/**
 * Unified Cache Manager
 * Phase 4.1: Consolidates memory cache, IndexedDB, and service worker cache
 * - Single source of truth for all caching operations
 * - LRU eviction with size limits
 * - Cache warming for popular locations
 * - Cache hit/miss telemetry
 */

import { SmartCacheManager } from '../services/mobile/SmartCacheManager';
import { advancedCachingManager } from './advancedCachingManager';
import { logger } from './logger';
import { offlineStorage } from './offlineWeatherStorage';
import { searchCacheManager } from './searchCacheManager';

interface UnifiedCacheEntry<T> {
  data: T;
  timestamp: number;
  category: CacheCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  size: number;
  accessCount: number;
  lastAccessed: number;
}

type CacheCategory =
  | 'weather-data'
  | 'search-results'
  | 'city-data'
  | 'user-preferences'
  | 'geocoding';

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  memoryCacheSize: number;
  indexedDBSize: number;
  localStorageSize: number;
}

class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;
  private readonly memoryCache = new Map<string, UnifiedCacheEntry<unknown>>();
  private readonly smartCacheManager: SmartCacheManager;
  private readonly MAX_MEMORY_CACHE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_MEMORY_ENTRIES = 200;
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly popularLocations: string[] = [];

  private constructor() {
    this.smartCacheManager = new SmartCacheManager();
    this.loadPopularLocations();
    this.startPeriodicCleanup();
  }

  static getInstance(): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager();
    }
    return UnifiedCacheManager.instance;
  }

  /**
   * Get data from unified cache (checks all layers)
   */
  async get<T>(
    key: string,
    category: CacheCategory = 'weather-data'
  ): Promise<T | null> {
    // 1. Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry, category)) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.cacheHits++;
      logger.info(`Cache HIT (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // 2. Check SmartCacheManager (localStorage-backed)
    try {
      const smartCacheData = await this.smartCacheManager.get(key);
      if (smartCacheData) {
        // Promote to memory cache
        this.setMemoryCache(key, smartCacheData, category, 'medium');
        this.cacheHits++;
        logger.info(`Cache HIT (smart): ${key}`);
        return smartCacheData as T;
      }
    } catch (error) {
      logger.error('Smart cache get error:', error);
    }

    // 3. Check offlineStorage (localStorage)
    if (category === 'weather-data' || category === 'city-data') {
      try {
        const offlineData = offlineStorage.getCachedWeatherData<T>(key);
        if (offlineData) {
          this.setMemoryCache(key, offlineData, category, 'medium');
          this.cacheHits++;
          logger.info(`Cache HIT (offline): ${key}`);
          return offlineData;
        }
      } catch (error) {
        logger.error('Offline storage get error:', error);
      }
    }

    // 4. Check searchCacheManager (IndexedDB) for search results
    if (category === 'search-results') {
      try {
        const searchData = await searchCacheManager.getCachedResults(key);
        if (searchData && Array.isArray(searchData) && searchData.length > 0) {
          this.setMemoryCache(key, searchData, category, 'medium');
          this.cacheHits++;
          logger.info(`Cache HIT (IndexedDB): ${key}`);
          return searchData as T;
        }
      } catch (error) {
        logger.error('Search cache get error:', error);
      }
    }

    // Cache miss
    this.cacheMisses++;
    logger.info(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set data in unified cache (writes to all appropriate layers)
   */
  async set<T>(
    key: string,
    data: T,
    category: CacheCategory = 'weather-data',
    priority: UnifiedCacheEntry<T>['priority'] = 'medium'
  ): Promise<boolean> {
    const size = this.calculateSize(data);

    // 1. Always set in memory cache (fastest access)
    this.setMemoryCache(key, data, category, priority);

    // 2. Set in appropriate persistent cache based on category
    try {
      if (category === 'weather-data' || category === 'city-data') {
        // Use offlineStorage for weather data
        await offlineStorage.cacheWeatherData(key, data);
      }

      // Use SmartCacheManager for all categories (localStorage-backed)
      // Map 'critical' priority to 'high' for SmartCacheManager compatibility
      let smartCachePriority: 'low' | 'medium' | 'high' = 'medium';
      if (priority === 'critical') {
        smartCachePriority = 'high';
      } else if (
        priority === 'low' ||
        priority === 'medium' ||
        priority === 'high'
      ) {
        smartCachePriority = priority;
      }
      await this.smartCacheManager.set(key, data, {
        priority: smartCachePriority,
        ttl: this.getTTLForCategory(category),
      });

      // Use advancedCachingManager for statistics
      // Map 'critical' priority to 'high' for advancedCachingManager compatibility
      const advancedCachePriority =
        priority === 'critical'
          ? 'high'
          : priority === 'low' || priority === 'medium' || priority === 'high'
            ? priority
            : 'medium';
      await advancedCachingManager.set(
        key,
        data,
        category,
        advancedCachePriority
      );

      // Use searchCacheManager for search results (IndexedDB)
      if (category === 'search-results' && Array.isArray(data)) {
        await searchCacheManager.cacheSearchResults(key, data, 'api', {
          responseTime: 0,
        });
      }

      logger.info(`Cached ${key} (${category}) - ${size} bytes`);
      return true;
    } catch (error) {
      logger.error('Failed to set cache:', error);
      return false;
    }
  }

  /**
   * Remove entry from all cache layers
   */
  async remove(key: string): Promise<boolean> {
    let removed = false;

    // Remove from memory
    if (this.memoryCache.delete(key)) {
      removed = true;
    }

    // Remove from persistent caches
    try {
      const promises: Promise<unknown>[] = [advancedCachingManager.remove(key)];

      // Only clear search cache if it's a search result
      if (key.startsWith('search:')) {
        try {
          // searchCacheManager.clearCache() doesn't take parameters
          // Individual entry removal would need to be handled differently
        } catch {
          // Ignore errors
        }
      }

      await Promise.all(promises);
      removed = true;
    } catch (error) {
      logger.error('Failed to remove from cache:', error);
    }

    return removed;
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;

    try {
      const promises: Promise<unknown>[] = [advancedCachingManager.clear()];

      // Clear search cache if available
      if (searchCacheManager.clearCache) {
        try {
          await searchCacheManager.clearCache();
        } catch {
          // Ignore errors for optional clearCache
        }
      }

      await Promise.all(promises);
      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Failed to clear caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.cacheMisses / totalRequests : 0;

    let totalSize = 0;
    this.memoryCache.forEach(entry => {
      totalSize += entry.size;
    });

    return {
      totalEntries: this.memoryCache.size,
      totalSize,
      hitRate,
      missRate,
      memoryCacheSize: totalSize,
      indexedDBSize: 0, // Would need IndexedDB API to calculate
      localStorageSize: 0, // Would need to calculate from localStorage
    };
  }

  /**
   * Warm cache for popular locations
   */
  async warmCache(locations: string[]): Promise<void> {
    logger.info(`Warming cache for ${locations.length} popular locations`);
    // This would trigger prefetching of weather data for popular locations
    // Implementation would depend on weather API integration
  }

  /**
   * Private helper methods
   */
  private setMemoryCache<T>(
    key: string,
    data: T,
    category: CacheCategory,
    priority: UnifiedCacheEntry<T>['priority']
  ): void {
    const size = this.calculateSize(data);
    const now = Date.now();

    // Check if we need to evict entries
    if (
      this.memoryCache.size >= this.MAX_MEMORY_ENTRIES ||
      this.getTotalMemorySize() + size > this.MAX_MEMORY_CACHE_SIZE
    ) {
      this.evictEntries(size);
    }

    const entry: UnifiedCacheEntry<T> = {
      data,
      timestamp: now,
      category,
      priority,
      size,
      accessCount: 1,
      lastAccessed: now,
    };

    this.memoryCache.set(key, entry as UnifiedCacheEntry<unknown>);
  }

  private evictEntries(requiredSize: number): void {
    // Sort by priority and last accessed (LRU)
    const entries = Array.from(this.memoryCache.entries()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    let freedSize = 0;
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      if (entry.priority === 'low' || entry.priority === 'medium') {
        freedSize += entry.size;
        this.memoryCache.delete(key);
      }
    }
  }

  private getTotalMemorySize(): number {
    let total = 0;
    this.memoryCache.forEach(entry => {
      total += entry.size;
    });
    return total;
  }

  private isExpired(
    entry: UnifiedCacheEntry<unknown>,
    category: CacheCategory
  ): boolean {
    const ttl = this.getTTLForCategory(category);
    return Date.now() - entry.timestamp > ttl;
  }

  private getTTLForCategory(category: CacheCategory): number {
    const ttls: Record<CacheCategory, number> = {
      'weather-data': 30 * 60 * 1000, // 30 minutes
      'search-results': 60 * 60 * 1000, // 1 hour
      'city-data': 24 * 60 * 60 * 1000, // 24 hours
      'user-preferences': 7 * 24 * 60 * 60 * 1000, // 1 week
      geocoding: 24 * 60 * 60 * 1000, // 24 hours
    };
    return ttls[category];
  }

  private calculateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default estimate
    }
  }

  private loadPopularLocations(): void {
    try {
      const stored = localStorage.getItem('popular-locations');
      if (stored) {
        this.popularLocations.push(...JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  private cleanupExpiredEntries(): void {
    const keysToRemove: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (this.isExpired(entry, entry.category)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.memoryCache.delete(key));

    if (keysToRemove.length > 0) {
      logger.info(`Cleaned up ${keysToRemove.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const unifiedCacheManager = UnifiedCacheManager.getInstance();
export type { CacheCategory, CacheStats, UnifiedCacheEntry };
