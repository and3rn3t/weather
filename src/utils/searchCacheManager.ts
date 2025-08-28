/**
 * Advanced Search Cache Manager with IndexedDB
 * Provides persistent offline storage for search results with intelligent caching
 */

/* eslint-disable no-console */

// Cache configuration
const CACHE_CONFIG = {
  DATABASE_NAME: 'WeatherAppSearchCache',
  // v3 adds a unique index for normalized query and dedupes existing records
  DATABASE_VERSION: 3,
  STORE_NAME: 'searchResults',
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours fallback
  // Optional per-source TTL overrides (ms)
  SOURCE_TTL: {
    api: 12 * 60 * 60 * 1000, // 12h
    autocorrect: 30 * 24 * 60 * 60 * 1000, // 30d (stable)
    prefetch: 7 * 24 * 60 * 60 * 1000, // 7d
  } as Record<'api' | 'autocorrect' | 'prefetch', number>,
  MAX_CACHE_SIZE: 1000,
  CLEANUP_THRESHOLD: 0.8,
  // When over threshold, trim to this fraction via LRU
  EVICT_TARGET_RATIO: 0.6,
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
  // v2 additions (optional for backward compatibility)
  lastAccessed?: number;
  accessCount?: number;
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
        CACHE_CONFIG.DATABASE_VERSION
      );

      request.onerror = () => {
        const err = request.error ?? new Error('IndexedDB open error');
        console.error('Failed to open cache database:', err);
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Search cache initialized');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion || 0;

        // Create store if missing (fresh install)
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(CACHE_CONFIG.STORE_NAME, {
            keyPath: 'id',
          });

          store.createIndex('query', 'query', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('source', 'source', { unique: false });
          // v2: indices for LRU and access metrics
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('accessCount', 'accessCount', { unique: false });
          return;
        }

        // v2 upgrade: add missing indices if upgrading from v1
        if (oldVersion < 2) {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) this.applyUpgradeV2(tx);
        }

        if (oldVersion < 3) {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) this.applyUpgradeV3(tx);
        }
      };
    });
  }

  // v2: add indices for lastAccessed/accessCount if missing
  private applyUpgradeV2(tx: IDBTransaction): void {
    try {
      const store = tx.objectStore(CACHE_CONFIG.STORE_NAME);
      if (!store.indexNames.contains('lastAccessed')) {
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }
      if (!store.indexNames.contains('accessCount')) {
        store.createIndex('accessCount', 'accessCount', { unique: false });
      }
    } catch {
      // ignore
    }
  }

  // v3: dedupe by query and create unique index
  private applyUpgradeV3(tx: IDBTransaction): void {
    try {
      const store = tx.objectStore(CACHE_CONFIG.STORE_NAME);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const records = (getAllReq.result || []) as CachedSearchResult[];
        const byQuery = new Map<string, CachedSearchResult>();
        for (const rec of records) {
          const key = rec.query;
          const existing = byQuery.get(key);
          if (!existing || rec.timestamp > existing.timestamp) {
            byQuery.set(key, rec);
          }
        }
        // Delete duplicates (older ones)
        for (const rec of records) {
          const keeper = byQuery.get(rec.query);
          if (keeper && keeper.id !== rec.id) {
            try {
              store.delete(rec.id);
            } catch {
              /* ignore */
            }
          }
        }

        // Create unique index if not present
        try {
          if (!store.indexNames.contains('query_unique')) {
            store.createIndex('query_unique', 'query', { unique: true });
          }
        } catch {
          // ignore (may still be duplicates)
        }
      };
      getAllReq.onerror = () => {
        try {
          if (!store.indexNames.contains('query_unique')) {
            store.createIndex('query_unique', 'query', { unique: true });
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      // ignore migration issues
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    results: unknown[],
    source: 'api' | 'autocorrect' | 'prefetch',
    metadata: { responseTime: number; accuracy?: number }
  ): Promise<void> {
    if (!this.db) {
      console.warn('Cache not initialized');
      return;
    }

    const normalizedQuery = this.normalizeQuery(query);
    const now = Date.now();
    const ttl = this.getTTLForSource(source);

    // We'll upsert by query (stable id from query) to avoid duplicates
    const stableId = this.generateDeterministicKey(normalizedQuery);

    return new Promise(resolve => {
      const db = this.db;
      if (!db) {
        resolve();
        return;
      }
      const transaction = db.transaction(
        [CACHE_CONFIG.STORE_NAME],
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      // First check for existing entry by query (prefer unique index when available)
      const idx = store.indexNames.contains('query_unique')
        ? store.index('query_unique')
        : store.index('query');
      const getReq = idx.get(normalizedQuery);
      getReq.onsuccess = () => {
        const existing = getReq.result as CachedSearchResult | undefined;
        const entry: CachedSearchResult = {
          id: existing?.id ?? stableId,
          query: normalizedQuery,
          results,
          timestamp: now,
          ttl,
          source,
          metadata: {
            ...metadata,
            queryNormalized: normalizedQuery,
          },
          lastAccessed: now,
          accessCount: existing?.accessCount ? existing.accessCount + 1 : 1,
        };

        const putReq = store.put(entry);
        putReq.onsuccess = () => {
          this.updateCacheSize();
          resolve();
        };
        putReq.onerror = () => {
          const err = putReq.error;
          console.error('Failed to cache results:', err ?? 'unknown');
          resolve(); // don't reject to avoid cascading failures
        };
      };
      getReq.onerror = () => {
        // Fallback: write anyway with stable id
        const entry: CachedSearchResult = {
          id: stableId,
          query: normalizedQuery,
          results,
          timestamp: now,
          ttl,
          source,
          metadata: { ...metadata, queryNormalized: normalizedQuery },
          lastAccessed: now,
          accessCount: 1,
        };
        const putReq = store.put(entry);
        putReq.onsuccess = () => {
          this.updateCacheSize();
          resolve();
        };
        putReq.onerror = () => resolve();
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
      const index = store.indexNames.contains('query_unique')
        ? store.index('query_unique')
        : store.index('query');

      const request = index.get(normalizedQuery);

      request.onsuccess = () => {
        const result = request.result as CachedSearchResult | undefined;

        if (result && this.isValidCache(result)) {
          this.metrics.cacheHits++;
          this.updateHitRate();
          // Update access metrics (best effort)
          this.touchEntry(result.id);
          resolve({
            ...result,
            lastAccessed: Date.now(),
            accessCount: (result.accessCount ?? 0) + 1,
          });
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
    query: string
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
          matrix[i - 1][j - 1] + cost
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
        'readwrite'
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
        'readwrite'
      );
      const store = transaction.objectStore(CACHE_CONFIG.STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result as CachedSearchResult[];
        const expiredEntries = allEntries.filter(
          entry => !this.isValidCache(entry)
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
      'readonly'
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
        this.cleanupExpiredEntries()
          .then(() => this.cleanupLRUExcess())
          .then(() => this.ensureWithinQuota())
          .catch(() => void 0);
      }
    };
  }

  private async removeCacheEntry(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(
      [CACHE_CONFIG.STORE_NAME],
      'readwrite'
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
    entries: CachedSearchResult[]
  ): Promise<number> {
    const deletions = entries.map(
      entry =>
        new Promise<void>(resolve => {
          const req = store.delete(entry.id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        })
    );

    return Promise.all(deletions).then(() => entries.length);
  }

  // Get per-source TTL or default
  private getTTLForSource(source: CachedSearchResult['source']): number {
    try {
      return CACHE_CONFIG.SOURCE_TTL[source] ?? CACHE_CONFIG.DEFAULT_TTL;
    } catch {
      return CACHE_CONFIG.DEFAULT_TTL;
    }
  }

  // Update access metadata for an entry (best effort)
  private touchEntry(id: string): void {
    if (!this.db) return;
    try {
      const tx = this.db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
      const store = tx.objectStore(CACHE_CONFIG.STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result as CachedSearchResult | undefined;
        if (!rec) return;
        rec.lastAccessed = Date.now();
        rec.accessCount = (rec.accessCount ?? 0) + 1;
        store.put(rec);
      };
    } catch {
      // ignore
    }
  }

  // Deterministic key from query to avoid duplicates across writes
  private generateDeterministicKey(query: string): string {
    return `q_${btoa(encodeURIComponent(query))}`;
  }

  // LRU cleanup when cache too large: delete oldest by lastAccessed
  private async cleanupLRUExcess(): Promise<void> {
    if (!this.db) return;
    const targetSize = Math.floor(
      CACHE_CONFIG.MAX_CACHE_SIZE * CACHE_CONFIG.EVICT_TARGET_RATIO
    );

    if (this.metrics.cacheSize <= targetSize) return;

    return new Promise(resolve => {
      const db = this.db;
      if (!db) return resolve();
      const tx = db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
      const store = tx.objectStore(CACHE_CONFIG.STORE_NAME);
      const idx = store.index('lastAccessed');
      const toDelete = this.metrics.cacheSize - targetSize;
      let deleted = 0;
      const cursorReq = idx.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && deleted < toDelete) {
          const key = (cursor.value as CachedSearchResult).id;
          store.delete(key);
          deleted++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => resolve();
    });
  }

  // Best-effort quota check and cleanup to prevent StorageError
  private async ensureWithinQuota(): Promise<void> {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) return;
    try {
      const nav = navigator as Navigator & { storage?: StorageManager };
      const estimate = await nav.storage?.estimate?.();
      const usage = estimate?.usage ?? 0;
      const quota = estimate?.quota ?? 0;
      if (quota > 0 && usage / quota > 0.9) {
        // Under pressure: aggressively evict by LRU
        await this.cleanupLRUExcess();
      }
    } catch {
      // ignore
    }
  }
}

// Export singleton instance
export const searchCacheManager = new SearchCacheManager();
export type { CachedSearchResult, CacheMetrics };
