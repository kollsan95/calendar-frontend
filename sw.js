// =============================================
//  Service Worker для PWA-обёртки
//  Версия: 1.0
// =============================================

const CACHE_NAME = 'calendar-pwa-v1';
const GAS_URL = '{{GAS_URL}}';

// Ресурсы для кеширования (статическая обёртка)
const urlsToCache = [
  '/calendar-frontend/',
  '/calendar-frontend/index.html',
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

// === УСТАНОВКА ===
self.addEventListener('install', function(event) {
  console.log('📦 Service Worker установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Кеширование статики...');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Статика закеширована');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.warn('⚠️ Ошибка кеширования:', error);
      })
  );
});

// === АКТИВАЦИЯ ===
self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker активация...');
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

// === ПЕРЕХВАТ ЗАПРОСОВ ===
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // GAS-запросы не кешируем (они внутри IFRAME)
  if (request.url.includes('script.google.com')) {
    event.respondWith(fetch(request));
    return;
  }

  // Для статики: сначала сеть, потом кеш
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
            if (cachedResponse) {
              console.log('📦 Офлайн: отдаём из кеша:', request.url);
              return cachedResponse;
            }
            if (request.mode === 'navigate') {
              return caches.match('/calendar-frontend/index.html');
            }
            return new Response('Не удалось загрузить ресурс', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});

// === ОБРАБОТКА УВЕДОМЛЕНИЙ ===
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'showNotification') {
    // Показываем системное уведомление
    self.registration.showNotification(
      event.data.title || 'Календарь мастера',
      {
        body: event.data.body || '',
        icon: '/calendar-frontend/icons/icon-192.png',
        badge: '/calendar-frontend/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
          timestamp: event.data.timestamp || Date.now()
        }
      }
    );
  }
});

// === ОБРАБОТКА КЛИКА ПО УВЕДОМЛЕНИЮ ===
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Открываем приложение, если оно закрыто
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/calendar-frontend/');
    })
  );
});