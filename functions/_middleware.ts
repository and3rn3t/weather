// Cloudflare Pages Functions middleware to set CORS and device id
export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const response = await next();

  const headers = new Headers(response.headers);
  const origin = request.headers.get('Origin') || '*';
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
