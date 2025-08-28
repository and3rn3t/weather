/**
 * IndexedDB Preseed Utility
 * Fetches geocoding results for a small set of popular cities and seeds the search cache.
 */

import { logInfo, logWarn } from './logger';
import { popularCitiesCache } from './popularCitiesCache';
import { searchCacheManager } from './searchCacheManager';

// Configuration
const PRESEED_CONFIG = {
  TOP_N: 8,
  CONCURRENCY: 3,
  TIMEOUT_MS: 6500,
  USER_AGENT: 'WeatherApp/1.0',
} as const;

/**
 * Fetch with timeout helper using AbortController
 */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(input, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Run an array of async tasks with limited concurrency
 */
async function runWithConcurrency<T>(
  limit: number,
  items: T[],
  task: (item: T) => Promise<void>
) {
  const queue = [...items];
  const workers: Promise<void>[] = [];
  const next = async () => {
    const item = queue.shift();
    if (typeof item === 'undefined') return;
    try {
      await task(item);
    } catch {
      // swallow individual item errors
    } finally {
      if (queue.length > 0) {
        await next();
      }
    }
  };
  for (let i = 0; i < Math.min(limit, items.length); i++) {
    workers.push(next());
  }
  await Promise.all(workers);
}

/**
 * Derive a list of city query strings to pre-seed
 */
function getDefaultCityQueries(topN = PRESEED_CONFIG.TOP_N): string[] {
  try {
    return popularCitiesCache
      .getInstantSuggestions(topN)
      .map(c => `${c.name}, ${c.country}`);
  } catch {
    return [];
  }
}

/**
 * Pre-seed the IndexedDB search cache with geocoding results for the given queries.
 * Uses source 'prefetch' to honor longer TTLs.
 */
export async function preseedSearchCache(queries?: string[]): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return; // only pre-seed when online

  // Run at most once per session
  try {
    if (sessionStorage.getItem('preseed:done') === '1') return;
    sessionStorage.setItem('preseed:done', '1');
  } catch {
    // ignore storage errors
  }

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1';

  // Avoid noisy background fetches in local dev
  if (isLocalhost) return;

  const list =
    queries && queries.length > 0 ? queries : getDefaultCityQueries();
  if (list.length === 0) return;

  try {
    // Ensure cache is ready
    await searchCacheManager.initialize();

    const task = async (q: string) => {
      // Build Nominatim URL
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const started = performance.now();
      try {
        const resp = await fetchWithTimeout(
          url,
          {
            method: 'GET',
            headers: {
              'User-Agent': PRESEED_CONFIG.USER_AGENT,
            },
          },
          PRESEED_CONFIG.TIMEOUT_MS
        );

        if (!resp.ok) return;
        const data = await resp.json();
        const responseTime = performance.now() - started;
        // Store with 'prefetch' source to use its TTL
        await searchCacheManager.cacheSearchResults(q, data, 'prefetch', {
          responseTime,
          accuracy: 0.7,
        });
      } catch {
        // ignore individual failures
      }
    };

    await runWithConcurrency(PRESEED_CONFIG.CONCURRENCY, list, task);
    logInfo(`📦 IndexedDB pre-seed complete for ${list.length} queries`);
  } catch (e) {
    logWarn('IndexedDB pre-seed skipped/failed:', e as unknown as Error);
  }
}
