const smoongiAssets = {
  academic: "./assets/smoongi/spring_deer.png",
  apply: "./assets/smoongi/sky_jump.png",
  extracurricular: "./assets/smoongi/autumn_reading.png",
  notice: "./assets/smoongi/night_bench.png",
  portal: "./assets/smoongi/painting.png",
  life: "./assets/smoongi/snow_mountain.png",
  deadline: "./assets/smoongi/fireworks.png",
  target: "./assets/smoongi/grass_pair.png",
  source: "./assets/smoongi/blue_frame.png",
};

const fallbackImage = smoongiAssets.academic;

const officialLinks = [
  {
    title: "상명대 홈페이지",
    description: "학교 공식 홈페이지 메인",
    url: "https://www.smu.ac.kr/ko/index.do",
    tag: "공식",
  },
  {
    title: "통합공지",
    description: "학사, 장학, 사업단 공지를 한 번에 확인",
    url: "https://www.smu.ac.kr/lounge/notice/notice.do",
    tag: "공지",
  },
  {
    title: "샘물포털",
    description: "성적, 학적, 등록 확인",
    url: "https://portal.smu.ac.kr/",
    tag: "포털",
  },
  {
    title: "학술정보관",
    description: "도서관, 열람실, 학술자료",
    url: "https://lib.smu.ac.kr/",
    tag: "생활",
  },
  {
    title: "학생생활관",
    description: "생활관 공지, 입사, 외박/연장",
    url: "https://dormitory.smu.ac.kr/dormi/index.do",
    tag: "생활",
  },
];

const categories = [
  {
    id: "academic",
    title: "학사",
    image: smoongiAssets.academic,
    description: "개강, 종강, 시험기간, 등록 같은 학교 공통 일정",
    items: [
      { title: "학사일정", url: "https://www.smu.ac.kr/kor/life/academicCalendar.do" },
      { title: "학사 안내", url: "https://www.smu.ac.kr/kor/life/onlineGuide.do" },
      { title: "상명 Q&A", url: "https://www.smu.ac.kr/kor/life/faq.do" },
      { title: "행정서식", url: "https://www.smu.ac.kr/kor/life/administration.do" },
    ],
  },
  {
    id: "apply",
    title: "신청",
    image: smoongiAssets.apply,
    description: "수강신청, HUSS, 바이오헬스, K-MOOC 신청 확인",
    items: [
      { title: "수강신청", url: "https://sugang.smu.ac.kr/" },
      { title: "HUSS 공지 확인", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
      { title: "바이오헬스", url: "https://www.smu.ac.kr/biohealth/index.do" },
      { title: "K-MOOC 공지 확인", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
    ],
  },
  {
    id: "extracurricular",
    title: "비교과",
    image: smoongiAssets.extracurricular,
    description: "비교과, 마일리지, 진로·취업 프로그램",
    items: [
      { title: "비교과/마일리지", url: "https://extracur.smu.ac.kr/extracur/index.do" },
      { title: "피어오름", url: "https://peerorum.smu.ac.kr/" },
      { title: "SMe 포트폴리오", url: "https://smcareer.smu.ac.kr/" },
    ],
  },
  {
    id: "notice",
    title: "공지",
    image: smoongiAssets.notice,
    description: "통합공지, 학사운영, 장학 공지 확인",
    items: [
      { title: "통합공지", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
      { title: "등록/장학 공지", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
      { title: "학사운영", url: "https://www.smu.ac.kr/search/search.do?menu=%ED%86%B5%ED%95%A9%EA%B2%80%EC%83%89&qt=%ED%95%99%EC%82%AC%EC%9A%B4%EC%98%81" },
      { title: "상명 Q&A", url: "https://www.smu.ac.kr/kor/life/faq.do" },
    ],
  },
  {
    id: "portal",
    title: "포털",
    image: smoongiAssets.portal,
    description: "샘물, e-Campus, 성적, 강의 관련 이동",
    items: [
      { title: "샘물포털", url: "https://portal.smu.ac.kr/" },
      { title: "e-Campus", url: "https://ecampus.smu.ac.kr/" },
      { title: "수강신청", url: "https://sugang.smu.ac.kr/" },
      { title: "상명대 홈페이지", url: "https://www.smu.ac.kr/ko/index.do" },
    ],
  },
  {
    id: "life",
    title: "생활",
    image: smoongiAssets.life,
    description: "도서관, 생활관, 식당, 버스처럼 자주 쓰는 생활 링크",
    items: [
      { title: "학술정보관", url: "https://lib.smu.ac.kr/" },
      { title: "학생생활관", url: "https://dormitory.smu.ac.kr/dormi/index.do" },
      { title: "식당메뉴", url: "https://www.smu.ac.kr/kor/life/restaurant.do" },
      { title: "버스안내", url: "https://www.smu.ac.kr/kor/life/ShuttleBus.do#tab18443_" },
    ],
  },
];


const smartBannerRules = [
  {
    id: "grade-check",
    start: "06-24",
    end: "07-11",
    priority: 100,
    label: "성적확인",
    title: "성적확인 기간이에요",
    message: "성적 확인, 이의신청, 확정 일정은 샘물포털과 공식 학사일정표를 같이 확인해요.",
    url: "https://portal.smu.ac.kr/",
    button: "샘물포털 바로가기",
    secondaryUrl: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    secondaryButton: "학사일정표 보기",
  },
  {
    id: "summer-class",
    start: "06-20",
    end: "07-20",
    priority: 80,
    label: "계절수업",
    title: "하계 계절수업 관련 일정을 확인해요",
    message: "수업 기간, 성적 입력, 성적 확인 일정은 공식 학사일정표 기준으로 보는 게 안전해요.",
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    button: "학사일정표 보기",
    secondaryUrl: "https://www.smu.ac.kr/lounge/notice/notice.do",
    secondaryButton: "통합공지 보기",
  },
  {
    id: "summer-break",
    start: "07-12",
    end: "08-31",
    priority: 70,
    label: "방학추천",
    title: "방학 중 비교과와 진로 프로그램을 확인해보세요",
    message: "인턴십, 비교과, 마일리지, 진로 프로그램은 방학 때 미리 확인하면 놓치기 쉬운 신청을 줄일 수 있어요.",
    url: "https://extracur.smu.ac.kr/extracur/index.do",
    button: "비교과/마일리지 보기",
    secondaryUrl: "https://smcareer.smu.ac.kr/",
    secondaryButton: "SMe 포트폴리오",
  },
  {
    id: "course-registration-summer",
    start: "08-01",
    end: "08-22",
    priority: 95,
    label: "수강신청",
    title: "수강신청 기간이 가까워졌어요",
    message: "장바구니, 1차 신청, 정정 기간은 대상 학년과 시간을 같이 확인해요.",
    url: "https://sugang.smu.ac.kr/",
    button: "수강신청 바로가기",
    secondaryUrl: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    secondaryButton: "일정표 보기",
  },
  {
    id: "course-registration-winter",
    start: "02-01",
    end: "03-10",
    priority: 95,
    label: "수강신청",
    title: "수강신청과 정정 일정을 확인해요",
    message: "개강 전후에는 수강신청, 정정, 폐강 기준을 함께 확인하는 게 좋아요.",
    url: "https://sugang.smu.ac.kr/",
    button: "수강신청 바로가기",
    secondaryUrl: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    secondaryButton: "학사일정표 보기",
  },
  {
    id: "new-semester",
    start: "03-01",
    end: "03-20",
    priority: 90,
    label: "개강초기",
    title: "개강 초기에는 수강정정과 학사 공지를 확인해요",
    message: "수강정정, 폐강, 출석 관련 안내가 몰리는 시기라 통합공지와 수강신청 페이지를 같이 확인해요.",
    url: "https://sugang.smu.ac.kr/",
    button: "수강신청 바로가기",
    secondaryUrl: "https://www.smu.ac.kr/lounge/notice/notice.do",
    secondaryButton: "통합공지 보기",
  },
  {
    id: "midterm",
    start: "04-10",
    end: "04-30",
    priority: 60,
    label: "시험기간",
    title: "중간고사 기간 전후 학사일정을 확인해요",
    message: "시험, 휴강, 보강 일정은 과목 공지와 공식 학사일정표를 함께 확인하는 게 좋아요.",
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    button: "학사일정표 보기",
    secondaryUrl: "https://ecampus.smu.ac.kr/",
    secondaryButton: "e-Campus 바로가기",
  },
  {
    id: "final-grade-input",
    start: "05-20",
    end: "06-30",
    priority: 75,
    label: "기말·성적",
    title: "기말고사와 성적 입력 일정을 확인해요",
    message: "기말고사, 강의평가, 성적 입력 기간은 학사일정표 기준으로 먼저 확인해요.",
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    button: "학사일정표 보기",
    secondaryUrl: "https://portal.smu.ac.kr/",
    secondaryButton: "샘물포털 바로가기",
  },
  {
    id: "winter-final",
    start: "12-01",
    end: "12-31",
    priority: 80,
    label: "기말·동계",
    title: "기말고사와 동계 계절수업 일정을 확인해요",
    message: "기말, 성적, 동계 계절수업 관련 일정은 학사일정표와 통합공지를 같이 확인해요.",
    url: "https://www.smu.ac.kr/kor/life/academicCalendar.do",
    button: "학사일정표 보기",
    secondaryUrl: "https://www.smu.ac.kr/lounge/notice/notice.do",
    secondaryButton: "통합공지 보기",
  },
  {
    id: "winter-break",
    start: "01-01",
    end: "01-31",
    priority: 65,
    label: "방학추천",
    title: "겨울방학 비교과와 진로 프로그램을 확인해요",
    message: "방학 기간에는 비교과, 마일리지, 진로·취업 프로그램을 미리 확인하기 좋아요.",
    url: "https://extracur.smu.ac.kr/extracur/index.do",
    button: "비교과/마일리지 보기",
    secondaryUrl: "https://smcareer.smu.ac.kr/",
    secondaryButton: "SMe 포트폴리오",
  },
];

const checkCards = [
  {
    id: "deadline",
    title: "마감부터 보기",
    image: smoongiAssets.deadline,
    description: "D-Day와 날짜를 먼저 확인해서 놓치기 쉬운 신청을 위로 올려요.",
    answer: "마감이 가까운 일정은 신청 페이지와 통합공지에서 마감 시간까지 같이 확인하는 게 좋아요.",
    links: [
      { title: "통합공지", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
      { title: "수강신청", url: "https://sugang.smu.ac.kr/" },
    ],
  },
  {
    id: "target",
    title: "대상 확인",
    image: smoongiAssets.target,
    description: "학년, 캠퍼스, 전공, 참여 조건을 먼저 확인해요.",
    answer: "대상 확인에서는 학년, 캠퍼스, 전공 제한, 중복 참여 가능 여부를 먼저 봐야 해요.",
    links: [
      { title: "상명 Q&A", url: "https://www.smu.ac.kr/kor/life/faq.do" },
      { title: "통합공지", url: "https://www.smu.ac.kr/lounge/notice/notice.do" },
    ],
  },
  {
    id: "source",
    title: "출처 확인",
    image: smoongiAssets.source,
    description: "세부 시간은 공식 공지 기준으로 한 번 더 확인해요.",
    answer: "출처 확인은 공식 링크 모음으로 연결했어요. 일정 요약이 맞더라도 최종 신청 전에는 공식 공지를 확인해줘.",
    links: officialLinks,
  },
];

const categoryGrid = document.querySelector("#categoryGrid");
const officialLinkList = document.querySelector("#officialLinkList");
const checkGrid = document.querySelector("#checkGrid");
const detailPanel = document.querySelector("#detailPanel");
const detailTitle = document.querySelector("#detailTitle");
const detailDescription = document.querySelector("#detailDescription");
const detailItems = document.querySelector("#detailItems");
const aiForm = document.querySelector("#aiForm");
const aiInput = document.querySelector("#aiInput");
const aiAnswer = document.querySelector("#aiAnswer");
const smartBanner = document.querySelector("#smartBanner");
const academicScheduleList = document.querySelector("#academicScheduleList");
const scheduleStatus = document.querySelector("#scheduleStatus");
const scheduleCount = document.querySelector("#scheduleCount");
const scheduleFilters = Array.from(document.querySelectorAll("[data-schedule-filter]"));
const scheduleRefresh = document.querySelector("#scheduleRefresh");
const scheduleYearSelect = document.querySelector("#scheduleYearSelect");
const academicCalendarUrl = "https://www.smu.ac.kr/kor/life/academicCalendar.do";
let academicScheduleEvents = [];
let activeScheduleFilter = "all";

function renderCategories() {
  categoryGrid.innerHTML = categories
    .map(
      (category) => `
        <button class="category-card" type="button" data-category-id="${category.id}">
          <span class="smoongi-icon" aria-hidden="true">
            ${imageTag(category.image, "")}
          </span>
          <strong>${category.title}</strong>
          <small>${category.description}</small>
        </button>
      `,
    )
    .join("");

  categoryGrid.querySelectorAll(".category-card").forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.categoryId));
  });
  wireImageFallbacks(categoryGrid);
}

function renderLinks() {
  officialLinkList.innerHTML = officialLinks
    .map(
      (link) => `
        <a class="official-link" href="${link.url}" target="_blank" rel="noopener noreferrer">
          <span class="badge">${link.tag}</span>
          <strong>${link.title}</strong>
          <small>${link.description}</small>
        </a>
      `,
    )
    .join("");
}

function renderCheckCards() {
  checkGrid.innerHTML = checkCards
    .map(
      (card) => `
        <button class="check-card" type="button" data-check-id="${card.id}">
          <span class="smoongi-icon wide" aria-hidden="true">
            ${imageTag(card.image, "")}
          </span>
          <div>
            <strong>${card.title}</strong>
            <small>${card.description}</small>
          </div>
        </button>
      `,
    )
    .join("");

  checkGrid.querySelectorAll(".check-card").forEach((button) => {
    button.addEventListener("click", () => selectCheck(button.dataset.checkId));
  });
  wireImageFallbacks(checkGrid);
}

function selectCategory(id) {
  const category = categories.find((item) => item.id === id) || categories[0];
  detailTitle.textContent = category.title;
  detailDescription.textContent = category.description;
  detailItems.innerHTML = `
    ${imageTag(category.image, `${category.title} 수뭉이 이미지`, "detail-image")}
    ${category.items.map(renderDetailItem).join("")}
  `;
  wireImageFallbacks(detailItems);
  document.querySelectorAll(".category-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.categoryId === id);
  });
  detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function selectCheck(id) {
  const card = checkCards.find((item) => item.id === id) || checkCards[0];
  setAnswer(card.title, card.answer, card.links || []);
  if (id === "source") {
    document.querySelector("#official-links").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function setAnswer(title, message, links = []) {
  aiAnswer.classList.add("active");
  aiAnswer.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
    ${links.length ? `<div class="answer-links">${links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a>`).join("")}</div>` : ""}
  `;
}

function renderDetailItem(item) {
  return `
    <a class="event-card clickable-event" href="${item.url}" target="_blank" rel="noopener noreferrer">
      <span>${item.title}</span>
    </a>
  `;
}

function imageTag(src, alt, className = "") {
  return `<img ${className ? `class="${className}"` : ""} src="${src}" alt="${alt}" data-fallback-src="${fallbackImage}" />`;
}

function wireImageFallbacks(root = document) {
  root.querySelectorAll("img[data-fallback-src]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fallbackUrl = img.dataset.fallbackSrc;
        if (!fallbackUrl || img.src.includes(fallbackUrl.replace("./", ""))) return;
        img.src = fallbackUrl;
      },
      { once: true },
    );
  });
}

function getAiResponse(question) {
  const text = question.replaceAll(" ", "").toLowerCase();

  if (text.includes("huss") || text.includes("허스")) {
    return {
      title: "HUSS 관련 안내",
      message: "HUSS 신청 일정은 상명대 통합공지로 이동한 뒤 HUSS 키워드로 검색하는 방식이 가장 안전해요.",
      links: categories.find((category) => category.id === "apply").items.filter((link) => link.title.includes("HUSS")),
    };
  }

  if (text.includes("바이오") || text.includes("bio")) {
    return {
      title: "바이오헬스 관련 안내",
      message: "바이오헬스 혁신융합대학 프로그램은 사업단 홈페이지와 통합공지를 같이 확인하면 좋아요.",
      links: categories.find((category) => category.id === "apply").items.filter((link) => link.title.includes("바이오헬스")),
    };
  }

  if (text.includes("생활관") || text.includes("기숙사") || text.includes("외박")) {
    return {
      title: "학생생활관 안내",
      message: "생활관 공지, 입사/퇴사, 외박/연장 신청은 학생생활관 페이지에서 확인하면 돼요.",
      links: categories.find((category) => category.id === "life").items.filter((link) => link.title.includes("생활관")),
    };
  }

  if (text.includes("도서관") || text.includes("학술정보관") || text.includes("열람실")) {
    return {
      title: "학술정보관 안내",
      message: "도서 검색, 열람실, 학술자료는 학술정보관 페이지에서 확인하면 돼요.",
      links: categories.find((category) => category.id === "life").items.filter((link) => link.title.includes("학술정보관")),
    };
  }

  if (text.includes("샘물") || text.includes("포털") || text.includes("성적")) {
    return {
      title: "포털 안내",
      message: "성적, 학적, 등록 관련 확인은 샘물포털에서 진행하는 경우가 많아요.",
      links: categories.find((category) => category.id === "portal").items.filter((link) => link.title.includes("샘물")),
    };
  }

  if (text.includes("수강") || text.includes("신청") || text.includes("정정")) {
    return {
      title: "신청 일정 확인",
      message: "수강신청이나 정정은 날짜뿐 아니라 시작 시간, 대상 학년, 캠퍼스 기준을 같이 확인해야 해요.",
      links: categories.find((category) => category.id === "apply").items.slice(0, 2),
    };
  }

  if (text.includes("학사") || text.includes("시험") || text.includes("개강") || text.includes("종강")) {
    return {
      title: "학사일정 확인",
      message: "개강, 종강, 시험기간 같은 학교 공통 일정은 상명대 학사일정 페이지를 기준으로 확인하면 돼요.",
      links: categories.find((category) => category.id === "academic").items.slice(0, 2),
    };
  }

  return {
    title: "수뭉이 답변",
    message: "질문 내용과 가까운 공식 링크를 먼저 보여줄게요. 정확한 대상과 마감 시간은 공식 공지에서 한 번 더 확인해줘.",
    links: officialLinks.slice(0, 3),
  };
}


function renderSmartBanner() {
  if (!smartBanner) return;
  smartBanner.hidden = true;
  smartBanner.innerHTML = "";
}


async function loadAcademicScheduleList(forceRefresh = false) {
  if (!academicScheduleList) return;

  const year = getSelectedScheduleYear();
  setScheduleStatus("공식 학사일정을 불러오는 중이에요.", "");
  academicScheduleList.innerHTML = `<div class="schedule-empty">상명대 공식 학사일정에서 전체 일정 목록을 가져오고 있어요.</div>`;
  if (scheduleRefresh) scheduleRefresh.disabled = true;

  try {
    const query = new URLSearchParams({ campus: "seoul", year: String(year) });
    if (forceRefresh) query.set("refresh", "true");
    const response = await fetch(`/api/academic-schedules?${query.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && !Array.isArray(payload.events)) throw new Error(`HTTP ${response.status}`);
    const events = normalizeScheduleEvents(payload.events || [], year);

    if (events.length === 0) throw new Error("일정 데이터 없음");

    academicScheduleEvents = events;
    const isBackup = payload.cache === "fallback" || payload.source === "fallback" || !payload.ok;
    const sourceLabel = isBackup
      ? `${year}년 백업 일정 기준으로 표시 중이에요. 공식 페이지에서 최종 확인해줘.`
      : `상명대 공식 학사일정 기준으로 전체 ${events.length}개 일정을 불러왔어요.`;
    setScheduleStatus(sourceLabel, `${events.length}개 일정`);
    renderAcademicScheduleList();
    updateSmartBannerFromScheduleEvents();
  } catch (error) {
    academicScheduleEvents = normalizeScheduleEvents(getLocalAcademicScheduleFallback(year), year);
    setScheduleStatus(`공식 일정 자동수집이 불안정해서 ${year}년 백업 일정으로 표시 중이에요.`, `${academicScheduleEvents.length}개 일정`);
    renderAcademicScheduleList();
    updateSmartBannerFromScheduleEvents();
  } finally {
    if (scheduleRefresh) scheduleRefresh.disabled = false;
  }
}

function getSelectedScheduleYear() {
  const selected = Number(scheduleYearSelect?.value);
  if (selected) return selected;
  return getKoreanToday().getFullYear();
}

function setScheduleStatus(message, countText) {
  if (scheduleStatus) scheduleStatus.textContent = message;
  if (scheduleCount) scheduleCount.textContent = countText;
}

function normalizeScheduleEvents(events, year) {
  return dedupeScheduleEvents(
    events
      .map((event, index) => {
        const date = normalizeScheduleDate(event.date || event.start || event.startDate, year);
        const endDate = normalizeScheduleDate(event.endDate || event.end || event.date || event.start || event.startDate, year) || date;
        const title = String(event.title || event.subject || event.content || "").replace(/\s+/g, " ").trim();
        if (!date || !isValidScheduleIsoDate(date) || !isValidScheduleIsoDate(endDate) || !isLikelyScheduleTitle(title)) return null;
        return {
          id: event.id || `schedule-${date}-${index}`,
          title,
          date,
          endDate: endDate < date ? date : endDate,
          importance: event.importance || inferScheduleImportance(title),
          note: event.note || "상명대 학사일정",
          url: event.url || academicCalendarUrl,
        };
      })
      .filter(Boolean),
  ).sort((a, b) => a.date.localeCompare(b.date) || a.endDate.localeCompare(b.endDate) || a.title.localeCompare(b.title));
}

function dedupeScheduleEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.date}:${event.endDate}:${event.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeScheduleDate(value, year) {
  if (!value) return "";
  const text = String(value).trim();
  const iso = text.match(/(20\d{2})[-./년\s]*(\d{1,2})[-./월\s]*(\d{1,2})/);
  const normalizedIso = iso ? `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}` : "";
  if (isValidScheduleIsoDate(normalizedIso)) return normalizedIso;

  const short = text.match(/(\d{1,2})[-./월\s]*(\d{1,2})/);
  const normalizedShort = short ? `${year}-${short[1].padStart(2, "0")}-${short[2].padStart(2, "0")}` : "";
  return isValidScheduleIsoDate(normalizedShort) ? normalizedShort : "";
}

function isValidScheduleIsoDate(value) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function isLikelyScheduleTitle(title) {
  if (!title || title.length < 2 || title.length > 80) return false;
  if (/window\.|dataLayer|gtag|function\s*\(|상명소개|열린 총장실|개인정보처리방침|COPYRIGHT|본문 바로가기|모바일 메뉴|서브메뉴|사이트맵|입학안내|대학현황|캠퍼스 안내|정보공개|검색어 입력|담당부서|대표번호|SMPOPUP|Login|닫기/.test(title)) return false;
  if (/^[{}[\];:=,.\s0-9A-Za-z_-]+$/.test(title)) return false;
  return true;
}

function inferScheduleImportance(title) {
  const importantWords = ["수강신청", "장바구니", "성적", "시험", "강의평가", "등록", "휴학", "복학", "학적", "이의신청", "정정", "계절수업"];
  return importantWords.some((word) => title.includes(word)) ? "critical" : "normal";
}

function renderAcademicScheduleList() {
  if (!academicScheduleList) return;
  const events = filterScheduleEvents(academicScheduleEvents);

  scheduleFilters.forEach((button) => {
    button.classList.toggle("active", button.dataset.scheduleFilter === activeScheduleFilter);
  });

  if (scheduleCount) {
    scheduleCount.textContent = `${events.length}개 표시 / 전체 ${academicScheduleEvents.length}개`;
  }

  if (events.length === 0) {
    academicScheduleList.innerHTML = `<div class="schedule-empty">해당 조건에 맞는 학사일정이 없어요. 전체 탭이나 공식 원본을 확인해줘.</div>`;
    return;
  }

  const grouped = groupEventsByMonth(events);
  academicScheduleList.innerHTML = Object.entries(grouped)
    .map(([month, monthEvents]) => `
      <div class="schedule-month-group">
        <div class="schedule-month-title">${month}</div>
        ${monthEvents.map(renderScheduleRow).join("")}
      </div>
    `)
    .join("");
}

function filterScheduleEvents(events) {
  const today = getKoreanToday();
  return events.filter((event) => {
    const start = parseLocalDate(event.date);
    const end = parseLocalDate(event.endDate || event.date);
    if (!start || !end) return false;
    if (activeScheduleFilter === "active") return start <= today && today <= end;
    if (activeScheduleFilter === "upcoming") return start > today;
    if (activeScheduleFilter === "important") return event.importance === "critical";
    return true;
  });
}

function groupEventsByMonth(events) {
  return events.reduce((acc, event) => {
    const date = parseLocalDate(event.date);
    const key = date ? `${date.getFullYear()}년 ${date.getMonth() + 1}월` : "날짜 미정";
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});
}

function renderScheduleRow(event) {
  const meta = getScheduleMeta(event);
  const ddayClass = meta.phase === "active" ? "active" : meta.phase === "upcoming" ? "upcoming" : "";
  const rowClass = meta.phase === "active" ? "is-active" : meta.phase === "upcoming" && meta.daysUntil <= 1 ? "is-soon" : "";
  return `
    <a class="schedule-row ${rowClass}" href="${event.url || academicCalendarUrl}" target="_blank" rel="noopener noreferrer">
      <span class="schedule-date">${formatScheduleRange(event.date, event.endDate)}</span>
      <span class="schedule-title">
        <strong>${event.title}</strong>
        <small>${event.note || "상명대 공식 학사일정"}</small>
      </span>
      <span class="schedule-dday ${ddayClass}">${meta.label}</span>
    </a>
  `;
}

function formatScheduleRange(start, end) {
  const startText = formatScheduleDate(start);
  const endText = end && end !== start ? formatScheduleDate(end) : "";
  return endText ? `${startText} ~ ${endText}` : startText;
}

function formatScheduleDate(value) {
  const date = parseLocalDate(value);
  if (!date) return value || "날짜 미정";
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}.${date.getDate()}(${weekdays[date.getDay()]})`;
}

function getScheduleState(event) {
  return getScheduleMeta(event).label;
}

function getScheduleMeta(event) {
  const today = getKoreanToday();
  const start = parseLocalDate(event.date);
  const end = parseLocalDate(event.endDate || event.date);
  if (!start || !end) return { label: "확인", phase: "unknown", daysUntil: Infinity, daysFromStart: 0 };

  if (today < start) {
    const daysUntil = daysBetween(today, start);
    return {
      label: daysUntil === 1 ? "내일 시작" : daysUntil <= 30 ? `D-${daysUntil}` : "예정",
      phase: "upcoming",
      daysUntil,
      daysFromStart: 0,
    };
  }

  if (today > end) {
    return {
      label: "종료",
      phase: "past",
      daysUntil: -daysBetween(end, today),
      daysFromStart: daysBetween(start, today),
    };
  }

  const daysFromStart = daysBetween(start, today);
  const isSingleDay = start.getTime() === end.getTime();
  return {
    label: daysFromStart === 0 ? (isSingleDay ? "오늘" : "오늘 시작") : "진행중",
    phase: "active",
    daysUntil: 0,
    daysFromStart,
  };
}

function parseLocalDate(value) {
  if (!isValidScheduleIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getKoreanToday() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return startOfDay(new Date(Number(map.year), Number(map.month) - 1, Number(map.day)));
  } catch {
    return startOfDay(new Date());
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start, end) {
  return Math.round((startOfDay(end) - startOfDay(start)) / 86400000);
}

function updateSmartBannerFromScheduleEvents() {
  if (!smartBanner || academicScheduleEvents.length === 0) return;
  const today = getKoreanToday();
  const candidates = academicScheduleEvents
    .map((event) => ({ event, meta: getScheduleMeta(event) }))
    .filter(({ event, meta }) => meta.phase !== "past" && parseLocalDate(event.endDate || event.date) >= today)
    .sort((a, b) => getScheduleBannerScore(b.event, b.meta) - getScheduleBannerScore(a.event, a.meta) || a.event.date.localeCompare(b.event.date));

  const picked = candidates[0];
  if (!picked) {
    smartBanner.hidden = true;
    smartBanner.innerHTML = "";
    return;
  }

  const { event, meta } = picked;
  const phrase = getScheduleBannerPhrase(event, meta);
  smartBanner.hidden = false;
  smartBanner.innerHTML = `
    <div class="smart-banner-copy">
      <span class="smart-banner-label">${meta.label}</span>
      <strong>${event.title}</strong>
      <small>${phrase} · ${formatScheduleRange(event.date, event.endDate)} · 공식 학사일정표 기준으로 확인해요.</small>
    </div>
    <div class="smart-banner-actions">
      <a href="${event.url || academicCalendarUrl}" target="_blank" rel="noopener noreferrer">공식 일정표 열기</a>
      <a class="sub" href="#scheduleListTitle">전체 목록 보기</a>
    </div>
  `;
}

function getScheduleBannerScore(event, meta) {
  const title = event.title || "";
  let score = event.importance === "critical" ? 100 : 0;
  if (meta.phase === "upcoming") {
    score += 80 - Math.min(meta.daysUntil, 30);
    if (meta.daysUntil <= 1) score += 70;
    if (meta.daysUntil <= 3) score += 25;
  }
  if (meta.phase === "active") score += 65;
  if (/성적|수강신청|장바구니|정정|확정|이의신청|시험|등록/.test(title)) score += 35;
  return score;
}

function getScheduleBannerPhrase(event, meta) {
  if (meta.phase === "upcoming") {
    if (meta.daysUntil === 1) return "내일부터 시작되는 일정이에요";
    if (meta.daysUntil === 0) return "오늘 시작되는 일정이에요";
    return `${meta.daysUntil}일 뒤 시작되는 일정이에요`;
  }

  if (meta.phase === "active") {
    return meta.daysFromStart === 0 ? "오늘 시작된 일정이에요" : "현재 진행 중인 일정이에요";
  }

  return "날짜를 공식 페이지에서 확인해요";
}

function getLocalAcademicScheduleFallback(year) {
  if (String(year) === "2026") {
    return [
      { title: "2026-1학기 기말강의평가", date: "2026-06-30", endDate: "2026-07-04", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-1학기 성적입력", date: "2026-06-28", endDate: "2026-07-05", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-1학기 성적확인", date: "2026-07-02", endDate: "2026-07-04", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-하계 계절수업", date: "2026-06-30", endDate: "2026-07-08", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-1학기 성적확정", date: "2026-07-10", endDate: "2026-07-10", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-하계 계절수업 성적입력 기간", date: "2026-07-08", endDate: "2026-07-13", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-하계 계절수업 성적 확인, 이의신청 및 정정 기간", date: "2026-07-14", endDate: "2026-07-15", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-2학기 대상 학적 변동 기간", date: "2026-07-13", endDate: "2026-07-17", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-2학기 장바구니 수강신청(1차)", date: "2026-07-16", endDate: "2026-07-17", importance: "critical", note: "공식 학사일정표 백업" },
      { title: "2026-하계 계절수업 성적확정", date: "2026-07-23", endDate: "2026-07-23", importance: "critical", note: "공식 학사일정표 백업" },
    ];
  }

  return [
    { title: `${year}-1학기 학사일정`, date: `${year}-03-01`, endDate: `${year}-06-30`, importance: "normal", note: "기본 백업 일정" },
    { title: `${year}-2학기 학사일정`, date: `${year}-09-01`, endDate: `${year}-12-31`, importance: "normal", note: "기본 백업 일정" },
  ];
}

scheduleFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeScheduleFilter = button.dataset.scheduleFilter || "all";
    renderAcademicScheduleList();
  });
});

scheduleRefresh?.addEventListener("click", () => {
  loadAcademicScheduleList(true);
});

scheduleYearSelect?.addEventListener("change", () => {
  activeScheduleFilter = "all";
  loadAcademicScheduleList(true);
});

aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = aiInput.value.trim();
  if (!question) {
    setAnswer("질문을 입력해줘", "예: HUSS 신청일 알려줘, 학생생활관 외박 신청 어디야? 처럼 물어보면 돼요.");
    aiInput.focus();
    return;
  }

  setAnswer("답변 생성 중", "질문을 확인하고 있어요. 잠시만 기다려주세요.");
  window.setTimeout(() => {
    const response = getAiResponse(question);
    setAnswer(response.title, response.message, response.links);
  }, 250);
});

renderCategories();
renderLinks();
renderCheckCards();
if (scheduleYearSelect) {
  const currentYear = String(getKoreanToday().getFullYear());
  if ([...scheduleYearSelect.options].some((option) => option.value === currentYear)) {
    scheduleYearSelect.value = currentYear;
  }
}

renderSmartBanner();
loadAcademicScheduleList();
wireImageFallbacks();
selectCategory("academic");
