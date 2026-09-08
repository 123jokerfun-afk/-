// Торон Хашааны Эрсдэл — офлайн кэш
// Сүлжээг эхэлж оролдоод, амжилтгүй бол кэшээс өгнө (network-first, cache fallback).
// Ингэснээр талбай дээр интернэтгүй үед апп бүрэн ажиллана.
const CACHE = 'toron-v1';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Firebase/gstatic зэрэг гадаад хүсэлтийг хөндөхгүй — тэдгээр нь зөвхөн онлайн үйлдэл
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
