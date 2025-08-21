#!/usr/bin/env node

/**
 * Fix Rollup Dependencies - TypeScript Script
 * Cross-platform script to resolve Rollup binary dependency issues
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, rmSync } from 'fs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

interface Options {
  force?: boolean;
  clean?: boolean;
  verbose?: boolean;
}

class RollupDependencyFixer {
  private options: Options;

  constructor(options: Options = {}) {
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

    console.log(`${icons[type]} ${colors[type]}${message}${colors.reset}`);
  }

  private async runCommand(
    command: string,
    description: string,
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    if (this.options.verbose) {
      this.log(`Executing: ${command}`, 'info');
    }

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: projectRoot });

      if (this.options.verbose && stdout) {
        console.log(stdout);
      }

      if (stderr && !stderr.includes('warning')) {
        this.log(`Command output: ${stderr}`, 'warning');
      }

      return { success: true, output: stdout };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`${description} failed: ${errorMessage}`, 'error');
      return { success: false, error: errorMessage };
    }
  }

  private checkProjectRoot(): boolean {
    const packageJsonPath = join(projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      this.log(
        'package.json not found. Please run this script from the project root.',
        'error',
      );
      return false;
    }

    if (this.options.verbose) {
      this.log(`Current directory: ${projectRoot}`, 'info');
    }

    return true;
  }

  private async cleanInstallation(): Promise<void> {
    this.log('Performing clean installation...', 'warning');

    const nodeModulesPath = join(projectRoot, 'node_modules');
    const packageLockPath = join(projectRoot, 'package-lock.json');

    if (existsSync(nodeModulesPath)) {
      this.log('Removing node_modules...', 'info');
      rmSync(nodeModulesPath, { recursive: true, force: true });
    }

    if (existsSync(packageLockPath)) {
      this.log('Removing package-lock.json...', 'info');
      rmSync(packageLockPath, { force: true });
    }

    this.log('Clean completed', 'success');
  }

  private async installDependencies(): Promise<boolean> {
    this.log('Installing dependencies...', 'info');

    const result = await this.runCommand('npm install', 'npm install');
    if (!result.success) {
      return false;
    }

    this.log('Dependencies installed successfully', 'success');
    return true;
  }

  private async fixRollupBinaries(): Promise<boolean> {
    this.log('Fixing Rollup binary dependencies...', 'info');

    // Check current platform
    const platform = process.platform;
    const arch = process.arch;

    this.log(`Detected platform: ${platform}-${arch}`, 'info');

    // List of common Rollup binary packages
    const rollupBinaries = [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-x64-musl',
      '@rollup/rollup-linux-arm64-gnu',
      '@rollup/rollup-linux-arm64-musl',
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-win32-x64-msvc',
      '@rollup/rollup-win32-ia32-msvc',
    ];

    // Determine platform-specific binary
    let platformBinary = '';
    if (platform === 'linux' && arch === 'x64') {
      platformBinary = '@rollup/rollup-linux-x64-gnu';
    } else if (platform === 'darwin' && arch === 'x64') {
      platformBinary = '@rollup/rollup-darwin-x64';
    } else if (platform === 'darwin' && arch === 'arm64') {
      platformBinary = '@rollup/rollup-darwin-arm64';
    } else if (platform === 'win32' && arch === 'x64') {
      platformBinary = '@rollup/rollup-win32-x64-msvc';
    } else if (platform === 'win32' && arch === 'ia32') {
      platformBinary = '@rollup/rollup-win32-ia32-msvc';
    }

    if (platformBinary) {
      this.log(
        `Installing platform-specific binary: ${platformBinary}`,
        'info',
      );

      const installResult = await this.runCommand(
        `npm install ${platformBinary} --save-optional --no-save`,
        `Install ${platformBinary}`,
      );

      if (installResult.success) {
        this.log(`Successfully installed ${platformBinary}`, 'success');
      } else {
        this.log(
          `Failed to install ${platformBinary}, continuing...`,
          'warning',
        );
      }
    }

    // Try to install all common binaries as optional
    this.log('Installing optional Rollup binaries...', 'info');

    for (const binary of rollupBinaries) {
      const result = await this.runCommand(
        `npm install ${binary} --save-optional --no-save || echo "Skipped ${binary}"`,
        `Install ${binary}`,
      );

      if (this.options.verbose) {
        this.log(
          `${binary}: ${result.success ? 'installed' : 'skipped'}`,
          'info',
        );
      }
    }

    return true;
  }

  private async testBuild(): Promise<boolean> {
    this.log('Testing build to verify Rollup fix...', 'info');

    const buildResult = await this.runCommand('npm run build', 'Build test');

    if (buildResult.success) {
      this.log(
        'Build test successful - Rollup dependencies are working!',
        'success',
      );
      return true;
    } else {
      this.log('Build test failed - Rollup issues may persist', 'error');
      return false;
    }
  }

  private async verifyRollupInstallation(): Promise<void> {
    this.log('Verifying Rollup installation...', 'info');

    try {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Check if Rollup is in dependencies
      const hasRollup =
        packageJson.dependencies?.rollup ||
        packageJson.devDependencies?.rollup ||
        packageJson.dependencies?.vite ||
        packageJson.devDependencies?.vite;

      if (hasRollup) {
        this.log('Rollup/Vite found in package.json', 'success');
      } else {
        this.log('Rollup/Vite not found in package.json', 'warning');
      }

      // Check node_modules
      const rollupPath = join(projectRoot, 'node_modules', 'rollup');
      const vitePath = join(projectRoot, 'node_modules', 'vite');

      if (existsSync(rollupPath)) {
        this.log('Rollup found in node_modules', 'success');
      } else if (existsSync(vitePath)) {
        this.log('Vite found in node_modules (includes Rollup)', 'success');
      } else {
        this.log('Rollup/Vite not found in node_modules', 'warning');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Verification failed: ${errorMessage}`, 'error');
    }
  }

  async run(): Promise<void> {
    console.log('🔧 Weather App - Rollup Dependencies Fix');
    console.log('=========================================');

    if (this.options.verbose) {
      this.log('Verbose mode enabled', 'info');
    }

    // Check if we're in the right directory
    if (!this.checkProjectRoot()) {
      process.exit(1);
    }

    try {
      // Clean installation if requested
      if (this.options.clean) {
        await this.cleanInstallation();
      }

      // Install dependencies
      const installSuccess = await this.installDependencies();
      if (!installSuccess && !this.options.force) {
        this.log(
          'Dependency installation failed. Use --force to continue anyway.',
          'error',
        );
        process.exit(1);
      }

      // Fix Rollup binaries
      await this.fixRollupBinaries();

      // Verify installation
      await this.verifyRollupInstallation();

      // Test build unless specifically skipped
      if (!process.argv.includes('--no-test')) {
        const testSuccess = await this.testBuild();
        if (!testSuccess && !this.options.force) {
          this.log(
            'Build test failed. Rollup issues may not be fully resolved.',
            'warning',
          );
          process.exit(1);
        }
      }

      this.log('🎉 Rollup dependencies fix completed successfully!', 'success');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Fatal error: ${errorMessage}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): Options {
  const args = process.argv.slice(2);
  return {
    force: args.includes('--force') || args.includes('-f'),
    clean: args.includes('--clean') || args.includes('-c'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

// Show help
function showHelp() {
  console.log(`
🔧 Rollup Dependencies Fix - Cross-Platform TypeScript Version

Usage: node fix-rollup-deps.ts [options]

Options:
  --clean, -c     Clean node_modules and package-lock.json before install
  --force, -f     Continue even if some steps fail
  --verbose, -v   Show detailed output
  --no-test       Skip build test at the end
  --help, -h      Show this help message

Examples:
  node fix-rollup-deps.ts              # Basic fix
  node fix-rollup-deps.ts --clean      # Clean install + fix
  node fix-rollup-deps.ts --verbose    # Detailed output
  node fix-rollup-deps.ts --force      # Force completion

This script resolves Rollup binary dependency issues that can occur
in CI/CD environments or when switching between different platforms.
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const fixer = new RollupDependencyFixer(options);
fixer.run().catch(console.error);
