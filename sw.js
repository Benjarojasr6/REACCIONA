/* Service worker de Reacciona: deja la app disponible sin internet.
   Cambia VERSION cada vez que subas cambios, para que los dispositivos se actualicen. */
var VERSION = "reacciona-v5";
var ARCHIVOS = [
  "./", "index.html", "manifest.webmanifest",
  "css/app.css", "css/juegos.css",
  "js/core.js", "js/sonido.js", "js/xlsx.js", "js/historial.js", "js/main.js",
  "js/games/colores.js", "js/games/luces.js", "js/games/reaccion.js",
  "icon-192.png", "icon-512.png", "maskable-192.png", "maskable-512.png",
  "apple-touch-icon.png", "favicon-64.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("message", function (e) {
  if (e.data === "version" && e.source) e.source.postMessage({ version: VERSION });
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var propio = url.origin === self.location.origin;
  var fuente = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!propio && !fuente) return;

  // Archivos propios: responde desde la copia guardada y actualiza en segundo plano.
  // Tipografías: se guardan la primera vez y se reutilizan.
  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req, { ignoreSearch: propio }).then(function (guardado) {
        var red = fetch(req).then(function (resp) {
          if (resp && (resp.ok || resp.type === "opaque")) cache.put(req, resp.clone());
          return resp;
        }).catch(function () { return guardado; });
        if (guardado) return guardado;
        return red.then(function (r) { return r || (req.mode === "navigate" ? cache.match("index.html") : r); });
      });
    })
  );
});
