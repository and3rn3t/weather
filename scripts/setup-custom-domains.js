#!/usr/bin/env node

/**
 * Custom Domain Setup Script
 * Helps configure custom domains for Cloudflare Pages
 */

import { execSync } from 'child_process';

console.log('🌐 Custom Domain Setup for Weather App\n');

const domains = {
  production: {
    domain: 'weather.andernet.dev',
    branch: 'main',
    environment: 'production',
  },
  development: {
    domain: 'weather-dev.andernet.dev',
    branch: 'dev',
    environment: 'development',
  },
};

console.log('📋 Domain Configuration:');
console.log(
  `🚀 Production:  ${domains.production.domain} (${domains.production.branch} branch)`
);
console.log(
  `🧪 Development: ${domains.development.domain} (${domains.development.branch} branch)`
);
console.log('');

// Check if wrangler is available
try {
  execSync('npx wrangler --version', {
    stdio: 'pipe',
    shell: false, // Disable shell interpretation for security
  });
  console.log('✅ Wrangler CLI available');
} catch (error) {
  console.log('❌ Wrangler CLI not available');
  console.log('   Run: npm install -g wrangler');
  process.exit(1);
}

// Check if logged in
try {
  const whoami = execSync('npx wrangler whoami', {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false, // Disable shell interpretation for security
  });
  console.log('✅ Logged in to Cloudflare');
  console.log(`   Account: ${whoami.trim()}`);
} catch (error) {
  console.log('❌ Not logged in to Cloudflare');
  console.log('   Run: npx wrangler login');
  process.exit(1);
}

console.log('\n🔧 Manual Setup Steps Required:');
console.log('\n1. 📡 DNS Configuration (in Cloudflare DNS):');
console.log('   Add these CNAME records in your andernet.dev zone:');
console.log('   ');
console.log(
  '   weather.andernet.dev     CNAME   premium-weather-app.pages.dev'
);
console.log(
  '   weather-dev.andernet.dev CNAME   premium-weather-app.pages.dev'
);

console.log('\n2. 🔗 Custom Domains (in Cloudflare Pages):');
console.log('   Go to: https://dash.cloudflare.com/pages/premium-weather-app');
console.log('   Navigate to: Custom domains tab');
console.log('   ');
console.log('   Add these custom domains:');
console.log(
  `   - ${domains.production.domain} → ${domains.production.branch} branch`
);
console.log(
  `   - ${domains.development.domain} → ${domains.development.branch} branch`
);

console.log('\n3. 🌍 Environment Variables (in Cloudflare Pages):');
console.log('   Go to: Settings → Environment variables');
console.log('   ');
console.log('   Production environment (main branch):');
console.log('   ENVIRONMENT=production');
console.log('   VITE_APP_ENV=production');
console.log('   VITE_API_BASE_URL=https://weather.andernet.dev');
console.log('   ');
console.log('   Development environment (dev branch):');
console.log('   ENVIRONMENT=development');
console.log('   VITE_APP_ENV=development');
console.log('   VITE_API_BASE_URL=https://weather-dev.andernet.dev');

console.log('\n🧪 Testing Commands:');
console.log(
  '   npm run deploy:production  # Deploy to production (main branch)'
);
console.log(
  '   npm run deploy:dev         # Deploy to development (dev branch)'
);
console.log('   npm run deploy:diagnostic  # Verify configuration');

console.log('\n🔍 Verification URLs:');
console.log(`   Production:  https://${domains.production.domain}`);
console.log(`   Development: https://${domains.development.domain}`);
console.log('   Cloudflare:  https://premium-weather-app.pages.dev');

console.log('\n📚 Documentation:');
console.log(
  '   Custom Domains: https://developers.cloudflare.com/pages/configuration/custom-domains/'
);
console.log(
  '   Pages Setup:    https://developers.cloudflare.com/pages/get-started/'
);

console.log(
  '\n✨ Once DNS propagates (up to 24 hours), your custom domains will be live!'
);
