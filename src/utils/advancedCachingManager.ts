/**
 * Advanced Caching Strategy Manager
 * Implements intelligent caching strategies for optimal performance
 */

import { logError, logInfo } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
  size: number;
}

interface CacheStrategy {
  maxSize: number; // Maximum cache size in MB
  maxAge: number; // Maximum age in milliseconds
  maxEntries: number; // Maximum number of entries
  evictionPolicy: 'lru' | 'lfu' | 'adaptive';
}

interface CacheStats {
  size: number; // Current size in bytes
  entries: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  memoryUsage: number;
}

class AdvancedCachingManager {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheHits = new Map<string, number>();
  private readonly cacheMisses = new Map<string, number>();
  private evictionCount = 0;
  private readonly STORAGE_KEY = 'weather-advanced-cache';
  private readonly STATS_KEY = 'weather-cache-stats';

  // Default cache strategies for different data types
  private readonly strategies: Record<string, CacheStrategy> = {
    'weather-data': {
      maxSize: 5, // 5MB
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxEntries: 100,
      evictionPolicy: 'adaptive',
    },
    'search-results': {
      maxSize: 2, // 2MB
      maxAge: 60 * 60 * 1000, // 1 hour
      maxEntries: 200,
      evictionPolicy: 'lru',
    },
    'city-data': {
      maxSize: 1, // 1MB
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 500,
      evictionPolicy: 'lfu',
    },
    'user-preferences': {
      maxSize: 0.5, // 500KB
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      maxEntries: 50,
      evictionPolicy: 'lru',
    },
  };

  /**
   * Store data with intelligent caching strategy
   */
  async set<T>(
    key: string,
    data: T,
    category: keyof typeof this.strategies = 'weather-data',
    priority: CacheEntry<T>['priority'] = 'medium',
  ): Promise<boolean> {
    try {
      const strategy = this.strategies[category];
      const size = this.calculateSize(data);
      const now = Date.now();

      // Check if we need to make space
      await this.ensureSpace(strategy, size);

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
        priority,
        size,
      };

      this.cache.set(key, entry as CacheEntry<unknown>);
      await this.persistCache();

      logInfo(`Cached ${key} with size ${size} bytes`);
      return true;
    } catch (error) {
      logError('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from cache with access tracking
   */
  async get<T>(
    key: string,
    category: keyof typeof this.strategies = 'weather-data',
  ): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.recordMiss(key);
      return null;
    }

    const strategy = this.strategies[category];
    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > strategy.maxAge) {
      this.cache.delete(key);
      await this.persistCache();
      this.recordMiss(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.recordHit(key);

    return entry.data;
  }

  /**
   * Remove specific entry from cache
   */
  async remove(key: string): Promise<boolean> {
    const removed = this.cache.delete(key);
    if (removed) {
      await this.persistCache();
    }
    return removed;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.cacheHits.clear();
    this.cacheMisses.clear();
    this.evictionCount = 0;
    await this.persistCache();
    localStorage.removeItem(this.STATS_KEY);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0,
    );
    const totalHits = Array.from(this.cacheHits.values()).reduce(
      (sum, hits) => sum + hits,
      0,
    );
    const totalMisses = Array.from(this.cacheMisses.values()).reduce(
      (sum, misses) => sum + misses,
      0,
    );
    const totalRequests = totalHits + totalMisses;

    return {
      size: totalSize,
      entries: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      evictions: this.evictionCount,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimize(): Promise<{ evicted: number; optimized: number }> {
    let evicted = 0;
    let optimized = 0;

    // Remove expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const category = this.getCategoryFromKey(key);
      const strategy = this.strategies[category];

      if (now - entry.timestamp > strategy.maxAge) {
        this.cache.delete(key);
        evicted++;
      }
    }

    // Optimize based on access patterns
    const entries = Array.from(this.cache.entries());

    // Promote frequently accessed entries
    for (const [_key, entry] of entries) {
      if (entry.accessCount > 10 && entry.priority === 'low') {
        entry.priority = 'medium';
        optimized++;
      } else if (entry.accessCount > 50 && entry.priority === 'medium') {
        entry.priority = 'high';
        optimized++;
      }
    }

    await this.persistCache();
    logInfo(
      `Cache optimization complete: ${evicted} evicted, ${optimized} optimized`,
    );

    return { evicted, optimized };
  }

  /**
   * Prefetch data based on usage patterns
   */
  async prefetchPredictiveData(): Promise<string[]> {
    const prefetched: string[] = [];

    // Analyze access patterns to predict needed data
    const accessPatterns = this.analyzeAccessPatterns();

    for (const pattern of accessPatterns) {
      if (pattern.confidence > 0.7 && !this.cache.has(pattern.key)) {
        // This would typically trigger a background fetch
        // For now, we'll just mark it as a prefetch candidate
        prefetched.push(pattern.key);
      }
    }

    return prefetched;
  }

  /**
   * Ensure there's enough space for new data
   */
  private async ensureSpace(
    strategy: CacheStrategy,
    requiredSize: number,
  ): Promise<void> {
    const stats = this.getStats();
    const maxSizeBytes = strategy.maxSize * 1024 * 1024; // Convert MB to bytes

    // Check size constraints
    if (
      stats.size + requiredSize > maxSizeBytes ||
      this.cache.size >= strategy.maxEntries
    ) {
      await this.evictEntries(strategy, requiredSize);
    }
  }

  /**
   * Evict entries based on strategy
   */
  private async evictEntries(
    strategy: CacheStrategy,
    requiredSize: number,
  ): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let freedSize = 0;

    // Sort entries based on eviction policy
    switch (strategy.evictionPolicy) {
      case 'lru':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'adaptive':
        entries.sort(([, a], [, b]) => {
          // Adaptive policy considers both recency and frequency
          const scoreA =
            a.accessCount * 0.7 + (Date.now() - a.lastAccessed) * -0.3;
          const scoreB =
            b.accessCount * 0.7 + (Date.now() - b.lastAccessed) * -0.3;
          return scoreA - scoreB;
        });
        break;
    }

    // Evict entries until we have enough space
    for (const [key, entry] of entries) {
      if (entry.priority === 'high') continue; // Don't evict high priority entries

      this.cache.delete(key);
      freedSize += entry.size;
      this.evictionCount++;

      if (freedSize >= requiredSize) break;
    }

    await this.persistCache();
  }

  /**
   * Calculate approximate size of data in bytes
   */
  private calculateSize(data: unknown): number {
    try {
      return new TextEncoder().encode(JSON.stringify(data)).length;
    } catch {
      // Fallback estimation
      return JSON.stringify(data).length * 2; // Rough UTF-16 estimation
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory: { usedJSHeapSize: number };
      };
      return perfWithMemory.memory.usedJSHeapSize;
    }
    return this.getStats().size * 2; // Rough estimation
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string): void {
    const current = this.cacheHits.get(key) || 0;
    this.cacheHits.set(key, current + 1);
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string): void {
    const current = this.cacheMisses.get(key) || 0;
    this.cacheMisses.set(key, current + 1);
  }

  /**
   * Get category from cache key
   */
  private getCategoryFromKey(key: string): keyof typeof this.strategies {
    if (key.startsWith('weather-')) return 'weather-data';
    if (key.startsWith('search-')) return 'search-results';
    if (key.startsWith('city-')) return 'city-data';
    if (key.startsWith('pref-')) return 'user-preferences';
    return 'weather-data';
  }

  /**
   * Analyze access patterns for predictive caching
   */
  private analyzeAccessPatterns(): Array<{ key: string; confidence: number }> {
    const patterns: Array<{ key: string; confidence: number }> = [];

    // Simple pattern analysis - in a real implementation, this would be more sophisticated
    for (const [key, hits] of this.cacheHits.entries()) {
      const misses = this.cacheMisses.get(key) || 0;
      const totalRequests = hits + misses;
      const confidence = totalRequests > 5 ? hits / totalRequests : 0;

      if (confidence > 0.5) {
        patterns.push({ key, confidence });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Persist cache to localStorage
   */
  private async persistCache(): Promise<void> {
    try {
      const cacheData = {
        cache: Array.from(this.cache.entries()),
        hits: Array.from(this.cacheHits.entries()),
        misses: Array.from(this.cacheMisses.entries()),
        evictionCount: this.evictionCount,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      logError('Failed to persist cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  async loadPersistedCache(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const cacheData = JSON.parse(stored);

      // Restore cache entries
      for (const [key, entry] of cacheData.cache || []) {
        this.cache.set(key, entry);
      }

      // Restore statistics
      for (const [key, hits] of cacheData.hits || []) {
        this.cacheHits.set(key, hits);
      }

      for (const [key, misses] of cacheData.misses || []) {
        this.cacheMisses.set(key, misses);
      }

      this.evictionCount = cacheData.evictionCount || 0;

      // Clean up expired entries
      await this.optimize();
    } catch (error) {
      logError('Failed to load persisted cache:', error);
    }
  }

  /**
   * Get cache recommendations for optimization
   */
  getCacheRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.hitRate < 0.6) {
      recommendations.push(
        'Consider implementing predictive caching for better hit rates',
      );
    }

    if (stats.memoryUsage > 50 * 1024 * 1024) {
      // > 50MB
      recommendations.push(
        'Cache memory usage is high, consider reducing cache size limits',
      );
    }

    if (stats.evictions > stats.entries * 0.5) {
      recommendations.push(
        'High eviction rate detected, consider increasing cache size or TTL',
      );
    }

    if (this.cache.size === 0) {
      recommendations.push(
        'Cache is empty, data is not being cached effectively',
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const advancedCachingManager = new AdvancedCachingManager();
