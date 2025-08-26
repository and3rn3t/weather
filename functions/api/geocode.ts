// Geocode API with D1-backed cache and Nominatim fallback
// GET /api/geocode?q=city
// Headers: X-Device-Id optional (for logging later)

// Minimal local types (avoid importing global Workers types here)
type D1Stmt = {
  bind: (...args: unknown[]) => D1Stmt;
  run: () => Promise<{ meta?: { changes?: number } }>;
  first: () => Promise<unknown>;
};
type D1DatabaseLike = { prepare: (sql: string) => D1Stmt };
type KVGetType = 'text' | 'json' | 'arrayBuffer' | 'stream' | undefined;
type KVNamespaceLike = {
  get: (key: string, type?: KVGetType) => Promise<unknown>;
};
type Env = {
  DB: D1DatabaseLike;
  CONFIG?: KVNamespaceLike;
  ENVIRONMENT?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  if (!q) return json({ error: 'Missing q' }, 400);

  const normalized = normalizeQuery(q);
  try {
    // TTL from KV config (default 30 days)
    let ttlMs = 1000 * 60 * 60 * 24 * 30;
    try {
      const flags = (
        env.CONFIG ? await env.CONFIG.get('flags', 'json') : null
      ) as { geocode_cache_ttl_ms?: number } | null;
      if (flags && typeof flags.geocode_cache_ttl_ms === 'number')
        ttlMs = flags.geocode_cache_ttl_ms;
    } catch {
      /* ignore KV errors; default TTL */
    }
    const now = Date.now();

    // 1) Try cache
    type CacheRow = {
      lat: number;
      lon: number;
      normalized: string;
      hits: number;
      updated_at: number;
    };
    const cached = (await env.DB.prepare(
      'SELECT lat, lon, normalized, hits, updated_at FROM geocoding_cache WHERE query = ?'
    )
      .bind(normalized)
      .first()) as CacheRow | null;

    if (
      cached &&
      typeof cached.updated_at === 'number' &&
      now - cached.updated_at <= ttlMs
    ) {
      // update hit count asynchronously; don't await to keep latency low
      env.DB.prepare(
        'UPDATE geocoding_cache SET hits = hits + 1, updated_at = ? WHERE query = ?'
      )
        .bind(Date.now(), normalized)
        .run()
        .catch(err => {
          // Log error but do not block response
          console.error('Failed to update geocoding_cache hit count:', err);
        });
      return json({ lat: cached.lat, lon: cached.lon, source: 'cache' });
    }

    // 2) Fallback to Nominatim (no API key, must include User-Agent)
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', q);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('limit', '1');

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'weather-app (https://weather.andernet.dev)',
      },
    });
    if (!res.ok) return json({ error: 'Geocoding failed' }, 502);
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0)
      return json({ error: 'No results' }, 404);

    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);

    // 3) Write to cache
    await env.DB.prepare(
      'INSERT OR REPLACE INTO geocoding_cache (query, normalized, lat, lon, hits, updated_at) VALUES (?,?,?,?,?,?)'
    )
      .bind(normalized, normalized, lat, lon, 1, Date.now())
      .run();

    return json({ lat, lon, source: 'nominatim' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: 'Server error', details: message }, 500);
  }
};
