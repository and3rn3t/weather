/**
 * Reverse Geocoding Cache Utility
 * - In-memory + localStorage cache with TTL
 * - In-flight request coalescing
 * - Coordinate rounding for better hit rate
 */

import { logError, logInfo } from './logger';
import { optimizedFetchJson } from './optimizedFetch';

export type ReverseGeoResult = { city?: string; country?: string };

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CACHE_PREFIX = 'reverse-geo-cache:';

const memoryCache = new Map<string, { value: ReverseGeoResult; ts: number }>();
const inflight = new Map<string, Promise<ReverseGeoResult>>();

const roundCoord = (n: number, decimals = 3) =>
  Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);

const makeKey = (lat: number, lon: number, decimals = 3) =>
  `${CACHE_PREFIX}${roundCoord(lat, decimals)}_${roundCoord(lon, decimals)}`;

function getFromLocalStorage(key: string, ttlMs: number) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: ReverseGeoResult; ts: number };
    if (parsed && Date.now() - parsed.ts < ttlMs) return parsed;
  } catch {
    // ignore storage errors
  }
  return null;
}

function setToLocalStorage(key: string, value: ReverseGeoResult) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

export async function reverseGeocodeCached(
  latitude: number,
  longitude: number,
  opts?: { ttlMs?: number; roundDecimals?: number }
): Promise<ReverseGeoResult> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const decimals = opts?.roundDecimals ?? 3;
  const key = makeKey(latitude, longitude, decimals);

  // Memory cache first
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.ts < ttlMs) return mem.value;

  // LocalStorage cache
  const ls = getFromLocalStorage(key, ttlMs);
  if (ls) {
    memoryCache.set(key, ls);
    return ls.value;
  }

  // Coalesce concurrent requests
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      logInfo(
        `🔍 Reverse geocoding for coordinates: ${latitude}, ${longitude}`
      );
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;
      const data = await optimizedFetchJson<{
        address?: Record<string, string>;
      }>(url, {}, `reverse:${key}`);
      const address = data?.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.county ||
        address.state ||
        'Unknown Location';
      const country = address.country || '';
      const result: ReverseGeoResult = { city, country };
      memoryCache.set(key, { value: result, ts: Date.now() });
      setToLocalStorage(key, result);
      return result;
    } catch (error) {
      logError('❌ Reverse geocoding error:', error);
      return {} as ReverseGeoResult;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
