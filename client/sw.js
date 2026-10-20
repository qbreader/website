// Minimal service worker that makes the site installable and shows an offline page.
// It deliberately never caches pages, scripts, styles or API responses: the site is
// redeployed daily and every page is built from live data, so stale copies would be worse
// than an error. Only the offline fallback page is stored.

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
  // Only page navigations get a fallback. API calls, scripts and WebSockets are untouched.
  if (event.request.mode !== 'navigate') { return; }

  event.respondWith(
    fetch(event.request).catch(() => self.caches.match(OFFLINE_URL))
  );
});
