#!/usr/bin/env node

/**
 * Pre-commit Security Check
 * Runs SonarLint-style security checks before commits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Running Pre-commit Security Checks...\n');

class SecurityChecker {
  constructor() {
    this.issues = [];
    this.projectRoot = process.cwd();
  }

  // Check for insecure Math.random() usage
  checkInsecureRandom() {
    console.log('🎲 Checking for insecure random number generation...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Flag Math.random() unless it's in a secure fallback context
        if (
          line.includes('Math.random()') &&
          !line.includes('// Fallback') &&
          !line.includes('fallback') &&
          !line.includes('Fallback') &&
          !content.includes('crypto.getRandomValues') &&
          !file.includes('test') &&
          !file.includes('spec')
        ) {
          this.issues.push({
            type: 'security',
            severity: 'error',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message:
              'Use cryptographically secure random generation instead of Math.random()',
            rule: 'S2245',
          });
        }
      });
    }
  }

  // Check for command injection vulnerabilities
  checkCommandInjection() {
    console.log('💉 Checking for command injection vulnerabilities...');

    const scriptFiles = this.getScriptFiles();
    for (const file of scriptFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Flag execSync without shell: false
        if (
          line.includes('execSync(') &&
          !content.includes('shell: false') &&
          !line.includes('shell: false')
        ) {
          this.issues.push({
            type: 'security',
            severity: 'error',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message:
              'Command injection risk: Add shell: false to execSync options',
            rule: 'S4507',
          });
        }
      });
    }
  }

  // Check for hardcoded credentials
  checkHardcodedCredentials() {
    console.log('🔑 Checking for hardcoded credentials...');

    const allFiles = this.getSourceFiles().concat(this.getScriptFiles());
    const credentialPatterns = [
      /password\s*[:=]\s*['"][^'"]{3,}/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]{10,}/i,
      /secret\s*[:=]\s*['"][^'"]{3,}/i,
      /token\s*[:=]\s*['"][^'"]{10,}/i,
    ];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        credentialPatterns.forEach(pattern => {
          if (
            pattern.test(line) &&
            !line.includes('TODO') &&
            !line.includes('EXAMPLE')
          ) {
            this.issues.push({
              type: 'security',
              severity: 'error',
              file: path.relative(this.projectRoot, file),
              line: index + 1,
              message: 'Potential hardcoded credential detected',
              rule: 'S2068',
            });
          }
        });
      });
    }
  }

  // Get source files for analysis
  getSourceFiles() {
    const files = [];
    const walkDir = dir => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldExcludeDir(item)) {
          walkDir(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
          files.push(fullPath);
        }
      }
    };

    walkDir(path.join(this.projectRoot, 'src'));
    return files;
  }

  // Get script files for analysis
  getScriptFiles() {
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    if (!fs.existsSync(scriptsDir)) return [];

    const files = [];
    const items = fs.readdirSync(scriptsDir);

    for (const item of items) {
      const fullPath = path.join(scriptsDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && /\.(js|ts|cjs)$/.test(item)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // Check if directory should be excluded
  shouldExcludeDir(dirname) {
    const excludeDirs = [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '__tests__',
      'test',
    ];
    return excludeDirs.includes(dirname);
  }

  // Run all security checks
  async runChecks() {
    this.checkInsecureRandom();
    this.checkCommandInjection();
    this.checkHardcodedCredentials();

    return this.issues;
  }

  // Format and display results
  displayResults() {
    if (this.issues.length === 0) {
      console.log('✅ No security issues found!\n');
      return true;
    }

    console.log(`❌ Found ${this.issues.length} security issue(s):\n`);

    this.issues.forEach(issue => {
      const severity = issue.severity === 'error' ? '🚨' : '⚠️';
      console.log(`${severity} ${issue.file}:${issue.line}`);
      console.log(`   ${issue.message}`);
      console.log(`   Rule: ${issue.rule}\n`);
    });

    console.log(
      '🔧 Fix these issues before committing to maintain security standards.\n'
    );
    return false;
  }
}

// Main execution
async function main() {
  try {
    const checker = new SecurityChecker();
    await checker.runChecks();
    const passed = checker.displayResults();

    if (!passed) {
      console.log(
        '💡 Tip: Use SonarLint extension in VS Code for real-time security feedback!'
      );
      process.exit(1);
    }

    console.log('🎉 Security check passed! Ready to commit.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Security check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SecurityChecker;
