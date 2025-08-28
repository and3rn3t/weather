# Headers Configuration (Cloudflare Pages)

This project uses Cloudflare Pages `_headers` to control caching and security headers.

Key points:

- Source of truth: `public/_headers` (copied into `dist/_headers` by Vite build)
- Critical rule: `/version.json` is set to `no-cache, no-store, must-revalidate` with
  `Pragma: no-cache` and `Expires: 0`
- `index.html` is also set to no-store so app updates propagate immediately
- Static assets keep long-cache with immutable

Verification:

- Build locally and ensure `dist/_headers` exists
- Check production headers (PowerShell-friendly):

```powershell
# Use a browser-like UA to avoid Cloudflare curl challenge
curl.exe -I -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" https://weather.andernet.dev/version.json
```

Expected response headers for `/version.json`:

- `Cache-Control: ... no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`
- `cf-cache-status: DYNAMIC`

Maintenance:

- Edit `public/_headers` only; avoid keeping a second `_headers` in repo root.
