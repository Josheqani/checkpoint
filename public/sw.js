/**
 * Checkpoint Service Worker powered by Google Workbox
 * https://developer.chrome.com/docs/workbox/
 */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

const CACHE_VERSION = 'v1';
const OFFLINE_FALLBACK_URL = '/offline.html';

if (typeof workbox !== 'undefined') {
  console.log('[SW] Google Workbox initialized successfully');

  workbox.core.setCacheNameDetails({
    prefix: 'checkpoint',
    suffix: CACHE_VERSION,
    precache: 'precache',
    runtime: 'runtime',
  });

  // Listen for user action to skip waiting and activate new service worker
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  workbox.core.clientsClaim();

  // Clean up old cache versions upon activation
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('checkpoint-') &&
                !name.endsWith(`-${CACHE_VERSION}`)
              );
            })
            .map((name) => caches.delete(name))
        );
      })
    );
  });

  // 1. Precache essential offline fallback page & core icons
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(`checkpoint-precache-${CACHE_VERSION}`).then((cache) => {
        return cache.addAll([
          OFFLINE_FALLBACK_URL,
          '/favicon.ico',
          '/favicon.svg',
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png',
        ]);
      })
    );
  });

  // 2. Static Assets: Cache CSS, JS, and Next.js static chunks using StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request, url }) =>
      url.pathname.startsWith('/_next/static/') ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `checkpoint-static-assets-${CACHE_VERSION}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // 3. Images and Icons: Cache First
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.jpg'),
    new workbox.strategies.CacheFirst({
      cacheName: `checkpoint-images-${CACHE_VERSION}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 Days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 4. API calls: Always Network Only (Never cache mutations or auth tokens)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkOnly()
  );

  // 5. HTML Page Navigations: Network First with 3s timeout, fallback to cache, then offline page
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: `checkpoint-pages-${CACHE_VERSION}`,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        }),
      ],
    })
  );

  // 6. Global Catch Handler for Offline Fallbacks
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return (await caches.match(OFFLINE_FALLBACK_URL)) || Response.error();
    }
    return Response.error();
  });
} else {
  // Graceful fallback if Workbox CDN is unreachable
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(`checkpoint-fallback-${CACHE_VERSION}`).then((cache) => {
        return cache.addAll([OFFLINE_FALLBACK_URL]);
      })
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        clients.claim(),
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => {
                return (
                  name.startsWith('checkpoint-') &&
                  !name.endsWith(`-${CACHE_VERSION}`)
                );
              })
              .map((name) => caches.delete(name))
          );
        }),
      ])
    );
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(async () => {
          const cache = await caches.open(`checkpoint-fallback-${CACHE_VERSION}`);
          return (await cache.match(OFFLINE_FALLBACK_URL)) || Response.error();
        })
      );
    }
  });
}
