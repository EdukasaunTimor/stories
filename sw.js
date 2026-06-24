// ==========================================================================
// EdukasaunTimor.org - Stories PWA Service Worker (sw.js)
// Aligned with the official orthography standards of Timor-Leste.
// Provides complete offline functionality for English stories.
// ==========================================================================

const CACHE_NAME = 'edutimor-stories-cache-v3';

// Core assets to cache immediately for complete offline usability in schools (eskolas)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap',
  'https://img.icons8.com/color/192/000000/bilingual.png',
  'https://img.icons8.com/color/512/000000/bilingual.png'
];

// The install event opens the cache and populates it with all essential PWA assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching Stories app shell...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// The activate event cleans up any old caches to prevent version conflicts.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept all network requests to serve assets from cache if offline.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests (caching doesn't support POST, PUT, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached asset immediately if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from the live network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone and cache newly fetched assets dynamically
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // Return index.html as a fallback for navigation requests when offline
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
