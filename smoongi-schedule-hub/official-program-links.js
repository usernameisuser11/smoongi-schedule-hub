(() => {
  const HUSS_URL = "https://huss.ac.kr/";
  const KMOOC_URL = "https://www.kmooc.kr/";

  function rewriteOfficialProgramLinks(root = document) {
    root.querySelectorAll?.("a").forEach((anchor) => {
      const label = (anchor.textContent || "").replace(/\s+/g, " ").trim();
      const compact = label.replace(/\s+/g, "").toLowerCase();

      if (compact.includes("huss") || compact.includes("허스")) {
        anchor.href = HUSS_URL;
        if (/공지\s*확인/.test(label)) anchor.textContent = "HUSS 공식 홈페이지";
        return;
      }

      if (compact.includes("k-mooc") || compact.includes("kmooc") || compact.includes("케이묵") || compact.includes("케이무크")) {
        anchor.href = KMOOC_URL;
        if (/공지\s*확인/.test(label)) anchor.textContent = "K-MOOC 공식 홈페이지";
      }
    });
  }

  function renderKmoocAnswer(question) {
    const compact = String(question || "").replace(/\s+/g, "").toLowerCase();
    const isKmooc = compact.includes("k-mooc") || compact.includes("kmooc") || compact.includes("케이묵") || compact.includes("케이무크");
    if (!isKmooc) return;

    window.setTimeout(() => {
      const answer = document.querySelector("#aiAnswer");
      if (!answer) return;
      answer.classList.add("active");
      answer.innerHTML = `
        <strong>K-MOOC 안내</strong>
        <span>K-MOOC 강좌와 수강 정보는 K-MOOC 공식 홈페이지에서 바로 확인할 수 있어요.</span>
        <div class="answer-links"><a href="${KMOOC_URL}" target="_blank" rel="noopener noreferrer">K-MOOC 공식 홈페이지</a></div>
      `;
    }, 320);
  }

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
    aiForm?.addEventListener("submit", () => renderKmoocAnswer(aiInput?.value));
  });
})();
