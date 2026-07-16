/* ITC HQ service worker
   Bump CACHE_VERSION whenever index.html changes so installed phones
   pick up the new build on next launch. */
const CACHE_VERSION = 'itc-hq-v4.0';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // App shell: network-first so updates land fast, cache fallback offline.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  // CDN libraries (mammoth, html-docx): cache-first, fill in background.
  if (url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(
      caches.match(e.request).then((m) => {
        const net = fetch(e.request).then((res) => {
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, res.clone()));
          return res;
        }).catch(() => m);
        return m || net;
      })
    );
  }
});
