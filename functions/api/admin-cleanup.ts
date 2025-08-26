// Admin endpoint to cleanup stale geocoding cache entries
// POST /api/admin-cleanup { ttl_ms?: number }

// Minimal local types to avoid importing global Workers types here
type D1Stmt = {
  bind: (...args: unknown[]) => D1Stmt;
  run: () => Promise<{ meta?: { changes?: number } }>;
  first?: () => Promise<unknown>;
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
  DEBUG?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequest = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  const isProd = (env.ENVIRONMENT || '').toLowerCase() === 'production';
  if (isProd) return json({ error: 'Not allowed in production' }, 403);

  let ttlMs = 1000 * 60 * 60 * 24 * 30;
  try {
    const flags = (
      env.CONFIG ? await env.CONFIG.get('flags', 'json') : null
    ) as { geocode_cache_ttl_ms?: number } | null;
    if (flags && typeof flags.geocode_cache_ttl_ms === 'number')
      ttlMs = flags.geocode_cache_ttl_ms;
  } catch {
    /* ignore KV read issues; default TTL will be used */
  }

  const override = await request.json().catch(() => ({}));
  if (typeof override?.ttl_ms === 'number') ttlMs = override.ttl_ms;

  const cutoff = Date.now() - ttlMs;
  const res = await env.DB.prepare(
    'DELETE FROM geocoding_cache WHERE updated_at < ?'
  )
    .bind(cutoff)
    .run();

  return json({ deleted: res.meta?.changes ?? 0, cutoff });
};
