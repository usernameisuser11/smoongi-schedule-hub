const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4174);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 1000 * 60 * 60 * 12);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, ".cache");
const CACHE_FILE = path.join(DATA_DIR, "academic-schedules.json");
const STATIC_ROOT = path.resolve(__dirname, "..");
const SMU_CALENDAR_URLS = {
  seoul: process.env.SMU_SEOUL_CALENDAR_URL || "https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=list",
  cheonan:
    process.env.SMU_CHEONAN_CALENDAR_URL || "https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=list",
};

const SMU_CALENDAR_CANDIDATE_URLS = [
  "https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=list",
  "https://www.smu.ac.kr/kor/life/academicCalendar.do?mode=calendar",
  "https://www.smu.ac.kr/kor/life/academicCalendar.do",
];

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

  if (req.method === "GET" || req.method === "HEAD") {
    serveStaticFile(req, res, url.pathname);
    return;
  }

  sendJson(res, { ok: false, error: "Not found" }, 404);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Smoongi Schedule Hub: http://localhost:${PORT}`);
  });
}

function serveStaticFile(req, res, requestPath) {
  const pathname = decodeURIComponent(requestPath.split("?")[0]);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(STATIC_ROOT, relativePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    sendJson(res, { ok: false, error: "Not found" }, 404);
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      const indexPath = path.join(STATIC_ROOT, "index.html");
      fs.readFile(indexPath, (indexError, indexBuffer) => {
        if (indexError) {
          sendJson(res, { ok: false, error: "Not found" }, 404);
          return;
        }
        sendBuffer(res, indexBuffer, "text/html; charset=utf-8", req.method);
      });
      return;
    }

    fs.readFile(filePath, (readError, buffer) => {
      if (readError) {
        sendJson(res, { ok: false, error: "Not found" }, 404);
        return;
      }
      sendBuffer(res, buffer, getContentType(filePath), req.method);
    });
  });
}

function sendBuffer(res, buffer, contentType, method = "GET") {
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  if (method === "HEAD") {
    res.end();
    return;
  }
  res.end(buffer);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".txt": "text/plain; charset=utf-8",
    }[extension] || "application/octet-stream"
  );
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
  const cleanEndpointEvents = dedupeEvents(endpointEvents.filter(isValidScheduleEvent));
  if (cleanEndpointEvents.length > 0) {
    return {
      source: "상명대 공식 학사일정 JSON 엔드포인트",
      events: cleanEndpointEvents,
      warnings,
    };
  }

  const candidateUrls = Array.from(new Set([url, ...SMU_CALENDAR_CANDIDATE_URLS]));
  const htmlEvents = [];
  let htmlSource = "";
  for (const candidateUrl of candidateUrls) {
    try {
      const html = await fetchText(candidateUrl);
      const parsed = parseSmuCalendarHtml(html, year);
      if (parsed.length > 0) {
        htmlSource = candidateUrl;
        htmlEvents.push(...parsed.map((event) => ({ ...event, url: candidateUrl })));
      }
    } catch (error) {
      warnings.push(`학사일정 HTML 수집 실패: ${candidateUrl} (${error.message})`);
    }
  }

  const dedupedHtmlEvents = dedupeEvents(htmlEvents.filter(isValidScheduleEvent));
  if (dedupedHtmlEvents.length > 0) {
    return {
      source: `상명대 공식 학사일정 HTML 자동 수집${htmlSource ? ` (${htmlSource})` : ""}`,
      events: dedupedHtmlEvents,
      warnings,
    };
  }

  const renderedEvents = await tryRenderedPageCollection({ url, year, warnings });
  const cleanRenderedEvents = dedupeEvents(renderedEvents.filter(isValidScheduleEvent));
  if (cleanRenderedEvents.length > 0) {
    return {
      source: "상명대 공식 학사일정 JS 렌더링 자동 수집",
      events: cleanRenderedEvents,
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

  // 상명대 학사일정 페이지는 메뉴/푸터/스크립트 텍스트가 함께 내려옵니다.
  // 본문 전체 텍스트를 일정으로 파싱하면 window.dataLayer, 상명소개, 개인정보처리방침 같은
  // 사이트 메뉴가 일정 카드로 섞이는 문제가 생기므로 구조화된 표/JSON만 사용합니다.
  const events = [...tableEvents, ...jsonEvents].filter(isValidScheduleEvent);

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
    // 렌더링된 화면에서도 날짜로 시작하는 짧은 행만 일정 후보로 봅니다.
    // 전체 메뉴/스크립트가 한 줄로 붙은 긴 문자열은 절대 일정으로 취급하지 않습니다.
    if (line.length > 120 || isNavigationOrScriptText(line)) continue;
    const matched = line.match(/^(\d{1,2}[./월]\s*\d{1,2}[일.]?(?:\s*[~\-–]\s*(?:\d{1,2}[./월]\s*)?\d{1,2}[일.]?)?)\s+(.{2,80})$/);
    if (!matched) continue;

    const event = buildEventFromDateAndTitle({
      dateText: matched[1],
      title: matched[2].trim(),
      year,
      note: "상명대 공식 렌더링 텍스트",
    });
    if (event && isValidScheduleEvent(event)) events.push(event);
  }

  return dedupeEvents(events);
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
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
  };
}

function buildEventFromDateAndTitle({ dateText, title, year, note }) {
  const cleanTitle = stripTags(String(title || "")).trim();
  if (!isLikelyScheduleTitle(cleanTitle)) return null;
  const range = parseDateRange(String(dateText || ""), year);
  if (!range) return null;

  return {
    id: `smu-${range.date}-${slugify(cleanTitle)}`,
    title: cleanTitle,
    date: range.date,
    endDate: range.endDate,
    importance: inferImportance(cleanTitle),
    note,
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
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
  const clean = String(value || "").replace(/[^\d]/g, "");
  let normalized = null;
  if (clean.length === 8) normalized = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  if (clean.length === 4) normalized = `${year}-${clean.slice(0, 2)}-${clean.slice(2, 4)}`;
  return isValidIsoDate(normalized) ? normalized : null;
}

function isValidIsoDate(value) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isLikelyScheduleTitle(title) {
  if (!title || title.length < 2 || title.length > 80) return false;
  if (isNavigationOrScriptText(title)) return false;
  if (/^[{}[\];:=,.\s0-9A-Za-z_-]+$/.test(title)) return false;
  return true;
}

function isNavigationOrScriptText(text) {
  return /window\.|dataLayer|gtag|function\s*\(|상명소개|열린 총장실|개인정보처리방침|COPYRIGHT|본문 바로가기|모바일 메뉴|서브메뉴|사이트맵|입학안내|대학현황|캠퍼스 안내|정보공개|검색어 입력|담당부서|대표번호|SMPOPUP|Login|닫기/.test(String(text || ""));
}

function isValidScheduleEvent(event) {
  if (!event) return false;
  if (!isValidIsoDate(event.date) || !isValidIsoDate(event.endDate || event.date)) return false;
  if ((event.endDate || event.date) < event.date) return false;
  return isLikelyScheduleTitle(event.title);
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
  if (String(year) === "2026") {
    return [
      {
        id: `smu-${year}-final-lecture-evaluation`,
        title: "2026-1학기 기말강의평가",
        date: "2026-06-30",
        endDate: "2026-07-04",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-grade-input-1st`,
        title: "2026-1학기 성적입력",
        date: "2026-06-28",
        endDate: "2026-07-05",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-grade-check-1st`,
        title: "2026-1학기 성적확인",
        date: "2026-07-02",
        endDate: "2026-07-04",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-summer-class`,
        title: "2026-하계 계절수업",
        date: "2026-06-30",
        endDate: "2026-07-08",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-grade-confirm-1st`,
        title: "2026-1학기 성적확정",
        date: "2026-07-10",
        endDate: "2026-07-10",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-summer-grade-input`,
        title: "2026-하계 계절수업 성적입력 기간",
        date: "2026-07-08",
        endDate: "2026-07-13",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-summer-grade-check`,
        title: "2026-하계 계절수업 성적 확인, 이의신청 및 정정 기간",
        date: "2026-07-14",
        endDate: "2026-07-15",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-student-record-change`,
        title: "2026-2학기 대상 학적 변동 기간",
        date: "2026-07-13",
        endDate: "2026-07-17",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-cart-registration-1`,
        title: "2026-2학기 장바구니 수강신청(1차)",
        date: "2026-07-16",
        endDate: "2026-07-17",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
      {
        id: `smu-${year}-summer-grade-confirm`,
        title: "2026-하계 계절수업 성적확정",
        date: "2026-07-23",
        endDate: "2026-07-23",
        importance: "critical",
        note: "공식 학사일정표 백업",
        url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
      },
    ];
  }

  return [
    {
      id: `smu-${year}-fall-registration`,
      title: "2학기 수강신청/정정 준비",
      date: `${year}-08-24`,
      endDate: `${year}-08-28`,
      importance: "critical",
      note: "fallback",
      url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    },
    {
      id: `smu-${year}-fall-start`,
      title: "2학기 개강",
      date: `${year}-09-01`,
      endDate: `${year}-09-01`,
      importance: "normal",
      note: "fallback",
      url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    },
    {
      id: `smu-${year}-midterm`,
      title: "중간고사 예상 기간",
      date: `${year}-10-19`,
      endDate: `${year}-10-23`,
      importance: "critical",
      note: "fallback",
      url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
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
