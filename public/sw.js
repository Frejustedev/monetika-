// Monétika — Service Worker minimal.
// Stratégie : cache-first pour les assets statiques, network-first avec
// fallback offline pour les requêtes de navigation. La saisie hors-ligne
// (queue + sync) est prévue pour une phase ultérieure.

const CACHE_VERSION = 'monetika-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  '/offline',
  '/marks/favicon.svg',
  '/marks/mark-primary.svg',
  '/marks/wordmark-forest.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png',
  '/og-image.png',
];

// —— Install ——
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] precache incomplete', err);
      }),
    ),
  );
  self.skipWaiting();
});

// —— Activate ——
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => !n.startsWith(CACHE_VERSION))
          .map((n) => caches.delete(n)),
      ),
    ),
  );
  self.clients.claim();
});

// —— Fetch ——
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // On ne met pas en cache les routes d'auth, d'API, ni les uploads.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/verify') ||
    url.pathname === '/login' ||
    url.pathname === '/signup'
  ) {
    return; // Let browser handle.
  }

  // Assets statiques : cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/marks/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigations : network-first avec fallback offline.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached ?? Response.error();
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline');
    if (offline) return offline;
    return new Response('Offline', { status: 503, statusText: 'offline' });
  }
}
