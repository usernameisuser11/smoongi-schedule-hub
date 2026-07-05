const labels = {
  all: "전체",
  academic: "학사",
  course: "수강",
  grade: "성적",
  huss: "HUSS",
  kmooc: "K-MOOC",
  biohealth: "바이오헬스",
  activity: "비교과",
};

const state = { items: [], faqs: [], category: "all", query: "", sort: "soon" };

const $ = (selector) => document.querySelector(selector);
const mascotAssets = [
  "smoongi-main.png",
  "smoongi-main-face.png",
  "smoongi-desk.png",
  "smoongi-desk-face.png",
  "smoongi-autumn.png",
  "smoongi-small.png",
  "smoongi-cover-desk.png",
  "smoongi-cover-autumn.png",
];

init();

async function init() {
  renderFilters();
  bindEvents();
  const [items, faqs] = await Promise.all([fetchJson("/api/items"), fetchJson("/api/faqs")]);
  state.items = items.items || [];
  state.faqs = faqs.faqs || [];
  render();
}

function bindEvents() {
  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  $("#askForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = $("#questionInput").value.trim();
    if (!question) return;
    await ask(question);
  });
}

function renderFilters() {
  $("#filters").innerHTML = Object.entries(labels)
    .map(([key, label]) => `<button class="chip ${key === "all" ? "active" : ""}" data-category="${key}">${label}</button>`)
    .join("");
  $("#filters").addEventListener("click", (e) => {
    const button = e.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    render();
  });
}

function render() {
  const items = filteredItems();
  const faqs = filteredFaqs();
  $("#items").innerHTML = items.length ? items.map(renderItem).join("") : `<div class="empty">일정이 없습니다.</div>`;
  $("#faqs").innerHTML = faqs.length ? faqs.map(renderFaq).join("") : `<div class="empty">FAQ가 없습니다.</div>`;
  $("#itemCount").textContent = state.items.length;
  $("#faqCount").textContent = state.faqs.length;
  $("#checkCount").textContent = state.items.filter((item) => item.needsVerification).length;
  const next = [...state.items].filter((item) => item.startDate).sort(compareSoon)[0];
  $("#nextItem").textContent = next ? `${dday(next)} · ${next.title}` : "확인 필요한 일정부터 채우기";
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.category);
  });
}

function filteredItems() {
  return state.items
    .filter((item) => state.category === "all" || item.category === state.category)
    .filter((item) => match(item))
    .sort(state.sort === "category" ? compareCategory : compareSoon);
}

function filteredFaqs() {
  return state.faqs
    .filter((faq) => state.category === "all" || faq.category === state.category)
    .filter((faq) => match(faq));
}

function renderItem(item) {
  const img = mascotForItem(item);
  return `
    <article class="item ${item.needsVerification ? "warning" : ""}">
      <div class="date"><strong>${dday(item)}</strong><span>${dateRange(item)}</span></div>
      <div class="body">
        <div class="title-row"><h3>${esc(item.title)}</h3><span class="badge">${labels[item.category] || item.category}</span></div>
        <p>${esc(item.summary)}</p>
        <div class="meta">
          <span>${item.needsVerification ? "확인 필요" : "확인됨"}</span>
          <span>마지막 확인 ${item.verifiedAt ? formatShort(item.verifiedAt) : "미등록"}</span>
          ${item.sourceUrl ? `<a href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer">공식 링크</a>` : ""}
        </div>
      </div>
      <img class="sticker" src="./assets/${img}" alt="" />
    </article>
  `;
}

function renderFaq(faq) {
  const img = mascotForKey(faq.id || faq.question);
  return `
    <article class="faq">
      <div class="faq-top">
        <span class="badge">${labels[faq.category] || faq.category}</span>
        <img src="./assets/${img}" alt="" />
      </div>
      <h3>${esc(faq.question)}</h3>
      <p>${esc(faq.answer)}</p>
      <small>${esc(faq.caution || "세부사항은 공식 공지를 확인하세요.")}</small>
    </article>
  `;
}

function mascotForItem(item) {
  if (item.needsVerification) return "smoongi-desk-face.png";
  if (item.category === "course") return mascotForKey(item.id, ["smoongi-small.png", "smoongi-small-wide.png", "smoongi-main-face.png"]);
  if (item.category === "grade") return "smoongi-main-face.png";
  if (item.category === "academic") return mascotForKey(item.id, ["smoongi-main.png", "smoongi-cover-desk.png"]);
  return mascotForKey(item.id);
}

function mascotForKey(key, pool = mascotAssets) {
  const seed = String(key || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

async function ask(question) {
  $("#answer").classList.remove("hidden");
  $("#answer").innerHTML = `<div class="empty">수뭉이가 관련 자료를 찾는 중입니다.</div>`;
  try {
    const data = await fetchJson("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    $("#answer").innerHTML = `
      <p class="eyebrow">AI 안내</p>
      <h2>${esc(question)}</h2>
      <p class="answer-text">${esc(data.answer)}</p>
      <p class="caution">이 답변은 등록된 자료를 바탕으로 정리한 안내입니다. 세부 시간과 대상은 공식 공지를 다시 확인해주세요.</p>
    `;
  } catch (error) {
    $("#answer").innerHTML = `<div class="empty">답변 생성 실패: ${esc(error.message)}</div>`;
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청 실패");
  return data;
}

function match(item) {
  if (!state.query) return true;
  return [item.title, item.summary, item.question, item.answer, item.category, item.tags?.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(state.query);
}

function compareSoon(a, b) {
  if (!a.startDate && !b.startDate) return a.title.localeCompare(b.title, "ko");
  if (!a.startDate) return 1;
  if (!b.startDate) return -1;
  return a.startDate.localeCompare(b.startDate);
}

function compareCategory(a, b) {
  return (labels[a.category] || a.category).localeCompare(labels[b.category] || b.category, "ko") || compareSoon(a, b);
}

function dday(item) {
  if (!item.startDate) return "확인 필요";
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${item.startDate}T00:00:00`);
  const diff = Math.ceil((target - base) / 86400000);
  if (diff === 0) return "오늘";
  if (diff > 0) return `D-${diff}`;
  return "진행/마감";
}

function dateRange(item) {
  if (!item.startDate) return "날짜 확인 필요";
  const start = formatDate(item.startDate);
  if (!item.endDate || item.endDate === item.startDate) return start;
  return `${start} ~ ${formatDate(item.endDate)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${date}T00:00:00`));
}

function formatShort(date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date(date));
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
