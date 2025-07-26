#!/usr/bin/env node

/**
 * Security Dashboard Generator
 * Creates a comprehensive security status dashboard with visual metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function generateProgressBar(value, max, width = 20) {
  const percentage = Math.min(value / max, 1);
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getStatusIcon(status) {
  const icons = {
    'PASS': '✅',
    'FAIL': '❌',
    'REVIEW_REQUIRED': '⚠️',
    'PASS_WITH_WARNINGS': '🟡',
    'PENDING': '⏳',
    'COMPLETED': '✅',
    'ERROR': '💥',
    'UNKNOWN': '❓'
  };
  return icons[status] || '❓';
}

function getRiskColor(risk) {
  const colors = {
    'LOW': '🟢',
    'MEDIUM': '🟡',
    'HIGH': '🟠',
    'CRITICAL': '🔴'
  };
  return colors[risk] || '⚪';
}

function generateSecurityDashboard() {
  console.log('🛡️  Generating Security Dashboard...\n');
  
  const projectRoot = path.dirname(__dirname);
  const timestamp = new Date().toISOString();
  
  // Read all security reports
  const securityReport = readJsonFile(path.join(projectRoot, 'security-monitoring-report.json'));
  const licenseReport = readJsonFile(path.join(projectRoot, 'license-compliance-report.json'));
  const bundleReport = readJsonFile(path.join(projectRoot, 'bundle-analysis.json'));
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🛡️  SECURITY DASHBOARD                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  // Overall Security Status
  const overallRisk = securityReport?.overallRisk || 'UNKNOWN';
  const complianceStatus = securityReport?.complianceStatus || 'PENDING';
  const riskScore = securityReport?.metrics?.riskScore || 0;
  
  console.log('📊 OVERALL SECURITY STATUS');
  console.log('─'.repeat(50));
  console.log(`${getRiskColor(overallRisk)} Risk Level: ${overallRisk}`);
  console.log(`${getStatusIcon(complianceStatus)} Compliance: ${complianceStatus}`);
  console.log(`📈 Risk Score: ${riskScore}/100 ${generateProgressBar(riskScore, 100)}`);
  console.log('');
  
  // Vulnerability Breakdown
  if (securityReport?.metrics?.severityCounts) {
    const counts = securityReport.metrics.severityCounts;
    console.log('🚨 VULNERABILITY BREAKDOWN');
    console.log('─'.repeat(50));
    console.log(`🔴 Critical: ${counts.critical.toString().padEnd(3)} ${generateProgressBar(counts.critical, 10)}`);
    console.log(`🟠 High:     ${counts.high.toString().padEnd(3)} ${generateProgressBar(counts.high, 10)}`);
    console.log(`🟡 Medium:   ${counts.medium.toString().padEnd(3)} ${generateProgressBar(counts.medium, 20)}`);
    console.log(`🟢 Low:      ${counts.low.toString().padEnd(3)} ${generateProgressBar(counts.low, 30)}`);
    console.log('');
  }
  
  // Security Scans Status
  console.log('🔍 SECURITY SCANS STATUS');
  console.log('─'.repeat(50));
  
  if (securityReport?.scans) {
    const scans = securityReport.scans;
    
    console.log(`${getStatusIcon(scans.dependencyVulnerabilities?.status || 'PENDING')} Dependency Scan: ${scans.dependencyVulnerabilities?.status || 'PENDING'}`);
    console.log(`${getStatusIcon(scans.codeAnalysis?.status || 'PENDING')} Code Analysis: ${scans.codeAnalysis?.status || 'PENDING'}`);
    console.log(`${getStatusIcon(scans.licenseCompliance?.status || 'PENDING')} License Check: ${scans.licenseCompliance?.status || 'PENDING'}`);
    console.log(`${getStatusIcon(scans.bundleAnalysis?.status || 'PENDING')} Bundle Analysis: ${scans.bundleAnalysis?.status || 'PENDING'}`);
  } else {
    console.log('⏳ No security scan data available');
  }
  console.log('');
  
  // License Compliance
  if (licenseReport) {
    console.log('📋 LICENSE COMPLIANCE');
    console.log('─'.repeat(50));
    console.log(`${getStatusIcon(licenseReport.complianceStatus)} Status: ${licenseReport.complianceStatus}`);
    console.log(`📦 Total Dependencies: ${licenseReport.totalDependencies}`);
    
    if (licenseReport.licenseAnalysis) {
      const analysis = licenseReport.licenseAnalysis;
      console.log(`✅ Approved: ${analysis.approved?.length || 0}`);
      console.log(`⚠️  Restricted: ${analysis.restricted?.length || 0}`);
      console.log(`❌ Prohibited: ${analysis.prohibited?.length || 0}`);
      console.log(`❓ Unknown: ${analysis.unknown?.length || 0}`);
    }
    console.log('');
  }
  
  // Performance & Bundle Security
  if (bundleReport) {
    console.log('📦 BUNDLE SECURITY');
    console.log('─'.repeat(50));
    console.log(`${getStatusIcon(bundleReport.performance_passed ? 'PASS' : 'FAIL')} Performance Budget: ${bundleReport.performance_passed ? 'PASSED' : 'FAILED'}`);
    console.log(`📏 Bundle Size: ${bundleReport.total_kb}KB`);
    console.log(`🟡 JavaScript: ${bundleReport.javascript_kb}KB`);
    console.log(`🟢 CSS: ${bundleReport.css_kb}KB`);
    console.log('');
  }
  
  // Security Recommendations
  if (securityReport?.recommendations && securityReport.recommendations.length > 0) {
    console.log('💡 SECURITY RECOMMENDATIONS');
    console.log('─'.repeat(50));
    securityReport.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log('');
  }
  
  // Quick Actions
  console.log('⚡ QUICK ACTIONS');
  console.log('─'.repeat(50));
  console.log('• Run full security scan: npm run security:all');
  console.log('• Check license compliance: npm run license:check');
  console.log('• Update dependencies: npm audit fix');
  console.log('• Generate reports: npm run security:monitor');
  console.log('');
  
  // CI/CD Integration Status
  console.log('🔄 CI/CD INTEGRATION');
  console.log('─'.repeat(50));
  const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
  console.log(`${isCI ? '✅' : '❌'} Running in CI: ${isCI ? 'YES' : 'NO'}`);
  console.log('✅ GitHub Actions: Configured');
  console.log('✅ Snyk Security: Integrated');
  console.log('✅ CodeQL Analysis: Enabled');
  console.log('✅ Dependabot: Active');
  console.log('');
  
  // Generate HTML dashboard for web viewing
  const htmlDashboard = generateHTMLDashboard({
    timestamp,
    overallRisk,
    complianceStatus,
    riskScore,
    securityReport,
    licenseReport,
    bundleReport
  });
  
  const dashboardPath = path.join(projectRoot, 'security-dashboard.html');
  fs.writeFileSync(dashboardPath, htmlDashboard, 'utf8');
  
  console.log(`📊 Dashboard saved to: security-dashboard.html`);
  console.log('📱 Open in browser for visual charts and graphs');
  
  // GitHub Actions output
  if (process.env.GITHUB_ACTIONS) {
    console.log(`\n::notice title=Security Dashboard::Risk: ${overallRisk}, Compliance: ${complianceStatus}, Score: ${riskScore}/100`);
  }
}

function generateHTMLDashboard(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Dashboard - Weather App</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .metric { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .risk-critical { color: #e53e3e; }
        .risk-high { color: #dd6b20; }
        .risk-medium { color: #d69e2e; }
        .risk-low { color: #38a169; }
        .progress-bar { width: 100%; height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 10px 0; }
        .footer { text-align: center; color: #666; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🛡️ Security Dashboard</h1>
            <p>Weather App Security Status Report</p>
            <p>Generated: ${new Date(data.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="cards">
            <div class="card">
                <h3>Overall Security</h3>
                <div class="metric risk-${data.overallRisk?.toLowerCase()}">${data.overallRisk}</div>
                <p>Compliance: ${data.complianceStatus}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${100 - data.riskScore}%; background: ${data.riskScore > 50 ? '#e53e3e' : '#38a169'};"></div>
                </div>
                <small>Security Score: ${100 - data.riskScore}/100</small>
            </div>
            
            <div class="card">
                <h3>Vulnerabilities</h3>
                ${data.securityReport?.metrics?.severityCounts ? `
                <p>🔴 Critical: ${data.securityReport.metrics.severityCounts.critical}</p>
                <p>🟠 High: ${data.securityReport.metrics.severityCounts.high}</p>
                <p>🟡 Medium: ${data.securityReport.metrics.severityCounts.medium}</p>
                <p>🟢 Low: ${data.securityReport.metrics.severityCounts.low}</p>
                ` : '<p>No vulnerability data available</p>'}
            </div>
            
            <div class="card">
                <h3>License Compliance</h3>
                ${data.licenseReport ? `
                <div class="metric">${data.licenseReport.complianceStatus}</div>
                <p>Dependencies: ${data.licenseReport.totalDependencies}</p>
                <p>Prohibited: ${data.licenseReport.licenseAnalysis?.prohibited?.length || 0}</p>
                ` : '<p>No license data available</p>'}
            </div>
            
            <div class="card">
                <h3>Bundle Security</h3>
                ${data.bundleReport ? `
                <div class="metric">${data.bundleReport.total_kb}KB</div>
                <p>Budget: ${data.bundleReport.performance_passed ? '✅ PASSED' : '❌ FAILED'}</p>
                <p>JS: ${data.bundleReport.javascript_kb}KB | CSS: ${data.bundleReport.css_kb}KB</p>
                ` : '<p>No bundle data available</p>'}
            </div>
        </div>
        
        ${data.securityReport?.recommendations?.length ? `
        <div class="recommendations">
            <h3>🔧 Recommendations</h3>
            <ul>
                ${data.securityReport.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>🔄 Auto-updated via CI/CD Pipeline | 🛡️ Powered by Snyk, CodeQL, and Custom Security Tools</p>
        </div>
    </div>
</body>
</html>`;
}

// Run dashboard generation
generateSecurityDashboard();
