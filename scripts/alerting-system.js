#!/usr/bin/env node

/**
 * Intelligent Alerting System
 * Monitors performance metrics and sends notifications for critical issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Alert thresholds and configurations
const ALERT_THRESHOLDS = {
  critical: {
    bundleSize: 700 * 1024,        // 700KB
    lighthousePerformance: 60,     // Below 60%
    securityRisk: 50,              // Risk score above 50
    buildTime: 120000,             // 2 minutes
    errorRate: 0.05                // 5% error rate
  },
  warning: {
    bundleSize: 600 * 1024,        // 600KB
    lighthousePerformance: 80,     // Below 80%
    securityRisk: 20,              // Risk score above 20
    buildTime: 90000,              // 1.5 minutes
    errorRate: 0.02                // 2% error rate
  },
  info: {
    bundleSize: 500 * 1024,        // 500KB
    lighthousePerformance: 90,     // Below 90%
    securityRisk: 10,              // Risk score above 10
    buildTime: 60000,              // 1 minute
    errorRate: 0.01                // 1% error rate
  }
};

// Notification channels configuration
const NOTIFICATION_CHANNELS = {
  console: true,
  github: true,
  slack: process.env.SLACK_WEBHOOK_URL ? true : false,
  email: process.env.EMAIL_SERVICE ? true : false,
  teams: process.env.TEAMS_WEBHOOK_URL ? true : false
};

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function getAlertLevel(metric, value) {
  const thresholds = ALERT_THRESHOLDS;
  
  // For metrics where lower is better (bundle size, build time, security risk)
  const lowerIsBetter = ['bundleSize', 'buildTime', 'securityRisk', 'errorRate'];
  
  // For metrics where higher is better (lighthouse scores)
  const higherIsBetter = ['lighthousePerformance'];
  
  if (lowerIsBetter.includes(metric)) {
    if (value >= thresholds.critical[metric]) return 'CRITICAL';
    if (value >= thresholds.warning[metric]) return 'WARNING';
    if (value >= thresholds.info[metric]) return 'INFO';
    return 'OK';
  }
  
  if (higherIsBetter.includes(metric)) {
    if (value <= thresholds.critical[metric]) return 'CRITICAL';
    if (value <= thresholds.warning[metric]) return 'WARNING';
    if (value <= thresholds.info[metric]) return 'INFO';
    return 'OK';
  }
  
  return 'OK';
}

function generateAlert(level, title, message, metric, value, threshold) {
  const icons = {
    'CRITICAL': '🚨',
    'WARNING': '⚠️',
    'INFO': 'ℹ️',
    'OK': '✅'
  };
  
  const colors = {
    'CRITICAL': '#dc3545',  // Red
    'WARNING': '#ffc107',   // Yellow
    'INFO': '#17a2b8',      // Blue
    'OK': '#28a745'         // Green
  };
  
  return {
    timestamp: new Date().toISOString(),
    level,
    title,
    message,
    metric,
    value,
    threshold,
    icon: icons[level],
    color: colors[level],
    actionRequired: level === 'CRITICAL' || level === 'WARNING'
  };
}

function sendConsoleAlert(alert) {
  const timestamp = new Date(alert.timestamp).toLocaleTimeString();
  console.log(`\n${alert.icon} [${alert.level}] ${timestamp}`);
  console.log(`📋 ${alert.title}`);
  console.log(`💬 ${alert.message}`);
  
  if (alert.metric && alert.value !== undefined) {
    console.log(`📊 Metric: ${alert.metric} = ${alert.value}`);
    if (alert.threshold) {
      console.log(`🎯 Threshold: ${alert.threshold}`);
    }
  }
  
  if (alert.actionRequired) {
    console.log(`🔧 Action Required: ${alert.level === 'CRITICAL' ? 'IMMEDIATE' : 'REVIEW'}`);
  }
  console.log('─'.repeat(50));
}

function sendGitHubAlert(alert) {
  if (!process.env.GITHUB_ACTIONS) return;
  
  const command = {
    'CRITICAL': 'error',
    'WARNING': 'warning',
    'INFO': 'notice',
    'OK': 'notice'
  }[alert.level];
  
  console.log(`::${command} title=${alert.title}::${alert.message}`);
}

async function sendSlackAlert(alert) {
  if (!NOTIFICATION_CHANNELS.slack || !process.env.SLACK_WEBHOOK_URL) return;
  
  const payload = {
    text: `${alert.icon} ${alert.title}`,
    attachments: [{
      color: alert.color,
      fields: [
        { title: 'Level', value: alert.level, short: true },
        { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true },
        { title: 'Message', value: alert.message, short: false }
      ]
    }]
  };
  
  try {
    // Note: In a real implementation, you'd use fetch or axios here
    console.log(`📱 Would send Slack alert: ${JSON.stringify(payload, null, 2)}`);
  } catch (error) {
    console.warn('⚠️  Failed to send Slack alert:', error.message);
  }
}

function analyzeMetricsAndAlert() {
  console.log('🔔 Intelligent Alerting System Starting...');
  
  const projectRoot = path.dirname(__dirname);
  
  // Read current metrics
  const performanceReport = readJsonFile(path.join(projectRoot, 'performance-monitoring-report.json'));
  const bundleReport = readJsonFile(path.join(projectRoot, 'bundle-analysis.json'));
  const securityReport = readJsonFile(path.join(projectRoot, 'security-monitoring-report.json'));
  
  const alerts = [];
  
  // Bundle size alerts
  if (bundleReport?.total_kb) {
    const bundleSizeBytes = bundleReport.total_kb * 1024;
    const alertLevel = getAlertLevel('bundleSize', bundleSizeBytes);
    
    if (alertLevel !== 'OK') {
      alerts.push(generateAlert(
        alertLevel,
        'Bundle Size Alert',
        `Bundle size is ${bundleReport.total_kb}KB (${alertLevel.toLowerCase()} threshold exceeded)`,
        'bundleSize',
        `${bundleReport.total_kb}KB`,
        `${Math.round(ALERT_THRESHOLDS[alertLevel.toLowerCase()].bundleSize / 1024)}KB`
      ));
    }
  }
  
  // Lighthouse performance alerts
  if (performanceReport?.metrics?.lighthouse?.performance) {
    const perfScore = performanceReport.metrics.lighthouse.performance;
    const alertLevel = getAlertLevel('lighthousePerformance', perfScore);
    
    if (alertLevel !== 'OK') {
      alerts.push(generateAlert(
        alertLevel,
        'Lighthouse Performance Alert',
        `Performance score is ${perfScore}% (below ${alertLevel.toLowerCase()} threshold)`,
        'lighthousePerformance',
        `${perfScore}%`,
        `${ALERT_THRESHOLDS[alertLevel.toLowerCase()].lighthousePerformance}%`
      ));
    }
  }
  
  // Security risk alerts
  if (securityReport?.metrics?.riskScore !== undefined) {
    const riskScore = securityReport.metrics.riskScore;
    const alertLevel = getAlertLevel('securityRisk', riskScore);
    
    if (alertLevel !== 'OK') {
      alerts.push(generateAlert(
        alertLevel,
        'Security Risk Alert',
        `Security risk score is ${riskScore}/100 (${alertLevel.toLowerCase()} threshold exceeded)`,
        'securityRisk',
        `${riskScore}/100`,
        `${ALERT_THRESHOLDS[alertLevel.toLowerCase()].securityRisk}/100`
      ));
    }
  }
  
  // Performance trend alerts
  if (performanceReport?.trends) {
    const { bundleSize, lighthouse, security } = performanceReport.trends;
    
    if (bundleSize.change > 20) {
      alerts.push(generateAlert(
        'WARNING',
        'Performance Regression Alert',
        `Bundle size increased by ${bundleSize.change}% - investigate recent changes`,
        'bundleTrend',
        `+${bundleSize.change}%`,
        '<10%'
      ));
    }
    
    if (lighthouse.change < -10) {
      alerts.push(generateAlert(
        'WARNING',
        'Lighthouse Score Regression',
        `Lighthouse scores decreased by ${Math.abs(lighthouse.change)}% - performance optimization needed`,
        'lighthouseTrend',
        `${lighthouse.change}%`,
        '>-5%'
      ));
    }
  }
  
  // Generate summary report
  const alertSummary = {
    timestamp: new Date().toISOString(),
    totalAlerts: alerts.length,
    alertsByLevel: {
      critical: alerts.filter(a => a.level === 'CRITICAL').length,
      warning: alerts.filter(a => a.level === 'WARNING').length,
      info: alerts.filter(a => a.level === 'INFO').length
    },
    alerts,
    systemStatus: alerts.filter(a => a.level === 'CRITICAL').length > 0 ? 'CRITICAL' : 
                 alerts.filter(a => a.level === 'WARNING').length > 0 ? 'WARNING' : 'HEALTHY',
    recommendedActions: []
  };
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                🔔 ALERTING DASHBOARD                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  console.log('📊 ALERT SUMMARY');
  console.log('─'.repeat(50));
  console.log(`🚨 Critical: ${alertSummary.alertsByLevel.critical}`);
  console.log(`⚠️  Warning: ${alertSummary.alertsByLevel.warning}`);
  console.log(`ℹ️  Info: ${alertSummary.alertsByLevel.info}`);
  console.log(`🎯 System Status: ${alertSummary.systemStatus}`);
  console.log('');
  
  // Send alerts through configured channels
  if (alerts.length > 0) {
    console.log('🔔 ACTIVE ALERTS');
    console.log('─'.repeat(50));
    
    for (const alert of alerts) {
      // Console alerts
      if (NOTIFICATION_CHANNELS.console) {
        sendConsoleAlert(alert);
      }
      
      // GitHub Actions alerts
      if (NOTIFICATION_CHANNELS.github) {
        sendGitHubAlert(alert);
      }
      
      // Slack alerts (simulated)
      if (NOTIFICATION_CHANNELS.slack) {
        sendSlackAlert(alert);
      }
    }
    
    // Generate recommended actions
    if (alertSummary.alertsByLevel.critical > 0) {
      alertSummary.recommendedActions.push('🚨 IMMEDIATE: Address critical performance issues');
      alertSummary.recommendedActions.push('🔧 Run performance optimization scripts');
      alertSummary.recommendedActions.push('📊 Review bundle analysis and lighthouse reports');
    }
    
    if (alertSummary.alertsByLevel.warning > 0) {
      alertSummary.recommendedActions.push('⚠️  REVIEW: Investigate warning-level issues within 24h');
      alertSummary.recommendedActions.push('📈 Monitor performance trends');
    }
    
    if (alertSummary.recommendedActions.length > 0) {
      console.log('\n💡 RECOMMENDED ACTIONS');
      console.log('─'.repeat(50));
      alertSummary.recommendedActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
      console.log('');
    }
  } else {
    console.log('✅ No alerts detected - all systems healthy!\n');
  }
  
  // Save alert summary
  const summaryPath = path.join(projectRoot, 'alert-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(alertSummary, null, 2), 'utf8');
  console.log(`📄 Alert summary saved to: ${summaryPath}`);
  
  // Exit with appropriate code
  if (alertSummary.alertsByLevel.critical > 0) {
    console.log('\n🚨 CRITICAL ALERTS DETECTED - Immediate action required!');
    process.exit(1);
  } else if (alertSummary.alertsByLevel.warning > 0) {
    console.log('\n⚠️  WARNING ALERTS DETECTED - Review recommended');
    process.exit(0);
  } else {
    console.log('\n🎉 All systems healthy - no alerts!');
    process.exit(0);
  }
}

// Run alerting analysis
analyzeMetricsAndAlert();
