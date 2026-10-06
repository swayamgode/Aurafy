// Service Worker for Aurafy Mobile PWA — Background Audio Edition
const CACHE_NAME = "aurafy-pwa-v3";
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

// Fetch event — pass through audio/stream so range requests always work
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── CRITICAL: Let ALL audio/stream requests pass directly to the network ──
  // Never cache or intercept audio — range requests MUST go through unmodified
  // so mobile browsers can continue streaming in the background.
  if (
    url.pathname.startsWith("/api/stream") ||
    url.pathname.startsWith("/api/download") ||
    request.destination === "audio" ||
    request.destination === "video" ||
    request.headers.get("range") !== null
  ) {
    // Pass through with no-op — let browser handle range negotiation natively
    return;
  }

  // Bypass all other API routes
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Bypass external YouTube / Google CDN requests
  if (
    url.hostname.includes("youtube.com") ||
    url.hostname.includes("googlevideo.com") ||
    url.hostname.includes("ytimg.com") ||
    url.hostname.includes("ggpht.com")
  ) {
    return;
  }

  // Network-first for HTML pages & App shell navigation
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

// Background Sync — re-trigger audio resume after network reconnect
self.addEventListener("sync", (event) => {
  if (event.tag === "aurafy-audio-resume") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "AUDIO_RESUME" });
        });
      })
    );
  }
});

// Push message from clients — handle audio control commands
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
