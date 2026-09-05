// [Предположение] Минимальный service worker — только чтобы сайт был
// устанавливаемым (PWA) и открывался офлайн со старой версией оболочки.
// Данные (турниры, профиль) всегда идут в сеть, кешируется только сама
// оболочка приложения.
const CACHE = "blackcard-shell-v1";
const SHELL_FILES = ["./app.html", "./manifest.webmanifest", "./assets/logo.png", "./assets/background.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // не трогаем запросы к API
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
