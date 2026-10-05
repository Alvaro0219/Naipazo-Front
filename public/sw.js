// Service worker mínimo de Truco Online: hace que la app sea instalable y muestra una pantalla
// "Sin conexión" si no hay red al abrirla. NO cachea la API, los sockets ni el juego: todo eso
// necesita conexión siempre. Se registra solo en producción (ver src/main.js).
const CACHE = 'truco-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/favicon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Solo las navegaciones (abrir la app o cambiar de página) caen en la pantalla sin conexión
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
