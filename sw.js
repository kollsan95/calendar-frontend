// ============================================
//  SERVICE WORKER
// ============================================

const CACHE_NAME = 'calendar-pwa-v1';
const urlsToCache = [
    '/calendar-frontend/',
    '/calendar-frontend/index.html',
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

let GAS_URL = '';

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
            .catch(function(error) {
                console.warn('⚠️ Ошибка кеширования:', error);
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

// === ОБРАБОТКА СООБЩЕНИЙ ===
self.addEventListener('message', function(event) {
    // Установка GAS_URL
    if (event.data && event.data.type === 'SET_GAS_URL') {
        GAS_URL = event.data.url;
        console.log('✅ GAS_URL установлен в SW:', GAS_URL);
    }
    
    // Показ уведомления
    if (event.data && event.data.type === 'showNotification') {
        var options = {
            body: event.data.body,
            icon: '/calendar-frontend/icons/icon-192.png',
            badge: '/calendar-frontend/icons/icon-72.png',
            vibrate: [200, 100, 200],
            data: event.data.data || {},
            requireInteraction: true,
            timestamp: event.data.timestamp || Date.now()
        };
        
        self.registration.showNotification(event.data.title || 'Календарь мастера', options);
    }
    
    // Обновление значка (для Android)
    if (event.data && event.data.type === 'updateBadge') {
        if (self.registration && self.registration.updateBadge) {
            self.registration.updateBadge(event.data.count);
        }
    }
    
    // Синхронизация
    if (event.data && event.data.type === 'sync') {
        handleSync(event.data.payload);
    }
});

// === ФУНКЦИЯ СИНХРОНИЗАЦИИ ===
async function handleSync(payload) {
    if (!GAS_URL) {
        console.warn('⚠️ GAS_URL не установлен, синхронизация отложена');
        return;
    }

    console.log('🔄 Синхронизация:', payload);

    try {
        var response = await fetch(GAS_URL + '?action=' + payload.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload.data)
        });

        var result = await response.json();
        console.log('✅ Синхронизация успешна:', result);

        var clients = await self.clients.matchAll();
        clients.forEach(function(client) {
            client.postMessage({
                type: 'syncComplete',
                payload: result
            });
        });

    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
    }
}

// === ПЕРЕХВАТ ЗАПРОСОВ ===
self.addEventListener('fetch', function(event) {
    var request = event.request;

    if (request.url.includes('script.google.com') || (GAS_URL && request.url.includes(GAS_URL))) {
        event.respondWith(
            fetch(request)
                .then(function(response) {
                    if (request.method === 'GET' && !request.url.includes('action=app')) {
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
                                console.log('📦 Офлайн: отдаём из кеша GAS:', request.url);
                                return cachedResponse;
                            }
                            return new Response(JSON.stringify({
                                status: 'error',
                                message: 'Нет соединения с интернетом'
                            }), {
                                status: 503,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        });
                })
        );
        return;
    }

    if (request.url.includes('index.html')) {
        event.respondWith(
            fetch(request)
                .then(function(response) {
                    return response;
                })
                .catch(function() {
                    return caches.match(request)
                        .then(function(cachedResponse) {
                            if (cachedResponse) {
                                console.log('📦 Офлайн: отдаём index.html из кеша');
                                return cachedResponse;
                            }
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

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
                            return caches.match('/index.html');
                        }
                        return new Response('Не удалось загрузить ресурс', {
                            status: 404
                        });
                    });
            })
    );
});

// === КЛИК ПО УВЕДОМЛЕНИЮ ===
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // Открываем приложение
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(function(clientList) {
            // Если уже есть открытое окно, фокусируем его
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url && client.url.includes('/calendar-frontend/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Иначе открываем новое окно
            if (clients.openWindow) {
                return clients.openWindow('/calendar-frontend/');
            }
        })
    );
});

// === ПЕРИОДИЧЕСКАЯ СИНХРОНИЗАЦИЯ ===
self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'periodic-sync') {
        event.waitUntil(
            handleSync({
                action: 'getData',
                data: { 
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    forceRefresh: true
                }
            })
        );
    }
});