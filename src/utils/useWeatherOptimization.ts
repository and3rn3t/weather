/**
 * Weather Data Optimization Hook
 * 
 * Provides performance optimizations specifically for weather data processing,
 * including memoization, debouncing, and intelligent caching.
 */

import { useMemo, useCallback, useRef } from 'react';

interface WeatherOptimizationOptions {
  debounceMs?: number;
  cacheTimeout?: number;
  enableMemoization?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

export const useWeatherOptimization = <T>(
  data: T,
  key: string,
  options: WeatherOptimizationOptions = {}
) => {
  const {
    debounceMs = 300,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    enableMemoization = true
  } = options;

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Memoized data processing
  const optimizedData = useMemo(() => {
    if (!enableMemoization) return data;

    const cacheKey = `${key}-${JSON.stringify(data)}`;
    const cached = cache.current.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cacheTimeout) {
      return cached.data;
    }

    // Cache the new data
    cache.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      key: cacheKey
    });

    // Clean up old cache entries
    if (cache.current.size > 10) {
      const oldestKey = Array.from(cache.current.keys())[0];
      cache.current.delete(oldestKey);
    }

    return data;
  }, [data, key, cacheTimeout, enableMemoization]);

  // Debounced update function
  const debouncedUpdate = useCallback((callback: () => void) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      callback();
      debounceTimer.current = null;
    }, debounceMs);
  }, [debounceMs]);

  // Cache statistics
  const getCacheStats = useCallback(() => ({
    size: cache.current.size,
    keys: Array.from(cache.current.keys()),
    hitRate: cache.current.size > 0 ? 1 : 0 // Simplified calculation
  }), []);

  // Clear cache
  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    optimizedData,
    debouncedUpdate,
    getCacheStats,
    clearCache,
    isFromCache: cache.current.has(`${key}-${JSON.stringify(data)}`)
  };
};

/**
 * Hook for optimizing weather API calls
 */
export const useWeatherAPIOptimization = () => {
  const requestCache = useRef<Map<string, Promise<Response>>>(new Map());
  const lastRequestTime = useRef<Map<string, number>>(new Map());

  const optimizedFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    cacheKey: string = url
  ) => {
    const now = Date.now();
    const lastRequest = lastRequestTime.current.get(cacheKey);
    
    // Prevent duplicate requests within 1 second
    if (lastRequest && (now - lastRequest) < 1000) {
      const existingRequest = requestCache.current.get(cacheKey);
      if (existingRequest) {
        return existingRequest;
      }
    }

    // Create new request
    const request = fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cache-Control': 'max-age=300', // 5 minutes browser cache
      }
    });

    // Cache the request
    requestCache.current.set(cacheKey, request);
    lastRequestTime.current.set(cacheKey, now);

    // Clean up cache after request completes
    request.finally(() => {
      setTimeout(() => {
        requestCache.current.delete(cacheKey);
      }, 5000); // Keep for 5 seconds to prevent rapid duplicate requests
    });

    return request;
  }, []);

  const clearAPICache = useCallback(() => {
    requestCache.current.clear();
    lastRequestTime.current.clear();
  }, []);

  return {
    optimizedFetch,
    clearAPICache,
    getCacheSize: () => requestCache.current.size
  };
};

/**
 * Hook for weather data transformation optimization
 */
export const useWeatherDataTransform = () => {
  const transformCache = useRef<Map<string, unknown>>(new Map());

  const optimizedTransform = useCallback(<TInput, TOutput>(
    data: TInput,
    transformFn: (data: TInput) => TOutput,
    cacheKey: string
  ): TOutput => {
    const cached = transformCache.current.get(cacheKey) as TOutput;
    if (cached) {
      return cached;
    }

    const result = transformFn(data);
    transformCache.current.set(cacheKey, result);

    // Clean up cache when it gets too large
    if (transformCache.current.size > 20) {
      const firstKey = transformCache.current.keys().next().value;
      if (firstKey) {
        transformCache.current.delete(firstKey);
      }
    }

    return result;
  }, []);

  return { optimizedTransform };
};

export default {
  useWeatherOptimization,
  useWeatherAPIOptimization,
  useWeatherDataTransform
};
