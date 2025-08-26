/**
 * Integrated Offline & Performance Enhancement Hook
 *
 * Combines SearchCacheManager, PerformanceMonitor, and NetworkResilienceManager
 * into a unified system for comprehensive offline capabilities and performance optimization.
 */

// eslint rule adjusted: trailing commas handled by Prettier; no disable needed

import { useCallback, useEffect, useRef, useState } from 'react';
import { networkResilienceManager } from './networkResilienceManager';
import {
  performanceMonitor,
  type PerformanceSummary,
} from './performanceMonitor';
import { searchCacheManager } from './searchCacheManager';

// Integration Configuration
const INTEGRATION_CONFIG = {
  // Initialization delays
  CACHE_INIT_DELAY: 100,
  PERFORMANCE_INIT_DELAY: 200,
  NETWORK_INIT_DELAY: 300,

  // Auto-optimization settings
  AUTO_OPTIMIZE_INTERVAL: 60000, // 1 minute
  PERFORMANCE_CHECK_INTERVAL: 30000, // 30 seconds
  CACHE_CLEANUP_INTERVAL: 300000, // 5 minutes

  // Performance thresholds for auto-optimization
  OPTIMIZATION_THRESHOLDS: {
    CACHE_HIT_RATE: 0.7, // Below 70% triggers optimization
    AVERAGE_SEARCH_TIME: 1000, // Above 1s triggers optimization
    ERROR_RATE: 0.05, // Above 5% triggers network optimization
    MEMORY_USAGE_RATIO: 0.8, // Above 80% triggers cleanup
  },
} as const;

// Hook state interface
interface OfflinePerformanceState {
  isInitialized: boolean;
  isOnline: boolean;
  cacheStatus: {
    hitRate: number;
    size: number;
    lastCleanup: number;
  };
  performance: {
    score: number;
    averageSearchTime: number;
    recommendations: string[];
  };
  network: {
    queueLength: number;
    successRate: number;
    circuitBreakers: number;
  };
  autoOptimization: {
    enabled: boolean;
    lastRun: number;
    actionsPerformed: string[];
  };
}

// Hook result interface
interface UseOfflinePerformanceResult {
  // State
  state: OfflinePerformanceState;

  // Core functions
  search: (
    query: string,
    options?: SearchOptions
  ) => Promise<SearchResultWithMeta>;
  clearCache: (type?: 'all' | 'search' | 'api') => Promise<void>;

  // Performance functions
  getPerformanceReport: () => PerformanceSummary;
  optimizePerformance: () => Promise<void>;

  // Network functions
  checkConnection: () => Promise<boolean>;
  retryFailedRequests: () => Promise<void>;

  // Cache functions
  preloadPopularSearches: (queries: string[]) => Promise<void>;
  getCacheSize: () => Promise<number>;

  // Configuration
  toggleAutoOptimization: (enabled: boolean) => void;
}

// Enhanced types
interface SearchOptions {
  source?: 'cache' | 'network' | 'auto';
  timeout?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  useCache?: boolean;
  autoCorrect?: boolean;
}

interface SearchResultWithMeta {
  results: unknown[];
  metadata: {
    source: 'cache' | 'network' | 'fallback';
    cached: boolean;
    offline: boolean;
    responseTime: number;
    timestamp: number;
    confidence?: number;
    accuracy?: number;
  };
}

/**
 * Comprehensive Offline & Performance Enhancement Hook
 * Provides unified access to all Feature 4 capabilities
 */
export const useOfflinePerformance = (): UseOfflinePerformanceResult => {
  // State management
  const [state, setState] = useState<OfflinePerformanceState>({
    isInitialized: false,
    isOnline: navigator.onLine,
    cacheStatus: {
      hitRate: 0,
      size: 0,
      lastCleanup: Date.now(),
    },
    performance: {
      score: 100,
      averageSearchTime: 0,
      recommendations: [],
    },
    network: {
      queueLength: 0,
      successRate: 1,
      circuitBreakers: 0,
    },
    autoOptimization: {
      enabled: true,
      lastRun: Date.now(),
      actionsPerformed: [],
    },
  });

  // Refs for timers and optimization
  const optimizationTimer = useRef<NodeJS.Timeout | null>(null);
  const performanceTimer = useRef<NodeJS.Timeout | null>(null);
  const cacheTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitializing = useRef(false);

  /**
   * Initialize all systems in proper order
   */
  const initializeSystems = useCallback(async () => {
    if (isInitializing.current || state.isInitialized) return;
    isInitializing.current = true;

    try {
      // Initialize in sequence with proper delays
      await new Promise(resolve =>
        setTimeout(resolve, INTEGRATION_CONFIG.CACHE_INIT_DELAY)
      );
      await searchCacheManager.initialize();

      await new Promise(resolve =>
        setTimeout(resolve, INTEGRATION_CONFIG.PERFORMANCE_INIT_DELAY)
      );
      performanceMonitor.initialize();

      await new Promise(resolve =>
        setTimeout(resolve, INTEGRATION_CONFIG.NETWORK_INIT_DELAY)
      );
      networkResilienceManager.initialize();

      // Setup network event handlers
      networkResilienceManager.onOnline(() => {
        setState(prev => ({ ...prev, isOnline: true }));
        updateNetworkStatus();
      });

      networkResilienceManager.onOffline(() => {
        setState(prev => ({ ...prev, isOnline: false }));
        updateNetworkStatus();
      });

      // Start periodic updates
      startPeriodicUpdates();

      setState(prev => ({ ...prev, isInitialized: true }));

      // eslint-disable-next-line no-console
      console.log('🚀 Offline & Performance systems initialized successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize systems:', error);
      isInitializing.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isInitialized]);

  /**
   * Start periodic status updates and auto-optimization
   */
  const startPeriodicUpdates = useCallback(() => {
    // Performance monitoring updates
    performanceTimer.current = setInterval(() => {
      updatePerformanceStatus();
    }, INTEGRATION_CONFIG.PERFORMANCE_CHECK_INTERVAL);

    // Cache status updates
    cacheTimer.current = setInterval(() => {
      updateCacheStatus();
    }, INTEGRATION_CONFIG.CACHE_CLEANUP_INTERVAL);

    // Auto-optimization
    if (state.autoOptimization.enabled) {
      optimizationTimer.current = setInterval(() => {
        performAutoOptimization();
      }, INTEGRATION_CONFIG.AUTO_OPTIMIZE_INTERVAL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.autoOptimization.enabled]);

  /**
   * Update performance status
   */
  const updatePerformanceStatus = useCallback(() => {
    const report = performanceMonitor.generatePerformanceReport();

    setState(prev => ({
      ...prev,
      performance: {
        score: report.performanceScore,
        averageSearchTime: report.averageSearchTime,
        recommendations: report.recommendations,
      },
    }));
  }, []);

  /**
   * Update cache status
   */
  const updateCacheStatus = useCallback(() => {
    const metrics = searchCacheManager.getCacheMetrics();

    setState(prev => ({
      ...prev,
      cacheStatus: {
        hitRate: metrics.hitRate,
        size: metrics.cacheSize,
        lastCleanup: metrics.lastCleanup,
      },
    }));
  }, []);

  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(() => {
    const status = networkResilienceManager.getNetworkStatus();

    setState(prev => ({
      ...prev,
      network: {
        queueLength: status.queueLength,
        successRate:
          status.metrics.successCount /
          Math.max(1, status.metrics.requestCount),
        circuitBreakers: status.circuitBreakers.filter(
          cb => cb.state !== 'closed'
        ).length,
      },
    }));
  }, []);

  /**
   * Perform automatic optimization based on performance metrics
   */
  const performAutoOptimization = useCallback(async () => {
    if (!state.autoOptimization.enabled) return;

    const actions: string[] = [];
    const thresholds = INTEGRATION_CONFIG.OPTIMIZATION_THRESHOLDS;

    try {
      // Check cache hit rate
      if (state.cacheStatus.hitRate < thresholds.CACHE_HIT_RATE) {
        await searchCacheManager.clearCache();
        actions.push('Cache cleared due to low hit rate');
      }

      // Check average search time
      if (
        state.performance.averageSearchTime > thresholds.AVERAGE_SEARCH_TIME
      ) {
        // Reset circuit breakers to allow fresh attempts
        networkResilienceManager.resetCircuitBreakers();
        actions.push('Circuit breakers reset due to slow searches');
      }

      // Check error rate
      const networkStatus = networkResilienceManager.getNetworkStatus();
      const errorRate =
        1 -
        networkStatus.metrics.successCount /
          Math.max(1, networkStatus.metrics.requestCount);

      if (errorRate > thresholds.ERROR_RATE) {
        // Cancel queued requests and reset
        networkResilienceManager.cancelAllRequests();
        actions.push('Network requests reset due to high error rate');
      }

      // Check memory usage
      const memoryMetrics = performanceMonitor.getMemoryHistory();
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];

      if (
        latestMemory &&
        latestMemory.used / latestMemory.limit > thresholds.MEMORY_USAGE_RATIO
      ) {
        await searchCacheManager.clearCache();
        performanceMonitor.reset();
        actions.push('Memory cleanup performed');
      }

      if (actions.length > 0) {
        setState(prev => ({
          ...prev,
          autoOptimization: {
            ...prev.autoOptimization,
            lastRun: Date.now(),
            actionsPerformed: actions,
          },
        }));

        // eslint-disable-next-line no-console
        console.log('🔧 Auto-optimization performed:', actions);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Auto-optimization failed:', error);
    }
  }, [state]);

  /**
   * Enhanced search function with comprehensive offline support
   */
  const search = useCallback(
    async (
      query: string,
      options: SearchOptions = {}
    ): Promise<SearchResultWithMeta> => {
      const startTime = performance.now();
      const operationId = `search_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Start performance tracking
      performanceMonitor.startSearchOperation(operationId, 'enhanced_search', {
        query,
        options,
      });

      try {
        let result: SearchResultWithMeta;

        // Try cache first if enabled
        if (options.useCache !== false && options.source !== 'network') {
          const cached = await searchCacheManager.getCachedResults(query);

          if (cached) {
            result = {
              results: cached.results,
              metadata: {
                source: 'cache',
                cached: true,
                offline: !state.isOnline,
                responseTime: performance.now() - startTime,
                timestamp: Date.now(),
                accuracy: cached.metadata.accuracy,
              },
            };

            // End performance tracking
            performanceMonitor.endSearchOperation(
              operationId,
              'enhanced_search',
              {
                query,
                duration: result.metadata.responseTime,
                source: 'cache',
                resultCount: result.results.length,
                cacheHit: true,
                accuracy: result.metadata.accuracy,
              }
            );

            return result;
          }
        }

        // If cache miss or network preferred, make network request
        if (state.isOnline && options.source !== 'cache') {
          try {
            // Use network resilience manager for the request
            const geocodingUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              query
            )}&format=json&limit=5`;

            const response = await networkResilienceManager.makeRequest(
              geocodingUrl,
              {
                method: 'GET',
                headers: {
                  'User-Agent': 'WeatherApp/1.0',
                },
              },
              {
                priority: options.priority || 'medium',
                timeout: options.timeout,
                source: 'user',
              }
            );

            const data = await response.json();
            const responseTime = performance.now() - startTime;

            // Cache the results
            await searchCacheManager.cacheSearchResults(query, data, 'api', {
              responseTime,
              accuracy: 0.9,
            });

            result = {
              results: data,
              metadata: {
                source: 'network',
                cached: false,
                offline: false,
                responseTime,
                timestamp: Date.now(),
                accuracy: 0.9,
              },
            };

            // End performance tracking
            performanceMonitor.endSearchOperation(
              operationId,
              'enhanced_search',
              {
                query,
                duration: responseTime,
                source: 'api',
                resultCount: result.results.length,
                cacheHit: false,
                accuracy: 0.9,
              }
            );

            return result;
          } catch (networkError) {
            // Network failed, try cache as fallback
            const cached = await searchCacheManager.getCachedResults(query);

            if (cached) {
              result = {
                results: cached.results,
                metadata: {
                  source: 'cache',
                  cached: true,
                  offline: true,
                  responseTime: performance.now() - startTime,
                  timestamp: Date.now(),
                  accuracy: cached.metadata.accuracy,
                },
              };

              return result;
            }

            // No cache available, return error fallback
            throw networkError;
          }
        }

        // Offline fallback
        result = {
          results: [],
          metadata: {
            source: 'fallback',
            cached: false,
            offline: true,
            responseTime: performance.now() - startTime,
            timestamp: Date.now(),
          },
        };

        return result;
      } catch (error) {
        // Record search error
        performanceMonitor.recordSearchError(
          'enhanced_search',
          error as Error,
          {
            query,
            options,
          }
        );

        throw error;
      }
    },
    [state.isOnline]
  );

  /**
   * Clear cache with options
   */
  const clearCache = useCallback(
    async (type: 'all' | 'search' | 'api' = 'all') => {
      if (type === 'all') {
        await searchCacheManager.clearCache();

        // Send message to service worker
        if (
          'serviceWorker' in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_CACHE',
            payload: {},
          });
        }
      }

      updateCacheStatus();
    },
    [updateCacheStatus]
  );

  /**
   * Get comprehensive performance report
   */
  const getPerformanceReport = useCallback(() => {
    return performanceMonitor.generatePerformanceReport();
  }, []);

  /**
   * Manual performance optimization
   */
  const optimizePerformance = useCallback(async () => {
    await performAutoOptimization();
  }, [performAutoOptimization]);

  /**
   * Check network connection
   */
  const checkConnection = useCallback(async () => {
    return networkResilienceManager.getNetworkStatus().isOnline;
  }, []);

  /**
   * Retry failed network requests
   */
  const retryFailedRequests = useCallback(async () => {
    networkResilienceManager.resetCircuitBreakers();
  }, []);

  /**
   * Preload popular searches
   */
  const preloadPopularSearches = useCallback(
    async (queries: string[]) => {
      const preloadPromises = queries.map(query =>
        search(query, { useCache: false, priority: 'low' })
      );

      await Promise.allSettled(preloadPromises);
    },
    [search]
  );

  /**
   * Get current cache size
   */
  const getCacheSize = useCallback(async () => {
    const metrics = searchCacheManager.getCacheMetrics();
    return metrics.cacheSize;
  }, []);

  /**
   * Toggle auto-optimization
   */
  const toggleAutoOptimization = useCallback(
    (enabled: boolean) => {
      setState(prev => ({
        ...prev,
        autoOptimization: {
          ...prev.autoOptimization,
          enabled,
        },
      }));

      if (enabled && !optimizationTimer.current) {
        optimizationTimer.current = setInterval(() => {
          performAutoOptimization();
        }, INTEGRATION_CONFIG.AUTO_OPTIMIZE_INTERVAL);
      } else if (!enabled && optimizationTimer.current) {
        clearInterval(optimizationTimer.current);
        optimizationTimer.current = null;
      }
    },
    [performAutoOptimization]
  );

  // Initialize systems on mount
  useEffect(() => {
    initializeSystems();

    // Cleanup on unmount
    return () => {
      if (optimizationTimer.current) {
        clearInterval(optimizationTimer.current);
      }
      if (performanceTimer.current) {
        clearInterval(performanceTimer.current);
      }
      if (cacheTimer.current) {
        clearInterval(cacheTimer.current);
      }
    };
  }, [initializeSystems]);

  return {
    state,
    search,
    clearCache,
    getPerformanceReport,
    optimizePerformance,
    checkConnection,
    retryFailedRequests,
    preloadPopularSearches,
    getCacheSize,
    toggleAutoOptimization,
  };
};

// Export types for external use
export type {
  OfflinePerformanceState,
  SearchOptions,
  SearchResultWithMeta,
  UseOfflinePerformanceResult,
};
