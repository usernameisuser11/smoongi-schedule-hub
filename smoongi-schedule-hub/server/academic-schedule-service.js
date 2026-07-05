const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4174);
const ROOT = path.join(__dirname, "..");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

let poolPromise;
let dbReady;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "OPTIONS") return sendJson(res, {});

    if (url.pathname === "/api/health") {
      return sendJson(res, { ok: true, db: Boolean(await getPool()), ai: Boolean(GEMINI_API_KEY) });
    }
    if (url.pathname === "/api/items" && req.method === "GET") {
      await ensureDb();
      return sendJson(res, { ok: true, items: await listItems() });
    }
    if (url.pathname === "/api/faqs" && req.method === "GET") {
      await ensureDb();
      return sendJson(res, { ok: true, faqs: await listFaqs() });
    }
    if (url.pathname === "/api/ask" && req.method === "POST") {
      await ensureDb();
      const body = await readJson(req);
      return sendJson(res, await answerQuestion(String(body.question || "").trim()));
    }
    if (url.pathname === "/api/admin/items" && req.method === "POST") {
      requireAdmin(req);
      await ensureDb();
      const item = normalizeItem(await readJson(req));
      const pool = await getPool();
      if (pool) await upsertItem(pool, item);
      else seedItems.unshift(item);
      return sendJson(res, { ok: true, item }, 201);
    }
    if (url.pathname === "/api/admin/faqs" && req.method === "POST") {
      requireAdmin(req);
      await ensureDb();
      const faq = normalizeFaq(await readJson(req));
      const pool = await getPool();
      if (pool) await upsertFaq(pool, faq);
      else seedFaqs.unshift(faq);
      return sendJson(res, { ok: true, faq }, 201);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, { ok: false, error: error.message }, error.statusCode || 500);
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Smoongi Schedule Hub: http://localhost:${PORT}`));
}

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      try {
        const { Pool } = require("pg");
        return new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
        });
      } catch {
        return null;
      }
    })();
  }
  return poolPromise;
}

async function ensureDb() {
  if (!dbReady) dbReady = initDb();
  return dbReady;
}

async function initDb() {
  const pool = await getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS info_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      summary TEXT NOT NULL DEFAULT '',
      source_label TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      verified_at TIMESTAMPTZ,
      needs_verification BOOLEAN NOT NULL DEFAULT false,
      tags TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      caution TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS question_logs (
      id BIGSERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  const itemCount = await pool.query("SELECT COUNT(*)::int AS count FROM info_items");
  if (itemCount.rows[0].count === 0) for (const item of seedItems) await upsertItem(pool, item);
  const faqCount = await pool.query("SELECT COUNT(*)::int AS count FROM faqs");
  if (faqCount.rows[0].count === 0) for (const faq of seedFaqs) await upsertFaq(pool, faq);
}

async function listItems() {
  const pool = await getPool();
  if (!pool) return seedItems.sort(compareItems);
  const { rows } = await pool.query("SELECT * FROM info_items ORDER BY start_date NULLS LAST, category, title");
  return rows.map(mapItem);
}

async function listFaqs() {
  const pool = await getPool();
  if (!pool) return seedFaqs;
  const { rows } = await pool.query("SELECT * FROM faqs ORDER BY category, question");
  return rows.map(mapFaq);
}

async function answerQuestion(question) {
  if (!question) {
    const error = new Error("질문을 입력해주세요.");
    error.statusCode = 400;
    throw error;
  }
  const [items, faqs] = await Promise.all([listItems(), listFaqs()]);
  const relatedItems = rank(question, items).slice(0, 5);
  const relatedFaqs = rank(question, faqs).slice(0, 4);
  const answer = GEMINI_API_KEY
    ? await askGemini(question, relatedItems, relatedFaqs)
    : fallbackAnswer(relatedItems, relatedFaqs);
  const pool = await getPool();
  if (pool) await pool.query("INSERT INTO question_logs (question, answer) VALUES ($1,$2)", [question, answer]);
  return { ok: true, question, answer, relatedItems, relatedFaqs, ai: Boolean(GEMINI_API_KEY) };
}

async function askGemini(question, items, faqs) {
  const prompt = `상명대학교 서울캠퍼스 학생을 위한 일정 안내 답변을 작성해라.
등록 자료에 없는 날짜와 대상은 추측하지 말고 공식 공지 확인 필요라고 말해라.

질문: ${question}
등록 일정: ${JSON.stringify(items)}
등록 FAQ: ${JSON.stringify(faqs)}

답변은 한국어로 짧게 작성하고 마지막에 공식 공지 확인 문구를 포함해라.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }),
  });
  if (!response.ok) return fallbackAnswer(items, faqs);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() || fallbackAnswer(items, faqs);
}

function fallbackAnswer(items, faqs) {
  const lines = [];
  if (faqs[0]) lines.push(faqs[0].answer);
  if (items[0]) lines.push(`${items[0].title}: ${items[0].startDate ? `${items[0].startDate}${items[0].endDate && items[0].endDate !== items[0].startDate ? `~${items[0].endDate}` : ""}` : "날짜 확인 필요"}`);
  if (!lines.length) lines.push("등록된 자료에서 바로 연결되는 내용을 찾지 못했습니다.");
  lines.push("세부 시간, 대상, 변경사항은 반드시 학교 공식 공지를 확인해주세요.");
  return lines.join("\n\n");
}

function rank(question, list) {
  const tokens = String(question).toLowerCase().split(/\s+/).filter((token) => token.length > 1);
  return list
    .map((item) => ({ item, score: tokens.reduce((sum, token) => sum + (searchText(item).includes(token) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

async function upsertItem(pool, item) {
  await pool.query(
    `INSERT INTO info_items (id,title,category,start_date,end_date,summary,source_label,source_url,verified_at,needs_verification,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET title=$2, category=$3, start_date=$4, end_date=$5, summary=$6, source_label=$7, source_url=$8, verified_at=$9, needs_verification=$10, tags=$11, updated_at=now()`,
    [item.id, item.title, item.category, item.startDate, item.endDate, item.summary, item.sourceLabel, item.sourceUrl, item.verifiedAt, item.needsVerification, item.tags.join(",")],
  );
}

async function upsertFaq(pool, faq) {
  await pool.query(
    `INSERT INTO faqs (id,question,answer,category,caution,tags)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET question=$2, answer=$3, category=$4, caution=$5, tags=$6, updated_at=now()`,
    [faq.id, faq.question, faq.answer, faq.category, faq.caution, faq.tags.join(",")],
  );
}

function normalizeItem(body) {
  if (!body.title || !body.category) throw Object.assign(new Error("title과 category는 필수입니다."), { statusCode: 400 });
  return {
    id: body.id || slug(`${body.category}-${body.title}-${body.startDate || "check"}`),
    title: String(body.title),
    category: String(body.category),
    startDate: body.startDate || null,
    endDate: body.endDate || body.startDate || null,
    summary: String(body.summary || ""),
    sourceLabel: String(body.sourceLabel || ""),
    sourceUrl: String(body.sourceUrl || ""),
    verifiedAt: body.verifiedAt || new Date().toISOString(),
    needsVerification: Boolean(body.needsVerification),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
  };
}

function normalizeFaq(body) {
  if (!body.question || !body.answer || !body.category) throw Object.assign(new Error("question, answer, category는 필수입니다."), { statusCode: 400 });
  return {
    id: body.id || slug(`${body.category}-${body.question}`),
    question: String(body.question),
    answer: String(body.answer),
    category: String(body.category),
    caution: String(body.caution || "세부사항은 공식 공지를 확인하세요."),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
  };
}

function mapItem(row) {
  return { id: row.id, title: row.title, category: row.category, startDate: dateOnly(row.start_date), endDate: dateOnly(row.end_date), summary: row.summary, sourceLabel: row.source_label, sourceUrl: row.source_url, verifiedAt: row.verified_at, needsVerification: row.needs_verification, tags: split(row.tags) };
}
function mapFaq(row) {
  return { id: row.id, question: row.question, answer: row.answer, category: row.category, caution: row.caution, tags: split(row.tags) };
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(Object.assign(new Error("JSON 형식이 아닙니다."), { statusCode: 400 })); }
    });
  });
}
function requireAdmin(req) {
  if (ADMIN_KEY && req.headers["x-admin-key"] !== ADMIN_KEY) throw Object.assign(new Error("관리자 권한이 필요합니다."), { statusCode: 401 });
}
function serveStatic(urlPath, res) {
  const filePath = urlPath === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, decodeURIComponent(urlPath));
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT) || !fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) return sendJson(res, { ok: false, error: "Not found" }, 404);
  res.writeHead(200, { "Content-Type": mime(normalized) });
  fs.createReadStream(normalized).pipe(res);
}
function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,x-admin-key" });
  res.end(JSON.stringify(payload, null, 2));
}
function mime(file) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" }[path.extname(file)] || "application/octet-stream";
}
function searchText(item) { return [item.title, item.summary, item.question, item.answer, item.category, item.tags?.join(" ")].filter(Boolean).join(" ").toLowerCase(); }
function split(value) { return String(value || "").split(",").map((v) => v.trim()).filter(Boolean); }
function dateOnly(value) { return value ? new Date(value).toISOString().slice(0, 10) : null; }
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); }
function compareItems(a, b) { if (!a.startDate && !b.startDate) return a.title.localeCompare(b.title, "ko"); if (!a.startDate) return 1; if (!b.startDate) return -1; return a.startDate.localeCompare(b.startDate); }

const seedItems = [
  { id: "grade-confirm-2026-1", title: "2026-1학기 성적확정", category: "grade", startDate: "2026-07-10", endDate: "2026-07-10", summary: "1학기 성적이 확정되는 일정입니다. 스뮤니티 학점 계산은 확정 이후 참고하세요.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["성적", "스뮤니티"] },
  { id: "cart-2026-fall-1", title: "2026-2학기 장바구니 수강신청 1차", category: "course", startDate: "2026-07-16", endDate: "2026-07-17", summary: "2학기 수강신청 전 장바구니에 과목을 담아두는 1차 일정입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["장바구니", "수강신청"] },
  { id: "course-2026-fall-1", title: "2026-2학기 재학생 1차 수강신청", category: "course", startDate: "2026-07-22", endDate: "2026-07-24", summary: "재학생 대상 2학기 1차 수강신청 기간입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["수강신청", "재학생"] },
  { id: "cart-2026-fall-2", title: "2026-2학기 장바구니 수강신청 2차", category: "course", startDate: "2026-08-18", endDate: "2026-08-18", summary: "추가·변경을 준비하는 장바구니 수강신청 2차 일정입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["장바구니", "2차"] },
  { id: "course-2026-fall-2", title: "2026-2학기 재학생 2차 수강신청", category: "course", startDate: "2026-08-20", endDate: "2026-08-20", summary: "남은 과목이나 변경 과목을 신청하는 재학생 2차 수강신청 일정입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["수강신청", "2차"] },
  { id: "tuition-2026-fall", title: "2026-2학기 등록", category: "academic", startDate: "2026-08-24", endDate: "2026-08-26", summary: "2학기 등록금 납부 기간입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["등록", "등록금"] },
  { id: "fall-start-2026", title: "2026-2학기 개강", category: "academic", startDate: "2026-09-01", endDate: "2026-09-01", summary: "2026학년도 제2학기 개강일입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["개강"] },
  { id: "course-correction-2026-fall", title: "2026-2학기 수강신청 정정 및 취소", category: "course", startDate: "2026-09-01", endDate: "2026-09-07", summary: "개강 후 시간표를 최종 수정하는 기간입니다.", sourceLabel: "상명대 학사일정", sourceUrl: "", verifiedAt: "2026-07-05T00:00:00+09:00", needsVerification: false, tags: ["정정", "취소"] },
  { id: "huss-fall-check", title: "HUSS 2학기 신청 일정", category: "huss", startDate: null, endDate: null, summary: "HUSS 신청은 별도 공지로 확인해야 합니다. 신청 기간, 대상, 인정 방식 확인이 필요합니다.", sourceLabel: "공식 공지 확인 필요", sourceUrl: "", verifiedAt: null, needsVerification: true, tags: ["HUSS", "허스", "융합"] },
  { id: "kmooc-fall-check", title: "K-MOOC 2학기 신청/수강 일정", category: "kmooc", startDate: null, endDate: null, summary: "K-MOOC는 강좌별 신청 기간과 학점 인정 조건이 다를 수 있습니다.", sourceLabel: "공식 공지 확인 필요", sourceUrl: "", verifiedAt: null, needsVerification: true, tags: ["K-MOOC", "케이묵"] },
  { id: "biohealth-fall-check", title: "바이오헬스 혁신융합대학 신청 일정", category: "biohealth", startDate: null, endDate: null, summary: "바이오헬스 관련 신청, 수강, 행사 일정은 사업단 공지 기준으로 확인해야 합니다.", sourceLabel: "공식 공지 확인 필요", sourceUrl: "", verifiedAt: null, needsVerification: true, tags: ["바이오헬스", "CO-WEEK"] },
];

const seedFaqs = [
  { id: "faq-cart", question: "장바구니 수강신청 1차랑 2차 차이가 뭐야?", answer: "둘 다 실제 수강신청 전에 과목을 담아두는 준비 일정입니다. 1차 이후 변경이나 추가 확인이 필요하면 2차 일정도 확인해야 합니다.", category: "course", caution: "장바구니와 실제 수강신청 완료는 다릅니다.", tags: ["장바구니"] },
  { id: "faq-grade", question: "성적확정되면 스뮤니티에 바로 반영돼?", answer: "성적확정 이후 스뮤니티 계산을 참고하는 편이 안전합니다. 반영 시점은 서비스 상태에 따라 차이가 있을 수 있습니다.", category: "grade", caution: "최종 성적은 학교 시스템 기준으로 확인하세요.", tags: ["성적", "스뮤니티"] },
  { id: "faq-huss", question: "HUSS는 수강신청이랑 별도로 신청해야 해?", answer: "HUSS는 일반 수강신청과 별도 신청 절차가 있을 수 있습니다. 프로그램 공지에서 신청 기간, 대상, 인정 방식을 확인해야 합니다.", category: "huss", caution: "현재 등록된 HUSS 일정은 확인 필요 상태입니다.", tags: ["HUSS", "허스"] },
  { id: "faq-kmooc", question: "K-MOOC 들으면 학점 인정돼?", answer: "강좌와 학기별 공지에 따라 학점 인정 여부가 달라질 수 있습니다. 신청 전 학점 인정 조건과 이수 기준을 확인해야 합니다.", category: "kmooc", caution: "자동 인정 여부는 공식 공지 기준으로 확인하세요.", tags: ["K-MOOC", "케이묵"] },
  { id: "faq-biohealth", question: "바이오헬스는 누가 신청할 수 있어?", answer: "바이오헬스 혁신융합대학 관련 프로그램은 대상 학과, 학년, 캠퍼스 조건이 있을 수 있습니다. 사업단 공지를 기준으로 확인해야 합니다.", category: "biohealth", caution: "신청 대상과 인정 조건을 공식 공지에서 확인하세요.", tags: ["바이오헬스"] },
];

module.exports = { server, listItems, listFaqs, answerQuestion };
