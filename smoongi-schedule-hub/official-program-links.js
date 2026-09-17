(() => {
  const HUSS_URL = "https://huss.ac.kr/";
  const KMOOC_URL = "https://www.kmooc.kr/";

  function patchApplyCategoryData() {
    try {
      if (typeof categories === "undefined") return;
      const applyCategory = categories.find((category) => category.id === "apply");
      if (!applyCategory) return;

      applyCategory.items.forEach((item) => {
        const compact = String(item.title || "").replace(/\s+/g, "").toLowerCase();
        if (compact.includes("huss") || compact.includes("허스")) item.url = HUSS_URL;
        if (compact.includes("k-mooc") || compact.includes("kmooc") || compact.includes("케이묵") || compact.includes("케이무크")) {
          item.url = KMOOC_URL;
        }
      });
    } catch (error) {
      console.warn("official program link patch failed", error);
    }
  }

  function rewriteOfficialProgramLinks(root = document) {
    root.querySelectorAll?.("a").forEach((anchor) => {
      const label = (anchor.textContent || "").replace(/\s+/g, " ").trim();
      const compact = label.replace(/\s+/g, "").toLowerCase();

      if (compact.includes("huss") || compact.includes("허스")) {
        anchor.href = HUSS_URL;
        return;
      }

      if (compact.includes("k-mooc") || compact.includes("kmooc") || compact.includes("케이묵") || compact.includes("케이무크")) {
        anchor.href = KMOOC_URL;
      }
    });
  }

  function renderProgramAnswer(question) {
    const compact = String(question || "").replace(/\s+/g, "").toLowerCase();
    const isHuss = compact.includes("huss") || compact.includes("허스");
    const isKmooc = compact.includes("k-mooc") || compact.includes("kmooc") || compact.includes("케이묵") || compact.includes("케이무크");
    if (!isHuss && !isKmooc) return;

    window.setTimeout(() => {
      const answer = document.querySelector("#aiAnswer");
      if (!answer) return;

      const title = isHuss ? "HUSS 안내" : "K-MOOC 안내";
      const message = isHuss
        ? "HUSS 공지와 사업 정보는 HUSS 공식 홈페이지에서 바로 확인할 수 있어요."
        : "K-MOOC 강좌와 수강 정보는 K-MOOC 공식 홈페이지에서 바로 확인할 수 있어요.";
      const url = isHuss ? HUSS_URL : KMOOC_URL;
      const linkLabel = isHuss ? "HUSS 공식 홈페이지" : "K-MOOC 공식 홈페이지";

      answer.classList.add("active");
      answer.innerHTML = `
        <strong>${title}</strong>
        <span>${message}</span>
        <div class="answer-links"><a href="${url}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></div>
      `;
    }, 320);
  }

  patchApplyCategoryData();

  document.addEventListener("DOMContentLoaded", () => {
    rewriteOfficialProgramLinks();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) rewriteOfficialProgramLinks(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const aiForm = document.querySelector("#aiForm");
    const aiInput = document.querySelector("#aiInput");
    aiForm?.addEventListener("submit", () => renderProgramAnswer(aiInput?.value));
  });
})();
