/* DopaCart — Service Worker: shell offline-first + cache runtime immagini esterne. */
var CACHE = "dopacart-v13";
var IMG = "dopacart-img"; // immagini esterne (loremflickr/flickr): persiste tra le versioni
var ASSETS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png",
  "css/tokens.css", "css/app.css",
  "data/catalog.js", "js/icons.js", "js/store.js", "js/fx.js", "js/catalog.js",
  "js/cart.js", "js/checkout.js", "js/tracker.js", "js/rewards.js", "js/auth.js", "js/share.js", "js/app.js"
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

  // Cross-origin: cache-first solo per le immagini (foto prodotto); il resto va in rete
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

  // Same-origin: cache-first sulla shell
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});
