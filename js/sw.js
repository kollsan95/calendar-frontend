// ===== Service Worker для оффлайн-режима =====
const CACHE_NAME = 'calendar-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/config.js',
    '/js/cache.js',
    '/js/api.js',
    '/js/canvas.js',
    '/js/calendar.js',
    '/js/auth.js',
    '/js/modal.js',
    '/js/detail.js',
    '/js/notifications.js',
    '/js/filters.js',
    '/js/windows.js',
    '/js/main.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request).catch(() => {
                // Если оффлайн, показываем заглушку
                return new Response('Нет подключения к интернету', { status: 503 });
            });
        })
    );
});

// Регистрация Service Worker в main.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('✅ Service Worker зарегистрирован'))
        .catch(err => console.warn('SW registration failed:', err));
}