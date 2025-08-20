# 🚀 Weather App Deployment Guide

## Complete Production Deployment Setup and Configuration

## Last Updated: August 19, 2025

## 📋 **Overview**

This guide provides comprehensive instructions for deploying the weather application to production
using Cloudflare Pages with GitHub Actions automation.

**Current Deployment:**

- **Production**: [weather.andernet.dev](https://weather.andernet.dev)
- **Development**: [weather-dev.andernet.dev](https://weather-dev.andernet.dev)

## ⚡ **Quick Deployment**

For immediate deployment of the current codebase:

```bash
# Build and deploy to production
npm run build:ultra
npm run deploy:test

# Or use the combined command
npm run deploy:production
```

## 🏗️ **Initial Setup**

### **1. Prerequisites**

- Node.js 22.18.0+ (for modern crypto support)
- npm package manager
- GitHub repository with Actions enabled
- Cloudflare account with Pages access

### **2. Repository Configuration**

```bash
# Clone the repository
git clone https://github.com/and3rn3t/weather.git
cd weather

# Install dependencies
npm install

# Verify setup
npm run health
```

### **3. Cloudflare Pages Setup**

#### **Create Pages Project**

1. Log in to Cloudflare Dashboard
2. Navigate to Pages section
3. Create new project from GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build:ultra`
   - **Build output directory**: `dist`
   - **Node.js version**: `22.18.0`

#### **Environment Configuration**

No environment variables required - the app uses free APIs with no authentication.

## 🔧 **Configuration Files**

### **wrangler.toml**

```toml
name = "weather-app"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-01"

# Production environment configuration
[env.production]
# No environment variables needed for free APIs

# Development environment configuration
[env.development]
# No environment variables needed for free APIs
```

### **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.18.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:ultra

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name weather-app
```

## 🌐 **Custom Domain Setup**

### **DNS Configuration**

Add CNAME records to your DNS provider:

```dns
# Production domain
weather.andernet.dev → CNAME → weather-app.pages.dev

# Development domain
weather-dev.andernet.dev → CNAME → weather-app-dev.pages.dev
```

### **Cloudflare Domain Setup**

1. Navigate to Pages project settings
2. Go to Custom domains section
3. Add custom domain: `weather.andernet.dev`
4. Verify DNS propagation (15-30 minutes)
5. Enable "Always Use HTTPS"

### **SSL Certificate**

- Automatic SSL certificate provisioning
- Force HTTPS redirects enabled
- Security headers configured

## 🔑 **Secrets Configuration**

### **Required GitHub Secrets**

Navigate to repository Settings → Secrets and variables → Actions:

1. **CLOUDFLARE_API_TOKEN**

   - Value: Your Cloudflare API token
   - Permissions: Cloudflare Pages:Edit, Zone:Read
   - Create at: [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)

2. **CLOUDFLARE_ACCOUNT_ID** (optional)
   - Value: Your Cloudflare Account ID
   - Found in: Cloudflare Dashboard → Right sidebar

### **API Token Creation**

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Custom token" template:
   - **Permissions**:
     - Cloudflare Pages:Edit
     - Zone:Read (if using custom domains)
   - **Zone Resources**: Include your domain zone
   - **Account Resources**: Include your account

## 📊 **Build Optimization**

### **Production Build Configuration**

```json
// package.json scripts
{
  "scripts": {
    "build:ultra": "npx vite build --mode production",
    "build:deps": "npm install @rollup/rollup-linux-x64-gnu --optional --no-save || echo 'Optional dependency warning'",
    "deploy:test": "npm run build:ultra && npx wrangler pages deploy dist --project-name weather-app",
    "deploy:production": "npm run build:deps && npm run build:ultra && npm run deploy:test"
  }
}
```

### **Build Performance**

- **Bundle Size**: 286.70 kB (gzipped: 89.73 kB)
- **Build Time**: <2 seconds on GitHub Actions
- **Optimization**: Tree shaking, code splitting, asset optimization

### **Performance Monitoring**

```bash
# Check bundle size
npm run analyze

# Performance audit
npm run lighthouse

# Health check
npm run health
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Deployment Fails with "Invalid CLI arguments"**

**Problem**: Using Workers configuration in Pages deployment

**Solution**: Simplify `wrangler.toml`:

```toml
name = "weather-app"
pages_build_output_dir = "dist"
compatibility_date = "2024-01-01"
# Remove workers-specific configurations
```

#### **2. "The `set-output` command is deprecated"**

**Problem**: Using outdated GitHub Actions

**Solution**: Update to `cloudflare/wrangler-action@v3`:

```yaml
- uses: cloudflare/wrangler-action@v3 # Not v2
```

#### **3. Build Fails with "Module not found"**

**Problem**: Missing dependencies or Node.js version mismatch

**Solution**:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify Node.js version
node --version  # Should be 22.18.0+
```

#### **4. DNS Not Resolving**

**Problem**: DNS propagation delay or incorrect CNAME

**Solution**:

- Wait 15-30 minutes for DNS propagation
- Verify CNAME points to correct Pages domain
- Test with `nslookup weather.andernet.dev`

### **Diagnostic Commands**

```bash
# Check deployment status
npm run deploy:diagnostic

# Verify build integrity
npm run build:ultra && npm run test:fast

# Health check all systems
npm run health

# Check DNS resolution
nslookup weather.andernet.dev

# Test Cloudflare deployment
npx wrangler pages project list
```

## 🔄 **Deployment Workflow**

### **Automatic Deployment**

1. Push changes to `main` branch
2. GitHub Actions triggers automatically
3. Build runs with Node.js 22.18.0
4. Tests execute (185+ tests)
5. Bundle builds and optimizes
6. Deploy to Cloudflare Pages
7. DNS updates propagate

### **Manual Deployment**

```bash
# Build locally
npm run build:ultra

# Deploy to Pages
npx wrangler pages deploy dist --project-name weather-app

# Or use combined script
npm run deploy:production
```

### **Rollback Procedure**

1. Navigate to Cloudflare Pages dashboard
2. Select previous deployment from history
3. Click "Rollback to this deployment"
4. Verify rollback success

## 🎯 **Production Checklist**

### **Pre-Deployment**

- [ ] All tests passing (`npm run test:fast`)
- [ ] Build completes successfully (`npm run build:ultra`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Bundle size within budget (<300kB)
- [ ] Health check passes (`npm run health`)

### **Post-Deployment**

- [ ] Production site loads correctly
- [ ] Weather data displays properly
- [ ] Theme switching works
- [ ] Mobile optimization functions
- [ ] iOS26 components render correctly
- [ ] Performance metrics meet targets

### **Monitoring**

- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Monitor Core Web Vitals
- [ ] Track bundle size changes
- [ ] Set up security scanning

## 📈 **Performance Optimization**

### **Bundle Analysis**

```bash
# Analyze bundle composition
npm run analyze

# Check for unused dependencies
npx depcheck

# Performance budget monitoring
npm run lighthouse
```

### **Caching Strategy**

- **Static Assets**: 1 year cache with content hashing
- **HTML**: No cache for dynamic updates
- **API Responses**: Client-side caching for weather data
- **Service Worker**: Optional offline functionality

### **CDN Optimization**

- Global edge locations via Cloudflare
- Automatic compression (Brotli/Gzip)
- Image optimization and WebP conversion
- HTTP/3 and 0-RTT support

## 🔒 **Security Configuration**

### **Security Headers**

```http
# _headers file
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=()
```

### **Content Security Policy**

```http
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org;
```

### **HTTPS Configuration**

- Force HTTPS redirects
- HSTS headers enabled
- Secure cookie settings
- Mixed content protection

## 📚 **Additional Resources**

### **Documentation**

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

### **Support**

- [Cloudflare Community](https://community.cloudflare.com/)
- [GitHub Discussions](https://github.com/and3rn3t/weather/discussions)
- [Project Issues](https://github.com/and3rn3t/weather/issues)

---

_This deployment guide provides complete instructions for production deployment. For development
setup, see the [Development Guide](./development-setup.md)._
