const CACHE_NAME_1 = "static-cache-v1";
const CACHE_NAME_2 = "dynamic-cache-v1";
const FILES_TO_CACHE = [
  "./public/index.html",
  "./public/offline.html",
  "./public/styles.css",
  "./public/app.js"
];

self.addEventListener("install", async () => {
  const cache = await caches.open(CACHE_NAME_1);
  cache.addAll(FILES_TO_CACHE);
});
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin === location.url) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});
const cacheFirst = req => {
  const cachedResponse = caches.match(req);
  return cachedResponse || fetch(req);
};
const networkFirst = async req => {
  const cache = await caches.open(CACHE_NAME_2);
  try {
    const res = await fetch(req);
    cache.put(req, res.clone());
    return res;
  } catch (error) {
    return await cache.match(req);
  }
};
