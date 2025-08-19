# Custom Domain Configuration for Weather App

## 🌐 Domain Setup Instructions

### Production Domain: `weather.andernet.dev`

- **Environment**: `main` branch
- **Cloudflare Pages Project**: `premium-weather-app`
- **Primary URL**: <https://weather.andernet.dev>
- **Fallback URL**: <https://premium-weather-app.pages.dev>

### Development Domain: `weather-dev.andernet.dev`

- **Environment**: `dev`/`develop` branches
- **Cloudflare Pages Project**: `premium-weather-app` (branch: dev)
- **Primary URL**: <https://weather-dev.andernet.dev>
- **Fallback URL**: <https://dev.premium-weather-app.pages.dev>

## 🔧 Cloudflare Pages Configuration Steps

### 1. Set Up Custom Domains in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** → **Pages** → **premium-weather-app**
2. Navigate to **Custom domains** tab
3. Add custom domains:

   **For Production:**

   ```text
   Domain: weather.andernet.dev
   Branch: main (production)
   ```

   **For Development:**

   ```text
   Domain: weather-dev.andernet.dev
   Branch: dev (or your default development branch)
   ```

### 2. DNS Configuration in Cloudflare

Add these DNS records in your `andernet.dev` zone:

```dns
# Production
weather.andernet.dev    CNAME   premium-weather-app.pages.dev

# Development
weather-dev.andernet.dev CNAME   premium-weather-app.pages.dev
```

### 3. Branch-to-Domain Mapping

Configure in Cloudflare Pages settings:

```yaml
Branches:
  main:
    - weather.andernet.dev (primary)
    - premium-weather-app.pages.dev (fallback)

  dev/develop:
    - weather-dev.andernet.dev (primary)
    - dev.premium-weather-app.pages.dev (fallback)

  feature/*:
    - [branch-name].premium-weather-app.pages.dev
```

## 🚀 Deployment URLs by Branch

| Branch Type     | Custom Domain                      | Cloudflare Domain                                   |
| --------------- | ---------------------------------- | --------------------------------------------------- |
| `main`          | <https://weather.andernet.dev>     | <https://premium-weather-app.pages.dev>             |
| `dev`/`develop` | <https://weather-dev.andernet.dev> | <https://dev.premium-weather-app.pages.dev>         |
| `feature/xyz`   | N/A                                | <https://feature-xyz.premium-weather-app.pages.dev> |
| PR Preview      | N/A                                | https://[pr-number].premium-weather-app.pages.dev   |

## 🔐 Environment Variables

Set these in Cloudflare Pages → Settings → Environment variables:

### Production Environment (`main` branch)

```env
ENVIRONMENT=production
VITE_API_BASE_URL=https://weather.andernet.dev
VITE_APP_ENV=production
```

### Development Environment (`dev` branch)

```env
ENVIRONMENT=development
VITE_API_BASE_URL=https://weather-dev.andernet.dev
VITE_APP_ENV=development
```

## 📋 Verification Steps

After setup, verify:

1. **Production**: <https://weather.andernet.dev>
2. **Development**: <https://weather-dev.andernet.dev>
3. **SSL certificates** are automatically provisioned
4. **Redirects** work correctly
5. **Branch deployments** create appropriate subdomains

## 🛠️ Troubleshooting

### Common Issues

- **DNS propagation**: Can take up to 24 hours
- **SSL certificate**: Usually ready in 15-30 minutes
- **CNAME conflicts**: Ensure no other records conflict
- **Branch mapping**: Verify branch names match exactly

### Debug Commands

```bash
# Test DNS resolution
nslookup weather.andernet.dev
nslookup weather-dev.andernet.dev

# Test SSL certificates
curl -I https://weather.andernet.dev
curl -I https://weather-dev.andernet.dev
```
