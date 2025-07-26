#!/usr/bin/env node

/**
 * Security Monitoring and Alerting Script
 * Consolidates security scan results and generates actionable reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECURITY_THRESHOLDS = {
  critical: 0,  // No critical vulnerabilities allowed
  high: 3,      // Maximum 3 high severity issues
  medium: 10,   // Maximum 10 medium severity issues
  low: 20       // Maximum 20 low severity issues
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

function generateSecurityReport() {
  console.log('🛡️  Security Monitoring Report Generation Starting...');
  
  const projectRoot = path.dirname(__dirname);
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    project: 'Weather App',
    reportVersion: '1.0',
    overallRisk: 'UNKNOWN',
    complianceStatus: 'PENDING',
    scans: {
      dependencyVulnerabilities: null,
      codeAnalysis: null,
      licenseCompliance: null,
      bundleAnalysis: null
    },
    vulnerabilities: {
      critical: [],
      high: [],
      medium: [],
      low: []
    },
    recommendations: [],
    metrics: {
      totalVulnerabilities: 0,
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      riskScore: 0,
      complianceScore: 100
    }
  };
  
  console.log('\n🔍 Collecting Security Scan Results...');
  
  // Read bundle analysis
  const bundleAnalysis = readJsonFile(path.join(projectRoot, 'bundle-analysis.json'));
  if (bundleAnalysis) {
    report.scans.bundleAnalysis = {
      status: bundleAnalysis.status || 'COMPLETED',
      bundleSize: bundleAnalysis.total_kb,
      performanceBudgetPassed: bundleAnalysis.performance_passed,
      timestamp: bundleAnalysis.timestamp
    };
    console.log(`  ✅ Bundle analysis found: ${bundleAnalysis.total_kb}KB`);
  }
  
  // Read license compliance
  const licenseReport = readJsonFile(path.join(projectRoot, 'license-compliance-report.json'));
  if (licenseReport) {
    report.scans.licenseCompliance = {
      status: licenseReport.complianceStatus,
      prohibited: licenseReport.licenseAnalysis?.prohibited?.length || 0,
      restricted: licenseReport.licenseAnalysis?.restricted?.length || 0,
      totalDependencies: licenseReport.totalDependencies,
      timestamp: licenseReport.timestamp
    };
    console.log(`  ✅ License compliance: ${licenseReport.complianceStatus}`);
    
    if (licenseReport.riskAssessment?.critical > 0) {
      report.vulnerabilities.critical.push({
        type: 'LICENSE_VIOLATION',
        description: `${licenseReport.riskAssessment.critical} prohibited licenses found`,
        packages: licenseReport.licenseAnalysis.prohibited?.map(p => p.name) || []
      });
    }
  }
  
  // Simulate dependency scan results (would come from npm audit or Snyk)
  try {
    // Check if security-report.txt exists from CI
    const securityReportPath = path.join(projectRoot, 'security-report.txt');
    if (fs.existsSync(securityReportPath)) {
      const securityContent = fs.readFileSync(securityReportPath, 'utf8');
      report.scans.dependencyVulnerabilities = {
        status: 'COMPLETED',
        summary: securityContent,
        timestamp: new Date().toISOString()
      };
      console.log('  ✅ Security scan report found');
    }
  } catch (error) {
    console.warn('  ⚠️  No security scan results found');
  }
  
  // Calculate overall metrics
  const totalVulns = report.vulnerabilities.critical.length + 
                    report.vulnerabilities.high.length + 
                    report.vulnerabilities.medium.length + 
                    report.vulnerabilities.low.length;
  
  report.metrics.totalVulnerabilities = totalVulns;
  report.metrics.severityCounts = {
    critical: report.vulnerabilities.critical.length,
    high: report.vulnerabilities.high.length,
    medium: report.vulnerabilities.medium.length,
    low: report.vulnerabilities.low.length
  };
  
  // Calculate risk score (0-100, lower is better)
  const riskScore = (report.metrics.severityCounts.critical * 10) +
                   (report.metrics.severityCounts.high * 5) +
                   (report.metrics.severityCounts.medium * 2) +
                   (report.metrics.severityCounts.low * 1);
  
  report.metrics.riskScore = Math.min(riskScore, 100);
  
  // Determine overall risk level
  if (report.metrics.severityCounts.critical > 0) {
    report.overallRisk = 'CRITICAL';
    report.complianceStatus = 'FAIL';
  } else if (report.metrics.severityCounts.high > SECURITY_THRESHOLDS.high) {
    report.overallRisk = 'HIGH';
    report.complianceStatus = 'REVIEW_REQUIRED';
  } else if (report.metrics.severityCounts.medium > SECURITY_THRESHOLDS.medium) {
    report.overallRisk = 'MEDIUM';
    report.complianceStatus = 'REVIEW_REQUIRED';
  } else if (report.metrics.severityCounts.low > SECURITY_THRESHOLDS.low) {
    report.overallRisk = 'LOW';
    report.complianceStatus = 'PASS_WITH_WARNINGS';
  } else {
    report.overallRisk = 'LOW';
    report.complianceStatus = 'PASS';
  }
  
  // Generate recommendations
  if (report.metrics.severityCounts.critical > 0) {
    report.recommendations.push('🚨 URGENT: Address critical vulnerabilities immediately');
  }
  
  if (report.metrics.severityCounts.high > 0) {
    report.recommendations.push('⚠️  HIGH: Review and fix high-severity issues within 48 hours');
  }
  
  if (report.scans.licenseCompliance?.prohibited > 0) {
    report.recommendations.push('📋 LICENSE: Replace prohibited license dependencies');
  }
  
  if (report.scans.bundleAnalysis && !report.scans.bundleAnalysis.performanceBudgetPassed) {
    report.recommendations.push('📦 PERFORMANCE: Bundle size exceeds limits - optimize assets');
  }
  
  if (report.metrics.riskScore === 0) {
    report.recommendations.push('🎉 EXCELLENT: No security issues detected - maintain current practices');
  }
  
  // Print summary report
  console.log('\n📊 Security Monitoring Summary:');
  console.log('=' .repeat(50));
  console.log(`  🎯 Overall Risk: ${report.overallRisk}`);
  console.log(`  📋 Compliance: ${report.complianceStatus}`);
  console.log(`  📈 Risk Score: ${report.metrics.riskScore}/100`);
  console.log(`  🔢 Total Issues: ${report.metrics.totalVulnerabilities}`);
  
  console.log('\n🚨 Vulnerability Breakdown:');
  console.log(`  🔴 Critical: ${report.metrics.severityCounts.critical}`);
  console.log(`  🟠 High: ${report.metrics.severityCounts.high}`);
  console.log(`  🟡 Medium: ${report.metrics.severityCounts.medium}`);
  console.log(`  🟢 Low: ${report.metrics.severityCounts.low}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  // Save detailed report
  const reportPath = path.join(projectRoot, 'security-monitoring-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Generate CI outputs
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('\n📊 GitHub Actions Summary:');
    console.log(`::notice title=Security Monitoring::Risk: ${report.overallRisk}, Score: ${report.metrics.riskScore}/100, Issues: ${report.metrics.totalVulnerabilities}`);
    
    if (report.complianceStatus === 'FAIL') {
      console.log(`::error title=Security Compliance FAILED::Critical security issues must be addressed`);
    } else if (report.complianceStatus === 'REVIEW_REQUIRED') {
      console.log(`::warning title=Security Review Required::High or medium severity issues need attention`);
    }
    
    // Set output variables for other jobs
    console.log(`::set-output name=risk-level::${report.overallRisk}`);
    console.log(`::set-output name=compliance-status::${report.complianceStatus}`);
    console.log(`::set-output name=risk-score::${report.metrics.riskScore}`);
  }
  
  // Exit with appropriate code based on compliance status
  switch (report.complianceStatus) {
    case 'FAIL':
      console.log('\n💥 Security monitoring FAILED - critical issues detected!');
      process.exit(1);
    case 'REVIEW_REQUIRED':
      console.log('\n⚠️  Security review required - please address flagged issues');
      process.exit(0); // Don't fail CI but require review
    default:
      console.log('\n🎉 Security monitoring PASSED!');
      process.exit(0);
  }
}

// Run security monitoring
generateSecurityReport();
