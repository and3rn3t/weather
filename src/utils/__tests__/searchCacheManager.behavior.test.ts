import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCacheManager } from '../../utils/searchCacheManager';

async function countRecords(): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('WeatherAppSearchCache');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(['searchResults'], 'readonly');
      const store = tx.objectStore('searchResults');
      const countReq = store.count();
      countReq.onsuccess = () => {
        resolve(countReq.result);
        db.close();
      };
      countReq.onerror = () => {
        reject(countReq.error);
        db.close();
      };
    };
  });
}

describe('SearchCacheManager behavior', () => {
  beforeEach(async () => {
    vi.useRealTimers();
    await searchCacheManager.initialize();
    await searchCacheManager.clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('upserts deterministically for the same query (no duplicates)', async () => {
    await searchCacheManager.cacheSearchResults(
      'Paris, FR',
      [{ name: 'Paris' }],
      'prefetch',
      { responseTime: 10 }
    );
    await searchCacheManager.cacheSearchResults(
      'Paris, FR',
      [{ name: 'Paris' }, { name: 'Île-de-France' }],
      'prefetch',
      { responseTime: 12 }
    );

    const cnt = await countRecords();
    expect(cnt).toBe(1);

    const hit = await searchCacheManager.getCachedResults('Paris, FR');
    expect(hit).not.toBeNull();
    expect(hit?.results).toHaveLength(2);
  });

  it('expires entries based on TTL (api = 12h) and removes them', async () => {
    try {
      const t0 = new Date('2025-01-01T00:00:00Z').getTime();
      const spy = vi.spyOn(Date, 'now').mockReturnValue(t0);

      await searchCacheManager.cacheSearchResults(
        'Berlin, DE',
        [{ name: 'Berlin' }],
        'api',
        { responseTime: 8 }
      );

      let hit = await searchCacheManager.getCachedResults('Berlin, DE');
      expect(hit).not.toBeNull();

      // Move time forward beyond 12h TTL
      spy.mockReturnValue(t0 + 13 * 60 * 60 * 1000);

      hit = await searchCacheManager.getCachedResults('Berlin, DE');
      expect(hit).toBeNull();

      // Ensure it was removed during lookup
      const cnt = await countRecords();
      expect(cnt).toBe(0);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
