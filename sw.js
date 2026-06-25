// =============================================
//  Service Worker для офлайн-режима
//  Версия: 2.0
// =============================================

const CACHE_NAME = 'calendar-app-v2';

// {{GAS_URL}} заменяется GitHub Actions
// НЕ кешируем GAS-URL, чтобы избежать ошибок
const GAS_URL = '{{GAS_URL}}';

// Кешируем только статические файлы
const urlsToCache = [
  '/calendar-frontend/',
  '/calendar-frontend/index.html',
  '/calendar-frontend/styles.css',
  '/calendar-frontend/sw.js',
  '/calendar-frontend/manifest.json',
  '/calendar-frontend/favicon.ico',
  '/calendar-frontend/icons/icon-72.png',
  '/calendar-frontend/icons/icon-96.png',
  '/calendar-frontend/icons/icon-128.png',
  '/calendar-frontend/icons/icon-144.png',
  '/calendar-frontend/icons/icon-152.png',
  '/calendar-frontend/icons/icon-192.png',
  '/calendar-frontend/icons/icon-384.png',
  '/calendar-frontend/icons/icon-512.png'
];

// === Установка ===
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Кеширование статических файлов...');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Все статические файлы закешированы');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.warn('⚠️ Ошибка кеширования:', error);
      })
  );
});

// === Активация ===
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(function() {
      console.log('✅ Service Worker активирован');
      return self.clients.claim();
    })
  );
});

// === Перехват запросов ===
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // === Стратегия для GAS-запросов: только сеть ===
  if (request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          return response;
        })
        .catch(function() {
          // Если офлайн — возвращаем ошибку
          return new Response('Нет подключения к интернету', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

  // === Для всех остальных запросов: сначала сеть, потом кеш ===
  event.respondWith(
    fetch(request)
      .then(function(response) {
        // Кешируем успешные ответы
        if (response && response.status === 200 && request.method === 'GET') {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(function() {
        // Если сеть недоступна — пробуем кеш
        return caches.match(request)
          .then(function(cachedResponse) {
            if (cachedResponse) {
              console.log('📦 Офлайн: отдаём из кеша:', request.url);
              return cachedResponse;
            }
            // Если ничего нет — возвращаем страницу-заглушку
            if (request.mode === 'navigate') {
              return caches.match('/calendar-frontend/index.html');
            }
            return new Response('Не удалось загрузить ресурс', { status: 404 });
          });
      })
  );
});