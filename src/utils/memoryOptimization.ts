/**
 * Memory Optimization Manager
 * Implements memory management strategies for the weather app
 */

import React from 'react';

// Cache size limits in bytes
export const MEMORY_LIMITS = {
  searchCache: 5 * 1024 * 1024, // 5MB for search cache
  weatherCache: 10 * 1024 * 1024, // 10MB for weather data cache
  imageCache: 15 * 1024 * 1024, // 15MB for weather images/icons
  totalMemoryBudget: 50 * 1024 * 1024, // 50MB total app memory budget
  maxCacheEntries: {
    search: 100,
    weather: 50,
    location: 200,
  },
};

// Cache cleanup thresholds
export const CLEANUP_THRESHOLDS = {
  memoryPressure: 0.8, // Cleanup when 80% of budget is used
  cacheHitRate: 0.3, // Cleanup entries with hit rate below 30%
  maxAge: 24 * 60 * 60 * 1000, // 24 hours max age
  unusedTime: 30 * 60 * 1000, // 30 minutes without access
};

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<(usage: MemoryInfo) => void> = new Set();

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return; // Not available in this environment
    }

    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Check current memory usage
   */
  private checkMemoryUsage(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return;
    }

    const memory = (performance as Performance & { memory?: MemoryInfo })
      .memory;
    if (!memory) return;

    const usage: MemoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    // Check if we're approaching memory limits
    const memoryPressure =
      usage.usedJSHeapSize / MEMORY_LIMITS.totalMemoryBudget;

    if (memoryPressure > CLEANUP_THRESHOLDS.memoryPressure) {
      this.triggerMemoryCleanup();
    }

    // Notify callbacks
    this.callbacks.forEach(callback => callback(usage));
  }

  /**
   * Subscribe to memory updates
   */
  subscribe(callback: (usage: MemoryInfo) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup(): void {
    // Dispatch custom event for cache managers to clean up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('memory-pressure', {
          detail: { action: 'cleanup' },
        }),
      );
    }
  }

  /**
   * Get current memory info
   */
  getCurrentMemoryInfo(): MemoryInfo | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as Performance & { memory?: MemoryInfo })
      .memory;
    return memory || null;
  }
}

/**
 * Cache optimization utilities
 */
export class CacheOptimizer {
  /**
   * Optimize cache by removing least recently used items
   */
  static optimizeLRU<T>(
    cache: Map<string, T & { lastAccess: number; accessCount: number }>,
    maxSize: number,
  ): number {
    if (cache.size <= maxSize) return 0;

    // Sort by least recently used
    const entries = Array.from(cache.entries()).sort(
      ([, a], [, b]) => a.lastAccess - b.lastAccess,
    );

    const itemsToRemove = cache.size - maxSize;
    let removed = 0;

    for (let i = 0; i < itemsToRemove && i < entries.length; i++) {
      cache.delete(entries[i][0]);
      removed++;
    }

    return removed;
  }

  /**
   * Remove expired cache entries
   */
  static removeExpired<T>(
    cache: Map<string, T & { timestamp: number }>,
    maxAge: number = CLEANUP_THRESHOLDS.maxAge,
  ): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > maxAge) {
        cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Remove low-priority cache entries
   */
  static removeLowPriority<T>(
    cache: Map<
      string,
      T & { priority?: 'low' | 'medium' | 'high'; accessCount: number }
    >,
    minAccessCount: number = 2,
  ): number {
    let removed = 0;

    for (const [key, value] of cache.entries()) {
      if (
        (value.priority === 'low' || !value.priority) &&
        value.accessCount < minAccessCount
      ) {
        cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Global memory manager instance
 */
export const memoryMonitor = new MemoryMonitor();

/**
 * Memory optimization hook for React components
 */
export const useMemoryOptimization = () => {
  const [memoryInfo, setMemoryInfo] = React.useState<MemoryInfo | null>(null);
  const [isMemoryPressure, setIsMemoryPressure] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe(usage => {
      setMemoryInfo(usage);

      const pressure = usage.usedJSHeapSize / MEMORY_LIMITS.totalMemoryBudget;
      setIsMemoryPressure(pressure > CLEANUP_THRESHOLDS.memoryPressure);
    });

    // Initial check
    const currentMemory = memoryMonitor.getCurrentMemoryInfo();
    if (currentMemory) {
      setMemoryInfo(currentMemory);
    }

    return unsubscribe;
  }, []);

  return {
    memoryInfo,
    isMemoryPressure,
    memoryUsagePercent: memoryInfo
      ? (memoryInfo.usedJSHeapSize / MEMORY_LIMITS.totalMemoryBudget) * 100
      : 0,
  };
};

// Type definitions
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}
