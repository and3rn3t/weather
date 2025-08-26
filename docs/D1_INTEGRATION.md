# Cloudflare D1 Integration (Favorites + Geocoding Cache)

This app now includes optional backend persistence via Cloudflare Pages Functions:

- Favorites API (no auth): anonymous device-based saved cities
- Geocoding API with D1 cache and Nominatim fallback

## What’s included

- wrangler.toml: D1 binding `DB` and Pages Functions enabled
- functions/api/favorites.ts: GET/POST/DELETE endpoints
- functions/api/geocode.ts: GET endpoint with cache write-through
- migrations/0001_init.sql: database schema
- src/utils/useFavorites.ts: React hook
- src/utils/useGeocode.ts: helper

## Setup

1) Create a D1 database
   - npx wrangler d1 create weather-db
   - Copy the `database_id` into wrangler.toml under [[d1_databases]]
2) Apply schema locally and in production
   - npx wrangler d1 execute weather-db --local --file=./migrations/0001_init.sql
   - npx wrangler d1 execute weather-db --file=./migrations/0001_init.sql
3) Run locally
   - npm run build && npx wrangler pages dev dist -- d1=DB:weather-db
     or deploy with: npm run deploy:preview

Headers: send `X-Device-Id` (client creates/stores a UUID automatically in useFavorites).

## API

- GET /api/favorites -> FavoriteCity[]
- POST /api/favorites { city, lat, lon } -> FavoriteCity[]
- DELETE /api/favorites?city=CityName -> { ok: true }
- GET /api/geocode?q=City -> { lat, lon, source }

## Notes

- No auth; relies on per-device UUID stored in localStorage.
- Geocoding uses Nominatim with a proper User-Agent as required.
- Keep UI stateless if you don’t need cross-device sync; this backend is optional.
