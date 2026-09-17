const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const {
  OFFICIAL_NOTICE_URL,
  SEOUL_DIRECTORY_URL,
  NOTICE_CATEGORIES,
  VERIFIED_DEPARTMENT_SOURCES,
  NON_DEPARTMENT_SITE_KEYS,
} = require("./notice-sources");

const NOTICE_CACHE_TTL_MS = Number(process.env.NOTICE_CACHE_TTL_MS || 1000 * 60 * 30);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, ".cache");
const CACHE_FILE = path.join(DATA_DIR, "notices.json");
const DEPARTMENT_SOURCE_LIMIT = Number(process.env.NOTICE_SOURCE_LIMIT || 45);
const SOURCE_CONCURRENCY = Math.max(1, Math.min(10, Number(process.env.NOTICE_SOURCE_CONCURRENCY || 5)));

let memoryCache = loadCacheFromDisk() || null;

async function getNotices(options = {}) {
  const campus = options.campus || "seoul";
  const force = options.force === true;
  const now = Date.now();
  const freshEnough = memoryCache && now - memoryCache.fetchedAtMs < NOTICE_CACHE_TTL_MS;

  if (campus !== "seoul") {
    return {
      ok: false,
      campus,
      error: "현재 공지 허브는 서울캠퍼스 공개 공지만 지원합니다.",
      notices: [],
      departments: [],
      warnings: [],
      pagination: { page: 1, pageSize: 15, total: 0, totalPages: 0 },
    };
  }

  let collected;
  if (!force && freshEnough) {
    collected = { ...memoryCache.payload, cache: "hit" };
  } else {
    try {
      const payload = await collectNotices();
      memoryCache = {
        fetchedAtMs: now,
        payload,
      };
      saveCacheToDisk(memoryCache);
      collected = { ...payload, cache: "refresh" };
    } catch (error) {
      if (memoryCache && memoryCache.payload) {
        collected = {
          ...memoryCache.payload,
          cache: "stale",
          warnings: [
            ...(memoryCache.payload.warnings || []),
            `공지 새로고침 실패로 마지막 캐시를 사용합니다: ${error.message}`,
          ],
        };
      } else {
        return {
          ok: false,
          campus,
          error: `상명대 공식 공지를 불러오지 못했습니다: ${error.message}`,
          notices: [],
          departments: [],
          warnings: ["가짜 공지나 샘플 데이터로 대체하지 않았습니다."],
          pagination: { page: 1, pageSize: 15, total: 0, totalPages: 0 },
          cache: "miss",
          sourceUrl: OFFICIAL_NOTICE_URL,
        };
      }
    }
  }

  return applyNoticeFilters(collected, options);
}

async function collectNotices() {
  const warnings = [];
  const sourceSummaries = [];
  const notices = [];

  try {
    const officialHtml = await fetchText(withListLimit(OFFICIAL_NOTICE_URL, 40));
    const official = parseNoticeListHtml(officialHtml, {
      key: "integrated",
      name: "상명대학교 통합공지",
      type: "integrated",
      url: OFFICIAL_NOTICE_URL,
    });
    notices.push(...official.notices);
    sourceSummaries.push({
      key: "integrated",
      name: "상명대학교 통합공지",
      type: "integrated",
      url: OFFICIAL_NOTICE_URL,
      count: official.notices.length,
      ok: official.notices.length > 0,
    });
    if (!official.notices.length) warnings.push("통합공지 목록에서 게시글을 찾지 못했습니다.");
  } catch (error) {
    warnings.push(`통합공지 수집 실패: ${error.message}`);
    sourceSummaries.push({
      key: "integrated",
      name: "상명대학교 통합공지",
      type: "integrated",
      url: OFFICIAL_NOTICE_URL,
      count: 0,
      ok: false,
      error: error.message,
    });
  }

  let departmentSources = [...VERIFIED_DEPARTMENT_SOURCES];
  try {
    const directoryHtml = await fetchText(SEOUL_DIRECTORY_URL);
    const discovered = discoverDepartmentSources(directoryHtml);
    departmentSources = mergeSources(discovered, departmentSources).slice(0, DEPARTMENT_SOURCE_LIMIT);
    if (!discovered.length) {
      warnings.push("서울캠퍼스 대학소개 페이지에서 학과 링크 자동 발견에 실패해 검증된 보조 소스를 사용합니다.");
    }
  } catch (error) {
    warnings.push(`학과 링크 자동 발견 실패: ${error.message}`);
  }

  const departmentResults = await mapWithConcurrency(departmentSources, SOURCE_CONCURRENCY, async (source) => {
    try {
      const html = await fetchText(withListLimit(source.url, 25));
      const parsed = parseNoticeListHtml(html, {
        ...source,
        name: source.name || extractDepartmentName(html) || source.key,
        type: "department",
      });
      const resolvedName = normalizeDepartmentName(source.name, html, source.key);
      const normalizedNotices = parsed.notices.map((notice) => ({
        ...notice,
        sourceTitle: resolvedName,
      }));
      return {
        ok: normalizedNotices.length > 0,
        source: { ...source, name: resolvedName },
        notices: normalizedNotices,
        warning: normalizedNotices.length ? "" : `${resolvedName}: 공지 목록에서 게시글을 찾지 못했습니다.`,
      };
    } catch (error) {
      return {
        ok: false,
        source,
        notices: [],
        warning: `${source.name || source.key}: ${error.message}`,
      };
    }
  });

  for (const result of departmentResults) {
    notices.push(...result.notices);
    sourceSummaries.push({
      key: result.source.key,
      name: result.source.name || result.source.key,
      type: "department",
      url: result.source.url,
      count: result.notices.length,
      ok: result.ok,
      error: result.ok ? undefined : result.warning,
    });
    if (result.warning) warnings.push(result.warning);
  }

  const deduped = dedupeNotices(notices).sort(compareNoticesLatest);
  const departments = sourceSummaries
    .filter((item) => item.type === "department" && item.ok)
    .map((item) => ({ key: item.key, name: item.name, url: item.url, count: item.count }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  if (!deduped.length) {
    throw new Error("수집에 성공한 공식 공지 항목이 없습니다.");
  }

  return {
    ok: true,
    campus: "seoul",
    fetchedAt: new Date().toISOString(),
    notices: deduped,
    departments,
    sourceSummaries,
    warnings,
    sourceUrl: OFFICIAL_NOTICE_URL,
    directoryUrl: SEOUL_DIRECTORY_URL,
  };
}

function applyNoticeFilters(collected, options = {}) {
  const source = String(options.source || "all");
  const department = String(options.department || "").trim();
  const category = String(options.category || "").trim();
  const query = String(options.query || "").trim().toLocaleLowerCase("ko");
  const sort = options.sort === "oldest" ? "oldest" : "latest";
  const requestedPageSize = Number(options.pageSize || 15);
  const pageSize = Math.max(5, Math.min(50, Number.isFinite(requestedPageSize) ? requestedPageSize : 15));

  let filtered = [...(collected.notices || [])];
  if (source === "integrated") filtered = filtered.filter((item) => item.sourceType === "integrated");
  if (source === "department") filtered = filtered.filter((item) => item.sourceType === "department");
  if (department) filtered = filtered.filter((item) => item.sourceKey === department);
  if (category) filtered = filtered.filter((item) => item.category === category);
  if (query) {
    filtered = filtered.filter((item) => {
      const haystack = [item.title, item.author, item.sourceTitle, item.category]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko");
      return haystack.includes(query);
    });
  }

  filtered.sort(sort === "oldest" ? compareNoticesOldest : compareNoticesLatest);

  const total = filtered.length;
  const totalPages = total ? Math.ceil(total / pageSize) : 0;
  const requestedPage = Number(options.page || 1);
  const page = totalPages ? Math.max(1, Math.min(totalPages, Number.isFinite(requestedPage) ? requestedPage : 1)) : 1;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    ok: collected.ok !== false,
    campus: collected.campus || "seoul",
    fetchedAt: collected.fetchedAt,
    cache: collected.cache,
    notices: pageItems,
    departments: collected.departments || [],
    categories: NOTICE_CATEGORIES,
    sourceSummaries: collected.sourceSummaries || [],
    warnings: collected.warnings || [],
    sourceUrl: collected.sourceUrl || OFFICIAL_NOTICE_URL,
    directoryUrl: collected.directoryUrl || SEOUL_DIRECTORY_URL,
    filters: { source, department, category, query: String(options.query || ""), sort },
    pagination: { page, pageSize, total, totalPages },
  };
}

function discoverDepartmentSources(html) {
  const candidates = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const href = decodeHtml(match[1]);
    const label = cleanText(match[2]);
    const source = sourceFromDirectoryLink(href, label);
    if (source) candidates.push(source);
  }

  const absoluteUrlPattern = /https?:\/\/[^"'\s<>]+\.smu\.ac\.kr\/([a-zA-Z0-9_-]+)\/index\.do/gi;
  while ((match = absoluteUrlPattern.exec(html))) {
    const key = match[1];
    const source = sourceFromSiteKey(key, key);
    if (source) candidates.push(source);
  }

  const rootPathPattern = /["']\/([a-zA-Z0-9_-]+)\/index\.do["']/gi;
  while ((match = rootPathPattern.exec(html))) {
    const key = match[1];
    const source = sourceFromSiteKey(key, key);
    if (source) candidates.push(source);
  }

  return mergeSources(candidates, []);
}

function sourceFromDirectoryLink(href, label) {
  if (!href || href.startsWith("javascript:") || href.startsWith("#")) return null;
  let url;
  try {
    url = new URL(href, SEOUL_DIRECTORY_URL);
  } catch {
    return null;
  }
  if (!url.hostname.endsWith("smu.ac.kr")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const key = parts[0];
  if (!key || NON_DEPARTMENT_SITE_KEYS.has(key)) return null;
  if (!url.pathname.endsWith("/index.do") && parts.length < 2) return null;
  return sourceFromSiteKey(key, label);
}

function sourceFromSiteKey(key, label) {
  if (!key || NON_DEPARTMENT_SITE_KEYS.has(key)) return null;
  const cleanLabel = cleanText(label || "");
  const name = isDepartmentLikeLabel(cleanLabel) ? cleanLabel : key;
  return {
    key,
    name,
    url: `https://www.smu.ac.kr/${encodeURIComponent(key)}/community/notice.do`,
  };
}

function isDepartmentLikeLabel(label) {
  if (!label || label.length < 2 || label.length > 40) return false;
  return /(학과|학부|전공|교육과|공학|음악|예술|경영|경제|복지|안보|콘텐츠|환경)/.test(label);
}

function parseNoticeListHtml(html, source) {
  const notices = [];
  const seenArticleNos = new Set();
  const anchorPattern = /<a\b[^>]*href=["']([^"']*articleNo=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const href = decodeHtml(match[1]);
    if (!/mode=view/i.test(href)) continue;
    const articleNoMatch = href.match(/[?&]articleNo=(\d+)/i);
    if (!articleNoMatch) continue;
    const articleNo = articleNoMatch[1];
    if (seenArticleNos.has(articleNo)) continue;

    const title = cleanText(match[2]);
    if (!isLikelyNoticeTitle(title)) continue;

    const contextStart = match.index;
    const contextEnd = Math.min(html.length, match.index + match[0].length + 900);
    const context = cleanText(html.slice(contextStart, contextEnd));
    const dateMatch = context.match(/20\d{2}[-.]\d{1,2}[-.]\d{1,2}/);
    if (!dateMatch) continue;

    const date = normalizeDate(dateMatch[0]);
    if (!date) continue;

    const metadata = parseBracketMetadata(title);
    const absoluteUrl = resolveUrl(source.url, href);
    const pinned = /\[(공지|필독|중요)\]|공지사항\s*상단|공지글/.test(`${title} ${context}`);
    const author = inferAuthor(context, dateMatch[0], title);

    notices.push({
      id: `${source.type}-${source.key}-${articleNo}`,
      articleNo,
      title,
      date,
      author,
      category: source.type === "integrated" ? metadata.category : "",
      noticeCampus: source.type === "integrated" ? metadata.campus : "서울",
      pinned,
      isNew: /\bnew\b|새글|icon-new/i.test(html.slice(match.index, contextEnd)),
      sourceType: source.type,
      sourceKey: source.key,
      sourceTitle: source.name,
      sourceUrl: source.url,
      url: absoluteUrl,
    });
    seenArticleNos.add(articleNo);
  }

  return { notices };
}

function parseBracketMetadata(title) {
  const brackets = [...title.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].trim());
  const campus = brackets.find((value) => ["서울", "상명", "천안"].includes(value)) || "";
  const category = brackets.find((value) => NOTICE_CATEGORIES.includes(value)) || "";
  return { campus, category };
}

function inferAuthor(context, dateToken, title) {
  const beforeDate = context.split(dateToken)[0].replace(title, " ").trim();
  const tokens = beforeDate.split(/\s+/).filter(Boolean);
  const candidate = tokens.slice(-3).find((token) => /^[가-힣A-Za-z]{2,20}$/.test(token));
  if (!candidate) return "";
  if (["공지사항", "상명공지", "파일첨부", "서울", "상명", "천안"].includes(candidate)) return "";
  return candidate;
}

function normalizeDepartmentName(configuredName, html, fallbackKey) {
  if (configuredName && configuredName !== fallbackKey) return configuredName;
  return extractDepartmentName(html) || configuredName || fallbackKey;
}

function extractDepartmentName(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const title = cleanText(titleMatch[1]);
    const match = title.match(/^(.+?)(?:\(서울\))?\s*[|｜-]/);
    if (match && isDepartmentLikeLabel(match[1])) return match[1].trim();
  }
  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const heading = headingMatch ? cleanText(headingMatch[1]) : "";
  return isDepartmentLikeLabel(heading) ? heading : "";
}

function mergeSources(primary, fallback) {
  const map = new Map();
  for (const source of [...primary, ...fallback]) {
    if (!source || !source.key || map.has(source.key)) continue;
    map.set(source.key, source);
  }
  return [...map.values()];
}

function dedupeNotices(notices) {
  const seen = new Set();
  return notices.filter((notice) => {
    const key = notice.articleNo
      ? `${notice.sourceType}:${notice.sourceKey}:${notice.articleNo}`
      : `${notice.sourceType}:${notice.sourceKey}:${notice.date}:${notice.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareNoticesLatest(a, b) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return Number(b.articleNo || 0) - Number(a.articleNo || 0);
}

function compareNoticesOldest(a, b) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return Number(a.articleNo || 0) - Number(b.articleNo || 0);
}

function withListLimit(rawUrl, limit) {
  const url = new URL(rawUrl);
  if (!url.searchParams.has("mode")) url.searchParams.set("mode", "list");
  url.searchParams.set("article.offset", "0");
  url.searchParams.set("articleLimit", String(limit));
  return url.toString();
}

function resolveUrl(base, href) {
  try {
    return new URL(decodeHtml(href), base).toString();
  } catch {
    return base;
  }
}

function normalizeDate(value) {
  const match = String(value || "").match(/(20\d{2})[-.](\d{1,2})[-.](\d{1,2})/);
  if (!match) return "";
  const normalized = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return normalized;
}

function isLikelyNoticeTitle(title) {
  if (!title || title.length < 2 || title.length > 240) return false;
  if (/^(파일첨부|첨부파일|목록|이전글|다음글|공지사항|상명공지|검색|전체)$/i.test(title)) return false;
  if (/\.(pdf|hwp|hwpx|xlsx?|docx?|pptx?|zip|png|jpe?g)$/i.test(title)) return false;
  return true;
}

function cleanText(value) {
  return decodeHtml(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SmoongiScheduleHub/1.0; +https://www.smu.ac.kr/)",
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
        },
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          resolve(fetchText(new URL(response.headers.location, url).toString()));
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > 6_000_000) request.destroy(new Error("응답이 너무 큽니다."));
        });
        response.on("end", () => resolve(body));
      },
    );
    request.setTimeout(12000, () => request.destroy(new Error("요청 시간 초과")));
    request.on("error", reject);
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
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    // Render의 임시 파일시스템이나 읽기 전용 환경에서도 메모리 캐시는 계속 사용한다.
    console.warn(`notice cache write skipped: ${error.message}`);
  }
}

module.exports = {
  getNotices,
  collectNotices,
  discoverDepartmentSources,
  parseNoticeListHtml,
  applyNoticeFilters,
};
