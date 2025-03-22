self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('client-flow-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/script.js',
        '/favicon.png',
        '/favicon-192x192.png',
        '/favicon-512x512.png',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
