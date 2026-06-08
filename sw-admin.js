const CACHE = 'epiper-admin-v1';
const ASSETS = [
  '/admin.html',
  '/manifest.json',
  '/assets/epiper.png',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/assets/favicon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: network only
  if (url.pathname.includes('/.netlify/functions/') || url.pathname === '/api/auth') {
    return;
  }

  // Static assets: cache-first
  if (ASSETS.some(a => e.request.url.includes(a))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // HTML pages: network-first, fallback to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('/admin.html')))
    );
    return;
  }
});
