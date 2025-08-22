/**
 * Enhanced Service Worker - Phase 3B Optimization
 * Advanced caching strategies for CSS chunks and improved performance
 */

// Enhanced Cache Configuration
const CACHE_VERSION = 'v2.0.0-phase3b';
const ENHANCED_CACHE_NAMES = {
  STATIC: `weather-static-${CACHE_VERSION}`,
  API: `weather-api-${CACHE_VERSION}`,
  SEARCH: `weather-search-${CACHE_VERSION}`,
  IMAGES: `weather-images-${CACHE_VERSION}`,
  CSS_CORE: `weather-css-core-${CACHE_VERSION}`,
  CSS_CONDITIONAL: `weather-css-conditional-${CACHE_VERSION}`,
  JS_CHUNKS: `weather-js-chunks-${CACHE_VERSION}`,
};

// CSS-Aware Caching Strategy
const CSS_CACHE_STRATEGY = {
  // Core CSS - Cache forever, update on version change
  core: {
    pattern: /index-[a-zA-Z0-9]+\.css$/,
    strategy: 'CacheFirst',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  // Conditional CSS - Cache with network update
  conditional: {
    patterns: [
      /horrorTheme-[a-zA-Z0-9]+\.css$/,
      /ios-hig-enhancements-[a-zA-Z0-9]+\.css$/,
      /enhancedMobile-[a-zA-Z0-9]+\.css$/,
      /responsive-layout-[a-zA-Z0-9]+\.css$/,
    ],
    strategy: 'StaleWhileRevalidate',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
};

// JavaScript Chunk Caching
const JS_CACHE_STRATEGY = {
  vendor: {
    pattern: /vendor-[a-zA-Z0-9]+\.js$/,
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  app: {
    pattern: /index-[a-zA-Z0-9]+\.js$/,
    strategy: 'StaleWhileRevalidate',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
  chunks: {
    patterns: [
      /weather-core-[a-zA-Z0-9]+\.js$/,
      /haptic-features-[a-zA-Z0-9]+\.js$/,
      /ui-utils-[a-zA-Z0-9]+\.js$/,
    ],
    strategy: 'StaleWhileRevalidate',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
};

// Enhanced Network Timeout Configuration
const ENHANCED_NETWORK_CONFIG = {
  timeout: 5000, // Reduced from 8s to 5s for better performance
  retries: 2, // Reduced retries for faster fallback
  retryDelay: 500, // Faster retry attempts
  staleTimeout: 1000, // Use stale content after 1s if network is slow
};

/**
 * Enhanced CSS Chunk Handler
 */
async function handleCSSRequest(request, url) {
  const pathname = url.pathname;

  // Determine cache strategy based on CSS type
  let cacheStrategy, cacheName, maxAge;

  if (CSS_CACHE_STRATEGY.core.pattern.test(pathname)) {
    cacheStrategy = CSS_CACHE_STRATEGY.core.strategy;
    cacheName = ENHANCED_CACHE_NAMES.CSS_CORE;
    maxAge = CSS_CACHE_STRATEGY.core.maxAge;
  } else if (
    CSS_CACHE_STRATEGY.conditional.patterns.some(pattern =>
      pattern.test(pathname)
    )
  ) {
    cacheStrategy = CSS_CACHE_STRATEGY.conditional.strategy;
    cacheName = ENHANCED_CACHE_NAMES.CSS_CONDITIONAL;
    maxAge = CSS_CACHE_STRATEGY.conditional.maxAge;
  } else {
    // Fallback to static cache
    return handleStaticAsset(request);
  }

  return executeEnhancedCacheStrategy(
    request,
    cacheName,
    cacheStrategy,
    maxAge
  );
}

/**
 * Enhanced JavaScript Chunk Handler
 */
async function handleJSRequest(request, url) {
  const pathname = url.pathname;

  // Determine cache strategy based on JS type
  let cacheStrategy, maxAge;
  const cacheName = ENHANCED_CACHE_NAMES.JS_CHUNKS;

  if (JS_CACHE_STRATEGY.vendor.pattern.test(pathname)) {
    cacheStrategy = JS_CACHE_STRATEGY.vendor.strategy;
    maxAge = JS_CACHE_STRATEGY.vendor.maxAge;
  } else if (JS_CACHE_STRATEGY.app.pattern.test(pathname)) {
    cacheStrategy = JS_CACHE_STRATEGY.app.strategy;
    maxAge = JS_CACHE_STRATEGY.app.maxAge;
  } else if (
    JS_CACHE_STRATEGY.chunks.patterns.some(pattern => pattern.test(pathname))
  ) {
    cacheStrategy = JS_CACHE_STRATEGY.chunks.strategy;
    maxAge = JS_CACHE_STRATEGY.chunks.maxAge;
  } else {
    // Fallback to static cache
    return handleStaticAsset(request);
  }

  return executeEnhancedCacheStrategy(
    request,
    cacheName,
    cacheStrategy,
    maxAge
  );
}

/**
 * Execute Enhanced Cache Strategy with Performance Optimization
 */
async function executeEnhancedCacheStrategy(
  request,
  cacheName,
  strategy,
  maxAge
) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  switch (strategy) {
    case 'CacheFirst':
      return executeCacheFirst(request, cache, cachedResponse, maxAge);

    case 'StaleWhileRevalidate':
      return executeStaleWhileRevalidate(
        request,
        cache,
        cachedResponse,
        maxAge
      );

    case 'NetworkFirst':
      return executeNetworkFirst(request, cache, cachedResponse);

    default:
      return executeStaleWhileRevalidate(
        request,
        cache,
        cachedResponse,
        maxAge
      );
  }
}

/**
 * Cache First Strategy - Optimized for Core CSS/JS
 */
async function executeCacheFirst(request, cache, cachedResponse, maxAge) {
  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetchWithTimeout(
      request,
      ENHANCED_NETWORK_CONFIG.timeout
    );

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      return networkResponse;
    }

    // Return cached response if network fails
    return (
      cachedResponse || new Response('Asset not available', { status: 404 })
    );
  } catch (error) {
    console.warn('CacheFirst strategy failed, using cached response:', error);
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy - Optimized for Conditional CSS
 */
async function executeStaleWhileRevalidate(
  request,
  cache,
  cachedResponse,
  maxAge
) {
  // Start background update immediately
  const networkUpdatePromise = updateCacheInBackground(request, cache);

  // Return cached response immediately if available and not expired
  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    // Update in background for next time
    networkUpdatePromise.catch(error =>
      console.warn('Background cache update failed:', error)
    );
    return cachedResponse;
  }

  // If no cache or expired, wait for network with timeout
  try {
    const networkResponse = await Promise.race([
      fetchWithTimeout(request, ENHANCED_NETWORK_CONFIG.staleTimeout),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Stale timeout')),
          ENHANCED_NETWORK_CONFIG.staleTimeout
        )
      ),
    ]);

    if (networkResponse.ok) {
      // Cache the fresh response
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      return networkResponse;
    }
  } catch (error) {
    console.warn('Network request failed, using stale cache:', error);
  }

  // Fallback to cached response (even if expired)
  return cachedResponse || new Response('Service unavailable', { status: 503 });
}

/**
 * Network First Strategy - For Critical API Requests
 */
async function executeNetworkFirst(request, cache, cachedResponse) {
  try {
    const networkResponse = await fetchWithTimeout(
      request,
      ENHANCED_NETWORK_CONFIG.timeout
    );

    if (networkResponse.ok) {
      // Cache successful response
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      return networkResponse;
    }
  } catch (error) {
    console.warn('Network first failed, falling back to cache:', error);
  }

  // Fallback to cached response
  return (
    cachedResponse ||
    new Response('Network and cache unavailable', { status: 503 })
  );
}

/**
 * Background Cache Update
 */
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.warn('Background update failed:', error);
  }
}

/**
 * Enhanced Fetch with Timeout and Retries
 */
async function fetchWithTimeout(
  request,
  timeout = ENHANCED_NETWORK_CONFIG.timeout
) {
  let lastError;

  for (let attempt = 0; attempt < ENHANCED_NETWORK_CONFIG.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(request, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;

      // Wait before retry (except last attempt)
      if (attempt < ENHANCED_NETWORK_CONFIG.retries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, ENHANCED_NETWORK_CONFIG.retryDelay)
        );
      }
    }
  }

  throw lastError;
}

/**
 * Check if cache entry is expired
 */
function isCacheExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;

  const responseDate = new Date(dateHeader);
  const now = new Date();
  const age = now.getTime() - responseDate.getTime();

  return age > maxAge;
}

/**
 * Enhanced Asset Type Detection
 */
function isEnhancedCSSAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.css') &&
    (CSS_CACHE_STRATEGY.core.pattern.test(pathname) ||
      CSS_CACHE_STRATEGY.conditional.patterns.some(pattern =>
        pattern.test(pathname)
      ))
  );
}

function isEnhancedJSAsset(url) {
  const pathname = url.pathname;
  return (
    pathname.endsWith('.js') &&
    (JS_CACHE_STRATEGY.vendor.pattern.test(pathname) ||
      JS_CACHE_STRATEGY.app.pattern.test(pathname) ||
      JS_CACHE_STRATEGY.chunks.patterns.some(pattern => pattern.test(pathname)))
  );
}

/**
 * Cache Performance Monitoring
 */
async function reportCachePerformance() {
  try {
    const cacheNames = await caches.keys();
    const cacheStats = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheStats[cacheName] = {
        entryCount: keys.length,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Send stats to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_PERFORMANCE_STATS',
          payload: cacheStats,
        });
      });
    });
  } catch (error) {
    console.warn('Cache performance reporting failed:', error);
  }
}

// Export enhanced functions for integration
self.enhancedCacheStrategies = {
  handleCSSRequest,
  handleJSRequest,
  executeEnhancedCacheStrategy,
  reportCachePerformance,
  isEnhancedCSSAsset,
  isEnhancedJSAsset,
};
