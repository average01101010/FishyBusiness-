// The service worker of the app on the home screen (P1 of the PWA plan, 03.10.2026; only in dist-pwa/, which build.mjs makes with
// KYST_PWA=1). The map packs and the data files (the models, the pictures and Senja's buildings, out of the page from 29.10.2026)
// have their hash in the name and never change: they come from the cache first, and are kept until a new manifest no longer lists
// them. The page and the two manifests come from the net first, and from the cache when there is no net, so the game opens offline
// after the first visit. V is the build's own (build.mjs), so a new build gets a fresh page cache.
const V = '@V@', PAGE = 'kyst-page-' + V, MAP = 'kyst-map', DATA = 'kyst-data';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(PAGE).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'map/manifest.json', 'data/manifest.json', 'icon-192.png', 'icon-512.png'])).then(() => self.skipWaiting()));
});
// the packs the map manifest no longer lists go (a new map release names its changed packs anew), and the data files likewise
async function prune(){
  for (const [man, store, key] of [['map/manifest.json', MAP, 'packs'], ['data/manifest.json', DATA, 'files']]){
    try {
      const r = await (await caches.open(PAGE)).match(man); if (!r) continue;
      const keep = new Set((await r.json())[key].map(p => p.file)), c = await caches.open(store);
      for (const q of await c.keys()) if (!keep.has(q.url.split('/').pop())) await c.delete(q);
    } catch (e){}
  }
}
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('kyst-page-') && k !== PAGE) await caches.delete(k);
    await prune(); await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  const store = /\/map\/[^/]+\.wasm$/.test(u.pathname) ? MAP : /\/data\/[^/]+\.bin$/.test(u.pathname) ? DATA : null;
  if (store){
    e.respondWith(caches.open(store).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok){ const cl = r.clone(); c.put(req, cl); } return r;
    }));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok){ const cl = r.clone(); caches.open(PAGE).then(c => c.put(req, cl)).then(() => { if (/\/(map|data)\/manifest\.json$/.test(u.pathname)) prune(); }); }
    return r;
  }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
// push notifications (05.10.2026; ui/10g-push.js, supabase/functions/push-send): shown with the app's icon; a tap brings the app up
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x){ d = {body:e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Det Store Blå', {body:d.body || '', tag:d.tag || 'dsb', icon:'icon-192.png', lang:'no'}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    for (const c of await self.clients.matchAll({type:'window', includeUncontrolled:true})) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  })());
});
