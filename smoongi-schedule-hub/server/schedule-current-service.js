const { getAcademicSchedules } = require("./academic-schedule-service");

const VERIFIED_2026_FALL_EVENTS = [
  {
    id: "smu-2026-fall-course-change",
    title: "2026-2학기 수강신청 정정 및 취소",
    date: "2026-09-01",
    endDate: "2026-09-07",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-course-withdrawal",
    title: "2026-2학기 수강포기",
    date: "2026-09-17",
    endDate: "2026-09-18",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-midterm",
    title: "2026-2학기 중간고사",
    date: "2026-10-20",
    endDate: "2026-10-26",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-mid-evaluation",
    title: "2026-2학기 중간강의평가",
    date: "2026-10-27",
    endDate: "2026-11-10",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-final-evaluation",
    title: "2026-2학기 기말강의평가",
    date: "2026-12-01",
    endDate: "2027-01-05",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-grade-input",
    title: "2026-2학기 성적입력",
    date: "2026-12-08",
    endDate: "2026-12-27",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-final",
    title: "2026-2학기 기말고사",
    date: "2026-12-08",
    endDate: "2026-12-14",
    importance: "critical",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "smu-2026-fall-makeup",
    title: "2026-2학기 자율보강(기말고사)주간",
    date: "2026-12-15",
    endDate: "2026-12-21",
    importance: "normal",
    note: "상명대 공식 학사일정 복구 데이터",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
];

async function getCurrentAcademicSchedules(options = {}) {
  const payload = await getAcademicSchedules(options);
  const year = String(options.year || new Date().getFullYear());

  if (year !== "2026") return payload;

  const events = Array.isArray(payload.events) ? payload.events : [];
  const latestEnd = events.reduce((latest, event) => {
    const value = String(event.endDate || event.date || "");
    return value > latest ? value : latest;
  }, "");
  const today = getKoreanDateString();
  const staleForCurrentSemester = !latestEnd || latestEnd < today;
  const isFallback = payload.cache === "fallback" || payload.source === "fallback" || payload.ok === false;

  if (!isFallback && !staleForCurrentSemester) return payload;

  const merged = dedupeEvents([...events, ...VERIFIED_2026_FALL_EVENTS]).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || String(a.title).localeCompare(String(b.title), "ko"),
  );

  return {
    ...payload,
    ok: true,
    source: isFallback ? "상명대 공식 학사일정 복구 데이터" : payload.source,
    cache: isFallback ? "recovery" : payload.cache,
    events: merged,
    warnings: [
      ...(payload.warnings || []),
      "기존 자동수집 결과가 현재 학기보다 오래되어 2026-2학기 공식 확인 일정을 보강했습니다.",
    ],
  };
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.date}:${event.endDate || event.date}:${event.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getKoreanDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

module.exports = { getCurrentAcademicSchedules };
