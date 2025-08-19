# Deployment Guide

## 🚀 Overview

This guide covers deployment strategies for the Weather App across different environments and
platforms, including web deployment, mobile app deployment, and CI/CD automation.

## 🌐 Web Deployment

### Production Build

**Build Command**:

```bash
npm run build
```

**Output**: Optimized production bundle in `dist/` directory

**Build Features**:

- Tree-shaking for minimal bundle size
- Code splitting with dynamic imports
- Asset optimization and compression
- Service worker for offline functionality

### Deployment Platforms

#### Netlify (Recommended)

**Setup**:

1. Connect GitHub repository to Netlify
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**: Set API keys

**Configuration** (`netlify.toml`):

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

**Setup**:

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Configure domains and environment variables

**Configuration** (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### GitHub Pages

**Setup**:

1. Enable GitHub Pages in repository settings
2. Use GitHub Actions for deployment
3. Configure custom domain (optional)

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📱 Mobile Deployment

### Capacitor Setup

**Install Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init
```

**Configuration** (`capacitor.config.json`):

```json
{
  "appId": "com.weather.app",
  "appName": "Weather App",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "Haptics": {
      "enabled": true
    },
    "StatusBar": {
      "style": "DARK"
    }
  }
}
```

### iOS Deployment

**Prerequisites**:

- macOS with Xcode installed
- Apple Developer account
- iOS device or simulator

**Build Process**:

```bash
# Build web assets
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

**Xcode Configuration**:

1. Set deployment target (iOS 15.0+)
2. Configure signing certificates
3. Add App Store icons and launch screens
4. Configure permissions in `Info.plist`

### Android Deployment

**Prerequisites**:

- Android Studio
- Android SDK
- Java Development Kit (JDK)

**Build Process**:

```bash
# Build web assets
npm run build

# Add Android platform
npx cap add android

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

**Android Studio Configuration**:

1. Set minimum SDK version (API 24+)
2. Configure signing keys
3. Add app icons and splash screens
4. Configure permissions in `AndroidManifest.xml`

## 🔧 Environment Configuration

### Environment Variables

**Required Variables**:

```bash
# Weather API
VITE_OPENMETEO_API_URL=https://api.open-meteo.com/v1

# Geocoding API
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Analytics (optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Reporting (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
```

**Development** (`.env.development`):

```bash
VITE_APP_ENV=development
VITE_API_DEBUG=true
VITE_LOG_LEVEL=debug
```

**Production** (`.env.production`):

```bash
VITE_APP_ENV=production
VITE_API_DEBUG=false
VITE_LOG_LEVEL=error
```

### Performance Configuration

**Vite Configuration** (`vite.config.ts`):

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@emotion/react', '@emotion/styled'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    compression: true,
  },
});
```

## 🔍 Quality Assurance

### Pre-Deployment Checklist

**Automated Checks**:

- [ ] All tests passing (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript compilation (`npm run type-check`)
- [ ] Bundle analysis (`npm run analyze`)
- [ ] Performance audit (`npm run lighthouse`)

**Manual Testing**:

- [ ] Mobile responsiveness (375px - 1024px)
- [ ] Dark/light theme switching
- [ ] API error handling
- [ ] Offline functionality
- [ ] Touch interactions and haptic feedback

### Automated Performance Monitoring

**Lighthouse CI** (automated performance testing):

```yaml
# lighthouserc.json
{
  'ci':
    {
      'collect': { 'numberOfRuns': 3, 'url': ['http://localhost:3000'] },
      'assert':
        {
          'assertions':
            {
              'categories:performance': ['warn', { 'minScore': 0.9 }],
              'categories:accessibility': ['error', { 'minScore': 0.9 }],
            },
        },
    },
}
```

**Bundle Analysis**:

```bash
npm run analyze # Generates bundle-report.html
```

## 🚨 Error Monitoring

### Sentry Integration

**Setup**:

```bash
npm install @sentry/react @sentry/tracing
```

**Configuration** (`src/main.tsx`):

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 0.1,
});
```

### Custom Error Boundary

**Implementation** (`src/ErrorBoundary.tsx`):

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Complete Pipeline** (`.github/workflows/deploy.yml`):

- **Quality Gate**: Linting, testing, type checking
- **Build**: Production build with optimization
- **Security**: Dependency vulnerability scanning
- **Performance**: Lighthouse CI automation
- **Deploy**: Automated deployment to staging/production

**Workflow Features**:

- Parallel job execution for speed
- Comprehensive caching strategy
- Deployment previews for pull requests
- Rollback capabilities for failed deployments

### Manual Deployment

**Development Build**:

```bash
npm run dev     # Start development server
npm run preview # Preview production build locally
```

**Production Build**:

```bash
npm run build   # Create production build
npm run serve   # Serve production build locally
```

## 📊 Monitoring & Analytics

### Real User Performance Monitoring

**Real User Monitoring** (RUM):

- Core Web Vitals tracking
- API response time monitoring
- Error rate tracking
- User interaction analytics

**Implementation**:

```typescript
// Performance monitoring
const observer = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    // Send metrics to analytics service
  });
});

observer.observe({ entryTypes: ['navigation', 'measure'] });
```

### Health Checks

**Application Health** (`/api/health`):

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-19T17:45:00Z",
  "services": {
    "weather_api": "operational",
    "geocoding_api": "operational"
  }
}
```

## 🔐 Security Considerations

### Content Security Policy

**CSP Header**:

```
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org;
```

### HTTPS Configuration

**Production Requirements**:

- Force HTTPS redirects
- HSTS headers
- Secure cookie settings
- Certificate monitoring

## 🚀 Scaling Considerations

### CDN Integration

**Asset Optimization**:

- Image compression and WebP conversion
- JavaScript/CSS minification
- Gzip/Brotli compression
- Cache-Control headers

### API Rate Limiting

**Implementation**:

- Request throttling for weather API
- Caching strategies for repeated requests
- Graceful degradation for API failures

---

_This deployment guide ensures reliable, secure, and performant deployment across all platforms._
