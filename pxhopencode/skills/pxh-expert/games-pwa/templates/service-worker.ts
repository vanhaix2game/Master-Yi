const CACHE_NAME = "game-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./src/main.ts",
  "./assets/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Game assets: cache-first
  if (url.pathname.match(/\.(html|js|css|png|jpg|webp|glb|mp3|ogg|wav)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // API: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
