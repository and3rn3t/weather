#!/usr/bin/env node

/**
 * Cleanup Unused Files - TypeScript Script
 * Cross-platform script to remove backup files, unused workflows, and redundant configurations
 */

import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

interface CleanupOptions {
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
}

class ProjectCleaner {
  private options: CleanupOptions;
  private removedCount = 0;
  private skippedCount = 0;

  constructor(options: CleanupOptions = {}) {
    this.options = options;
  }

  private log(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
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

    const prefix = this.options.dryRun ? '[DRY RUN] ' : '';
    console.log(
      `${icons[type]} ${colors[type]}${prefix}${message}${colors.reset}`,
    );
  }

  private removeFile(filePath: string, description: string): boolean {
    const fullPath = join(projectRoot, filePath);

    if (!existsSync(fullPath)) {
      if (this.options.verbose) {
        this.log(`File not found: ${filePath}`, 'info');
      }
      return false;
    }

    if (this.options.dryRun) {
      this.log(`Would remove: ${filePath}`, 'warning');
      return true;
    }

    try {
      const stats = statSync(fullPath);
      rmSync(fullPath, { recursive: stats.isDirectory(), force: true });
      this.log(`Removed ${description}: ${filePath}`, 'success');
      this.removedCount++;
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Failed to remove ${filePath}: ${errorMessage}`, 'error');
      return false;
    }
  }

  private removeFiles(files: string[], description: string): void {
    this.log(`Step: Removing ${description}...`, 'info');

    let removed = 0;
    for (const file of files) {
      if (this.removeFile(file, description)) {
        removed++;
      }
    }

    if (removed === 0) {
      this.log(`No ${description} found to remove`, 'info');
    } else {
      this.log(`Removed ${removed} ${description}`, 'success');
    }
  }

  private cleanupBackupFiles(): void {
    const backupFiles = [
      'src/utils/__tests__/mobileInteractions.test.tsx.backup',
      'backup/SimpleMobileApp.tsx',
      'src/components/SearchScreen_backup.tsx',
      'src/components/SearchScreen_original.tsx',
      'src/components/SearchScreen_old.tsx',
      'package.json.backup',
      'package-lock.json.backup',
      'vite.config.ts.backup',
      'tsconfig.json.backup',
    ];

    this.removeFiles(backupFiles, 'backup files');
  }

  private cleanupRedundantWorkflows(): void {
    const redundantWorkflows = [
      '.github/workflows/deploy-optimized.yml',
      '.github/workflows/ci-cd.yml',
      '.github/workflows/optimized-ci-cd.yml',
      '.github/workflows/ultra-optimized-ci-cd.yml',
      '.github/workflows/phase4-2-ai-enhanced-ci-cd.yml',
      '.github/workflows/enhanced-ci-cd.yml',
      '.github/workflows/redundant-ci-cd.yml',
      '.github/workflows/backup-ci-cd.yml',
      '.github/workflows/old-deploy.yml',
    ];

    this.removeFiles(redundantWorkflows, 'redundant workflow files');
  }

  private cleanupUnusedScripts(): void {
    const unusedScripts = [
      'scripts/ci-cd-ai-controller.cjs',
      'scripts/pipeline-efficiency-analyzer.cjs',
      'scripts/production-dashboard.js',
      'scripts/ai-status-check.cjs',
      'scripts/phase4-2-demo.cjs',
      'scripts/chaos-engineering.js',
      'scripts/performance-optimizer.js',
      'scripts/predictive-scaling.js',
      'scripts/anomaly-detection.js',
      'scripts/phase4-next-steps.js',
      'scripts/phase4-demo.js',
      'scripts/error-tracking.js',
      'scripts/canary-release.js',
      'scripts/feature-flags.js',
      'scripts/rum-analytics.js',
      'scripts/blue-green-deployment.js',
      'scripts/alerting-system.js',
      'scripts/performance-monitoring.js',
      'scripts/security-dashboard.js',
      'scripts/security-monitoring.js',
      'scripts/license-compliance.js',
      'scripts/build-optimization-clean.ps1',
      'scripts/pre-commit-check-clean.ps1',
      'scripts/pre-commit-check.ps1',
      'scripts/performance-budget.js',
      'scripts/analyze-bundle.js',
      'scripts/build-optimization.ps1',
      'scripts/release-prep.ps1',
      'scripts/simple-bundle-check.ps1',
      'scripts/bundle-analysis-simple.ps1',
      'scripts/enhanced-bundle-analysis.ps1',
      'scripts/test-optimizations.ps1',
      'scripts/dev-workflow.ps1',
      'scripts/simple-bundle-analysis.ps1',
      'scripts/analyze-bundle.ps1',
      'scripts/mobile-test-simple.ps1',
    ];

    this.removeFiles(unusedScripts, 'unused script files');
  }

  private cleanupTempFiles(): void {
    const tempFiles = [
      'dist',
      'coverage',
      '.nyc_output',
      '.cache',
      'temp',
      'tmp',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '.vscode/settings.json.backup',
      '.eslintcache',
      'performance-report-*.json',
      'health-report-*.json',
      'setup-report-*.json',
      'deployment-report-*.json',
    ];

    // For pattern files, we need to handle them differently
    const exactFiles = tempFiles.filter(f => !f.includes('*'));
    const patternFiles = tempFiles.filter(f => f.includes('*'));

    this.removeFiles(exactFiles, 'temporary files');

    // Handle pattern files by scanning directories
    for (const pattern of patternFiles) {
      this.cleanupPatternFiles(pattern);
    }
  }

  private cleanupPatternFiles(pattern: string): void {
    try {
      const files = readdirSync(projectRoot);
      const matchingFiles = files.filter(file => {
        if (pattern.includes('*')) {
          // Security: Limit pattern complexity to prevent ReDoS
          const sanitizedPattern = pattern
            .replace(/\*/g, '.*')
            .substring(0, 100);
          try {
            const regex = new RegExp(sanitizedPattern, 'i');
            return regex.test(file);
          } catch (error) {
            console.warn(`Invalid regex pattern: ${pattern}`);
            return false;
          }
        }
        return file === pattern;
      });

      for (const file of matchingFiles) {
        this.removeFile(file, 'pattern-matched file');
      }
    } catch (error: unknown) {
      if (this.options.verbose) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.log(
          `Error scanning for pattern ${pattern}: ${errorMessage}`,
          'warning',
        );
      }
    }
  }

  private cleanupRedundantConfigs(): void {
    const redundantConfigs = [
      'webpack.config.js.backup',
      'rollup.config.js.backup',
      'jest.config.js.backup',
      'babel.config.js.backup',
      '.eslintrc.js.backup',
      '.prettierrc.backup',
      'tsconfig.json.old',
      'package.json.old',
      'vite.config.js.backup',
    ];

    this.removeFiles(redundantConfigs, 'redundant configuration files');
  }

  private cleanupEmptyDirectories(): void {
    this.log('Step: Removing empty directories...', 'info');

    const directories = [
      'backup',
      'temp',
      'tmp',
      'logs',
      'reports',
      'coverage/tmp',
      'dist/temp',
    ];

    let removed = 0;
    for (const dir of directories) {
      const fullPath = join(projectRoot, dir);

      if (existsSync(fullPath)) {
        try {
          const files = readdirSync(fullPath);
          if (files.length === 0) {
            if (this.options.dryRun) {
              this.log(`Would remove empty directory: ${dir}`, 'warning');
            } else {
              rmSync(fullPath, { recursive: true });
              this.log(`Removed empty directory: ${dir}`, 'success');
              removed++;
            }
          } else if (this.options.verbose) {
            this.log(
              `Directory not empty: ${dir} (${files.length} files)`,
              'info',
            );
          }
        } catch (error: unknown) {
          if (this.options.verbose) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.log(
              `Error checking directory ${dir}: ${errorMessage}`,
              'warning',
            );
          }
        }
      }
    }

    if (removed === 0) {
      this.log('No empty directories found to remove', 'info');
    } else {
      this.log(`Removed ${removed} empty directories`, 'success');
    }
  }

  private generateReport(): void {
    this.log('\n📊 Cleanup Report:', 'info');
    console.log(
      `Total files/directories processed: ${
        this.removedCount + this.skippedCount
      }`,
    );
    console.log(`Removed: ${this.removedCount}`);
    console.log(`Skipped: ${this.skippedCount}`);

    if (this.options.dryRun) {
      this.log(
        '\nThis was a dry run. No files were actually removed.',
        'warning',
      );
      this.log('Run without --dry-run to perform actual cleanup.', 'info');
    } else {
      this.log('\n🎉 Cleanup completed successfully!', 'success');
    }
  }

  async run(): Promise<void> {
    console.log('🧹 Weather App - Project Cleanup');
    console.log('=================================');

    if (this.options.dryRun) {
      this.log('DRY RUN MODE - No files will be actually removed', 'warning');
    }

    if (this.options.verbose) {
      this.log('Verbose mode enabled', 'info');
    }

    try {
      this.cleanupBackupFiles();
      this.cleanupRedundantWorkflows();
      this.cleanupUnusedScripts();
      this.cleanupTempFiles();
      this.cleanupRedundantConfigs();
      this.cleanupEmptyDirectories();

      this.generateReport();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Fatal error during cleanup: ${errorMessage}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force') || args.includes('-f'),
  };
}

// Show help
function showHelp() {
  console.log(`
🧹 Project Cleanup - Cross-Platform TypeScript Version

Usage: node cleanup-unused-files.ts [options]

Options:
  --dry-run, -d   Show what would be removed without actually removing
  --verbose, -v   Show detailed output
  --force, -f     Force removal without prompts
  --help, -h      Show this help message

Examples:
  node cleanup-unused-files.ts --dry-run    # Preview what will be removed
  node cleanup-unused-files.ts --verbose    # Detailed cleanup
  node cleanup-unused-files.ts              # Standard cleanup

This script removes:
  ✓ Backup files (.backup, .old, etc.)
  ✓ Redundant workflow files
  ✓ Unused script files
  ✓ Temporary files and directories
  ✓ Redundant configuration files
  ✓ Empty directories
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const cleaner = new ProjectCleaner(options);
cleaner.run().catch(console.error);
