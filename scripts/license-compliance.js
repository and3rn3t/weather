#!/usr/bin/env node

/**
 * License Compliance Checker
 * Scans dependencies for license compatibility and generates compliance reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Approved license types for commercial use
const APPROVED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'CC0-1.0',
  'Unlicense',
  'WTFPL'
];

// Restricted licenses that require review
const RESTRICTED_LICENSES = [
  'GPL-2.0',
  'GPL-3.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'AGPL-3.0',
  'MPL-2.0',
  'EPL-1.0',
  'EPL-2.0',
  'CPAL-1.0'
];

// Prohibited licenses
const PROHIBITED_LICENSES = [
  'AGPL-1.0',
  'AGPL-3.0-only',
  'GPL-1.0',
  'GPL-2.0-only',
  'GPL-3.0-only'
];

function readPackageJson() {
  const projectRoot = path.dirname(__dirname);
  const packagePath = path.join(projectRoot, 'package.json');
  
  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    process.exit(1);
  }
}

function analyzeLicense(license) {
  if (!license) {
    return { status: 'unknown', risk: 'medium' };
  }
  
  // Normalize license string
  const normalizedLicense = license.toString().toUpperCase();
  
  if (APPROVED_LICENSES.some(approved => normalizedLicense.includes(approved.toUpperCase()))) {
    return { status: 'approved', risk: 'low' };
  }
  
  if (RESTRICTED_LICENSES.some(restricted => normalizedLicense.includes(restricted.toUpperCase()))) {
    return { status: 'restricted', risk: 'high' };
  }
  
  if (PROHIBITED_LICENSES.some(prohibited => normalizedLicense.includes(prohibited.toUpperCase()))) {
    return { status: 'prohibited', risk: 'critical' };
  }
  
  return { status: 'unknown', risk: 'medium' };
}

function checkLicenseCompliance() {
  console.log('📋 License Compliance Check Starting...');
  
  const packageJson = readPackageJson();
  const projectRoot = path.dirname(__dirname);
  const lockFilePath = path.join(projectRoot, 'package-lock.json');
  
  let dependencies = {};
  
  // Read from package-lock.json for more detailed info
  if (fs.existsSync(lockFilePath)) {
    try {
      const lockContent = fs.readFileSync(lockFilePath, 'utf8');
      const lockData = JSON.parse(lockContent);
      
      if (lockData.packages) {
        // npm v7+ format
        dependencies = lockData.packages;
      } else if (lockData.dependencies) {
        // npm v6 format
        dependencies = lockData.dependencies;
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not read package-lock.json, falling back to package.json');
      dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    }
  } else {
    // Fallback to package.json
    dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    project: packageJson.name,
    version: packageJson.version,
    totalDependencies: Object.keys(dependencies).length,
    licenseAnalysis: {
      approved: [],
      restricted: [],
      prohibited: [],
      unknown: []
    },
    riskAssessment: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    complianceStatus: 'PASS'
  };
  
  console.log('\n📊 Analyzing Licenses...');
  console.log('=' .repeat(50));
  
  for (const [packageName, packageInfo] of Object.entries(dependencies)) {
    if (packageName === '') continue; // Skip root package
    
    let license = null;
    
    // Extract license info from different formats
    if (typeof packageInfo === 'object' && packageInfo.license) {
      license = packageInfo.license;
    } else if (typeof packageInfo === 'string') {
      // This might be a version string, skip license detection
      continue;
    }
    
    const analysis = analyzeLicense(license);
    const packageData = {
      name: packageName,
      license: license || 'UNKNOWN',
      status: analysis.status,
      risk: analysis.risk
    };
    
    // Categorize packages
    report.licenseAnalysis[analysis.status].push(packageData);
    report.riskAssessment[analysis.risk]++;
    
    // Log high-risk packages
    if (analysis.risk === 'critical' || analysis.risk === 'high') {
      console.log(`🚨 ${analysis.risk.toUpperCase()}: ${packageName} (${license || 'UNKNOWN'})`);
    }
  }
  
  // Determine overall compliance status
  if (report.riskAssessment.critical > 0) {
    report.complianceStatus = 'FAIL';
  } else if (report.riskAssessment.high > 0) {
    report.complianceStatus = 'REVIEW_REQUIRED';
  }
  
  // Print summary
  console.log('\n📈 License Compliance Summary:');
  console.log(`  ✅ Approved: ${report.licenseAnalysis.approved.length}`);
  console.log(`  ⚠️  Restricted: ${report.licenseAnalysis.restricted.length}`);
  console.log(`  ❌ Prohibited: ${report.licenseAnalysis.prohibited.length}`);
  console.log(`  ❓ Unknown: ${report.licenseAnalysis.unknown.length}`);
  
  console.log('\n🎯 Risk Assessment:');
  console.log(`  🟢 Low Risk: ${report.riskAssessment.low}`);
  console.log(`  🟡 Medium Risk: ${report.riskAssessment.medium}`);
  console.log(`  🟠 High Risk: ${report.riskAssessment.high}`);
  console.log(`  🔴 Critical Risk: ${report.riskAssessment.critical}`);
  
  console.log(`\n🏆 Overall Status: ${report.complianceStatus}`);
  
  // Generate detailed report file
  const reportPath = path.join(projectRoot, 'license-compliance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Generate CI output
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('\n📊 GitHub Actions Summary:');
    console.log(`::notice title=License Compliance::Status: ${report.complianceStatus}, Critical: ${report.riskAssessment.critical}, High: ${report.riskAssessment.high}`);
    
    if (report.riskAssessment.critical > 0) {
      console.log(`::error title=License Compliance FAILED::Found ${report.riskAssessment.critical} prohibited licenses`);
    } else if (report.riskAssessment.high > 0) {
      console.log(`::warning title=License Review Required::Found ${report.riskAssessment.high} restricted licenses that need review`);
    }
  }
  
  // Exit with appropriate code
  if (report.complianceStatus === 'FAIL') {
    console.log('\n💥 License compliance check FAILED!');
    process.exit(1);
  } else if (report.complianceStatus === 'REVIEW_REQUIRED') {
    console.log('\n⚠️  License review required - please check restricted licenses');
    process.exit(0); // Don't fail CI, but flag for review
  } else {
    console.log('\n🎉 License compliance check PASSED!');
    process.exit(0);
  }
}

// Run the compliance check
checkLicenseCompliance();
