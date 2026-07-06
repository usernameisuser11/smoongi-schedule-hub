const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4174);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 1000 * 60 * 60 * 12);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, ".cache");
const CACHE_FILE = path.join(DATA_DIR, "academic-schedules.json");
const SMU_CALENDAR_URLS = {
  seoul: process.env.SMU_SEOUL_CALENDAR_URL || "https://www.smu.ac.kr/cs/admission/calendar.do",
  cheonan:
    process.env.SMU_CHEONAN_CALENDAR_URL || "https://www.smu.ac.kr/software/admission/calendar.do",
};

let memoryCache = loadCacheFromDisk() || {
  schedules: {},
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, {});
    return;
  }

  if (url.pathname === "/api/academic-schedules") {
    const year = url.searchParams.get("year") || String(new Date().getFullYear());
    const campus = url.searchParams.get("campus") || "seoul";
    const force = url.searchParams.get("refresh") === "true";
    const payload = await getAcademicSchedules({ campus, year, force });
    sendJson(res, payload, payload.ok ? 200 : 206);
    return;
  }

  sendJson(res, { ok: false, error: "Not found" }, 404);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Moayo Campus academic schedule API: http://localhost:${PORT}`);
  });
}

async function getAcademicSchedules({ campus = "seoul", year, force = false }) {
  const cacheKey = `${campus}:${year}`;
  const cached = memoryCache.schedules[cacheKey];
  const freshEnough = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (!force && freshEnough) {
    return {
      ...cached.payload,
      cache: "hit",
    };
  }

  try {
    const collected = await collectOfficialAcademicSchedules({ campus, year });
    const payload = {
      ok: true,
      campus,
      year,
      source: collected.source,
      fetchedAt: new Date().toISOString(),
      events: collected.events,
      warnings: collected.warnings,
    };

    memoryCache.schedules[cacheKey] = {
      fetchedAt: Date.now(),
      payload,
    };
    saveCacheToDisk(memoryCache);
    return {
      ...payload,
      cache: "refresh",
    };
  } catch (error) {
    if (cached) {
      return {
        ...cached.payload,
        ok: true,
        cache: "stale",
        warning: `자동 수집 실패, 마지막 캐시 사용: ${error.message}`,
      };
    }

    return {
      ok: false,
      campus,
      year,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      error: error.message,
      events: getFallbackEvents(year),
      cache: "fallback",
      warnings: ["자동 수집 실패로 fallback 데이터를 사용합니다."],
    };
  }
}

async function collectOfficialAcademicSchedules({ campus, year }) {
  const url = SMU_CALENDAR_URLS[campus] || SMU_CALENDAR_URLS.seoul;
  const warnings = [];

  const endpointEvents = await tryConfiguredJsonEndpoints({ campus, year, warnings });
  if (endpointEvents.length > 0) {
    return {
      source: "상명대 공식 학사일정 JSON 엔드포인트",
      events: endpointEvents,
      warnings,
    };
  }

  const html = await fetchText(url);
  const htmlEvents = parseSmuCalendarHtml(html, year);
  if (htmlEvents.length > 0) {
    return {
      source: "상명대 공식 학사일정 HTML 자동 수집",
      events: htmlEvents,
      warnings,
    };
  }

  const renderedEvents = await tryRenderedPageCollection({ url, year, warnings });
  if (renderedEvents.length > 0) {
    return {
      source: "상명대 공식 학사일정 JS 렌더링 자동 수집",
      events: renderedEvents,
      warnings,
    };
  }

  throw new Error("상명대 공식 페이지에서 일정 항목을 찾지 못했습니다.");
}

async function tryConfiguredJsonEndpoints({ campus, year, warnings }) {
  const env = process.env.SMU_SCHEDULE_JSON_URLS || "";
  const urls = env
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) =>
      value
        .replaceAll("{campus}", encodeURIComponent(campus))
        .replaceAll("{year}", encodeURIComponent(year)),
    );

  for (const url of urls) {
    try {
      const json = JSON.parse(await fetchText(url));
      const events = normalizeUnknownJsonSchedule(json, year);
      if (events.length > 0) return events;
      warnings.push(`JSON 엔드포인트 응답에 일정이 없습니다: ${url}`);
    } catch (error) {
      warnings.push(`JSON 엔드포인트 수집 실패: ${url} (${error.message})`);
    }
  }

  return [];
}

async function tryRenderedPageCollection({ url, year, warnings }) {
  if (process.env.SMU_RENDER_JS !== "true") {
    warnings.push("SMU_RENDER_JS=true가 아니어서 JS 렌더링 수집은 건너뜁니다.");
    return [];
  }

  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    warnings.push("playwright 패키지가 없어 JS 렌더링 수집을 건너뜁니다.");
    return [];
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);
    const renderedText = await page.locator("body").innerText();
    return parseRenderedCalendarText(renderedText, year);
  } catch (error) {
    warnings.push(`JS 렌더링 수집 실패: ${error.message}`);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

function parseSmuCalendarHtml(html, year) {
  const tableEvents = parseTableRows(html, year);
  const jsonEvents = parseEmbeddedScheduleJson(html, year);
  const textEvents =
    tableEvents.length === 0 && jsonEvents.length === 0 ? parseRenderedCalendarText(stripTags(html), year) : [];
  const events = [...tableEvents, ...jsonEvents, ...textEvents];

  return dedupeEvents(events);
}

function parseTableRows(html, year) {
  const events = [];
  const rowPattern = /<tr[^>]*>\s*<td[^>]*>([\d.\-~/월일\s]+)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gis;
  let match;

  while ((match = rowPattern.exec(html))) {
    const dateText = stripTags(match[1]).trim();
    const title = stripTags(match[2]).trim();
    const event = buildEventFromDateAndTitle({ dateText, title, year, note: "상명대 공식 HTML" });
    if (event) events.push(event);
  }

  return events;
}

function parseEmbeddedScheduleJson(html, year) {
  const events = [];
  const objectPattern = /\{[^{}]*(?:title|subject|content|text|schdulNm|scheduleNm)[^{}]*(?:start|date|ymd|bgnde|beginDt|schdulBgnde)[^{}]*\}/gis;
  let match;

  while ((match = objectPattern.exec(html))) {
    const objectText = match[0]
      .replace(/([{,]\s*)([a-zA-Z_][\w-]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'/g, '"');

    try {
      const item = JSON.parse(objectText);
      const normalized = normalizeJsonScheduleItem(item, year);
      if (normalized) events.push(normalized);
    } catch {
      // Ignore script fragments that look like objects but are not JSON.
    }
  }

  return events;
}

function parseRenderedCalendarText(text, year) {
  const events = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const event = buildEventFromDateAndTitle({
      dateText: line,
      title: line.replace(/^\d{1,2}[./월]\s*\d{1,2}[일.]?\s*[-~–]?\s*/, "").trim(),
      year,
      note: "상명대 공식 렌더링 텍스트",
    });
    if (event) events.push(event);
  }

  return events;
}

function normalizeUnknownJsonSchedule(json, year) {
  const list = Array.isArray(json)
    ? json
    : json.events || json.items || json.list || json.result || json.data || [];

  if (!Array.isArray(list)) return [];
  return dedupeEvents(list.map((item) => normalizeJsonScheduleItem(item, year)).filter(Boolean));
}

function normalizeJsonScheduleItem(item, year) {
  const title =
    item.title ||
    item.subject ||
    item.content ||
    item.text ||
    item.schdulNm ||
    item.scheduleNm ||
    item.name;
  const start =
    item.start ||
    item.date ||
    item.ymd ||
    item.bgnde ||
    item.beginDt ||
    item.schdulBgnde ||
    item.startDate;
  const end = item.end || item.endDt || item.endde || item.schdulEndde || item.endDate || start;

  if (!title || !start) return null;
  const range = normalizeDateRange(String(start), String(end), year);
  if (!range) return null;

  return {
    id: `smu-${range.date}-${slugify(title)}`,
    title: stripTags(String(title)).trim(),
    date: range.date,
    endDate: range.endDate,
    importance: inferImportance(String(title)),
    note: "상명대 공식 JSON",
  };
}

function buildEventFromDateAndTitle({ dateText, title, year, note }) {
  if (!title || title.length < 2) return null;
  const range = parseDateRange(dateText, year);
  if (!range) return null;

  return {
    id: `smu-${range.date}-${slugify(title)}`,
    title: stripTags(title).trim(),
    date: range.date,
    endDate: range.endDate,
    importance: inferImportance(title),
    note,
  };
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(
      url,
      {
        headers: {
          "User-Agent": "MoayoCampus/0.1 (+academic schedule cache)",
          Accept: "text/html,application/json",
        },
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(fetchText(new URL(response.headers.location, url).toString()));
          response.resume();
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}`));
          response.resume();
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      },
    );

    request.setTimeout(10000, () => {
      request.destroy(new Error("Request timeout"));
    });
    request.on("error", reject);
  });
}

function parseDateRange(value, year) {
  const rangeMatch = value.match(
    /(\d{1,2})\s*[./월-]\s*(\d{1,2})\s*일?\s*(?:[~\-–]\s*(\d{1,2})?\s*[./월-]?\s*(\d{1,2})\s*일?)?/,
  );
  if (!rangeMatch) return null;

  const startMonth = rangeMatch[1].padStart(2, "0");
  const startDay = rangeMatch[2].padStart(2, "0");
  const endMonth = (rangeMatch[3] || rangeMatch[1]).padStart(2, "0");
  const endDay = (rangeMatch[4] || rangeMatch[2]).padStart(2, "0");

  return normalizeDateRange(`${year}-${startMonth}-${startDay}`, `${year}-${endMonth}-${endDay}`, year);
}

function normalizeDateRange(start, end, year) {
  const startDate = normalizeDate(start, year);
  const endDate = normalizeDate(end, year);
  if (!startDate || !endDate) return null;

  return {
    date: startDate,
    endDate,
  };
}

function normalizeDate(value, year) {
  const clean = value.replace(/[^\d]/g, "");
  if (clean.length === 8) return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  if (clean.length === 4) return `${year}-${clean.slice(0, 2)}-${clean.slice(2, 4)}`;
  return null;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function inferImportance(title) {
  const criticalWords = ["시험", "고사", "중간고사", "기말고사", "수강신청", "정정", "등록", "휴학", "복학", "납부"];
  return criticalWords.some((word) => title.includes(word)) ? "critical" : "normal";
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.date}:${event.endDate}:${event.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadCacheFromDisk() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveCacheToDisk(cache) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function getFallbackEvents(year) {
  return [
    {
      id: `smu-${year}-fall-registration`,
      title: "2학기 수강신청/정정 준비",
      date: `${year}-08-24`,
      endDate: `${year}-08-28`,
      importance: "critical",
      note: "fallback",
    },
    {
      id: `smu-${year}-fall-start`,
      title: "2학기 개강",
      date: `${year}-09-01`,
      endDate: `${year}-09-01`,
      importance: "normal",
      note: "fallback",
    },
    {
      id: `smu-${year}-midterm`,
      title: "중간고사 예상 기간",
      date: `${year}-10-19`,
      endDate: `${year}-10-23`,
      importance: "critical",
      note: "fallback",
    },
  ];
}

function parseEverytimeImportedText(text, year) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const event = buildEventFromDateAndTitle({
        dateText: line,
        title: line.replace(/^\d{1,2}[./월]\s*\d{1,2}[일.]?\s*[-~–]?\s*/, "").trim(),
        year,
        note: "사용자 제공 에브리타임 데이터",
      });
      return event;
    })
    .filter(Boolean);
}

module.exports = {
  getAcademicSchedules,
  parseSmuCalendarHtml,
  parseEverytimeImportedText,
  normalizeUnknownJsonSchedule,
};
