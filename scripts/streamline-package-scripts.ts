#!/usr/bin/env node

/**
 * Package Script Streamliner - TypeScript Script
 * Cross-platform script to optimize and streamline package.json scripts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

interface StreamlineOptions {
  backup?: boolean;
  verbose?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

class PackageStreamliner {
  private options: StreamlineOptions;
  private packagePath: string;

  constructor(options: StreamlineOptions = {}) {
    this.options = options;
    this.packagePath = join(projectRoot, 'package.json');
  }

  private log(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m', // Reset
    };

    console.log(`${icons[type]} ${colors[type]}${message}${colors.reset}`);
  }

  private checkPackageJson(): boolean {
    if (!existsSync(this.packagePath)) {
      this.log('package.json not found in project root', 'error');
      return false;
    }
    return true;
  }

  private getEssentialScripts(): Record<string, string> {
    return {
      // Core development
      dev: 'vite',
      build: 'npm run build:deps && npx tsc -b && npx vite build',
      'build:deps':
        "npm install @rollup/rollup-linux-x64-gnu --optional --no-save || echo 'Optional dependency warning'",
      preview: 'vite preview',

      // Testing (streamlined)
      test: 'vitest',
      'test:watch': 'vitest --watch',
      'test:fast': 'vitest run --coverage=false --run',
      'test:coverage': 'vitest --coverage',
      'test:parallel': 'vitest run --reporter=verbose --threads',

      // Quality assurance
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
      'type-check': 'npx tsc --noEmit',

      // CI/CD (streamlined)
      ci: 'npm run lint && npm run test:fast && npm run build',
      'ci:full': 'npm run lint && npm run test:coverage && npm run build',
      'ci:fast': 'npm run test:fast && npm run build',
      'ci:health': 'npm run health && npm run test:apis',

      // Utilities
      clean: 'rimraf dist coverage .vite node_modules/.cache',
      reset: 'npm run clean && npm install && npm run ci',
      'fix-deps': 'node scripts/fix-rollup-deps.ts',
      cleanup: 'node scripts/cleanup-unused-files.ts',

      // Essential tools
      health: 'node scripts/health-check.ts',
      doctor: 'node scripts/dev-doctor.ts',
      apis: 'node scripts/test-weather-apis.ts',

      // Mobile & deployment
      'mobile:setup': 'node scripts/mobile-deploy.ts',
      performance: 'node scripts/performance-monitor.ts',
      'design:check': 'node scripts/validate-ios-design.ts',

      // Quick setup
      setup: 'node scripts/quick-setup.ts',
    };
  }

  private analyzeCurrentScripts(): {
    current: number;
    essential: number;
    redundant: string[];
  } {
    this.log('Analyzing current package.json scripts...', 'info');

    const packageJson = JSON.parse(readFileSync(this.packagePath, 'utf8'));
    const currentScripts = packageJson.scripts || {};
    const essentialScripts = this.getEssentialScripts();

    const redundantScripts = Object.keys(currentScripts).filter(
      script => !Object.prototype.hasOwnProperty.call(essentialScripts, script)
    );

    return {
      current: Object.keys(currentScripts).length,
      essential: Object.keys(essentialScripts).length,
      redundant: redundantScripts,
    };
  }

  private backupPackageJson(): void {
    if (this.options.backup !== false) {
      const backupPath = join(projectRoot, 'package.json.backup');
      const packageContent = readFileSync(this.packagePath, 'utf8');
      writeFileSync(backupPath, packageContent);
      this.log(
        'Current package.json backed up to package.json.backup',
        'success'
      );
    }
  }

  private streamlineScripts(): void {
    this.log('Streamlining package.json scripts...', 'info');

    const packageJson = JSON.parse(readFileSync(this.packagePath, 'utf8'));
    const essentialScripts = this.getEssentialScripts();

    // Store original scripts count for reporting
    const originalCount = Object.keys(packageJson.scripts || {}).length;

    // Replace scripts with essential ones
    packageJson.scripts = essentialScripts;

    if (!this.options.dryRun) {
      writeFileSync(this.packagePath, JSON.stringify(packageJson, null, 2));
      this.log(
        `Scripts streamlined: ${originalCount} → ${Object.keys(essentialScripts).length}`,
        'success'
      );
    } else {
      this.log(
        `DRY RUN: Would streamline ${originalCount} → ${Object.keys(essentialScripts).length} scripts`,
        'info'
      );
    }
  }

  private generateReport(analysis: {
    current: number;
    essential: number;
    redundant: string[];
  }): void {
    console.log('\n📊 Package Script Streamlining Report:');
    console.log('=====================================');

    this.log(`Current scripts: ${analysis.current}`, 'info');
    this.log(`Essential scripts: ${analysis.essential}`, 'info');
    this.log(`Scripts to remove: ${analysis.redundant.length}`, 'warning');

    if (analysis.redundant.length > 0 && this.options.verbose) {
      console.log('\n🗑️  Scripts to be removed:');
      analysis.redundant.forEach(script => {
        console.log(`   • ${script}`);
      });
    }

    console.log('\n🎯 Benefits of streamlining:');
    console.log('   ✅ Cleaner development workflow');
    console.log('   ✅ Reduced maintenance overhead');
    console.log('   ✅ Faster script execution');
    console.log('   ✅ Better script organization');

    console.log('\n📋 Essential script categories:');
    console.log('   🔧 Development: dev, build, preview');
    console.log('   🧪 Testing: test, test:fast, test:coverage');
    console.log('   📏 Quality: lint, type-check');
    console.log('   🚀 CI/CD: ci, ci:fast, ci:health');
    console.log('   🛠️  Utilities: clean, reset, fix-deps');
    console.log('   📱 Mobile: mobile:setup, performance');
    console.log('   ⚡ Tools: health, doctor, apis, setup');

    if (!this.options.dryRun) {
      console.log('\n✨ Next steps:');
      console.log('   1. Run "npm run setup" to verify all tools work');
      console.log('   2. Use "npm run ci" for quick development checks');
      console.log('   3. Use "npm run health" for comprehensive monitoring');
    }
  }

  private showScriptList(): void {
    const essentialScripts = this.getEssentialScripts();

    console.log('\n📋 Essential Scripts List:');
    console.log('=========================');

    for (const [name, command] of Object.entries(essentialScripts)) {
      console.log(`  "${name}": "${command}"`);
    }
  }

  async run(): Promise<void> {
    console.log('📦 Weather App - Package Script Streamliner');
    console.log('==========================================');

    if (!this.checkPackageJson()) {
      process.exit(1);
    }

    try {
      const analysis = this.analyzeCurrentScripts();

      if (this.options.verbose) {
        this.showScriptList();
      }

      if (analysis.redundant.length === 0) {
        this.log('Package scripts are already optimized!', 'success');
        return;
      }

      if (!this.options.force && !this.options.dryRun) {
        this.log(
          `This will remove ${analysis.redundant.length} scripts. Use --force to proceed or --dry-run to preview`,
          'warning'
        );
        return;
      }

      if (!this.options.dryRun) {
        this.backupPackageJson();
        this.streamlineScripts();
      }

      this.generateReport(analysis);

      if (this.options.dryRun) {
        this.log('DRY RUN completed - no changes made', 'info');
      } else {
        this.log('Package scripts streamlined successfully!', 'success');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Fatal error: ${errorMessage}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): StreamlineOptions {
  const args = process.argv.slice(2);
  return {
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force') || args.includes('-f'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
  };
}

// Show help
function showHelp() {
  console.log(`
📦 Package Script Streamliner - Cross-Platform TypeScript Version

Usage: node streamline-package-scripts.ts [options]

Options:
  --force, -f       Force streamlining (remove redundant scripts)
  --dry-run, -d     Show what would be changed without making changes
  --no-backup       Skip backing up current package.json
  --verbose, -v     Show detailed output including script lists
  --help, -h        Show this help message

Examples:
  node streamline-package-scripts.ts --dry-run    # Preview changes
  node streamline-package-scripts.ts --force      # Apply streamlining
  node streamline-package-scripts.ts --verbose    # Show all scripts

Benefits:
  ✓ Reduces script maintenance overhead
  ✓ Keeps only essential development scripts
  ✓ Improves package.json readability
  ✓ Faster script discovery and execution
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const streamliner = new PackageStreamliner(options);
streamliner.run().catch(console.error);
