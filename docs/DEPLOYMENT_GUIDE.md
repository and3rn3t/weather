# 🚀 Deployment Guide

## 📋 **Production Deployment**

Complete guide for deploying the iOS26 Weather App to production environments with Cloudflare Pages,
custom domains, and CI/CD automation.

**Current Status**: ✅ **Production Ready** **Live Demo**:
[weather.andernet.dev](https://weather.andernet.dev) **Last Updated**: August 29, 2025

---

## 🌐 **Current Production Setup**

### **Production Environment**

- **Platform**: Cloudflare Pages
- **Domain**: [weather.andernet.dev](https://weather.andernet.dev)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 22.12.0

### **Preview Environment (Single Pages project)**

- **Platform**: Cloudflare Pages (Preview on same project)
- **Custom Domain**: [weather-dev.andernet.dev](https://weather-dev.andernet.dev)
- **Branches**: Any non-main branch
- **Auto-deploy**: Enabled for all non-main branches

---

## ⚡ **Quick Deployment**

### **Method 1: GitHub Integration (Recommended)**

#### **1. Fork Repository**

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/weather.git
cd weather
```

#### **2. Configure Cloudflare Pages**

1. **Login** to [Cloudflare Pages](https://pages.cloudflare.com/)
2. **Connect** your GitHub account
3. **Select** your forked weather repository
4. **Configure** build settings:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (default)
- **Node.js version**: 22.12.0

#### **3. Deploy**

- **Automatic**: Push to main branch triggers deployment
- **Manual**: Use Cloudflare Pages dashboard "Deploy now"

### **Method 2: Manual Upload**

#### **1. Build Locally**

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls dist/  # Should contain index.html, assets/, etc.
```

#### **2. Upload to Cloudflare Pages**

1. **Create** new project in Cloudflare Pages
2. **Upload** the `dist` folder contents
3. **Configure** custom domain (optional)

---

## 🔧 **Advanced Configuration**

### **Environment Variables**

```bash
# No environment variables required
# App uses public APIs (OpenMeteo, OpenStreetMap)
# No API keys needed
```

### **Build Optimization**

```bash
# Standard production build
npm run build

# Build with analysis
npm run analyze

# Test production build locally
npm run preview
```

### **Custom Build Settings**

```json
{
  "build": {
    "command": "npm run build",
    "directory": "dist",
    "environment": {
      "NODE_VERSION": "18",
      "NPM_VERSION": "9"
    }
  }
}
```

---

## 🌍 **Custom Domain Setup**

### **Cloudflare Pages Domain Configuration**

#### **1. Add Custom Domain**

1. **Navigate** to your Cloudflare Pages project
2. **Go to** Custom domains tab
3. **Add** your domain (e.g., `weather.yourdomain.com`)
4. **Follow** DNS configuration instructions

#### **2. DNS Configuration**

```dns
# Add CNAME record to your DNS provider
Type: CNAME
Name: weather (or your subdomain)
Value: your-project.pages.dev
TTL: Auto (or 3600)
```

#### **3. SSL/TLS Configuration**

- **Automatic**: Cloudflare provides free SSL certificates
- **Force HTTPS**: Enabled by default
- **HSTS**: Recommended for security

### **Alternative Platforms**

#### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure custom domain in Vercel dashboard
```

#### **Netlify Deployment**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions (Recommended)**

#### **Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: weather-app
          directory: dist
```

### **Cloudflare Pages Integration**

- **Automatic Deployments**: Enabled for all pushes
- **Preview Deployments**: Created for pull requests
- **Build Cache**: Optimized for faster builds
- **Rollback**: Easy rollback to previous deployments

---

## 📊 **Performance Optimization**

### **Build & Analysis**

```bash
# Bundle analysis
npm run analyze

# Performance budget check
npm run health

# Lighthouse CI
npx lhci autorun
```

### **Cloudflare Optimization**

- **Brotli Compression**: Automatic compression
- **Image Optimization**: Cloudflare Image Optimization
- **Minification**: Automatic HTML/CSS/JS minification
- **HTTP/2**: Enabled by default

### **Cache Configuration**

```javascript
// vite.config.ts cache configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          components: ['./src/components/modernWeatherUI'],
        },
      },
    },
  },
});
```

---

## 🔍 **Monitoring & Analytics**

### **Performance Monitoring**

- **Cloudflare Analytics**: Built-in performance metrics
- **Web Vitals**: Core Web Vitals tracking
- **Bundle Size**: Automated bundle size monitoring
- **Lighthouse**: Automated performance testing

### **Error Tracking**

```javascript
// Optional: Add error tracking service
// Example: Sentry, LogRocket, or similar
```

### **User Analytics**

```javascript
// Privacy-focused analytics (optional)
// Example: Plausible, Simple Analytics
```

---

## 🛡️ **Security Configuration**

### **Headers Configuration**

```javascript
// _headers file for Cloudflare Pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), payment=()
```

### **Content Security Policy**

```javascript
// CSP headers (optional)
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org;
```

---

## 🧪 **Testing Production**

### **Pre-deployment Checklist**

- ✅ **Build Success**: `npm run build` completes without errors
- ✅ **Tests Pass**: `npm test` all tests passing
- ✅ **Lint Clean**: `npm run lint` no critical errors
- ✅ **Type Check**: `npm run type-check` no TypeScript errors
- ✅ **Bundle Size**: Within performance budget
- ✅ **Lighthouse**: Performance score >90

### **Post-deployment Verification**

- ✅ **Site Load**: Main page loads correctly
- ✅ **Weather Data**: API calls successful
- ✅ **Search Function**: Location search working
- ✅ **iOS26 Components**: All components functional
- ✅ **Mobile Responsive**: Mobile interface working
- ✅ **Theme Switching**: Light/dark mode functional

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Failures**

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

#### **Node Version Issues**

```bash
# Verify Node version
node --version  # Should be 18.x or higher

# Use specific Node version
nvm use 18
npm run build
```

#### **Environment Variable Issues**

```bash
# No environment variables required for this app
# Check build logs for specific errors
```

### **Support Resources**

- **Documentation**: Complete guides in `/docs`
- **GitHub Issues**: [Report deployment issues](https://github.com/and3rn3t/weather/issues)
- **Cloudflare Docs**: [Pages documentation](https://developers.cloudflare.com/pages/)

---

## 📈 **Scaling Considerations**

### **Traffic Management**

- **CDN**: Global edge distribution via Cloudflare
- **Rate Limiting**: API rate limiting considerations
- **Caching**: Browser and CDN caching strategies

### **Future Enhancements**

- **API Caching**: Implement weather data caching
- **Service Worker**: Offline functionality
- **Progressive Web App**: App-like experience
- **Analytics**: User behavior tracking

---

## 🎯 **Success Metrics**

### **Performance Targets**

- **Lighthouse Performance**: >90
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

### **User Experience**

- **Time to Interactive**: <3s
- **Bundle Size**: <300kB gzipped
- **API Response**: <1s average
- **Error Rate**: <1%

---

**🚀 Your iOS26 Weather App is ready for production deployment!**

_For additional support, check the [troubleshooting guide](./guides/TROUBLESHOOTING.md) or
[create an issue](https://github.com/and3rn3t/weather/issues)._

---

_Deployment Guide_ _Last Updated: August 21, 2025_ _Version: 2.0_ _Status: Production Ready_
