/**
 * Advanced Search Cache Manager with IndexedDB
 * Provides persistent offline storage for search results with intelligent caching
 */

/* eslint-disable no-console */

// Cache configuration
const CACHE_CONFIG = {
  DATABASE_NAME: 'WeatherAppSearchCache',
  DATABASE_VERSION: 1,
  STORE_NAME: 'searchResults',
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_SIZE: 1000,
  CLEANUP_THRESHOLD: 0.8,
} as const;

// Types
interface CachedSearchResult {
  id: string;
  query: string;
  results: unknown[];
  timestamp: number;
  ttl: number;
  source: 'api' | 'autocorrect' | 'prefetch';
  metadata: {
    responseTime: number;
    accuracy?: number;
    queryNormalized?: string;
  };
}

interface CacheMetrics {
  hitRate: number;
  cacheSize: number;
  lastCleanup: number;
  totalRequests: number;
  cacheHits: number;
}

/**
 * Advanced Search Cache Manager
 */
class SearchCacheManager {
  private db: IDBDatabase | null = null;
  private metrics: CacheMetrics = {
    hitRate: 0,
    cacheSize: 0,
    lastCleanup: Date.now(),
    totalRequests: 0,
    cacheHits: 0,
  };

  /**
   * Initialize the cache manager
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        CACHE_CONFIG.DATABASE_NAME,
        CACHE_CONFIG.DATABASE_VERSION,
      );

      request.onerror = () => {
        console.error('Failed to open cache database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Search cache initialized');
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(CACHE_CONFIG.STORE_NAME, {
            keyPath: 'id',
          });

          store.createIndex('query', 'query', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('source', 'source', { unique: false });
        }
      };
    });
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    results: unknown[],
    source: 'api' | 'autocorrect' | 'prefetch',
    metadata: { responseTime: number; accuracy?: number },
  ): Promise<void> {
    if (!this.db) {
      console.warn('Cache not initialized');
      return;
    }

    const normalizedQuery = this.normalizeQuery(query);
    const cacheEntry: CachedSearchResult = {
      id: this.generateCacheKey(normalizedQuery),
      query: normalizedQuery,
      results,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.DEFAULT_TTL,
      source,
      metadata: {
        ...metadata,
        queryNormalized: normalizedQuery,
      },
    };

    return new Promise((resolve, reject) => {
      const db = this.db;
      if (!db) {
        resolve();
        return;
      }
      const transaction = db.transaction(
        [CACHE_CONFIG.STORE_NAME],
        'readwrite',
      );
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        this.updateCacheSize();
        resolve();
      };

      request.onerror = () => {
        const err = request.error;
        const message = err
          ? `${err.name}: ${err.message}`
          : 'Unknown IndexedDB error';
        console.error('Failed to cache results:', err ?? 'unknown');
        reject(new Error(message));
      };
    });
  }

  /**
   * Get cached search results
   */
  async getCachedResults(query: string): Promise<CachedSearchResult | null> {
    if (!this.db) return null;

    this.metrics.totalRequests++;
    const normalizedQuery = this.normalizeQuery(query);

    return new Promise(resolve => {
      const db = this.db;
      if (!db) {
        resolve(null);
        return;
      }
      const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
      const index = store.index('query');

      const request = index.get(normalizedQuery);

      request.onsuccess = () => {
        const result = request.result as CachedSearchResult | undefined;

        if (result && this.isValidCache(result)) {
          this.metrics.cacheHits++;
          this.updateHitRate();
          resolve(result);
        } else if (result) {
          // Expired cache, remove it
          this.removeCacheEntry(result.id);
          resolve(null);
        } else {
          // Try fuzzy search for typos
          this.findFuzzyMatch(normalizedQuery).then(resolve);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached results:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Find fuzzy matches for typos
   */
  private async findFuzzyMatch(
    query: string,
  ): Promise<CachedSearchResult | null> {
    if (!this.db) return null;

    return new Promise(resolve => {
      const db = this.db;
      if (!db) {
        resolve(null);
        return;
      }
      const transaction = db.transaction([CACHE_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result as CachedSearchResult[];
        let bestMatch: CachedSearchResult | null = null;
        let bestScore = 0;

        for (const entry of allEntries) {
          if (!this.isValidCache(entry)) continue;

          const similarity = this.calculateSimilarity(query, entry.query);
          if (similarity > 0.8 && similarity > bestScore) {
            bestMatch = entry;
            bestScore = similarity;
          }
        }

        if (bestMatch) {
          this.metrics.cacheHits++;
          this.updateHitRate();
        }

        resolve(bestMatch);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const db = this.db;
      if (!db) {
        resolve();
        return;
      }
      const transaction = db.transaction(
        [CACHE_CONFIG.STORE_NAME],
        'readwrite',
      );
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      const request = store.clear();

      request.onsuccess = () => {
        this.resetMetrics();
        console.log('🧹 Search cache cleared');
        resolve();
      };

      request.onerror = () => {
        const err = request.error;
        const message = err
          ? `${err.name}: ${err.message}`
          : 'Unknown IndexedDB error';
        console.error('Failed to clear cache:', err ?? 'unknown');
        reject(new Error(message));
      };
    });
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpiredEntries(): Promise<void> {
    if (!this.db) return;

    const currentTime = Date.now();

    return new Promise((resolve, reject) => {
      const db = this.db;
      if (!db) {
        resolve();
        return;
      }
      const transaction = db.transaction(
        [CACHE_CONFIG.STORE_NAME],
        'readwrite',
      );
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result as CachedSearchResult[];
        const expiredEntries = allEntries.filter(
          entry => !this.isValidCache(entry),
        );

        this.deleteExpiredEntries(store, expiredEntries).then(count => {
          this.metrics.lastCleanup = currentTime;
          this.updateCacheSize();
          console.log(`🧹 Cleaned up ${count} expired entries`);
          resolve();
        });
      };

      request.onerror = () => {
        const err = request.error;
        const message = err
          ? `${err.name}: ${err.message}`
          : 'Unknown IndexedDB error';
        console.error('Failed to cleanup cache:', err ?? 'unknown');
        reject(new Error(message));
      };
    });
  }

  // Helper methods
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private generateCacheKey(query: string): string {
    return `cache_${btoa(encodeURIComponent(query))}_${Date.now()}`;
  }

  private isValidCache(entry: CachedSearchResult): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async updateCacheSize(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(
      [CACHE_CONFIG.STORE_NAME],
      'readonly',
    );
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

    const request = store.count();
    request.onsuccess = () => {
      this.metrics.cacheSize = request.result;

      // Auto-cleanup if threshold exceeded
      if (
        this.metrics.cacheSize >
        CACHE_CONFIG.MAX_CACHE_SIZE * CACHE_CONFIG.CLEANUP_THRESHOLD
      ) {
        this.cleanupExpiredEntries();
      }
    };
  }

  private async removeCacheEntry(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(
      [CACHE_CONFIG.STORE_NAME],
      'readwrite',
    );
    const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
    store.delete(id);
  }

  private updateHitRate(): void {
    this.metrics.hitRate =
      this.metrics.totalRequests > 0
        ? this.metrics.cacheHits / this.metrics.totalRequests
        : 0;
  }

  private resetMetrics(): void {
    this.metrics = {
      hitRate: 0,
      cacheSize: 0,
      lastCleanup: Date.now(),
      totalRequests: 0,
      cacheHits: 0,
    };
  }

  /**
   * Delete expired entries from the given object store
   */
  private deleteExpiredEntries(
    store: IDBObjectStore,
    entries: CachedSearchResult[],
  ): Promise<number> {
    const deletions = entries.map(
      entry =>
        new Promise<void>(resolve => {
          const req = store.delete(entry.id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        }),
    );

    return Promise.all(deletions).then(() => entries.length);
  }
}

// Export singleton instance
export const searchCacheManager = new SearchCacheManager();
export type { CachedSearchResult, CacheMetrics };
