/**
 * Service Worker Enhancement Integration
 * Integrates Phase 3B optimizations with existing service worker
 */

/**
 * Initialize Enhanced Service Worker Features
 */
export const initializeServiceWorkerEnhancements = (): void => {
  if ('serviceWorker' in navigator) {
    registerEnhancedServiceWorker();
    setupServiceWorkerMessageHandling();
    monitorServiceWorkerPerformance();
  } else {
    console.warn('Service Worker not supported in this browser');
  }
};

/**
 * Register Enhanced Service Worker
 */
async function registerEnhancedServiceWorker(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('🔧 Enhanced Service Worker registered successfully');

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available, notify user
            notifyServiceWorkerUpdate();
          }
        });
      }
    });

    // Activate new service worker immediately
    if (registration.waiting) {
      skipWaitingAndActivate(registration.waiting);
    }
  } catch (error) {
    console.error('Enhanced Service Worker registration failed:', error);
  }
}

/**
 * Setup Message Handling with Service Worker
 */
function setupServiceWorkerMessageHandling(): void {
  if (!navigator.serviceWorker.controller) return;

  navigator.serviceWorker.addEventListener('message', event => {
    const { type, payload } = event.data || {};

    switch (type) {
      case 'CACHE_PERFORMANCE_STATS':
        handleCachePerformanceStats(payload);
        break;

      case 'CSS_CHUNK_CACHED':
        handleCSSChunkCached(payload);
        break;

      case 'CACHE_UPDATE_AVAILABLE':
        handleCacheUpdateAvailable(payload);
        break;

      default:
        console.log('Service Worker message:', type, payload);
    }
  });
}

/**
 * Monitor Service Worker Performance
 */
function monitorServiceWorkerPerformance(): void {
  // Request cache performance stats every 5 minutes
  setInterval(() => {
    sendMessageToServiceWorker('GET_ENHANCED_CACHE_STATUS');
  }, 5 * 60 * 1000);

  // Monitor cache hits vs misses
  monitorCacheEffectiveness();
}

/**
 * Preload Critical CSS Chunks
 */
export const preloadCriticalCSS = async (): Promise<void> => {
  const criticalCSSChunks = [
    // Core CSS is always loaded, so we preload conditional CSS that's likely to be needed
    'ios-hig-enhancements',
    'enhancedMobileLayout',
    'responsive-layout-consolidated',
  ];

  for (const chunkName of criticalCSSChunks) {
    try {
      await sendMessageToServiceWorker('PRELOAD_CSS_CHUNK', { chunkName });
    } catch (error) {
      console.warn(`Failed to preload CSS chunk: ${chunkName}`, error);
    }
  }
};

/**
 * Cache CSS Chunk Dynamically
 */
export const cacheCSSchunk = async (chunkUrl: string): Promise<boolean> => {
  try {
    const response = (await sendMessageToServiceWorker('CACHE_CSS_CHUNK', {
      url: chunkUrl,
    })) as { success: boolean };
    return response.success;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to cache CSS chunk:', error);
    return false;
  }
};

/**
 * Get Cache Status Report
 */
export const getCacheStatusReport = async (): Promise<CacheStatusReport> => {
  try {
    const stats = (await sendMessageToServiceWorker(
      'GET_ENHANCED_CACHE_STATUS'
    )) as {
      coreCSSCached?: boolean;
      conditionalCSSCached?: number;
      jsChunksCached?: number;
      totalCacheSize?: string;
      cacheHitRate?: number;
      lastUpdate?: string;
    };
    return {
      coreCSSSCached: stats.coreCSSCached || false,
      conditionalCSSCached: stats.conditionalCSSCached || 0,
      jSChunksCached: stats.jsChunksCached || 0,
      totalCacheSize: stats.totalCacheSize || '0MB',
      cacheHitRate: stats.cacheHitRate || 0,
      lastUpdate: stats.lastUpdate || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {
      coreCSSSCached: false,
      conditionalCSSCached: 0,
      jSChunksCached: 0,
      totalCacheSize: '0MB',
      cacheHitRate: 0,
      lastUpdate: new Date().toISOString(),
    };
  }
};

/**
 * Clear Conditional CSS Cache
 */
export const clearConditionalCSSCache = async (): Promise<void> => {
  try {
    await sendMessageToServiceWorker('CLEAR_CONDITIONAL_CSS_CACHE');
    console.log('✅ Conditional CSS cache cleared');
  } catch (error) {
    console.error('Failed to clear conditional CSS cache:', error);
  }
};

/**
 * Handle Cache Performance Stats
 */
function handleCachePerformanceStats(stats: any): void {
  // Update performance dashboard if available
  if (window.weatherApp?.performance) {
    window.weatherApp.performance.updateCacheStats(stats);
  }

  // Log cache efficiency
  console.log('📊 Cache Performance Stats:', {
    totalCaches: Object.keys(stats).length,
    totalEntries: Object.values(stats).reduce(
      (sum: number, cache: any) => sum + cache.entryCount,
      0
    ),
    timestamp: new Date().toLocaleTimeString(),
  });
}

/**
 * Handle CSS Chunk Cached Event
 */
function handleCSSChunkCached(payload: {
  chunkName: string;
  size: number;
}): void {
  console.log(
    `✅ CSS chunk cached: ${payload.chunkName} (${payload.size} bytes)`
  );

  // Update UI if CSS chunk caching UI exists
  if (window.weatherApp?.ui?.updateCSSChunkStatus) {
    window.weatherApp.ui.updateCSSChunkStatus(payload.chunkName, 'cached');
  }
}

/**
 * Handle Cache Update Available
 */
function handleCacheUpdateAvailable(payload: { chunkName: string }): void {
  console.log(`🔄 Cache update available for: ${payload.chunkName}`);

  // Could trigger a background update or notify user
  if (window.weatherApp?.notifications) {
    window.weatherApp.notifications.showCacheUpdateNotification(
      payload.chunkName
    );
  }
}

/**
 * Notify User of Service Worker Update
 */
function notifyServiceWorkerUpdate(): void {
  console.log('🆕 New app version available');

  // Show update notification
  if (window.weatherApp?.notifications) {
    window.weatherApp.notifications.showAppUpdateNotification();
  } else {
    // Fallback notification
    console.log('💡 Refresh the page to get the latest version');
  }
}

/**
 * Skip Waiting and Activate New Service Worker
 */
function skipWaitingAndActivate(serviceWorker: ServiceWorker): void {
  serviceWorker.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Send Message to Service Worker
 */
function sendMessageToServiceWorker(
  type: string,
  payload?: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = event => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage({ type, payload }, [
      messageChannel.port2,
    ]);

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Service Worker message timeout'));
    }, 10000);
  });
}

/**
 * Monitor Cache Effectiveness
 */
function monitorCacheEffectiveness(): void {
  let cacheHits = 0;
  let cacheMisses = 0;

  // Monitor Performance API for cache information
  if ('performance' in window && 'getEntriesByType' in performance) {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach((entry: any) => {
        if (entry.transferSize === 0) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      });

      // Report cache effectiveness every 100 requests
      const totalRequests = cacheHits + cacheMisses;
      if (totalRequests > 0 && totalRequests % 100 === 0) {
        const hitRate = (cacheHits / totalRequests) * 100;
        console.log(
          `📈 Cache Hit Rate: ${hitRate.toFixed(
            1
          )}% (${cacheHits}/${totalRequests})`
        );
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

/**
 * Types
 */
interface CacheStatusReport {
  coreCSSSCached: boolean;
  conditionalCSSCached: number;
  jSChunksCached: number;
  totalCacheSize: string;
  cacheHitRate: number;
  lastUpdate: string;
}

// Global weatherApp interface extension
declare global {
  interface Window {
    weatherApp?: {
      performance?: {
        updateCacheStats: (stats: any) => void;
      };
      ui?: {
        updateCSSChunkStatus: (chunkName: string, status: string) => void;
      };
      notifications?: {
        showCacheUpdateNotification: (chunkName: string) => void;
        showAppUpdateNotification: () => void;
      };
    };
  }
}
