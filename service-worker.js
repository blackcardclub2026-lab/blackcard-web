// [Предположение] Минимальный service worker — только чтобы сайт был
// устанавливаемым (PWA) и открывался офлайн со старой версией оболочки.
// Данные (турниры, профиль) всегда идут в сеть, кешируется только сама
// оболочка приложения.
//
// ВАЖНО: при каждом изменении app.html (или другого файла из SHELL_FILES)
// нужно поднимать номер версии ниже (v2 -> v3 -> ...). Браузер обновляет
// service worker, только если содержимое этого файла изменилось хотя бы на
// байт — иначе он продолжает работать со старым кэшем бесконечно, даже
// после нового деплоя на Netlify.
const CACHE = "blackcard-shell-v2";
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

  // Сеть сначала (чтобы всегда получать актуальную версию оболочки после
  // деплоя), кеш — только запасной вариант, если сети нет (офлайн).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
