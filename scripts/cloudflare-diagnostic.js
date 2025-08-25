#!/usr/bin/env node

/**
 * Cloudflare Deployment Diagnostic Tool
 * Checks configuration and suggests fixes for deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🔍 Cloudflare Deployment Diagnostic Tool\n');

// Check wrangler.toml
const wranglerPath = path.join(projectRoot, 'wrangler.toml');
if (fs.existsSync(wranglerPath)) {
  console.log('✅ wrangler.toml found');
  const content = fs.readFileSync(wranglerPath, 'utf8');

  if (content.includes('pages_build_output_dir')) {
    console.log('✅ pages_build_output_dir configured');
  } else {
    console.log('❌ Missing pages_build_output_dir in wrangler.toml');
    console.log('   Add: pages_build_output_dir = "dist"');
  }

  if (content.includes('compatibility_date')) {
    console.log('✅ compatibility_date configured');
  } else {
    console.log('⚠️  Missing compatibility_date');
  }
} else {
  console.log('❌ wrangler.toml not found');
}

// Check dist directory
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log(`✅ dist directory exists with ${files.length} files`);

  if (files.includes('index.html')) {
    console.log('✅ index.html found in dist');
  } else {
    console.log('❌ index.html not found in dist');
  }
} else {
  console.log('❌ dist directory not found - run npm run build first');
}

// Check workflow file
const workflowPath = path.join(projectRoot, '.github/workflows/deploy.yml');
if (fs.existsSync(workflowPath)) {
  console.log('✅ Deploy workflow found');
  const content = fs.readFileSync(workflowPath, 'utf8');

  if (content.includes('wrangler-action@v3')) {
    console.log('✅ Using modern wrangler-action@v3');
  } else if (content.includes('pages-action@v1')) {
    console.log('⚠️  Using older pages-action@v1 (consider upgrading)');
  }

  if (content.includes('pages deploy')) {
    console.log('✅ Using modern pages deploy command');
  } else if (content.includes('pages publish')) {
    console.log('⚠️  Using deprecated pages publish command');
  }
} else {
  console.log('❌ Deploy workflow not found');
}

console.log('\n🔧 Required GitHub Secrets:');
console.log('   CLOUDFLARE_API_TOKEN - Get from Cloudflare dashboard');
console.log('   CLOUDFLARE_ACCOUNT_ID - Get from Cloudflare dashboard');

console.log('\n🌐 Custom Domains:');
console.log('   Production:  weather.andernet.dev (main branch)');
console.log('   Development: weather-dev.andernet.dev (dev branch)');
console.log('   Setup:       npm run deploy:domains');

console.log('\n📋 Recommended Commands:');
console.log('   npm run build:ultra  # Test build locally');
console.log('   npm run deploy:production  # Deploy to production');
console.log('   npm run deploy:dev  # Deploy to development');
console.log(
  '   npx wrangler pages deploy dist --project-name=premium-weather-app  # Test deploy locally'
);

console.log('\n🌐 Useful Links:');
console.log('   Cloudflare Pages: https://dash.cloudflare.com/pages');
console.log('   API Tokens: https://dash.cloudflare.com/profile/api-tokens');
console.log(
  '   Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/'
);
