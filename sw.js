// Service Worker — кеширование для офлайн работы
const CACHE = 'hd-v4';

const ASSETS = [
  '/human-design-app/',
  '/human-design-app/index.html',
  '/human-design-app/css/style.css',
  '/human-design-app/js/ephemeris.js',
  '/human-design-app/js/planets_table.js',
  '/human-design-app/js/bodygraph.js',
  '/human-design-app/js/app.js',
  '/human-design-app/js/picker.js',
  '/human-design-app/js/cities.js',
  '/human-design-app/hero.jpeg',
  '/human-design-app/silhouette.jpeg',
  '/human-design-app/icon.jpeg'
];

// Установка — кешируем все файлы
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Запросы — сначала кеш, потом сеть
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});
