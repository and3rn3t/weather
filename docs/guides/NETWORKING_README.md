# Networking usage: shared utilities vs. hooks

This guide explains when to call the shared networking utilities directly and when to use the hooks,
plus a few dos and don’ts to keep requests fast, compliant, and consistent.

See also: `docs/technical/PRODUCTION_NETWORKING_STRATEGY.md`

## TL;DR

- Prefer calling the shared utilities in most places:
  - `optimizedFetch(url, options, cacheKey?)`
  - `optimizedFetchJson<T>(url, options, cacheKey?, ttlMs?)`
- Use hooks only when you need React-lifecycle coupling or mobile UX hints:
  - `useWeatherAPIOptimization()` → returns optimizedFetch delegate
  - `useMobileOptimizedAPI()` → wraps the shared utility with mobile timeouts/hints
- Do not set User-Agent yourself; the shared layer enforces Nominatim policy.

## When to use each

1. Components, utilities, services (most code)

- Use `optimizedFetch` / `optimizedFetchJson`
- Benefits: request coalescing, Response.clone, retries/backoff, Retry-After, Nominatim compliance,
  short-lived JSON cache for Open‑Meteo bursts (prod only)

Example

```ts
import { optimizedFetchJson } from '@/utils/optimizedFetch';

const data = await optimizedFetchJson<WeatherResponse>(
  `https://api.open-meteo.com/v1/forecast?...`,
  {},
  `weather:${lat},${lon}`
);
```

2. React flows that need hook semantics

- `useWeatherAPIOptimization()`
- What it does: returns a function that simply delegates to the shared optimizedFetch. Keeps call
  sites ergonomic inside React while centralizing policy logic.

Example

```ts
const { optimizedFetch } = useWeatherAPIOptimization();
const res = await optimizedFetch(url, { method: 'GET' }, `key:${id}`);
```

3. Mobile UX that needs adaptive timeouts/hints

- `useMobileOptimizedAPI()`
- What it does: adds AbortController timeouts based on connection quality, harmless hints
  (Accept-Encoding, optional X-Requested-With), and still calls the shared optimizedFetch
  underneath.

Example

```ts
const { optimizedFetch } = useMobileOptimizedAPI();
const res = await optimizedFetch(url, { method: 'GET' });
const json = await res.json();
```

## Dos and don’ts

- Do: pass a stable `cacheKey` that includes important params (e.g., city, lat/lon, page) for
  coalescing and caching.
- Do: pass `AbortController` signals when you need to cancel user-initiated searches.
- Do: check and handle non-OK HTTP statuses; `optimizedFetch` returns a Response clone.
- Don’t: set `User-Agent`, `Cache-Control`, or other headers that may trigger preflight. The shared
  utility sanitizes headers and adds UA only for Nominatim.
- Don’t: duplicate retry/backoff logic. Use the shared utilities or the networkResilienceManager for
  queue/circuit-breaking scenarios.

## Reverse geocoding and caching

- Use `reverseGeocodeCached(lat, lon)` for city name from coordinates.
- It rounds coordinates for privacy, uses TTL (memory + localStorage), and coalesces in-flight
  requests.

## Background and resilience

- `backgroundSyncManager` uses `optimizedFetchJson` for weather/search and `reverseGeocodeCached`
  for reverse lookup.
- `networkResilienceManager` handles queueing/circuit breaking internally; it sanitizes headers and
  sets Nominatim UA when needed.

## Troubleshooting

- Getting 429 from Nominatim? Ensure all calls route through `optimizedFetch/optimizedFetchJson` or
  the hook delegates, and avoid rapid-fire typing without debounce.
- Seeing “Response body already used”? Always consume the body from the clone the utilities return;
  don’t reuse the same Response instance in multiple places.
- Timeouts on slow connections? `useMobileOptimizedAPI()` gives adaptive timeouts and good error
  messages without violating policy.
