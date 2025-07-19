/**
 * Service Worker for Premium Weather App
 * Provides offline functionality and caching for PWA experience
 */

const CACHE_NAME = 'weather-app-v1.0.0';
const API_CACHE_NAME = 'weather-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_URLS = [
  'https://api.open-meteo.com',
  'https://nominatim.openstreetmap.org'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Take control immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.hostname === 'api.open-meteo.com' || url.hostname === 'nominatim.openstreetmap.org') {
    event.respondWith(
      // Network first strategy for API calls
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          
          // Cache successful API responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Service Worker: Serving cached API response');
                return cachedResponse;
              }
              
              // If no cached response, return a custom offline response
              return new Response(
                JSON.stringify({
                  error: 'offline',
                  message: 'No internet connection. Please try again when online.'
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static file requests
  event.respondWith(
    // Cache first strategy for static files
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving cached file', request.url);
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return error response for other requests
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'weather-sync') {
    event.waitUntil(
      // Notify the app that connection is restored
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CONNECTIVITY_RESTORED',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Weather conditions have changed in your area',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Weather',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Weather Alert', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
  // 'dismiss' action or default click - just close the notification
});

// Message handling from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Force update check
    self.registration.update();
  }
});
