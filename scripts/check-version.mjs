#!/usr/bin/env node
/**
 * Quick version.json checker for prod/dev with browser-like headers.
 * Usage: npm run check:version
 */
import https from 'https';

const targets = [
  { name: 'prod', url: 'https://weather.andernet.dev/version.json' },
  { name: 'dev-custom', url: 'https://weather-dev.andernet.dev/version.json' },
  { name: 'dev-pages', url: 'https://dev.weather.pages.dev/version.json' },
];

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36',
  Accept: 'application/json',
  'Cache-Control': 'no-cache',
};

function fetchJson(url) {
  return new Promise(resolve => {
    const ts = Date.now();
    const u = new URL(url);
    u.searchParams.set('ts', String(ts));

    const req = https.request(
      {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers,
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          const result = { statusCode: res.statusCode, url: u.toString() };
          try {
            const json = JSON.parse(data);
            resolve({ ok: true, json, ...result });
          } catch {
            resolve({ ok: false, body: data?.slice(0, 400), ...result });
          }
        });
      }
    );
    req.on('error', err =>
      resolve({ ok: false, error: String(err), url: u.toString() })
    );
    req.end();
  });
}

(async () => {
  console.log('Version check starting...');
  for (const t of targets) {
    const res = await fetchJson(t.url);
    if (res.ok) {
      const { version, environment, branch, commit } = res.json || {};
      console.log(`✔ ${t.name}: ${res.statusCode} ${res.url}`);
      console.log(
        `  version=${version} env=${environment} branch=${branch} commit=${commit?.slice(0, 8)}`
      );
    } else {
      console.log(`✖ ${t.name}: ${res.statusCode || ''} ${res.url}`);
      if (res.body)
        console.log(`  body: ${res.body.replace(/\s+/g, ' ').slice(0, 200)}`);
      if (res.error) console.log(`  error: ${res.error}`);
    }
  }
})();
