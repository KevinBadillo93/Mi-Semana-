const CACHE = 'mi-semana-v1';

// Al instalar: guardar el index en cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]).catch(() => {
        // Si algún asset no existe aún, no fallar
      });
    })
  );
  self.skipWaiting();
});

// Al activar: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache primero, red como respaldo
self.addEventListener('fetch', event => {
  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sin red: devolver index cacheado como fallback
          return caches.match('./index.html');
        });
    })
  );
});
