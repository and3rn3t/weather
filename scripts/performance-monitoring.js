#!/usr/bin/env node

/**
 * Advanced Performance Monitoring Script
 * Tracks performance metrics, generates historical trends, and provides insights
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance thresholds and targets
const PERFORMANCE_TARGETS = {
  lighthouse: {
    performance: 85,
    accessibility: 95,
    bestPractices: 90,
    seo: 85,
    pwa: 70
  },
  webVitals: {
    lcp: 2500,  // Largest Contentful Paint (ms)
    fid: 100,   // First Input Delay (ms)
    cls: 0.1    // Cumulative Layout Shift
  },
  bundle: {
    totalSize: 600 * 1024,      // 600KB
    javascriptSize: 500 * 1024, // 500KB
    cssSize: 100 * 1024,        // 100KB
    loadTime: 3000              // 3 seconds
  },
  build: {
    maxBuildTime: 60000,        // 60 seconds
    maxDependencies: 1000,      // Max package count
    treeshakingEfficiency: 0.8   // 80% efficiency target
  }
};

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Warning: Could not read ${filePath}:`, error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function generateScoreBar(score, max = 100, width = 20) {
  const percentage = Math.min(score / max, 1);
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  
  let color = '🔴'; // Red for poor
  if (percentage >= 0.9) color = '🟢'; // Green for excellent
  else if (percentage >= 0.7) color = '🟡'; // Yellow for good
  else if (percentage >= 0.5) color = '🟠'; // Orange for needs improvement
  
  return `${color} ${'█'.repeat(filled)}${'░'.repeat(empty)} ${score}/${max}`;
}

function calculateTrend(current, previous) {
  if (!previous) return { trend: '➖', change: 0 };
  
  const change = ((current - previous) / previous * 100);
  if (Math.abs(change) < 1) return { trend: '➖', change: 0 };
  
  return {
    trend: change > 0 ? '📈' : '📉',
    change: Math.round(change)
  };
}

function loadHistoricalData() {
  const projectRoot = path.dirname(__dirname);
  const historyPath = path.join(projectRoot, 'performance-history.json');
  
  const history = readJsonFile(historyPath) || { metrics: [] };
  return history;
}

function saveHistoricalData(newMetrics) {
  const projectRoot = path.dirname(__dirname);
  const historyPath = path.join(projectRoot, 'performance-history.json');
  
  const history = loadHistoricalData();
  history.metrics.push(newMetrics);
  
  // Keep only last 30 entries for manageable file size
  if (history.metrics.length > 30) {
    history.metrics = history.metrics.slice(-30);
  }
  
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
}

function analyzeLighthouseReports() {
  const projectRoot = path.dirname(__dirname);
  const reportsDir = path.join(projectRoot, 'lighthouse-reports');
  
  if (!fs.existsSync(reportsDir)) {
    return null;
  }
  
  try {
    const reportFiles = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-1); // Get latest report
    
    if (reportFiles.length === 0) {
      return null;
    }
    
    const latestReport = readJsonFile(path.join(reportsDir, reportFiles[0]));
    if (!latestReport?.categories) {
      return null;
    }
    
    return {
      performance: Math.round(latestReport.categories.performance?.score * 100) || 0,
      accessibility: Math.round(latestReport.categories.accessibility?.score * 100) || 0,
      bestPractices: Math.round(latestReport.categories['best-practices']?.score * 100) || 0,
      seo: Math.round(latestReport.categories.seo?.score * 100) || 0,
      pwa: Math.round(latestReport.categories.pwa?.score * 100) || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('⚠️  Warning: Could not analyze Lighthouse reports:', error.message);
    return null;
  }
}

function generatePerformanceReport() {
  console.log('📊 Advanced Performance Monitoring Starting...');
  
  const projectRoot = path.dirname(__dirname);
  const timestamp = new Date().toISOString();
  
  // Collect current metrics
  const bundleReport = readJsonFile(path.join(projectRoot, 'bundle-analysis.json'));
  const securityReport = readJsonFile(path.join(projectRoot, 'security-monitoring-report.json'));
  const lighthouseData = analyzeLighthouseReports();
  const packageJson = readJsonFile(path.join(projectRoot, 'package.json'));
  
  // Load historical data for trends
  const history = loadHistoricalData();
  const previousMetrics = history.metrics.length > 0 ? history.metrics[history.metrics.length - 1] : null;
  
  const currentMetrics = {
    timestamp,
    bundle: {
      totalSize: bundleReport?.total_kb || 0,
      jsSize: bundleReport?.javascript_kb || 0,
      cssSize: bundleReport?.css_kb || 0,
      performancePassed: bundleReport?.performance_passed || false
    },
    security: {
      riskScore: securityReport?.metrics?.riskScore || 0,
      vulnerabilities: securityReport?.metrics?.totalVulnerabilities || 0,
      complianceStatus: securityReport?.complianceStatus || 'UNKNOWN'
    },
    lighthouse: lighthouseData || {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      pwa: 0
    },
    dependencies: {
      total: Object.keys({
        ...packageJson?.dependencies,
        ...packageJson?.devDependencies
      }).length || 0
    }
  };
  
  // Calculate trends
  const trends = {
    bundleSize: calculateTrend(currentMetrics.bundle.totalSize, previousMetrics?.bundle?.totalSize),
    lighthouse: calculateTrend(
      (currentMetrics.lighthouse.performance + currentMetrics.lighthouse.accessibility) / 2,
      previousMetrics?.lighthouse ? (previousMetrics.lighthouse.performance + previousMetrics.lighthouse.accessibility) / 2 : null
    ),
    security: calculateTrend(100 - currentMetrics.security.riskScore, previousMetrics?.security ? 100 - previousMetrics.security.riskScore : null)
  };
  
  // Generate comprehensive report
  const report = {
    timestamp,
    metrics: currentMetrics,
    trends,
    targets: PERFORMANCE_TARGETS,
    recommendations: [],
    overallScore: 0,
    alerts: []
  };
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                📊 PERFORMANCE DASHBOARD                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  // Bundle Performance Analysis
  console.log('📦 BUNDLE PERFORMANCE');
  console.log('─'.repeat(50));
  console.log(`${generateScoreBar(Math.max(0, 600 - currentMetrics.bundle.totalSize), 600)} Total Size: ${currentMetrics.bundle.totalSize}KB ${trends.bundleSize.trend}`);
  console.log(`${generateScoreBar(Math.max(0, 500 - currentMetrics.bundle.jsSize), 500)} JavaScript: ${currentMetrics.bundle.jsSize}KB`);
  console.log(`${generateScoreBar(Math.max(0, 100 - currentMetrics.bundle.cssSize), 100)} CSS: ${currentMetrics.bundle.cssSize}KB`);
  console.log(`${currentMetrics.bundle.performancePassed ? '✅' : '❌'} Performance Budget: ${currentMetrics.bundle.performancePassed ? 'PASSED' : 'FAILED'}`);
  console.log('');
  
  // Lighthouse Scores
  if (currentMetrics.lighthouse.performance > 0) {
    console.log('🔍 LIGHTHOUSE SCORES');
    console.log('─'.repeat(50));
    console.log(`${generateScoreBar(currentMetrics.lighthouse.performance)} Performance ${trends.lighthouse.trend}`);
    console.log(`${generateScoreBar(currentMetrics.lighthouse.accessibility)} Accessibility`);
    console.log(`${generateScoreBar(currentMetrics.lighthouse.bestPractices)} Best Practices`);
    console.log(`${generateScoreBar(currentMetrics.lighthouse.seo)} SEO`);
    console.log(`${generateScoreBar(currentMetrics.lighthouse.pwa)} PWA`);
    console.log('');
  }
  
  // Security Performance
  console.log('🛡️ SECURITY PERFORMANCE');
  console.log('─'.repeat(50));
  console.log(`${generateScoreBar(100 - currentMetrics.security.riskScore)} Security Score ${trends.security.trend}`);
  console.log(`${currentMetrics.security.vulnerabilities === 0 ? '✅' : '❌'} Vulnerabilities: ${currentMetrics.security.vulnerabilities}`);
  console.log(`${currentMetrics.security.complianceStatus === 'PASS' ? '✅' : '❌'} Compliance: ${currentMetrics.security.complianceStatus}`);
  console.log('');
  
  // Dependency Health
  console.log('📋 DEPENDENCY HEALTH');
  console.log('─'.repeat(50));
  console.log(`${generateScoreBar(Math.max(0, 1000 - currentMetrics.dependencies.total), 1000)} Package Count: ${currentMetrics.dependencies.total}`);
  console.log('');
  
  // Performance Recommendations
  const recommendations = [];
  
  if (currentMetrics.bundle.totalSize > PERFORMANCE_TARGETS.bundle.totalSize * 0.001) {
    recommendations.push('🚨 Bundle size exceeds 600KB - implement code splitting');
  }
  
  if (currentMetrics.lighthouse.performance < PERFORMANCE_TARGETS.lighthouse.performance && currentMetrics.lighthouse.performance > 0) {
    recommendations.push('🔍 Lighthouse performance below 85% - optimize loading times');
  }
  
  if (currentMetrics.security.vulnerabilities > 0) {
    recommendations.push('🛡️ Security vulnerabilities detected - run security scans');
  }
  
  if (currentMetrics.dependencies.total > PERFORMANCE_TARGETS.build.maxDependencies) {
    recommendations.push('📦 High dependency count - audit and remove unused packages');
  }
  
  if (trends.bundleSize.change > 10) {
    recommendations.push('📈 Bundle size increased significantly - review recent changes');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('🎉 Excellent performance metrics - maintain current practices');
  }
  
  report.recommendations = recommendations;
  
  // Display recommendations
  console.log('💡 PERFORMANCE RECOMMENDATIONS');
  console.log('─'.repeat(50));
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  console.log('');
  
  // Historical Trends
  if (history.metrics.length > 1) {
    console.log('📈 HISTORICAL TRENDS (Last 7 Days)');
    console.log('─'.repeat(50));
    console.log(`Bundle Size: ${trends.bundleSize.change}% ${trends.bundleSize.trend}`);
    console.log(`Lighthouse: ${trends.lighthouse.change}% ${trends.lighthouse.trend}`);
    console.log(`Security: ${trends.security.change}% ${trends.security.trend}`);
    console.log('');
  }
  
  // Calculate overall score
  let overallScore = 0;
  let scoreComponents = 0;
  
  if (currentMetrics.bundle.performancePassed) {
    overallScore += 25;
    scoreComponents++;
  }
  
  if (currentMetrics.lighthouse.performance > 0) {
    overallScore += (currentMetrics.lighthouse.performance * 0.25);
    scoreComponents++;
  }
  
  if (currentMetrics.security.riskScore === 0) {
    overallScore += 25;
    scoreComponents++;
  }
  
  if (currentMetrics.dependencies.total < PERFORMANCE_TARGETS.build.maxDependencies) {
    overallScore += 25;
    scoreComponents++;
  }
  
  report.overallScore = scoreComponents > 0 ? Math.round(overallScore / scoreComponents * 4) : 0;
  
  console.log('🏆 OVERALL PERFORMANCE SCORE');
  console.log('─'.repeat(50));
  console.log(`${generateScoreBar(report.overallScore)} Overall: ${report.overallScore}%`);
  console.log('');
  
  // Save metrics and generate reports
  saveHistoricalData(currentMetrics);
  
  const reportPath = path.join(projectRoot, 'performance-monitoring-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📄 Performance report saved to: ${reportPath}`);
  
  // CI Integration
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('\n📊 GitHub Actions Summary:');
    console.log(`::notice title=Performance Monitoring::Overall Score: ${report.overallScore}%, Bundle: ${currentMetrics.bundle.totalSize}KB, Security: ${100 - currentMetrics.security.riskScore}%`);
    
    if (report.overallScore < 80) {
      console.log(`::warning title=Performance Alert::Overall performance below 80% - review recommendations`);
    }
    
    console.log(`::set-output name=performance-score::${report.overallScore}`);
    console.log(`::set-output name=bundle-size::${currentMetrics.bundle.totalSize}`);
  }
  
  return report;
}

// Run performance monitoring
generatePerformanceReport();
