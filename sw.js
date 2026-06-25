// =============================================
//  Service Worker для PWA-обёртки
// =============================================

const CACHE_NAME = 'calendar-pwa-v2';

const urlsToCache = [
  '/calendar-frontend/',
  '/calendar-frontend/index.html',
  '/calendar-frontend/sw.js',
  '/calendar-frontend/manifest.json',
  '/calendar-frontend/favicon.ico',
  '/calendar-frontend/icons/icon-192.png',
  '/calendar-frontend/icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Кеширование PWA-обёртки...');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ PWA-обёртка закеширована');
        return self.skipWaiting();
      })
  );
});

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

self.addEventListener('fetch', function(event) {
  var request = event.request;

  // GAS-запросы не кешируем
  if (request.url.includes('script.google.com')) {
    event.respondWith(fetch(request));
    return;
  }

  // Статические файлы — сначала сеть, потом кеш
  event.respondWith(
    fetch(request)
      .then(function(response) {
        if (response && response.status === 200 && request.method === 'GET') {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(request)
          .then(function(cachedResponse) {
            if (cachedResponse) return cachedResponse;
            if (request.mode === 'navigate') {
              return caches.match('/calendar-frontend/index.html');
            }
            return new Response('Не удалось загрузить ресурс', { status: 404 });
          });
      })
  );
});

// Обработка сообщений от приложения
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'showNotification') {
    self.registration.showNotification(event.data.title || 'Календарь мастера', {
      body: event.data.body || '',
      icon: '/calendar-frontend/icons/icon-192.png',
      badge: '/calendar-frontend/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: {
        timestamp: event.data.timestamp || Date.now()
      }
    });
  }
});