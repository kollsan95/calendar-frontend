// =============================================
//  Service Worker для офлайн-режима
//  Версия: 1.1
// =============================================

const CACHE_NAME = 'calendar-app-v1';
const GAS_URL = 'https://script.google.com/macros/s/ВАШ_GAS_ID/exec';

const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/sw.js',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  GAS_URL,
];

// === Установка ===
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Кеширование ресурсов...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Все ресурсы закешированы');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.warn('⚠️ Ошибка кеширования:', error);
      })
  );
});

// === Активация ===
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker активация...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker активирован');
      return self.clients.claim();
    })
  );
});

// === Перехват запросов ===
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Стратегия: сначала сеть, потом кеш
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кешируем успешные GET-запросы
        if (response && response.status === 200 && request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пробуем кеш
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📦 Офлайн-режим: отдаём из кеша:', request.url);
              return cachedResponse;
            }
            // Если запрос не закеширован
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Не удалось загрузить ресурс', {
              status: 404,
              statusText: 'Not Found',
            });
          });
      })
  );
});

// === Обновление кеша ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});