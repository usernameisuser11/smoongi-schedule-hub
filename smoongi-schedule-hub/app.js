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
  const banner = getActiveSmartBanner();

  if (!banner) {
    smartBanner.hidden = true;
    smartBanner.innerHTML = "";
    return;
  }

  smartBanner.hidden = false;
  smartBanner.innerHTML = `
    <div class="smart-banner-copy">
      <span class="smart-banner-label">${banner.label}</span>
      <strong>${banner.title}</strong>
      <small>${banner.message}</small>
    </div>
    <div class="smart-banner-actions">
      <a href="${banner.url}" target="_blank" rel="noopener noreferrer">${banner.button}</a>
      ${banner.secondaryUrl ? `<a class="sub" href="${banner.secondaryUrl}" target="_blank" rel="noopener noreferrer">${banner.secondaryButton}</a>` : ""}
    </div>
  `;
}

function getActiveSmartBanner(today = new Date()) {
  return smartBannerRules
    .filter((rule) => isTodayInRange(rule.start, rule.end, today))
    .sort((a, b) => b.priority - a.priority)[0];
}

function isTodayInRange(start, end, today) {
  const current = monthDayToNumber(`${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  const startValue = monthDayToNumber(start);
  const endValue = monthDayToNumber(end);

  if (startValue <= endValue) {
    return current >= startValue && current <= endValue;
  }

  return current >= startValue || current <= endValue;
}

function monthDayToNumber(value) {
  const [month, day] = value.split("-").map(Number);
  return month * 100 + day;
}

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
renderSmartBanner();
wireImageFallbacks();
selectCategory("academic");
