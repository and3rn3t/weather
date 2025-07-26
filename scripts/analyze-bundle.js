#!/usr/bin/env node

/**
 * Cross-platform bundle analysis script for CI/CD
 * Works on both Windows and Linux/Ubuntu runners
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust bundle size limits for modern React app
const BUNDLE_SIZE_LIMITS = {
  js: 500 * 1024, // 500KB for main JS (React + features)
  css: 100 * 1024, // 100KB for CSS
  total: 600 * 1024 // 600KB total (reasonable for modern app)
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

function analyzeBundle() {
  console.log('🔍 Bundle Analysis Starting...');
  
  // Use more robust path resolution
  const projectRoot = path.dirname(__dirname);
  const distPath = path.join(projectRoot, 'dist');
  
  console.log(`📁 Looking for dist folder at: ${distPath}`);
  
  // Check if dist folder exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ ERROR: dist folder not found');
    console.error(`   Expected location: ${distPath}`);
    console.error('   Make sure to run "npm run build" before bundle analysis');
    process.exit(1);
  }
  
  const assetsPath = path.join(distPath, 'assets');
  let jsFiles = [];
  let cssFiles = [];
  
  // Get JavaScript files
  if (fs.existsSync(assetsPath)) {
    jsFiles = fs.readdirSync(assetsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(assetsPath, file));
  }
  
  // Get CSS files (can be in multiple locations)
  function findCssFiles(dir) {
    const files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...findCssFiles(fullPath));
        } else if (item.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Skip directories that can't be read (permissions, etc.)
      console.warn(`⚠️  Warning: Could not read directory ${dir}: ${err.message}`);
    }
    return files;
  }
  
  cssFiles = findCssFiles(distPath);
  
  if (jsFiles.length === 0) {
    console.error('❌ ERROR: No JavaScript files found');
    process.exit(1);
  }
  
  console.log('\n📊 Bundle Analysis Results:');
  console.log('=' .repeat(50));
  
  let totalJsSize = 0;
  let totalCssSize = 0;
  
  // Analyze JavaScript files
  console.log('\n🟡 JavaScript Files:');
  jsFiles.forEach(file => {
    const size = getFileSize(file);
    totalJsSize += size;
    const filename = path.basename(file);
    console.log(`  ${filename}: ${formatBytes(size)}`);
  });
  
  // Analyze CSS files  
  console.log('\n🟢 CSS Files:');
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    totalCssSize += size;
    const filename = path.basename(file);
    console.log(`  ${filename}: ${formatBytes(size)}`);
  });
  
  const totalSize = totalJsSize + totalCssSize;
  
  console.log('\n📈 Summary:');
  console.log(`  Total JS: ${formatBytes(totalJsSize)}`);
  console.log(`  Total CSS: ${formatBytes(totalCssSize)}`);
  console.log(`  Grand Total: ${formatBytes(totalSize)}`);
  
  // Check size limits
  let exitCode = 0;
  console.log('\n🚨 Size Limit Checks:');
  
  if (totalJsSize > BUNDLE_SIZE_LIMITS.js) {
    console.log(`  ❌ JS size (${formatBytes(totalJsSize)}) exceeds limit (${formatBytes(BUNDLE_SIZE_LIMITS.js)})`);
    exitCode = 1;
  } else {
    console.log(`  ✅ JS size within limit (${formatBytes(totalJsSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.js)})`);
  }
  
  if (totalCssSize > BUNDLE_SIZE_LIMITS.css) {
    console.log(`  ❌ CSS size (${formatBytes(totalCssSize)}) exceeds limit (${formatBytes(BUNDLE_SIZE_LIMITS.css)})`);
    exitCode = 1;
  } else {
    console.log(`  ✅ CSS size within limit (${formatBytes(totalCssSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.css)})`);
  }
  
  if (totalSize > BUNDLE_SIZE_LIMITS.total) {
    console.log(`  ❌ Total size (${formatBytes(totalSize)}) exceeds limit (${formatBytes(BUNDLE_SIZE_LIMITS.total)})`);
    exitCode = 1;
  } else {
    console.log(`  ✅ Total size within limit (${formatBytes(totalSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.total)})`);
  }
  
  if (exitCode === 0) {
    console.log('\n🎉 Bundle analysis passed! All files within size limits.');
  } else {
    console.log('\n💥 Bundle analysis failed! Some files exceed size limits.');
  }

  // Generate CI report
  generateCIReport(exitCode, totalJsSize, totalCssSize, totalJsSize + totalCssSize);

  process.exit(exitCode);
}

// Enhanced CI reporting
function generateCIReport(exitCode, totalJsSize, totalCssSize, totalSize) {
  const report = {
    timestamp: new Date().toISOString(),
    status: exitCode === 0 ? 'PASS' : 'FAIL',
    javascript_kb: Math.round(totalJsSize / 1024),
    css_kb: Math.round(totalCssSize / 1024),
    total_kb: Math.round(totalSize / 1024),
    limits: BUNDLE_SIZE_LIMITS,
    performance_passed: exitCode === 0,
    recommendations: []
  };

  // Add recommendations based on sizes
  if (totalJsSize > BUNDLE_SIZE_LIMITS.js * 0.8) {
    report.recommendations.push('Consider code splitting for large JavaScript bundles');
  }
  
  if (totalCssSize > BUNDLE_SIZE_LIMITS.css * 0.8) {
    report.recommendations.push('Optimize CSS - consider removing unused styles');
  }

  if (totalSize > BUNDLE_SIZE_LIMITS.total * 0.9) {
    report.recommendations.push('Bundle approaching size limit - consider optimization');
  }

  // Write CI report for automation
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    try {
      fs.writeFileSync('bundle-analysis.json', JSON.stringify(report, null, 2), 'utf8');
      console.log('\n📄 CI report written to bundle-analysis.json');
      
      // Output GitHub Actions summary
      console.log('\n📊 GitHub Actions Summary:');
      console.log(`::notice title=Bundle Analysis::JavaScript: ${report.javascript_kb}KB, CSS: ${report.css_kb}KB, Total: ${report.total_kb}KB`);
      
      if (report.recommendations.length > 0) {
        console.log(`::warning title=Performance Recommendations::${report.recommendations.join('; ')}`);
      }
    } catch (writeError) {
      console.warn('⚠️  Warning: Could not write CI report:', writeError.message);
    }
  }

  return report;
}

// Run the analysis
analyzeBundle();
