#!/usr/bin/env node

/**
 * Pre-commit Hook - TypeScript Script
 * Cross-platform script to run quality checks before committing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { appendFile } from 'fs/promises';
import { EOL } from 'os';

const execAsync = promisify(exec);
const LOG_FILE = '.git/pre-commit.log';

async function log(line: string) {
  try {
    await appendFile(LOG_FILE, line + EOL);
  } catch {
    // ignore logging errors
  }
}

interface HookOptions {
  verbose?: boolean;
  fix?: boolean;
}

class PreCommitHook {
  private options: HookOptions;

  constructor(options: HookOptions = {}) {
    this.options = options;
  }

  private print(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    } as const;

    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m', // Reset
    } as const;

    const line = `${icons[type]} ${colors[type]}${message}${colors.reset}`;
    console.log(line);
    void log(line);
  }

  private async runCommand(
    command: string,
    description: string
  ): Promise<boolean> {
    const header = `Running ${description}...`;
    this.print(header, 'info');
    await log(`$ ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stdout) {
        if (this.options.verbose) console.log(stdout);
        await log(stdout);
      }
      if (stderr) {
        // Some tools write warnings to stderr even on success; do not fail on stderr alone
        if (this.options.verbose) console.error(stderr);
        await log(stderr);
      }
      this.print(`${description} passed`, 'success');
      return true;
    } catch (error: unknown) {
      const out = (error as { stdout?: string; stderr?: string }) ?? {};
      const stdout = out.stdout ?? '';
      const stderr = out.stderr ?? '';
      if (stdout) {
        if (this.options.verbose) console.log(stdout);
        await log(stdout);
      }
      if (stderr) {
        if (this.options.verbose) console.error(stderr);
        await log(stderr);
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.print(`${description} failed: ${msg}`, 'error');
      return false;
    }
  }

  private async formatCode(): Promise<void> {
    if (this.options.fix) {
      this.print('Auto-fixing code formatting and linting...', 'info');
      await this.runCommand('npm run format', 'Prettier formatting');
      await this.runCommand('npm run lint:fix', 'ESLint auto-fix');
      await this.runCommand('npm run stylelint:fix', 'Stylelint auto-fix');
    }
  }

  // Get staged files from git and filter by extensions Prettier can format
  private async getStagedFilesForPrettier(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        'git --no-pager diff --name-only --cached'
      );
      const files = stdout
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

      const prettierExts = new Set([
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.json',
        '.css',
        '.scss',
        '.md',
        '.mdx',
        '.html',
        '.yml',
        '.yaml',
        '.cjs',
        '.mjs',
      ]);

      const matches = files.filter(f => {
        const lower = f.toLowerCase();
        for (const ext of prettierExts) {
          if (lower.endsWith(ext)) return true;
        }
        return false;
      });
      return matches;
    } catch (e) {
      await log(
        `Failed to get staged files: ${e instanceof Error ? e.message : String(e)}`
      );
      return [];
    }
  }

  private quotePaths(paths: string[]): string {
    // Quote each path safely for shell (handles spaces and Windows paths)
    return paths.map(p => `"${p.replace(/"/g, '\\"')}"`).join(' ');
  }

  async run(): Promise<void> {
    if (process.env.SKIP_PRECOMMIT === '1') {
      this.print('SKIP_PRECOMMIT=1 detected — skipping all checks.', 'warning');
      return;
    }

    this.print('Weather App - Pre-commit Quality Checks', 'info');
    await log('=== Pre-commit start ===');

    // Run auto-fix upfront if explicitly requested
    if (this.options.fix) {
      await this.formatCode();
      await this.runCommand('git add -A', 'Stage auto-fixed files');
    }

    let allPassed = true;

    // 1) Code formatting check on staged files only (with auto-fix fallback)
    const staged = await this.getStagedFilesForPrettier();
    if (staged.length > 0) {
      const quoted = this.quotePaths(staged);
      const formattingPassed = await this.runCommand(
        `npx prettier --check --ignore-unknown ${quoted}`,
        'Code formatting (staged)'
      );

      if (!formattingPassed) {
        this.print(
          'Formatting issues detected — attempting auto-fix on staged files...',
          'warning'
        );
        await this.runCommand(
          `npx prettier --write --ignore-unknown ${quoted}`,
          'Prettier formatting (staged)'
        );
        await this.runCommand('git add -A', 'Stage formatting changes');
        const recheck = await this.runCommand(
          `npx prettier --check --ignore-unknown ${quoted}`,
          'Code formatting (staged, after auto-fix)'
        );
        if (!recheck) allPassed = false;
      }
    } else {
      this.print(
        'No staged files require Prettier formatting; skipping formatting check.',
        'info'
      );
    }

    // 2) Remaining checks (repo-wide)
    const checks = [
      { cmd: 'npm run lint:check', desc: 'ESLint rules' },
      { cmd: 'npm run stylelint', desc: 'Stylelint rules' },
      { cmd: 'npm run type-check', desc: 'TypeScript types' },
      { cmd: 'npm run test:fast', desc: 'Unit tests' },
    ];

    for (const check of checks) {
      const passed = await this.runCommand(check.cmd, check.desc);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      this.print('All pre-commit checks passed! 🎉', 'success');
      await log('=== Pre-commit success ===');
    } else {
      this.print(
        'Some checks failed. Please fix the issues before committing.',
        'error'
      );
      console.log('\nTips:');
      console.log(' • npm run lint:fix');
      console.log(' • npm run stylelint:fix');
      console.log(' • npm run format');
      console.log(' • npm run type-check');
      console.log(' • npm run test');
      await log('=== Pre-commit failed ===');
      process.exit(1);
    }
  }
}

function parseArgs(): HookOptions {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix') || args.includes('-f'),
  };
}

function showHelp() {
  console.log(`
Pre-commit Quality Checks

Usage: node pre-commit-hook.ts [options]

Options:
  --fix, -f         Auto-fix formatting and linting issues
  --verbose, -v     Show detailed output
  --help, -h        Show this help message
  `);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const hook = new PreCommitHook(options);
hook.run().catch(async (e: unknown) => {
  await log(
    `Unhandled: ${e instanceof Error ? e.stack || e.message : String(e)}`
  );
  process.exit(1);
});
