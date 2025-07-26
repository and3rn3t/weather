#!/usr/bin/env node

/**
 * Performance Budget Enforcement for CI/CD
 * Fails the build if performance targets are not met
 */

import fs from 'fs';
import path from 'path';

// Performance thresholds (in KB)
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets
  javascript_max: 500,
  css_max: 100,
  total_max: 600,
  
  // Performance metrics (when available)
  lighthouse_performance_min: 90,
  first_contentful_paint_max: 2000, // ms
  largest_contentful_paint_max: 4000, // ms
  
  // Dependencies
  dependencies_max: 50, // number of dependencies
  dev_dependencies_max: 100
};

function checkBundleSize() {
  console.log('📊 Checking Bundle Size Performance Budget...');
  
  if (!fs.existsSync('bundle-analysis.json')) {
    console.error('❌ bundle-analysis.json not found. Run bundle analysis first.');
    process.exit(1);
  }
  
  let analysis;
  try {
    const fileContent = fs.readFileSync('bundle-analysis.json', 'utf8');
    // Clean content for parsing
    const cleanContent = fileContent.replace(/^\uFEFF/, '').trim();
    analysis = JSON.parse(cleanContent);
    
    // Handle both formats (our Node.js format and PowerShell format)
    if (!analysis.javascript_kb && analysis.chunk_count) {
      // Convert PowerShell format to our expected format
      analysis = {
        javascript_kb: analysis.javascript_kb || 0,
        css_kb: analysis.css_kb || 0,
        total_kb: analysis.total_kb || 0,
        performance_passed: analysis.performance_passed || false
      };
    }
  } catch (error) {
    console.error('❌ Failed to parse bundle-analysis.json:', error.message);
    console.log('File content preview:', fs.readFileSync('bundle-analysis.json', 'utf8').substring(0, 100));
    process.exit(1);
  }
  
  let failed = false;
  
  // Check JavaScript size
  if (analysis.javascript_kb > PERFORMANCE_BUDGETS.javascript_max) {
    console.error(`❌ JavaScript bundle too large: ${analysis.javascript_kb}KB > ${PERFORMANCE_BUDGETS.javascript_max}KB`);
    failed = true;
  } else {
    console.log(`✅ JavaScript bundle size OK: ${analysis.javascript_kb}KB`);
  }
  
  // Check CSS size
  if (analysis.css_kb > PERFORMANCE_BUDGETS.css_max) {
    console.error(`❌ CSS bundle too large: ${analysis.css_kb}KB > ${PERFORMANCE_BUDGETS.css_max}KB`);
    failed = true;
  } else {
    console.log(`✅ CSS bundle size OK: ${analysis.css_kb}KB`);
  }
  
  // Check total size
  if (analysis.total_kb > PERFORMANCE_BUDGETS.total_max) {
    console.error(`❌ Total bundle too large: ${analysis.total_kb}KB > ${PERFORMANCE_BUDGETS.total_max}KB`);
    failed = true;
  } else {
    console.log(`✅ Total bundle size OK: ${analysis.total_kb}KB`);
  }
  
  return !failed;
}

function checkDependencyCount() {
  console.log('\n📦 Checking Dependency Count Budget...');
  
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found');
    return false;
  }
  
  let packageJson;
  try {
    const fileContent = fs.readFileSync('package.json', 'utf8');
    packageJson = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Failed to parse package.json:', error.message);
    return false;
  }
  
  const depCount = Object.keys(packageJson.dependencies || {}).length;
  const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
  
  let failed = false;
  
  if (depCount > PERFORMANCE_BUDGETS.dependencies_max) {
    console.error(`❌ Too many dependencies: ${depCount} > ${PERFORMANCE_BUDGETS.dependencies_max}`);
    failed = true;
  } else {
    console.log(`✅ Dependency count OK: ${depCount}`);
  }
  
  if (devDepCount > PERFORMANCE_BUDGETS.dev_dependencies_max) {
    console.error(`❌ Too many dev dependencies: ${devDepCount} > ${PERFORMANCE_BUDGETS.dev_dependencies_max}`);
    failed = true;
  } else {
    console.log(`✅ Dev dependency count OK: ${devDepCount}`);
  }
  
  return !failed;
}

function generatePerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    budgets: PERFORMANCE_BUDGETS,
    results: {
      bundle_size_passed: false,
      dependency_count_passed: false,
      overall_passed: false
    }
  };
  
  // Check bundle size
  report.results.bundle_size_passed = checkBundleSize();
  
  // Check dependency count
  report.results.dependency_count_passed = checkDependencyCount();
  
  // Overall result
  report.results.overall_passed = report.results.bundle_size_passed && 
                                  report.results.dependency_count_passed;
  
  // Write performance report
  fs.writeFileSync('performance-budget.json', JSON.stringify(report, null, 2));
  
  console.log('\n📋 Performance Budget Summary:');
  console.log(`  Bundle Size: ${report.results.bundle_size_passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Dependencies: ${report.results.dependency_count_passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Overall: ${report.results.overall_passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('\n📊 GitHub Actions Output:');
    console.log(`::notice title=Performance Budget::${report.results.overall_passed ? 'All checks passed' : 'Some checks failed'}`);
    
    if (!report.results.bundle_size_passed) {
      console.log(`::error title=Bundle Size Budget::Bundle size exceeds performance budget`);
    }
    
    if (!report.results.dependency_count_passed) {
      console.log(`::warning title=Dependency Budget::Too many dependencies detected`);
    }
  }
  
  return report.results.overall_passed;
}

// Main execution
console.log('🎯 Performance Budget Enforcement Starting...');
console.log('=' .repeat(50));

const passed = generatePerformanceReport();

if (passed) {
  console.log('\n🎉 All performance budgets met!');
  process.exit(0);
} else {
  console.log('\n💥 Performance budget enforcement failed!');
  process.exit(1);
}
