const CACHE_NAME = 'peyu-v1.0.1';
const RUNTIME_CACHE = 'peyu-runtime-v1';

// Install: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all([
        cache.add('/'),
        cache.add('/index.html'),
        cache.add('/manifest.json')
      ]).catch(() => {
        console.log('[SW] Some assets failed to cache, continuing...');
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // API calls: Network with timeout fallback
  if (url.pathname.includes('/api/') || url.hostname !== location.hostname) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ])
        .then((response) => {
          if (response?.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache first
  if (/\.(js|css|woff|png|svg|jpg|jpeg|gif|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          if (fetchResponse?.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, fetchResponse.clone());
            });
          }
          return fetchResponse;
        }).catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // HTML/SPA: Network first, fallback to cache/index.html
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response?.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request) || caches.match('/index.html');
      })
  );
});

// Periodic background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('[SW] Syncing...');
    // Sync implementation here
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() || {};
  const options = {
    body: data.body || 'Nueva notificación de PEYU',
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect fill=%22%230F8B6C%22 width=%22192%22 height=%22192%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%22120%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🐢</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 96 96%22><rect fill=%22%230F8B6C%22 width=%2296%22 height=%2296%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2260%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🐢</text></svg>',
    tag: 'peyu-notification',
    badge: 'https://peyu.cl/icon.png'
  };

  event.waitUntil(
    self.registration.showNotification('PEYU', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
