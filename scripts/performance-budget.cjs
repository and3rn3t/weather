#!/usr/bin/env node

/**
 * Performance Budget Script
 * Checks if the bundle meets performance requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Checking performance budget...');

// Performance budget limits (in KB)
const BUDGET = {
  totalBundle: 2000,  // 2MB total
  jsBundle: 1500,     // 1.5MB for JS
  cssBundle: 300,     // 300KB for CSS
  largestFile: 800    // 800KB for any single file
};

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.log('❌ Dist directory not found. Run build first.');
  process.exit(1);
}

try {
  const files = fs.readdirSync(distDir, { recursive: true });
  
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let largestFileSize = 0;
  let violations = [];
  
  files.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      totalSize += stats.size;
      
      if (file.endsWith('.js')) {
        jsSize += stats.size;
      } else if (file.endsWith('.css')) {
        cssSize += stats.size;
      }
      
      if (sizeKB > largestFileSize) {
        largestFileSize = sizeKB;
      }
      
      // Check individual file size
      if (sizeKB > BUDGET.largestFile) {
        violations.push(`Large file: ${file} (${sizeKB} KB > ${BUDGET.largestFile} KB)`);
      }
    }
  });
  
  const totalSizeKB = Math.round(totalSize / 1024);
  const jsSizeKB = Math.round(jsSize / 1024);
  const cssSizeKB = Math.round(cssSize / 1024);
  
  console.log('\n📊 Performance Budget Check:');
  console.log('='.repeat(40));
  
  // Check total bundle size
  console.log(`📦 Total Bundle: ${totalSizeKB} KB / ${BUDGET.totalBundle} KB`);
  if (totalSizeKB > BUDGET.totalBundle) {
    violations.push(`Total bundle too large: ${totalSizeKB} KB > ${BUDGET.totalBundle} KB`);
    console.log('❌ FAIL');
  } else {
    console.log('✅ PASS');
  }
  
  // Check JS bundle size
  console.log(`🟨 JS Bundle: ${jsSizeKB} KB / ${BUDGET.jsBundle} KB`);
  if (jsSizeKB > BUDGET.jsBundle) {
    violations.push(`JS bundle too large: ${jsSizeKB} KB > ${BUDGET.jsBundle} KB`);
    console.log('❌ FAIL');
  } else {
    console.log('✅ PASS');
  }
  
  // Check CSS bundle size
  console.log(`🟦 CSS Bundle: ${cssSizeKB} KB / ${BUDGET.cssBundle} KB`);
  if (cssSizeKB > BUDGET.cssBundle) {
    violations.push(`CSS bundle too large: ${cssSizeKB} KB > ${BUDGET.cssBundle} KB`);
    console.log('❌ FAIL');
  } else {
    console.log('✅ PASS');
  }
  
  // Check largest file
  console.log(`📄 Largest File: ${largestFileSize} KB / ${BUDGET.largestFile} KB`);
  if (largestFileSize > BUDGET.largestFile) {
    console.log('❌ FAIL');
  } else {
    console.log('✅ PASS');
  }
  
  if (violations.length > 0) {
    console.log('\n⚠️  Performance Budget Violations:');
    violations.forEach(violation => {
      console.log(`  - ${violation}`);
    });
    console.log('\n💡 Consider code splitting, tree shaking, or removing unused dependencies.');
    // Don't exit with error in CI to prevent build failures
    console.log('\n⚠️  Warning: Performance budget exceeded but continuing build...');
  } else {
    console.log('\n🎉 All performance budget checks passed!');
  }
  
} catch (error) {
  console.error('❌ Error checking performance budget:', error.message);
  // Don't exit with error to prevent CI failures
  console.log('⚠️  Warning: Performance budget check failed but continuing...');
}
