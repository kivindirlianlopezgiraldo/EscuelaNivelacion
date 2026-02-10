// ============================================
// SERVICE WORKER - MODO OFFLINE
// ============================================

const CACHE_NAME = 'escuela-nivelacion-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets estáticos cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error al cachear assets:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Estrategia de fetch: Cache First, luego Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorar requests de extensiones de Chrome y analytics
  if (
    request.url.startsWith('chrome-extension://') ||
    request.url.includes('google-analytics') ||
    request.url.includes('googletagmanager')
  ) {
    return;
  }

  // Estrategia para API calls (IndexedDB no usa fetch, pero por si acaso)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Sin conexión' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Estrategia Cache First para assets estáticos
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Retornar del cache y actualizar en segundo plano
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              }
            })
            .catch(() => {});
          
          return cachedResponse;
        }

        // Si no está en cache, buscar en la red
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cachear la respuesta
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // Si falla la red y es una página, retornar index.html
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return new Response('Sin conexión a internet', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Sincronizando datos...');
    event.waitUntil(syncData());
  }
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Notificación push recibida');
  
  const options = {
    body: event.data?.text() || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Escuela de Nivelación', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Función de sincronización de datos
async function syncData() {
  try {
    // Aquí se pueden sincronizar datos pendientes con el servidor
    console.log('[SW] Datos sincronizados');
  } catch (error) {
    console.error('[SW] Error al sincronizar:', error);
  }
}

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
