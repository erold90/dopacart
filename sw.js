/* DopaCart — Service Worker.
   SHELL (html/css/js) = NETWORK-FIRST → l'app è sempre aggiornata online (niente audit/utenti su versioni vecchie); la cache è solo fallback offline.
   catalog.json = stale-while-revalidate (istantaneo da cache + aggiorna in background).
   Immagini esterne = cache-first (persistono tra le versioni). */
var CACHE = "dopacart-v28";
var IMG = "dopacart-img";
var ASSETS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png",
  "css/tokens.css", "css/app.css",
  "data/catalog.js", "js/icons.js", "js/store.js", "js/fx.js", "js/wallet.js", "js/catalog.js",
  "js/cart.js", "js/checkout.js", "js/tracker.js", "js/rewards.js", "js/auth.js", "js/sync.js", "js/share.js", "js/donate.js", "js/app.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== IMG; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Cross-origin: cache-first solo per le immagini prodotto
  if (url.origin !== location.origin) {
    if (req.destination === "image") {
      e.respondWith(caches.open(IMG).then(function (c) {
        return c.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) { if (res && res.status === 200) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
          return hit || net;
        });
      }));
    }
    return;
  }

  // catalog.json: stale-while-revalidate (veloce + si aggiorna da solo)
  if (url.pathname.indexOf("catalog.json") >= 0) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && res.status === 200) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  // Shell: network-first (sempre l'ultima versione online), fallback alla cache offline
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
