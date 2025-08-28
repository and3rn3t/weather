# Production Networking Strategy

This app uses a centralized, policy-compliant networking layer to ensure stable performance in
production with Open‑Meteo and OpenStreetMap Nominatim.

See also: [Networking usage guide](../guides/NETWORKING_README.md) for when to use hooks vs. shared
utilities, caching, and compliance dos/don'ts.

## Tenets

- One path for HTTP: optimizedFetch/optimizedFetchJson with request coalescing and Response.clone
- Timeouts + retries with backoff, Retry‑After honor
- Nominatim compliance: required User‑Agent header, minimum 1200ms courtesy throttle per key, no
  extra headers causing preflight
- Optional short‑lived JSON cache for Open‑Meteo bursts (fast UI stacks) in production
- Reverse geocoding cache (memory + localStorage TTL) with lat/lon rounding and in‑flight coalescing

## APIs

- Open‑Meteo: no API key, current/hourly/daily; imperial units configured by query
- Nominatim: no API key; provide q, format=json, limit=1; must set User‑Agent header

## Client behavior

- All geocoding/weather calls through optimizedFetchJson
- AbortController passed through for user‑driven cancellations
- Strict header sanitization to avoid preflight; only User‑Agent for Nominatim
- Background refresh suppressed in development; enabled conservatively in production

## Failure handling

- 408/429/5xx: exponential backoff with jitter, honor Retry‑After when present
- Circuit breaking handled by networkResilienceManager for bursty failures (kept internal to avoid
  double policy stacking)
- User‑visible errors are friendly, with quiet console by default

## Caching

- Reverse geocoding cache with TTL (localStorage + memory) and in‑flight request coalescing
- Popular cities prefetch uses indexedDbPreseed, backed by optimized fetch
- Optional Open‑Meteo short‑term JSON cache during UI burst loads (guarded for prod only)

## Dev/Prod differences

- Dev: service worker disabled; background refresh suppressed; extra logs gated
- Prod: background sync enabled judiciously; burst caching on; full retry/backoff

## Security and privacy

- No tokens or API keys required
- No PII stored; city names only, and cached coordinates rounded for privacy

## Operational notes

- Respect Nominatim rate limits; throttle per search key
- Prefer stable keys for cache; include important query params in cache key
- Keep centralized utility the only place setting networking headers

## Lessons learned (Aug 2025)

- Centralize networking policy: moving all calls to a single utility eliminated inconsistent
  headers, double retries, and response stream reuse errors.
- Clone responses early: always consume clones when sharing results across callers to avoid "body
  used already" errors.
- Respect Nominatim: enforce a compliant User-Agent only for Nominatim and avoid extra custom
  headers that can trigger preflight and throttling.
- Coalesce and cache: short-lived JSON caching for Open‑Meteo burst loads and in‑flight coalescing
  reduced UI jitter and request volume significantly.
- Mobile timeouts belong in hooks: adaptive AbortController timeouts live in
  `useMobileOptimizedAPI`, while policy logic stays in the shared utility.
