/**
 * Weather Search Service Worker
 *
 * Provides comprehensive offline capabilities, caching strategies,
 * and network resilience for the weather search application.
 */

// Service Worker Configuration
const CACHE_VERSION = 'v1.3.0';
const CACHE_NAMES = {
  STATIC: `weather-static-${CACHE_VERSION}`,
  API: `weather-api-${CACHE_VERSION}`,
  SEARCH: `weather-search-${CACHE_VERSION}`,
  IMAGES: `weather-images-${CACHE_VERSION}`,
};

// URLs to cache during install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // App icons for offline availability
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/shortcut-current.png',
  '/icons/shortcut-forecast.png',
  // CSS and JS assets (will be added by Vite build)
];

// API endpoints patterns
const API_PATTERNS = {
  WEATHER: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/,
  GEOCODING: /^https:\/\/nominatim\.openstreetmap\.org\/search/,
  TILES: /^https:\/\/.+\.tile\.openstreetmap\.org\//,
};

// Network timeout configuration
const NETWORK_TIMEOUT = 8000; // 8 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      cacheStaticAssets(),
      self.skipWaiting(), // Activate immediately
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');

  event.waitUntil(
    (async () => {
      await Promise.all([cleanupOldCaches(), self.clients.claim()]);
      // Minimal fallback prewarm: in case the app doesn't send a message, seed a few cities
      try {
        const minimalCities = ['New York, US', 'London, GB', 'Tokyo, JP'];
        await handlePreloadPopularCities(minimalCities);
      } catch (e) {
        console.warn('SW fallback prewarm failed:', e);
      }
    })()
  );
});

/**
 * Fetch Event - Handle all network requests
 */
self.addEventListener('fetch', event => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const request = event.request;

  // Route requests to appropriate handlers
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request, url));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

/**
 * Message Event - Handle messages from main thread
 */
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_SEARCH_RESULTS':
      handleCacheSearchResults(payload);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(payload?.cacheType);
      break;
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus();
      break;
    case 'PRELOAD_POPULAR_CITIES':
      handlePreloadPopularCities(payload?.cities);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Background Sync Event - Handle background synchronization
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-search-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Cache static assets during installation
 */
async function cacheStaticAssets() {
  try {
    const cache = await caches.open(CACHE_NAMES.STATIC);

    // Cache with network fallback strategy
    const cachePromises = STATIC_CACHE_URLS.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`📦 Cached static asset: ${url}`);
        }
      } catch (error) {
        console.warn(`Failed to cache ${url}:`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    console.log('✅ Static assets cached successfully');
  } catch (error) {
    console.error('❌ Failed to cache static assets:', error);
    throw error;
  }
}

/**
 * Clean up old cache versions
 */
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = Object.values(CACHE_NAMES);

    const deletionPromises = cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log(`🗑️ Deleting old cache: ${cacheName}`);
        return caches.delete(cacheName);
      });

    await Promise.all(deletionPromises);
    console.log('✅ Old caches cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup old caches:', error);
  }
}

/**
 * Handle static asset requests (CSS, JS, etc.)
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);

  // Try cache first, then network
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log(`📦 Serving from cache: ${request.url}`);

    // Update cache in background
    fetchAndUpdateCache(request, cache);

    return cachedResponse;
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log(`🌐 Fetched and cached: ${request.url}`);
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', error);
    return createOfflineResponse('Static asset unavailable offline');
  }
}

/**
 * Handle API requests with intelligent caching
 */
async function handleApiRequest(request, url) {
  const cache = await caches.open(CACHE_NAMES.API);

  // Create cache key based on request parameters
  const cacheKey = createApiCacheKey(request, url);

  try {
    // Try network first for fresh data
    const networkResponse = await fetchWithRetry(request, RETRY_ATTEMPTS);

    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(cacheKey, networkResponse.clone());
      console.log(`🌐 API response cached: ${url.pathname}`);

      // Add offline indicator to response
      const responseClone = networkResponse.clone();
      const responseData = await responseClone.json();
      responseData._meta = {
        cached: false,
        timestamp: Date.now(),
        source: 'network',
      };

      return new Response(JSON.stringify(responseData), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: networkResponse.headers,
      });
    }

    throw new Error(`API request failed: ${networkResponse.status}`);
  } catch (error) {
    console.warn('🔄 Network failed, trying cache:', error);

    // Fallback to cache
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      cachedData._meta = {
        cached: true,
        timestamp: Date.now(),
        source: 'cache',
        offline: true,
      };

      console.log(`📦 Serving cached API response: ${url.pathname}`);

      return new Response(JSON.stringify(cachedData), {
        status: 200,
        statusText: 'OK (Cached)',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No cache available, return offline fallback
    return createApiOfflineResponse();
  }
}

/**
 * Handle image requests with caching
 */
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.IMAGES);

  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Failed to fetch image:', error);
    return createOfflineResponse('Image unavailable offline');
  }
}

/**
 * Handle navigation requests (HTML pages)
 */
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);

  try {
    // Try network first
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cachedResponse =
      (await cache.match(request)) ||
      (await cache.match('/')) ||
      (await cache.match('/index.html'));

    if (cachedResponse) {
      return cachedResponse;
    }

    // Ultimate fallback
    return createOfflineResponse('Page unavailable offline');
  }
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(request, maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(request, NETWORK_TIMEOUT);

      if (response.ok) {
        return response;
      }

      throw new Error(`Request failed: ${response.status}`);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY * (attempt + 1))
        );
        console.log(`🔄 Retrying request (${attempt + 1}/${maxRetries})`);
      }
    }
  }

  throw lastError;
}

/**
 * Update cache in background
 */
async function fetchAndUpdateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail background updates
    console.warn('Background cache update failed:', error);
  }
}

/**
 * Create API cache key
 */
function createApiCacheKey(request, url) {
  // Normalize URL parameters for consistent caching
  const params = new URLSearchParams(url.search);
  const sortedParams = new URLSearchParams();

  // Sort parameters for consistent cache keys
  Array.from(params.keys())
    .sort()
    .forEach(key => {
      sortedParams.append(key, params.get(key));
    });

  const normalizedUrl = `${url.origin}${
    url.pathname
  }?${sortedParams.toString()}`;
  return new Request(normalizedUrl, {
    method: request.method,
    headers: request.headers,
  });
}

/**
 * Create offline fallback response
 */
function createOfflineResponse(message) {
  return new Response(message, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * Create API offline fallback response
 */
function createApiOfflineResponse() {
  const offlineData = {
    error: 'offline',
    message: 'No internet connection. Showing cached data.',
    timestamp: Date.now(),
    data: null,
    _meta: {
      cached: false,
      offline: true,
      timestamp: Date.now(),
      source: 'fallback',
    },
  };

  return new Response(JSON.stringify(offlineData), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Check if request is for static asset
 */
function isStaticAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.includes('/assets/')
  );
}

/**
 * Check if request is for API
 */
function isApiRequest(url) {
  return Object.values(API_PATTERNS).some(pattern => pattern.test(url.href));
}

/**
 * Check if request is for image
 */
function isImageRequest(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg')
  );
}

/**
 * Handle cache search results message
 */
async function handleCacheSearchResults(payload) {
  if (!payload) return;

  try {
    const cache = await caches.open(CACHE_NAMES.SEARCH);
    const cacheKey = `search:${payload.query.toLowerCase()}`;

    const response = new Response(
      JSON.stringify({
        query: payload.query,
        results: payload.results,
        source: payload.source,
        timestamp: Date.now(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await cache.put(cacheKey, response);
    console.log(`📝 Cached search results: ${payload.query}`);
  } catch (error) {
    console.error('Failed to cache search results:', error);
  }
}

/**
 * Handle clear cache message
 */
async function handleClearCache(cacheType) {
  try {
    if (cacheType && CACHE_NAMES[cacheType]) {
      const cacheName = CACHE_NAMES[cacheType];
      await caches.delete(cacheName);
      console.log(`🗑️ Cleared cache: ${cacheName}`);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ Cleared all caches');
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Handle get cache status message
 */
async function handleGetCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames,
      version: CACHE_VERSION,
      timestamp: Date.now(),
    };

    // Send status to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_STATUS',
        payload: status,
      });
    });
  } catch (error) {
    console.error('Failed to get cache status:', error);
  }
}

/**
 * Handle preload popular cities message
 */
async function handlePreloadPopularCities(cities) {
  if (!cities || !Array.isArray(cities)) return;

  try {
    const cache = await caches.open(CACHE_NAMES.SEARCH);

    // Preload popular cities in background
    const preloadPromises = cities.map(async city => {
      const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=json&limit=1`;

      try {
        const response = await fetch(geocodingUrl, {
          headers: { 'User-Agent': 'WeatherApp/1.0' },
        });

        if (response.ok) {
          await cache.put(`preload:${city}`, response);
          console.log(`📍 Preloaded city: ${city}`);
        }
      } catch (error) {
        console.warn(`Failed to preload city ${city}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('✅ Popular cities preloading completed');
  } catch (error) {
    console.error('Failed to preload popular cities:', error);
  }
}

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  try {
    console.log('🔄 Performing background sync...');

    // Sync cached search results with IndexedDB
    // Implementation would sync with the SearchCacheManager

    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    throw error; // Re-throw to retry later
  }
}

console.log('🚀 Weather Search Service Worker loaded successfully');
