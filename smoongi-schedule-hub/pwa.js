(() => {
  const panel = document.getElementById("pwaInstallPanel");
  const button = document.getElementById("pwaInstallButton");
  const guide = document.getElementById("pwaInstallGuide");
  const offlineNotice = document.getElementById("pwaOfflineNotice");
  if (!panel || !button || !guide || !offlineNotice) return;
  const ua = navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const inAppBrowser = /Instagram|FBAN|FBAV|KAKAOTALK|Line\//i.test(ua);
  const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let deferredPrompt = null;

  function updateOfflineNotice() {
    offlineNotice.hidden = navigator.onLine;
  }
  updateOfflineNotice();
  window.addEventListener("online", updateOfflineNotice);
  window.addEventListener("offline", updateOfflineNotice);

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("수뭉이 오프라인 준비 실패:", error);
      });
    });
  }

  if (!isInstalled() && (isIos || isAndroid || inAppBrowser)) panel.hidden = false;
  function showGuide(message) {
    guide.textContent = message;
    guide.hidden = false;
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!isInstalled()) panel.hidden = false;
  });

  button.addEventListener("click", async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      prompt.prompt();
      await prompt.userChoice;
      return;
    }
    if (inAppBrowser) {
      showGuide("인스타그램 안에서는 바로 설치되지 않을 수 있어요. 오른쪽 위 ··· 메뉴에서 외부 브라우저(Safari 또는 Chrome)로 연 뒤 홈 화면에 추가해 주세요.");
    } else if (isIos) {
      showGuide("Safari의 공유 버튼을 누른 다음 ‘홈 화면에 추가’를 선택해 주세요. 메뉴에 없다면 ‘동작 편집’에서 찾아볼 수 있어요.");
    } else {
      showGuide("Chrome 메뉴(⋮)에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요.");
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    panel.hidden = true;
  });
  if (isInstalled()) panel.hidden = true;
})();
