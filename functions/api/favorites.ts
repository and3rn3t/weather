// Favorites API (no auth) using Cloudflare D1
// Routes:
// - GET /api/favorites -> list favorites for device_id
// - POST /api/favorites { city, lat, lon } -> add
// - DELETE /api/favorites?city=Name -> remove

type D1Stmt = {
  bind: (...args: unknown[]) => D1Stmt;
  all: () => Promise<{
    results?: Array<{
      city: string;
      lat: number;
      lon: number;
      added_at: number;
    }>;
  }>;
  run: () => Promise<unknown>;
};
type D1DatabaseLike = { prepare: (sql: string) => D1Stmt };
type Env = { DB: D1DatabaseLike };

function getDeviceId(request: Request): string | null {
  return request.headers.get('X-Device-Id');
}

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) => {
  const deviceId = getDeviceId(request);
  if (!deviceId) return badRequest('Missing X-Device-Id header');

  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT city, lat, lon, added_at FROM favorites WHERE device_id = ? ORDER BY added_at DESC'
      )
        .bind(deviceId)
        .all();
      return new Response(JSON.stringify(results ?? []), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { city, lat, lon } = body || {};
      if (!city || typeof lat !== 'number' || typeof lon !== 'number') {
        return badRequest('city, lat, lon are required');
      }
      const addedAt = Date.now();
      await env.DB.prepare(
        'INSERT OR IGNORE INTO favorites (device_id, city, lat, lon, added_at) VALUES (?,?,?,?,?)'
      )
        .bind(deviceId, String(city), Number(lat), Number(lon), addedAt)
        .run();
      const { results } = await env.DB.prepare(
        'SELECT city, lat, lon, added_at FROM favorites WHERE device_id = ? ORDER BY added_at DESC'
      )
        .bind(deviceId)
        .all();
      return new Response(JSON.stringify(results ?? []), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (request.method === 'DELETE') {
      const city = url.searchParams.get('city');
      if (!city) return badRequest('city is required');
      await env.DB.prepare(
        'DELETE FROM favorites WHERE device_id = ? AND city = ?'
      )
        .bind(deviceId, city)
        .run();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return badRequest('Method not allowed', 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return new Response(
      JSON.stringify({ error: 'Server error', details: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
