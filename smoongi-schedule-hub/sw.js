/* Official schedule/notice API responses are always network-only. */
const CACHE_NAME = "smoongi-shell-v1";
const APP_SHELL = ["/", "/index.html", "/styles.css", "/notice-hub.css",
  "/app.js", "/notice-hub.js", "/official-program-links.js", "/pwa.js",
  "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("smoongi-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name)))),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy)));
      }
      return response;
    }).catch(async () => (await caches.match("/index.html")) || Response.error()));
    return;
  }

  event.respondWith(fetch(request).then((response) => {
    // Never mistake the server's HTML fallback for an icon or script.
    if (response.ok && !response.headers.get("content-type")?.includes("text/html")) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || Response.error()));
});
