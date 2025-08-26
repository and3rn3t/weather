// Feature flags/config endpoint backed by KV (CONFIG)
// GET /api/config -> returns small set of flags (cache TTLs, feature toggles)

type KVGetType = 'text' | 'json' | 'arrayBuffer' | 'stream' | undefined;
type KVNamespaceLike = {
  get: (key: string, type?: KVGetType) => Promise<unknown>;
};
type Env = { CONFIG?: KVNamespaceLike };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequest = async ({ env }: { env: Env }) => {
  const defaults = {
    geocode_cache_ttl_ms: 1000 * 60 * 60 * 24 * 30,
    enable_popular_prewarm: true,
  };

  try {
    const flags = (
      env.CONFIG ? await env.CONFIG.get('flags', 'json') : null
    ) as Record<string, unknown> | null;
    return json({ ...(flags ?? {}), ...defaults });
  } catch {
    return json(defaults);
  }
};
