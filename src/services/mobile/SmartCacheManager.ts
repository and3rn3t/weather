/**
 * Smart Cache Manager - Phase 5B
 * Advanced caching strategy with intelligent data lifecycle management
 */

import { logger } from '../../utils/logger';

interface CacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  expires: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
  averageAccessCount: number;
}

interface CacheConfig {
  maxSize: number; // Maximum cache size in MB
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default time-to-live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionEnabled: boolean;
}

export class SmartCacheManager {
  private readonly CACHE_PREFIX = 'smart-cache-';
  private readonly METADATA_KEY = 'cache-metadata';
  private readonly STATS_KEY = 'cache-stats';

  private readonly config: CacheConfig = {
    maxSize: 10, // 10MB default
    maxEntries: 500,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    compressionEnabled: true,
  };

  private hitCount = 0;
  private missCount = 0;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.startCleanupTimer();
    this.loadStats();
  }

  /**
   * Store data in cache with intelligent priority management
   */
  async set(
    key: string,
    data: unknown,
    options?: {
      ttl?: number;
      priority?: CacheEntry['priority'];
      compress?: boolean;
    },
  ): Promise<boolean> {
    try {
      const {
        ttl = this.config.defaultTTL,
        priority = 'medium',
        compress = this.config.compressionEnabled,
      } = options || {};

      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      // Check if we need to make space
      await this.ensureSpace(size);

      const entry: CacheEntry = {
        key,
        data: compress ? this.compress(serializedData) : serializedData,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        priority,
        size,
      };

      await this.storeEntry(key, entry);
      await this.updateMetadata();

      logger.debug(`📦 Cached entry: ${key} (${this.formatSize(size)})`);
      return true;
    } catch (error) {
      logger.error('Failed to cache entry:', error);
      return false;
    }
  }

  /**
   * Retrieve data from cache with access tracking
   */
  async get(key: string): Promise<unknown> {
    try {
      const entry = await this.getEntry(key);

      if (!entry) {
        this.missCount++;
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expires) {
        await this.delete(key);
        this.missCount++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await this.storeEntry(key, entry);

      this.hitCount++;

      const dataString =
        typeof entry.data === 'string' && this.isCompressed(entry.data)
          ? this.decompress(entry.data)
          : String(entry.data);

      logger.debug(
        `📦 Cache hit: ${key} (accessed ${entry.accessCount} times)`,
      );
      return JSON.parse(dataString);
    } catch (error) {
      logger.error('Failed to retrieve cache entry:', error);
      this.missCount++;
      return null;
    }
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      const storageKey = this.CACHE_PREFIX + key;
      localStorage.removeItem(storageKey);
      await this.updateMetadata();

      logger.debug(`🗑️ Deleted cache entry: ${key}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete cache entry:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      cacheKeys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(this.METADATA_KEY);

      this.hitCount = 0;
      this.missCount = 0;

      logger.info('🧹 Cleared all cache entries');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const entries = this.getAllEntries();
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const total = this.hitCount + this.missCount;

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      missRate: total > 0 ? (this.missCount / total) * 100 : 0,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp)),
      averageAccessCount:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
          : 0,
    };
  }

  /**
   * Manually trigger cache cleanup
   */
  async cleanup(): Promise<{ removed: number; freedSpace: number }> {
    const entriesBefore = this.getAllEntries();
    const sizeBefore = entriesBefore.reduce(
      (sum, entry) => sum + entry.size,
      0,
    );

    let removed = 0;
    const now = Date.now();

    // Remove expired entries
    for (const entry of entriesBefore) {
      if (now > entry.expires) {
        await this.delete(entry.key);
        removed++;
      }
    }

    // Check if we need more aggressive cleanup
    const entriesAfter = this.getAllEntries();
    const currentSize = entriesAfter.reduce(
      (sum, entry) => sum + entry.size,
      0,
    );
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;

    if (
      currentSize > maxSizeBytes ||
      entriesAfter.length > this.config.maxEntries
    ) {
      // Use LRU with priority weighting for cleanup
      const entriesToSort = [...entriesAfter];
      entriesToSort.sort((a, b) => {
        const priorityWeight =
          this.getPriorityWeight(a.priority) -
          this.getPriorityWeight(b.priority);
        if (priorityWeight !== 0) return priorityWeight;

        return a.lastAccessed - b.lastAccessed; // LRU
      });
      const sortedEntries = entriesToSort;

      // Remove entries until we're under limits
      while (
        (entriesAfter.length > this.config.maxEntries ||
          currentSize > maxSizeBytes) &&
        sortedEntries.length > 0
      ) {
        const entryToRemove = sortedEntries.shift();
        if (!entryToRemove) break;

        await this.delete(entryToRemove.key);
        removed++;

        const index = entriesAfter.indexOf(entryToRemove);
        if (index > -1) entriesAfter.splice(index, 1);
      }
    }

    const freedSpace =
      sizeBefore - entriesAfter.reduce((sum, entry) => sum + entry.size, 0);

    logger.info(
      `🧹 Cache cleanup complete: ${removed} entries removed, ${this.formatSize(
        freedSpace,
      )} freed`,
    );

    return { removed, freedSpace };
  }

  /**
   * Private helper methods
   */
  private async storeEntry(key: string, entry: CacheEntry): Promise<void> {
    const storageKey = this.CACHE_PREFIX + key;
    localStorage.setItem(storageKey, JSON.stringify(entry));
  }

  private async getEntry(key: string): Promise<CacheEntry | null> {
    try {
      const storageKey = this.CACHE_PREFIX + key;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getAllEntries(): CacheEntry[] {
    const entries: CacheEntry[] = [];
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            entries.push(JSON.parse(data));
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    return entries;
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    const currentEntries = this.getAllEntries();
    const currentSize = currentEntries.reduce(
      (sum, entry) => sum + entry.size,
      0,
    );

    if (
      currentSize + requiredSize > maxSizeBytes ||
      currentEntries.length >= this.config.maxEntries
    ) {
      await this.cleanup();
    }
  }

  private async updateMetadata(): Promise<void> {
    const metadata = {
      lastUpdated: Date.now(),
      config: this.config,
      stats: { hitCount: this.hitCount, missCount: this.missCount },
    };

    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
  }

  private loadStats(): void {
    try {
      const data = localStorage.getItem(this.STATS_KEY);
      if (data) {
        const stats = JSON.parse(data);
        this.hitCount = stats.hitCount || 0;
        this.missCount = stats.missCount || 0;
      }
    } catch {
      // Start with fresh stats
    }
  }

  private compress(data: string): string {
    // Simple compression placeholder - in real implementation use a compression library
    return `COMPRESSED:${btoa(data)}`;
  }

  private decompress(data: string): string {
    if (this.isCompressed(data)) {
      return atob(data.replace('COMPRESSED:', ''));
    }
    return data;
  }

  private isCompressed(data: string): boolean {
    return data.startsWith('COMPRESSED:');
  }

  private getPriorityWeight(priority: CacheEntry['priority']): number {
    const weights = { critical: 100, high: 75, medium: 50, low: 25 };
    return weights[priority];
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('Scheduled cleanup failed:', error);
      });
    }, this.config.cleanupInterval);
  }

  /**
   * Destroy the cache manager and cleanup timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Save final stats
    const stats = { hitCount: this.hitCount, missCount: this.missCount };
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }
}

// Export singleton instance
export const smartCacheManager = new SmartCacheManager();
