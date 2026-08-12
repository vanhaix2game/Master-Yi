export function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(
      (reg) => console.log("SW registered:", reg.scope),
      (err) => console.warn("SW registration failed:", err)
    );
  });
}

export function setupInstallPrompt() {
  let deferredPrompt: any = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const btn = document.getElementById("install-btn") || createInstallButton();
    btn.style.display = "block";
    btn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log("Install result:", result.outcome);
      deferredPrompt = null;
      btn.style.display = "none";
    });
  });

  window.addEventListener("appinstalled", () => {
    console.log("App installed");
    const btn = document.getElementById("install-btn");
    if (btn) btn.style.display = "none";
  });
}

function createInstallButton(): HTMLElement {
  const btn = document.createElement("button");
  btn.id = "install-btn";
  btn.textContent = "Cài đặt game";
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:12px 24px;background:#f43f5e;color:#fff;border:none;
    border-radius:8px;font:600 16px sans-serif;cursor:pointer;
    box-shadow:0 4px 12px rgba(244,63,94,0.4);display:none;
  `;
  document.body.appendChild(btn);
  return btn;
}
