const SHELL_CACHE = 'tutoria-shell-v1';
const DATA_CACHE = 'tutoria-data-v1';
const PRECACHE_URLS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith('tutoria-') || key.startsWith('principia-')) &&
                key !== SHELL_CACHE &&
                key !== DATA_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (
    event.data &&
    (event.data.type === 'CLEAR_TUTORIA_CACHES' || event.data.type === 'CLEAR_PRINCIPIA_CACHES')
  ) {
    event.waitUntil(
      Promise.all([
        caches.delete(SHELL_CACHE),
        caches.delete(DATA_CACHE),
        caches.delete('principia-shell-v1'),
        caches.delete('principia-data-v1'),
      ]).then(() => {
        if (event.source && 'postMessage' in event.source) {
          event.source.postMessage({ type: 'TUTORIA_CACHES_CLEARED' });
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname === '/api/bootstrap' || url.pathname === '/api/lessons') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              error: 'Modo sin conexión activo; se utilizó la caché local del navegador.',
              offline: true,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response(
            'Modo sin conexión — abre TutorIA una vez con el servidor local activo para guardar la aplicación en caché.',
            {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }
          );
        })
    );
  }
});
