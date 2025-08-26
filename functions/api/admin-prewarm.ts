// Admin endpoint to prewarm popular cities geocoding cache (dev/preview only)
// POST /api/admin-prewarm  body: { cities: string[] } optional, else uses built-in list

// Minimal D1 interface since we only call through /api/geocode via fetch here
type Env = { ENVIRONMENT?: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const DEFAULT_CITIES = [
  'New York',
  'Los Angeles',
  'London',
  'Tokyo',
  'Sydney',
  'Paris',
  'Berlin',
  'Toronto',
  'San Francisco',
  'Singapore',
];

export const onRequest = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  const isProd = (env.ENVIRONMENT || '').toLowerCase() === 'production';
  if (isProd) return json({ error: 'Not allowed in production' }, 403);

  const body = await request.json().catch(() => ({}));
  const cities: string[] =
    Array.isArray(body?.cities) && body.cities.length
      ? body.cities
      : DEFAULT_CITIES;

  const promises = cities.map(async city => {
    try {
      const url = new URL(request.url);
      url.pathname = '/api/geocode';
      url.search = `?q=${encodeURIComponent(city)}`;
      const res = await fetch(url.toString());
      const data = (await res.json()) as { source?: string } | unknown;
      const source = (data as { source?: string } | null)?.source;
      return { city, ok: res.ok, source };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'error';
      return { city, ok: false, error: message };
    }
  });

  const results = await Promise.allSettled(promises);
  const formattedResults = results.map(result =>
    result.status === 'fulfilled'
      ? result.value
      : { city: '', ok: false, error: 'Promise rejected' }
  );

  return json({ count: formattedResults.length, results: formattedResults });
};
