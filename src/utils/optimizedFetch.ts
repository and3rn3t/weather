/**
 * optimizedFetch - shared, non-hook utility
 * - Coalesces in-flight requests per cacheKey
 * - Always returns a cloned Response so multiple consumers can read body
 * - Timeouts, retries/backoff (prod), Retry-After support
 * - Nominatim compliance: required User-Agent + courtesy host throttle
 * - Header sanitization to avoid unnecessary preflight
 * - Optional short-lived JSON cache for Open-Meteo bursts
 */

const requestCache = new Map<string, Promise<Response>>();
const lastRequestTime = new Map<string, number>();
const lastHostRequestTime = new Map<string, number>();

// Short-lived JSON cache, useful for Open-Meteo bursts in production
const jsonCache = new Map<string, { ts: number; data: unknown }>();

const now = () => Date.now();

function isProdEnv(): boolean {
  try {
    // Vite injects import.meta.env.PROD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((import.meta as any)?.env?.PROD);
  } catch {
    return false;
  }
}

function getHost(input: string): string {
  try {
    return new URL(input).hostname;
  } catch {
    return '';
  }
}

function computeMaxRetries(
  isOpenMeteo: boolean,
  isNominatim: boolean,
  isProd: boolean
): number {
  if (isOpenMeteo) return isProd ? 2 : 0;
  if (isNominatim) return 0;
  return isProd ? 1 : 0;
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

export async function optimizedFetch(
  url: string,
  options: RequestInit = {},
  cacheKey: string = url
): Promise<Response> {
  const t = now();
  const last = lastRequestTime.get(cacheKey);
  if (last && t - last < 1000) {
    const existing = requestCache.get(cacheKey);
    if (existing) return existing.then(r => r.clone());
  }

  const host = getHost(url);
  const isNominatim = /nominatim\.openstreetmap\.org$/i.test(host);
  const isOpenMeteo = /api\.open-meteo\.com$/i.test(host);
  const isProd = isProdEnv();

  // Courtesy throttle for Nominatim
  if (isNominatim) {
    const lastHost = lastHostRequestTime.get(host) ?? 0;
    const gap = 1200 - (now() - lastHost);
    if (gap > 0) await new Promise(res => setTimeout(res, gap));
  }

  // Sanitize headers
  const sanitizedHeaders: HeadersInit | undefined = (() => {
    if (!options.headers) return undefined;
    const h = new Headers(options.headers as HeadersInit);
    h.delete('Cache-Control');
    h.delete('cache-control');
    if (!isNominatim) {
      h.delete('User-Agent');
      h.delete('user-agent');
    }
    return h;
  })();

  // Add required User-Agent for Nominatim
  let finalHeaders: HeadersInit | undefined = sanitizedHeaders;
  if (isNominatim) {
    const h = new Headers(finalHeaders);
    if (!h.has('User-Agent') && !h.has('user-agent')) {
      h.set('User-Agent', 'PremiumWeatherApp/1.0 (optimized-fetch@weather)');
    }
    finalHeaders = h;
  }

  // Retry/backoff policy (production-focused)
  const maxRetries = computeMaxRetries(isOpenMeteo, isNominatim, isProd);
  const baseDelay = 300;
  // Increased timeout for slower connections, especially for Nominatim which can be slow
  // Nominatim can be very slow, so we give it more time
  const timeoutMs = isNominatim ? 20000 : 10000;

  function shouldRetryStatus(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  function computeRetryWaitMs(
    attempt: number,
    retryAfterHeader: string | null
  ): number {
    if (retryAfterHeader) {
      const parsed = Number(retryAfterHeader);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed * 1000 + Math.floor(Math.random() * 100);
      }
    }
    return baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
  }

  const doFetchWithRetry = async (): Promise<Response> => {
    const totalAttempts = maxRetries + 1;
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const req = fetch(url, {
          ...options,
          headers: finalHeaders,
          cache: options.cache ?? 'default',
          signal: controller.signal,
        });
        const res = await req;
        clearTimeout(timer);
        if (host) lastHostRequestTime.set(host, now());

        if (shouldRetryStatus(res.status) && attempt < maxRetries) {
          const waitMs = computeRetryWaitMs(
            attempt,
            res.headers.get('Retry-After')
          );
          await delay(waitMs);
          continue;
        }
        return res;
      } catch (err) {
        clearTimeout(timer);

        // Handle AbortError (timeout) gracefully
        if (err instanceof Error && err.name === 'AbortError') {
          if (attempt < maxRetries) {
            const waitMs = computeRetryWaitMs(attempt, null);
            await delay(waitMs);
            continue;
          }
          // Convert AbortError to a more user-friendly error
          throw new Error(`Request timeout after ${timeoutMs}ms. Please check your connection and try again.`);
        }

        // Handle network errors (connection refused, timeout, etc.)
        if (err instanceof TypeError && (err.message.includes('Failed to fetch') || err.message.includes('network') || err.message.includes('ERR_CONNECTION'))) {
          if (attempt < maxRetries) {
            const waitMs = computeRetryWaitMs(attempt, null);
            await delay(waitMs);
            continue;
          }
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        }

        if (attempt < maxRetries) {
          const waitMs = computeRetryWaitMs(attempt, null);
          await delay(waitMs);
          continue;
        }
        throw err;
      }
    }
    // Should not reach here
    throw new Error('Exhausted retry attempts');
  };

  const promise = doFetchWithRetry();
  requestCache.set(cacheKey, promise);
  lastRequestTime.set(cacheKey, t);

  // Clean up cache after request completes (success or failure)
  promise
    .then(() => {
      setTimeout(() => requestCache.delete(cacheKey), 5000);
    })
    .catch(() => {
      // Error will be handled by caller, just clean up cache
      setTimeout(() => requestCache.delete(cacheKey), 5000);
    });

  return promise.then(res => res.clone());
}

/**
 * optimizedFetchJson - parsed JSON with optional short-lived cache
 * - If ttlMs > 0 (or host is Open-Meteo and prod), cache JSON by cacheKey
 */
export async function optimizedFetchJson<T = unknown>(
  url: string,
  options: RequestInit = {},
  cacheKey: string = url,
  ttlMs?: number
): Promise<T> {
  const host = getHost(url);
  const isOpenMeteo = /api\.open-meteo\.com$/i.test(host);
  const isProd = isProdEnv();
  let effectiveTtl = 0;
  if (typeof ttlMs === 'number') {
    effectiveTtl = ttlMs;
  } else if (isOpenMeteo && isProd) {
    effectiveTtl = 20000; // 20s burst cache
  }

  if (effectiveTtl > 0) {
    const cached = jsonCache.get(cacheKey);
    if (cached && now() - cached.ts < effectiveTtl) {
      return cached.data as T;
    }
  }

  try {
    const res = await optimizedFetch(url, options, cacheKey);
    const data = (await res.json()) as T;
    if (effectiveTtl > 0) jsonCache.set(cacheKey, { ts: now(), data });
    return data;
  } catch (err) {
    // Re-throw with context, but ensure it's a proper Error
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to fetch JSON from ${url}`);
  }
}

export function clearAPICache() {
  requestCache.clear();
  lastRequestTime.clear();
  // Keep host timestamps as soft memory of throttling
  jsonCache.clear();
}

export default {
  optimizedFetch,
  optimizedFetchJson,
  clearAPICache,
};
