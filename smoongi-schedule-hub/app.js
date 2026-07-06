const officialLinks = [
  {
    title: "상명대 홈페이지",
    description: "학교 공식 홈페이지 메인",
    url: "https://www.smu.ac.kr/ko/index.do",
    tag: "공식",
  },
  {
    title: "상명대 학사일정",
    description: "개강, 종강, 시험, 등록 등 학사 캘린더",
    url: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
    tag: "학사",
  },
  {
    title: "수강신청 시스템",
    description: "수강신청 및 정정 기간에 확인",
    url: "https://sugang.smu.ac.kr/",
    tag: "신청",
  },
  {
    title: "상명대 통합공지",
    description: "장학, 학사, 비교과, 사업단 공지 확인",
    url: "https://www.smu.ac.kr/lounge/notice/notice.do",
    tag: "공지",
  },
  {
    title: "상명 Q&A FAQ",
    description: "자주 묻는 학사/학교생활 질문 확인",
    url: "https://www.smu.ac.kr/lounge/qna/faq.do",
    tag: "FAQ",
  },
  {
    title: "바이오헬스 사업단",
    description: "바이오헬스 혁신융합대학 공지와 비교과",
    url: "https://www.smu.ac.kr/biohealth/index.do",
    tag: "바이오헬스",
  },
  {
    title: "HUSS 확인",
    description: "HUSS 관련 공지는 통합공지에서 HUSS로 검색",
    url: "https://www.smu.ac.kr/lounge/notice/notice.do?mode=list&srSearchKey=article_title&srSearchVal=HUSS",
    tag: "HUSS",
  },
];

const smoongiAssets = {
  academic: "./assets/smoongi/spring_deer.png",
  apply: "./assets/smoongi/sky_jump.png",
  faq: "./assets/smoongi/free_major_youtube.png",
  extracurricular: "./assets/smoongi/autumn_reading.png",
  notice: "./assets/smoongi/night_bench.png",
  deadline: "./assets/smoongi/fireworks.png",
  target: "./assets/smoongi/grass_pair.png",
  source: "./assets/smoongi/painting.png",
  winter: "./assets/smoongi/winter_tree.png",
  snow: "./assets/smoongi/snow_mountain.png",
  christmas: "./assets/smoongi/christmas.png",
};

const categories = [
  {
    id: "academic",
    title: "학사",
    image: smoongiAssets.academic,
    description: "개강, 종강, 시험기간, 등록 같은 학교 공통 일정",
    items: ["학사일정 캘린더", "시험기간", "등록/휴학/복학", "계절학기"],
    linkTitle: "학사일정 바로가기",
    linkUrl: "https://www.smu.ac.kr/ko/life/academicCalendar.do",
  },
  {
    id: "apply",
    title: "신청",
    image: smoongiAssets.apply,
    description: "수강신청, 비교과 신청, 사업단 프로그램 신청 확인",
    items: ["수강신청", "정정 기간", "HUSS 신청", "바이오헬스 프로그램"],
    linkTitle: "수강신청 바로가기",
    linkUrl: "https://sugang.smu.ac.kr/",
  },
  {
    id: "faq",
    title: "FAQ",
    image: smoongiAssets.faq,
    description: "자주 묻는 질문과 학교생활 도움말",
    items: ["학사 FAQ", "신청 방법", "이수 기준", "문의처"],
    linkTitle: "상명 FAQ 바로가기",
    linkUrl: "https://www.smu.ac.kr/lounge/qna/faq.do",
  },
  {
    id: "extracurricular",
    title: "비교과",
    image: smoongiAssets.extracurricular,
    description: "비교과 프로그램, 마일리지, 사업단 활동",
    items: ["비교과 프로그램", "마일리지", "바이오헬스 비교과", "HUSS 프로그램"],
    linkTitle: "바이오헬스 비교과 보기",
    linkUrl: "https://www.smu.ac.kr/biohealth/index.do",
  },
  {
    id: "notice",
    title: "공지",
    image: smoongiAssets.notice,
    description: "상명대 통합공지와 사업단별 공지 확인",
    items: ["통합공지", "학사공지", "장학공지", "사업단 공지"],
    linkTitle: "통합공지 바로가기",
    linkUrl: "https://www.smu.ac.kr/lounge/notice/notice.do",
  },
];

const checkCards = [
  {
    id: "deadline",
    title: "마감부터 보기",
    image: smoongiAssets.deadline,
    description: "D-Day와 날짜를 먼저 확인해서 놓치기 쉬운 신청을 위로 올려요.",
    answer: "마감이 가까운 일정부터 보는 화면으로 이동했어요. 신청 공지는 마감 시간과 제출 방식까지 같이 확인하는 게 좋아요.",
  },
  {
    id: "target",
    title: "대상 확인",
    image: smoongiAssets.target,
    description: "나한테 해당되는 일정인지 학년, 캠퍼스, 전공, 참여 조건을 확인해요.",
    answer: "대상 확인에서는 학년, 캠퍼스, 전공 제한, 중복 참여 가능 여부를 먼저 봐야 해요.",
  },
  {
    id: "source",
    title: "출처 확인",
    image: smoongiAssets.source,
    description: "세부 시간은 공식 공지 기준으로 한 번 더 확인해요.",
    answer: "출처 확인은 공식 링크 모음으로 연결했어요. 일정 요약이 맞더라도 최종 신청 전에는 공식 공지를 확인해줘.",
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

function renderCategories() {
  categoryGrid.innerHTML = categories
    .map(
      (category) => `
        <button class="category-card" type="button" data-category-id="${category.id}">
          <span class="smoongi-icon" aria-hidden="true">
            <img src="${category.image}" alt="" />
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
            <img src="${card.image}" alt="" />
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
}

function selectCategory(id) {
  const category = categories.find((item) => item.id === id) || categories[0];
  detailTitle.textContent = category.title;
  detailDescription.textContent = category.description;
  detailItems.innerHTML = `
    <img class="detail-image" src="${category.image}" alt="${category.title} 수뭉이 이미지" />
    ${category.items.map((item) => `<div class="event-card"><span>${item}</span></div>`).join("")}
    <a class="detail-link" href="${category.linkUrl}" target="_blank" rel="noopener noreferrer">${category.linkTitle}</a>
  `;
  document.querySelectorAll(".category-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.categoryId === id);
  });
  detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function selectCheck(id) {
  const card = checkCards.find((item) => item.id === id) || checkCards[0];
  setAnswer(card.title, card.answer);
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

function getAiResponse(question) {
  const text = question.replaceAll(" ", "").toLowerCase();

  if (text.includes("huss") || text.includes("허스")) {
    return {
      title: "HUSS 관련 안내",
      message: "HUSS 신청 일정은 통합공지에서 HUSS 키워드로 확인하는 방식이 가장 안전해요. 신청 대상, 마감 시간, 제출 링크는 공지마다 달라질 수 있어요.",
      links: officialLinks.filter((link) => link.tag === "HUSS" || link.tag === "공지"),
    };
  }

  if (text.includes("바이오") || text.includes("bio")) {
    return {
      title: "바이오헬스 관련 안내",
      message: "바이오헬스 혁신융합대학 프로그램은 사업단 홈페이지의 공지사항과 비교과 프로그램을 같이 확인하면 좋아요.",
      links: officialLinks.filter((link) => link.tag === "바이오헬스" || link.tag === "공지"),
    };
  }

  if (text.includes("수강") || text.includes("신청") || text.includes("정정")) {
    return {
      title: "신청 일정 확인",
      message: "수강신청이나 정정은 날짜뿐 아니라 시작 시간, 대상 학년, 캠퍼스 기준을 같이 확인해야 해요.",
      links: officialLinks.filter((link) => link.tag === "신청" || link.tag === "학사"),
    };
  }

  if (text.includes("학사") || text.includes("시험") || text.includes("개강") || text.includes("종강")) {
    return {
      title: "학사일정 확인",
      message: "개강, 종강, 시험기간 같은 학교 공통 일정은 상명대 학사일정 페이지를 기준으로 확인하면 돼요.",
      links: officialLinks.filter((link) => link.tag === "학사"),
    };
  }

  return {
    title: "수뭉이 답변",
    message: "질문 내용과 가까운 공식 링크를 먼저 보여줄게요. 정확한 대상과 마감 시간은 공식 공지에서 한 번 더 확인해줘.",
    links: officialLinks.slice(0, 4),
  };
}

aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = aiInput.value.trim();
  if (!question) {
    setAnswer("질문을 입력해줘", "예: HUSS 신청일 알려줘, 바이오헬스 공지 어디서 봐? 처럼 물어보면 돼요.");
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
selectCategory("academic");
