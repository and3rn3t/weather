#!/usr/bin/env node

/**
 * Development Environment Doctor
 * Comprehensive environment diagnosis and auto-fixing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class DevelopmentDoctor {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.warnings = [];
    this.autoFix = process.argv.includes('--fix');
  }

  async diagnose(name, checkFn, fixFn = null) {
    console.log(`🔍 Checking: ${name}...`);
    try {
      const result = await checkFn();
      if (result.status === 'error') {
        this.issues.push({ name, ...result, fix: fixFn });
        console.log(`   ❌ ${result.message}`);

        if (this.autoFix && fixFn) {
          console.log(`   🔧 Auto-fixing...`);
          try {
            await fixFn();
            this.fixes.push(name);
            console.log(`   ✅ Fixed: ${name}`);
          } catch (fixError) {
            console.log(`   ⚠️ Auto-fix failed: ${fixError.message}`);
          }
        }
      } else if (result.status === 'warning') {
        this.warnings.push({ name, ...result });
        console.log(`   ⚠️ ${result.message}`);
      } else {
        console.log(`   ✅ ${result.message}`);
      }
    } catch (error) {
      this.issues.push({
        name,
        status: 'error',
        message: error.message,
        fix: fixFn,
      });
      console.log(`   ❌ Check failed: ${error.message}`);
    }
  }

  async checkNodeVersion() {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const versionNumber = parseFloat(version.replace('v', ''));

    if (versionNumber < 20) {
      return {
        status: 'error',
        message: `Node.js ${version} is outdated. Minimum required: v20.0.0`,
        recommendation: 'Upgrade Node.js to v20+ from nodejs.org',
      };
    } else if (versionNumber < 22) {
      return {
        status: 'warning',
        message: `Node.js ${version} works but v22+ recommended for best performance`,
      };
    } else {
      return {
        status: 'ok',
        message: `Node.js ${version} ✓`,
      };
    }
  }

  async checkNpmVersion() {
    const { stdout } = await execAsync('npm --version');
    const version = stdout.trim();
    const versionNumber = parseFloat(version);

    if (versionNumber < 9) {
      return {
        status: 'warning',
        message: `npm ${version} is older. Consider upgrading to v10+`,
      };
    } else {
      return {
        status: 'ok',
        message: `npm ${version} ✓`,
      };
    }
  }

  async checkPackageJson() {
    const packagePath = join(projectRoot, 'package.json');
    if (!existsSync(packagePath)) {
      return {
        status: 'error',
        message: 'package.json not found',
      };
    }

    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      if (!packageJson.scripts) {
        return {
          status: 'error',
          message: 'No scripts section in package.json',
        };
      }

      const requiredScripts = ['dev', 'build', 'test'];
      const missingScripts = requiredScripts.filter(
        script => !packageJson.scripts[script]
      );

      if (missingScripts.length > 0) {
        return {
          status: 'warning',
          message: `Missing recommended scripts: ${missingScripts.join(', ')}`,
        };
      }

      return {
        status: 'ok',
        message: `package.json configured correctly (${Object.keys(packageJson.scripts).length} scripts)`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Invalid package.json: ${error.message}`,
      };
    }
  }

  async checkDependencies() {
    try {
      const { stdout, stderr } = await execAsync('npm ls --depth=0', {
        cwd: projectRoot,
      });

      if (stderr && stderr.includes('missing')) {
        return {
          status: 'error',
          message: 'Missing dependencies detected',
        };
      }

      // Check for major outdated packages
      try {
        const { stdout: outdatedOutput } = await execAsync(
          'npm outdated --json',
          { cwd: projectRoot }
        );
        const outdated = JSON.parse(outdatedOutput || '{}');
        const criticalOutdated = Object.entries(outdated).filter(
          ([_, info]) => {
            const current = info.current || '0.0.0';
            const wanted = info.wanted || '0.0.0';
            return current.split('.')[0] !== wanted.split('.')[0]; // Major version diff
          }
        );

        if (criticalOutdated.length > 0) {
          return {
            status: 'warning',
            message: `${criticalOutdated.length} packages have major updates available`,
          };
        }
      } catch {
        // npm outdated command failed, not critical
      }

      return {
        status: 'ok',
        message: 'Dependencies are up to date',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to check dependencies',
      };
    }
  }

  async fixDependencies() {
    await execAsync('npm install', { cwd: projectRoot });
  }

  async checkTypeScript() {
    try {
      const { stderr } = await execAsync('npx tsc --noEmit', {
        cwd: projectRoot,
      });

      if (stderr) {
        const errorCount = (stderr.match(/error TS/g) || []).length;
        if (errorCount > 0) {
          return {
            status: 'warning',
            message: `${errorCount} TypeScript errors found`,
          };
        }
      }

      return {
        status: 'ok',
        message: 'TypeScript compilation clean',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        return {
          status: 'error',
          message: 'TypeScript not installed',
        };
      }
      return {
        status: 'warning',
        message: 'TypeScript check failed',
      };
    }
  }

  async checkBuildSystem() {
    const viteConfigPath = join(projectRoot, 'vite.config.ts');
    const viteConfigJsPath = join(projectRoot, 'vite.config.js');

    if (!existsSync(viteConfigPath) && !existsSync(viteConfigJsPath)) {
      return {
        status: 'error',
        message: 'Vite config file not found',
      };
    }

    try {
      await execAsync('npx vite --version', { cwd: projectRoot });
      return {
        status: 'ok',
        message: 'Vite build system configured',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Vite not properly installed',
      };
    }
  }

  async checkTestFramework() {
    const vitestConfigPath = join(projectRoot, 'vitest.config.ts');
    const jestConfigPath = join(projectRoot, 'jest.config.js');

    if (existsSync(vitestConfigPath)) {
      try {
        await execAsync('npx vitest --version', { cwd: projectRoot });
        return {
          status: 'ok',
          message: 'Vitest testing framework configured',
        };
      } catch (error) {
        return {
          status: 'error',
          message: 'Vitest not properly installed',
        };
      }
    } else if (existsSync(jestConfigPath)) {
      return {
        status: 'ok',
        message: 'Jest testing framework configured',
      };
    } else {
      return {
        status: 'warning',
        message: 'No testing framework configured',
      };
    }
  }

  async checkLinting() {
    const eslintConfigPath = join(projectRoot, 'eslint.config.js');
    const legacyEslintPath = join(projectRoot, '.eslintrc.js');

    if (!existsSync(eslintConfigPath) && !existsSync(legacyEslintPath)) {
      return {
        status: 'warning',
        message: 'ESLint not configured',
      };
    }

    try {
      await execAsync('npx eslint --version', { cwd: projectRoot });
      return {
        status: 'ok',
        message: 'ESLint configured',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'ESLint not properly installed',
      };
    }
  }

  async checkGitConfiguration() {
    try {
      await execAsync('git --version');

      // Check if we're in a git repository
      try {
        await execAsync('git rev-parse --git-dir', { cwd: projectRoot });
      } catch {
        return {
          status: 'error',
          message: 'Not a git repository',
        };
      }

      // Check git user configuration
      try {
        await execAsync('git config user.name', { cwd: projectRoot });
        await execAsync('git config user.email', { cwd: projectRoot });
      } catch {
        return {
          status: 'warning',
          message: 'Git user not configured',
        };
      }

      return {
        status: 'ok',
        message: 'Git configured correctly',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Git not installed',
      };
    }
  }

  async fixGitConfiguration() {
    // Set basic git configuration if missing
    try {
      await execAsync('git config user.name', { cwd: projectRoot });
    } catch {
      await execAsync('git config user.name "Developer"', { cwd: projectRoot });
    }

    try {
      await execAsync('git config user.email', { cwd: projectRoot });
    } catch {
      await execAsync('git config user.email "developer@example.com"', {
        cwd: projectRoot,
      });
    }
  }

  async checkEnvironmentFiles() {
    const envFiles = ['.env', '.env.local', '.env.development'];
  const envDir = join(projectRoot, '.env');
    // Check both root and .env directory for environment files
    const foundEnvFiles = envFiles.filter(file => {
      const rootPath = join(projectRoot, file);
      const envDirPath = join(envDir, file);
      return existsSync(rootPath) || existsSync(envDirPath);
    });

    if (foundEnvFiles.length === 0) {
      return {
        status: 'ok',
        message: 'No environment files (not required for this project)',
      };
    }

    return {
      status: 'ok',
      message: `Environment files found: ${foundEnvFiles.join(', ')}`,
    };
  }

  async checkPortAvailability() {
    const commonPorts = [5173, 3000, 8080, 4173];
    const busyPorts = [];

    for (const port of commonPorts) {
      try {
        const { stdout } = await execAsync(`netstat -an | findstr :${port}`, {
          timeout: 1000,
        });
        if (stdout.trim()) {
          busyPorts.push(port);
        }
      } catch {
        // Port is likely available
      }
    }

    if (busyPorts.length > 0) {
      return {
        status: 'warning',
        message: `Ports in use: ${busyPorts.join(', ')}. May cause development server conflicts.`,
      };
    }

    return {
      status: 'ok',
      message: 'Development ports available',
    };
  }

  async checkDiskSpace() {
    try {
      const { stdout } = await execAsync('dir /-c', { cwd: projectRoot });
      const lines = stdout.split('\n');
      const lastLine = lines[lines.length - 2] || '';
      const freeSpaceMatch = lastLine.match(/([0-9,]+)\s+bytes free/);

      if (freeSpaceMatch) {
        const freeBytes = parseInt(freeSpaceMatch[1].replace(/,/g, ''));
        const freeGB = freeBytes / (1024 * 1024 * 1024);

        if (freeGB < 1) {
          return {
            status: 'error',
            message: `Low disk space: ${freeGB.toFixed(1)}GB free`,
          };
        } else if (freeGB < 5) {
          return {
            status: 'warning',
            message: `Limited disk space: ${freeGB.toFixed(1)}GB free`,
          };
        } else {
          return {
            status: 'ok',
            message: `Sufficient disk space: ${freeGB.toFixed(1)}GB free`,
          };
        }
      }
    } catch {
      // Fallback for non-Windows or command failure
    }

    return {
      status: 'ok',
      message: 'Disk space check skipped',
    };
  }

  async checkNetworkConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://registry.npmjs.org/', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'ok',
          message: 'Network connectivity verified',
        };
      } else {
        return {
          status: 'warning',
          message: 'Network connectivity issues detected',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'No network connectivity',
      };
    }
  }

  generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        os: process.platform,
        arch: process.arch,
        node: process.version,
        cwd: projectRoot,
      },
      issues: this.issues,
      warnings: this.warnings,
      fixes: this.fixes,
      summary: {
        totalChecks:
          this.issues.length + this.warnings.length + this.fixes.length,
        issuesFound: this.issues.length,
        warningsFound: this.warnings.length,
        autoFixesApplied: this.fixes.length,
        healthScore: this.calculateHealthScore(),
      },
    };

    const reportPath = join(projectRoot, `health-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Health report saved: ${reportPath}`);
    return report;
  }

  calculateHealthScore() {
    const totalIssues = this.issues.length + this.warnings.length;
    const fixedIssues = this.fixes.length;
    const remainingIssues = totalIssues - fixedIssues;

    if (totalIssues === 0) return 100;

    const score = Math.max(0, 100 - remainingIssues * 10);
    return Math.round(score);
  }

  printSummary() {
    console.log('\n📊 DEVELOPMENT ENVIRONMENT DIAGNOSIS SUMMARY\n');

    const healthScore = this.calculateHealthScore();
    const healthEmoji =
      healthScore >= 90 ? '🟢' : healthScore >= 70 ? '🟡' : '🔴';

    console.log(`${healthEmoji} Health Score: ${healthScore}/100`);
    console.log(`❌ Issues: ${this.issues.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`🔧 Auto-fixes applied: ${this.fixes.length}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.issues.forEach(issue => {
        console.log(`   ❌ ${issue.name}: ${issue.message}`);
        if (issue.recommendation) {
          console.log(`      💡 ${issue.recommendation}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   ⚠️ ${warning.name}: ${warning.message}`);
      });
    }

    if (this.fixes.length > 0) {
      console.log('\n✅ AUTO-FIXES APPLIED:');
      this.fixes.forEach(fix => {
        console.log(`   ✅ ${fix}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (this.issues.length > 0) {
      console.log('   - Address critical issues before development');
      console.log('   - Run: npm run doctor --fix (to auto-fix issues)');
    }
    if (this.warnings.length > 2) {
      console.log('   - Consider addressing warnings for optimal experience');
    }
    if (healthScore >= 90) {
      console.log('   - Environment is ready for development! 🎉');
    }
    console.log('   - Run: npm run health (for detailed health check)');
    console.log('');
  }

  async run() {
    console.log('🩺 Development Environment Doctor Starting...\n');
    if (this.autoFix) {
      console.log('🔧 Auto-fix mode enabled\n');
    }

    // Core environment checks
    await this.diagnose('Node.js Version', () => this.checkNodeVersion());
    await this.diagnose('npm Version', () => this.checkNpmVersion());
    await this.diagnose('Package Configuration', () => this.checkPackageJson());
    await this.diagnose(
      'Dependencies',
      () => this.checkDependencies(),
      () => this.fixDependencies()
    );

    // Development tools
    await this.diagnose('TypeScript', () => this.checkTypeScript());
    await this.diagnose('Build System', () => this.checkBuildSystem());
    await this.diagnose('Test Framework', () => this.checkTestFramework());
    await this.diagnose('Linting', () => this.checkLinting());

    // Project setup
    await this.diagnose(
      'Git Configuration',
      () => this.checkGitConfiguration(),
      () => this.fixGitConfiguration()
    );
    await this.diagnose('Environment Files', () =>
      this.checkEnvironmentFiles()
    );

    // System resources
    await this.diagnose('Port Availability', () =>
      this.checkPortAvailability()
    );
    await this.diagnose('Disk Space', () => this.checkDiskSpace());
    await this.diagnose('Network Connectivity', () =>
      this.checkNetworkConnectivity()
    );

    this.generateHealthReport();
    this.printSummary();

    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Show usage if --help
if (process.argv.includes('--help')) {
  console.log('🩺 Development Environment Doctor\n');
  console.log('Usage: node dev-doctor.js [options]');
  console.log('\nOptions:');
  console.log('  --fix     Automatically fix issues where possible');
  console.log('  --help    Show this help message\n');
  console.log('Examples:');
  console.log('  node dev-doctor.js          # Diagnose only');
  console.log('  node dev-doctor.js --fix    # Diagnose and auto-fix');
  process.exit(0);
}

// Run doctor if called directly
if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))
) {
  const doctor = new DevelopmentDoctor();
  doctor.run().catch(console.error);
}

export { DevelopmentDoctor };
