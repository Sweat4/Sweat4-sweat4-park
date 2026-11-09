// OUTDOORPARK-APP – Offline-Cache. Bei Updates VERSION erhöhen.
// Getrennt von der SWEAT4-Trainer-App: eigener Cache-Name, es werden NUR eigene Caches (Präfix 'sweat4-park-') gelöscht.
const PREFIX = 'sweat4-park-';
const VERSION = PREFIX + 'v3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'park-config.js', 'park-katalog.js', 'park-videos.js', 'park.js', 'logo.png', 'logo-mark.png', 'lebensmittel.js', 'sprache-en.js', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== VERSION && k !== PREFIX + 'thumbs').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;                 // fremde Server (z. B. Video-Hosting) gehen direkt ins Netz
  if (/\.(mp4|mov|webm|m4v)$/i.test(u.pathname) || e.request.headers.has('range')) return;   // Videos nicht zwischenspeichern (zu groß, Streaming)
  // Netzwerk zuerst (für Updates), sonst Cache – so öffnet sich die App auch ohne Internet.
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
