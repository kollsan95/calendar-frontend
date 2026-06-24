// sw.js
const CACHE_VERSION = 'v1';
const CACHE_NAME = `calendar-cache-${CACHE_VERSION}`;
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если есть в кеше — отдаём
        if (response) {
          return response;
        }
        // Иначе запрашиваем с сервера
        return fetch(event.request);
      })
  );
});