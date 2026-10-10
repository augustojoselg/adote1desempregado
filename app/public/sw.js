const CACHE_NAME = 'adote-shell-v2'
const ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('adote-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  )))
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Never intercept authenticated data or identity-provider endpoints.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/') || url.pathname.startsWith('/.auth/')) return
  // Fresh HTML on navigation avoids retaining an obsolete release indefinitely.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')))
  }
})
