/* Keep the install icon and logo available without caching pages or API data. */
const CACHE = "vk-shell-v1";
const SHELL = ["/brand/logo.png", "/icons/vk-icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("vk-shell-") && k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !SHELL.includes(url.pathname)) return;
  e.respondWith(fetch(e.request).catch(async (error) => {
    const cached = await caches.match(url.pathname, { cacheName: CACHE });
    if (cached) return cached;
    throw error;
  }));
});
