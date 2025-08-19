#!/usr/bin/env node

/**
 * Pre-commit Hook - TypeScript Script
 * Cross-platform script to run quality checks before committing
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HookOptions {
  verbose?: boolean;
  fix?: boolean;
}

class PreCommitHook {
  private options: HookOptions;

  constructor(options: HookOptions = {}) {
    this.options = options;
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

  private async runCommand(
    command: string,
    description: string
  ): Promise<boolean> {
    try {
      this.log(`Running ${description}...`, 'info');
      const { stdout, stderr } = await execAsync(command);

      if (this.options.verbose && stdout) {
        console.log(stdout);
      }

      if (stderr && !stderr.includes('warning')) {
        console.error(stderr);
        return false;
      }

      this.log(`${description} passed`, 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`${description} failed: ${errorMessage}`, 'error');
      return false;
    }
  }

  private async formatCode(): Promise<boolean> {
    if (this.options.fix) {
      this.log('Auto-fixing code formatting...', 'info');
      await this.runCommand('npm run format', 'Prettier formatting');
      await this.runCommand('npm run lint:fix', 'ESLint auto-fix');
    }
    return true;
  }

  async run(): Promise<void> {
    console.log('🔍 Weather App - Pre-commit Quality Checks');
    console.log('=========================================');

    const checks = [
      { cmd: 'npm run format:check', desc: 'Code formatting' },
      { cmd: 'npm run lint:check', desc: 'ESLint rules' },
      { cmd: 'npm run type-check', desc: 'TypeScript types' },
      { cmd: 'npm run test:fast', desc: 'Unit tests' },
    ];

    let allPassed = true;

    try {
      // Auto-fix if requested
      if (this.options.fix) {
        await this.formatCode();
      }

      // Run all checks
      for (const check of checks) {
        const passed = await this.runCommand(check.cmd, check.desc);
        if (!passed) {
          allPassed = false;
        }
      }

      if (allPassed) {
        this.log('All pre-commit checks passed! 🎉', 'success');
        console.log('\n✨ Your code is ready for commit!');
      } else {
        this.log(
          'Some checks failed. Please fix the issues before committing.',
          'error'
        );
        console.log('\n💡 Tips:');
        console.log('   • Run "npm run lint:fix" to auto-fix linting issues');
        console.log('   • Run "npm run format" to fix formatting');
        console.log('   • Run "npm run type-check" to see TypeScript errors');
        console.log('   • Run "npm run test" to see test failures');
        process.exit(1);
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
function parseArgs(): HookOptions {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix') || args.includes('-f'),
  };
}

// Show help
function showHelp() {
  console.log(`
🔍 Pre-commit Quality Checks - Cross-Platform TypeScript Version

Usage: node pre-commit-hook.ts [options]

Options:
  --fix, -f         Auto-fix formatting and linting issues
  --verbose, -v     Show detailed output
  --help, -h        Show this help message

Checks performed:
  ✓ Code formatting (Prettier)
  ✓ Linting rules (ESLint)
  ✓ TypeScript compilation
  ✓ Unit tests

Examples:
  node pre-commit-hook.ts           # Run all checks
  node pre-commit-hook.ts --fix     # Auto-fix issues and run checks
  node pre-commit-hook.ts --verbose # Show detailed output
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const hook = new PreCommitHook(options);
hook.run().catch(console.error);
