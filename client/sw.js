// Service worker that makes the site installable and shows an offline page.
//It doesn't cache pages, scripts, styles, or API responses to avoid stale copies from redeploys

/* global self */

const CACHE_NAME = 'qbreader-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    self.caches.open(CACHE_NAME)
      .then(cache => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => self.caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Fallback is only for page navigations
  if (event.request.mode !== 'navigate') { return; }

  event.respondWith(
    fetch(event.request).catch(() => self.caches.match(OFFLINE_URL))
  );
});
