// Service Worker for Aurafy Mobile PWA
const CACHE_NAME = "aurafy-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/search",
  "/favorites",
  "/import",
  "/profile",
  "/activity",
  "/manifest.json",
];

// Install event — cache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event — stale-while-revalidate for static assets, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass API routes & media stream requests so streams never get blocked
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("googlevideo.com") ||
    url.pathname.includes("youtube.com") ||
    request.destination === "audio" ||
    request.destination === "video"
  ) {
    return;
  }

  // Network-first for HTML pages & App shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request) || caches.match("/"))
    );
    return;
  }

  // Cache-first for images & static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200 && request.method === "GET") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});
