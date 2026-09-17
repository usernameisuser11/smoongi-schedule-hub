const https = require('node:https');
const { getCleanNotices } = require('./notice-clean-service');

const OFFICIAL_NOTICE_URL = 'https://www.smu.ac.kr/kor/life/notice.do?mode=list&srCampus=smu&article.offset=0&articleLimit=50';
const TITLE_CACHE_TTL_MS = 1000 * 60 * 5;

let titleCache = { fetchedAt: 0, titles: new Map() };

async function getPolishedNotices(options = {}) {
  const payload = await getCleanNotices(options);
  const departments = (payload.departments || []).map((department) => ({
    ...department,
    name: canonicalDepartmentName(department.name, department.key),
  }));
  const departmentNameByKey = new Map(departments.map((department) => [department.key, department.name]));

  let officialTitles = new Map();
  if ((payload.notices || []).some((notice) => notice.sourceType === 'integrated')) {
    try {
      officialTitles = await getOfficialTitleMap(Boolean(options.force));
    } catch (error) {
      payload.warnings = [...(payload.warnings || []), `통합공지 제목 보정 실패: ${error.message}`];
    }
  }

  const notices = (payload.notices || []).map((notice) => {
    if (notice.sourceType === 'integrated') {
      const actualTitle = officialTitles.get(String(notice.articleNo || ''));
      return actualTitle ? { ...notice, title: actualTitle } : notice;
    }

    if (notice.sourceType === 'department') {
      return {
        ...notice,
        sourceTitle: departmentNameByKey.get(notice.sourceKey) || canonicalDepartmentName(notice.sourceTitle, notice.sourceKey),
      };
    }

    return notice;
  });

  return { ...payload, departments, notices };
}

async function getOfficialTitleMap(force = false) {
  const now = Date.now();
  if (!force && titleCache.titles.size && now - titleCache.fetchedAt < TITLE_CACHE_TTL_MS) {
    return titleCache.titles;
  }

  const html = await fetchText(OFFICIAL_NOTICE_URL);
  const titles = parseIntegratedTitleMap(html);
  if (!titles.size) throw new Error('공식 통합공지에서 실제 제목을 찾지 못했습니다.');
  titleCache = { fetchedAt: now, titles };
  return titles;
}

function parseIntegratedTitleMap(html) {
  const candidates = new Map();
  const anchorPattern = /<a\b[^>]*href=["']([^"']*articleNo=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(String(html || '')))) {
    const href = decodeHtml(match[1]);
    if (!/mode=view/i.test(href)) continue;
    const articleNo = href.match(/[?&]articleNo=(\d+)/i)?.[1];
    if (!articleNo) continue;

    const text = cleanText(match[2]);
    if (!isActualNoticeTitle(text)) continue;

    const score = scoreTitle(text);
    const previous = candidates.get(articleNo);
    if (!previous || score > previous.score) candidates.set(articleNo, { title: text, score });
  }

  return new Map([...candidates.entries()].map(([articleNo, value]) => [articleNo, value.title]));
}

function isActualNoticeTitle(value) {
  const text = String(value || '').trim();
  if (text.length < 6 || text.length > 260) return false;
  if (/^(상명|서울|천안)\s*\[(학사|일반|사회봉사|등록\/장학|학생생활|글로벌|진로취업|비교과|코로나19)\]$/u.test(text)) return false;
  if (/^(학사|일반|사회봉사|등록\/장학|학생생활|글로벌|진로취업|비교과|코로나19)$/u.test(text)) return false;
  if (/^(파일첨부|첨부파일|목록|이전글|다음글|공지사항|상명공지|검색|전체)$/u.test(text)) return false;
  if (/\.(pdf|hwp|hwpx|xlsx?|docx?|pptx?|zip|png|jpe?g)$/i.test(text)) return false;
  return true;
}

function scoreTitle(title) {
  let score = Math.min(title.length, 180);
  if (/20\d{2}|학년도|안내|모집|신청|선발|운영|프로그램|장학|졸업|수강|채용/.test(title)) score += 40;
  if (/^\[[^\]]+\]/.test(title)) score += 8;
  return score;
}

function canonicalDepartmentName(value, fallbackKey = '') {
  const raw = decodeHtml(String(value || ''))
    .replace(/새창\s*열림|새창열림/gi, ' ')
    .replace(/홈페이지|바로가기|교수\s*(?:소개|프로필)|졸업\s*작품|졸업작품|작품\s*페이지|페이지|사이트/gi, ' ')
    .replace(/[|｜]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matches = [...raw.matchAll(/([가-힣A-Za-z0-9·]+(?:교육과|학과|학부|전공))/g)].map((match) => match[1]);
  if (matches.length) return matches[matches.length - 1];
  return raw || String(fallbackKey || '').trim();
}

function cleanText(value) {
  return decodeHtml(
    String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SmoongiScheduleHub/1.0; +https://www.smu.ac.kr/)',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.7',
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
        response.setEncoding('utf8');
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
          if (body.length > 6_000_000) request.destroy(new Error('응답이 너무 큽니다.'));
        });
        response.on('end', () => resolve(body));
      },
    );
    request.setTimeout(12000, () => request.destroy(new Error('요청 시간 초과')));
    request.on('error', reject);
  });
}

module.exports = { getPolishedNotices, parseIntegratedTitleMap, canonicalDepartmentName };
