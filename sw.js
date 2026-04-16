// Service worker for Chess PWA. Cache-first for the app shell so the game works offline.
// Bump CACHE_VERSION on every deploy so clients pick up new assets.
const CACHE_VERSION = 'chess-v5';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/chess.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png',
  './assets/pieces/wK.svg',
  './assets/pieces/wQ.svg',
  './assets/pieces/wR.svg',
  './assets/pieces/wB.svg',
  './assets/pieces/wN.svg',
  './assets/pieces/wP.svg',
  './assets/pieces/bK.svg',
  './assets/pieces/bQ.svg',
  './assets/pieces/bR.svg',
  './assets/pieces/bB.svg',
  './assets/pieces/bN.svg',
  './assets/pieces/bP.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // For navigations, try network first so updates show up when online; fall back to cached shell.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache-first with background refresh.
  e.respondWith(
    caches.match(req).then(hit => {
      const fetchPromise = fetch(req).then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => hit);
      return hit || fetchPromise;
    })
  );
});
