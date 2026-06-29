// ============================================
//  SERVICE WORKER
// ============================================

const CACHE_NAME = 'calendar-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png'
];

// === УСТАНОВКА ===
self.addEventListener('install', function(event) {
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
    );
});

// === АКТИВАЦИЯ ===
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

// === ПЕРЕХВАТ ЗАПРОСОВ ===
self.addEventListener('fetch', function(event) {
    var request = event.request;

    // Пропускаем запросы к GAS (динамические)
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
                            return cachedResponse;
                        }
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Не удалось загрузить ресурс', {
                            status: 404
                        });
                    });
            })
    );
});