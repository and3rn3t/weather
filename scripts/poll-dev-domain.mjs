#!/usr/bin/env node

// Simple readiness poller for a URL; exits 0 on success, 1 on timeout
// Usage: node scripts/poll-dev-domain.mjs --url https://example --max 30 --delay 10

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
};

const url = getArg('url', 'https://weather-dev.andernet.dev');
const max = Number(getArg('max', '30')); // attempts
const delay = Number(getArg('delay', '10')); // seconds

const sleep = ms => new Promise(r => setTimeout(r, ms));

const okBodyHint = ['<html', 'DEV: index.html banner', '<!doctype html'];

async function probeOnce() {
  const started = Date.now();
  try {
    const resp = await fetch(url, { redirect: 'follow' });
    const text = await resp.text();
    const ms = Date.now() - started;
    const hint = text.slice(0, 120).replace(/\s+/g, ' ').trim();
    const bodyLooksOk = okBodyHint.some(h => text.includes(h));
    console.log(`→ ${url} | ${resp.status} in ${ms}ms | body hint: ${hint}`);
    return resp.ok && bodyLooksOk;
  } catch (e) {
    const ms = Date.now() - started;
    console.log(`→ ${url} | ERROR in ${ms}ms | ${String(e)}`);
    return false;
  }
}

(async () => {
  for (let i = 1; i <= max; i++) {
    const ok = await probeOnce();
    if (ok) {
      console.log('✅ Domain is live and serving expected content');
      process.exit(0);
    }
    if (i < max) {
      console.log(`⏳ Waiting ${delay}s before retry ${i + 1}/${max}…`);
      await sleep(delay * 1000);
    }
  }
  console.log('❌ Timed out waiting for domain to become ready');
  process.exit(1);
})();
