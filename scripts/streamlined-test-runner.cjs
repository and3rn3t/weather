#!/usr/bin/env node

/**
 * Streamlined Test Runner for CI/CD
 * Optimizes test execution based on environment and changes
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class StreamlinedTestRunner {
  constructor() {
    this.isCI = process.env.CI === 'true';
    this.shard = process.env.VITEST_SHARD || '1/1';
    this.pattern = process.env.TEST_PATTERN || '';
    this.mode = process.env.TEST_MODE || 'full';

    this.testConfig = {
      timeout: this.isCI ? 30000 : 10000,
      retries: this.isCI ? 2 : 0,
      parallel: this.isCI,
      coverage: process.env.COVERAGE !== 'false',
    };
  }

  async run() {
    console.log('🚀 Streamlined Test Runner');
    console.log('═'.repeat(40));
    console.log(`Environment: ${this.isCI ? 'CI' : 'Local'}`);
    console.log(`Shard: ${this.shard}`);
    console.log(`Mode: ${this.mode}`);
    console.log(
      `Coverage: ${this.testConfig.coverage ? 'Enabled' : 'Disabled'}`
    );
    console.log('');

    try {
      const startTime = Date.now();

      switch (this.mode) {
        case 'fast':
          await this.runFastTests();
          break;
        case 'sharded':
          await this.runShardedTests();
          break;
        case 'affected':
          await this.runAffectedTests();
          break;
        case 'full':
        default:
          await this.runFullTests();
          break;
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n✅ Tests completed in ${duration.toFixed(2)}s`);
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async runFastTests() {
    console.log('⚡ Running fast tests (no coverage)...');

    const cmd = [
      'npx',
      'vitest',
      'run',
      '--config',
      'vitest.config.optimized.ts',
      '--coverage=false',
      '--reporter=basic',
      `--testTimeout=${this.testConfig.timeout}`,
      this.pattern,
    ].filter(Boolean);

    await this.executeCommand(cmd);
  }

  async runShardedTests() {
    console.log(`🔀 Running sharded tests (${this.shard})...`);

    const shardMap = {
      '1/4': 'src/utils/__tests__/**/*.test.{ts,tsx}',
      '2/4': 'src/components/**/*.test.{ts,tsx}',
      '3/4': 'src/__tests__/**/*.test.{ts,tsx}',
      '4/4': 'src/utils/__tests__/**/*.simple.test.{ts,tsx}',
    };

    const pattern = shardMap[this.shard] || this.pattern;

    const cmd = [
      'npx',
      'vitest',
      'run',
      '--config',
      'vitest.config.optimized.ts',
      this.testConfig.coverage ? '--coverage' : '--coverage=false',
      '--reporter=json',
      `--outputFile=test-results-${this.shard.replace('/', '-')}.json`,
      `--testTimeout=${this.testConfig.timeout}`,
      pattern,
    ].filter(Boolean);

    await this.executeCommand(cmd);
  }

  async runAffectedTests() {
    console.log('🎯 Running affected tests only...');

    try {
      // Get changed files
      const changedFiles = this.getChangedFiles();
      const affectedTests = this.getAffectedTests(changedFiles);

      if (affectedTests.length === 0) {
        console.log(
          'ℹ️  No tests affected by changes. Skipping test execution.'
        );
        return;
      }

      console.log(`📋 Found ${affectedTests.length} affected test files`);

      const cmd = [
        'npx',
        'vitest',
        'run',
        '--config',
        'vitest.config.optimized.ts',
        this.testConfig.coverage ? '--coverage' : '--coverage=false',
        `--testTimeout=${this.testConfig.timeout}`,
        ...affectedTests,
      ];

      await this.executeCommand(cmd);
    } catch (error) {
      console.log(
        '⚠️  Could not determine affected tests, running all tests...'
      );
      console.log(`   Error: ${error.message}`);
      await this.runFullTests();
    }
  }

  async runFullTests() {
    console.log('🔄 Running full test suite...');

    const cmd = [
      'npx',
      'vitest',
      'run',
      '--config',
      'vitest.config.optimized.ts',
      this.testConfig.coverage ? '--coverage' : '--coverage=false',
      '--reporter=verbose',
      `--testTimeout=${this.testConfig.timeout}`,
      this.pattern,
    ].filter(Boolean);

    await this.executeCommand(cmd);
  }

  getChangedFiles() {
    try {
      const output = execSync('git diff --name-only HEAD~1 HEAD', {
        encoding: 'utf8',
        shell: false, // Security: disable shell interpretation
      });
      return output.trim().split('\n').filter(Boolean);
    } catch (error) {
      // Fallback to staged files if HEAD~1 doesn't exist (initial commit)
      console.log(`⚠️  Could not get diff from HEAD~1: ${error.message}`);
      try {
        const output = execSync('git diff --cached --name-only', {
          encoding: 'utf8',
          shell: false, // Security: disable shell interpretation
        });
        return output.trim().split('\n').filter(Boolean);
      } catch (fallbackError) {
        console.log(`⚠️  Could not get staged files: ${fallbackError.message}`);
        throw new Error('Could not determine changed files');
      }
    }
  }

  getAffectedTests(changedFiles) {
    const affectedTests = new Set();

    changedFiles.forEach(file => {
      // Direct test files
      if (file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
        affectedTests.add(file);
      }

      // Source files - find corresponding tests
      if (
        file.match(/^src\/.*\.(ts|tsx|js|jsx)$/) &&
        !file.includes('.test.') &&
        !file.includes('.spec.')
      ) {
        const possibleTests = this.findTestsForSourceFile(file);
        possibleTests.forEach(test => affectedTests.add(test));
      }
    });

    return Array.from(affectedTests).filter(file => fs.existsSync(file));
  }

  findTestsForSourceFile(sourceFile) {
    const tests = [];
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const dir = path.dirname(sourceFile);

    // Check common test patterns
    const patterns = [
      path.join(dir, `${baseName}.test.ts`),
      path.join(dir, `${baseName}.test.tsx`),
      path.join(dir, `${baseName}.spec.ts`),
      path.join(dir, `${baseName}.spec.tsx`),
      path.join(dir, '__tests__', `${baseName}.test.ts`),
      path.join(dir, '__tests__', `${baseName}.test.tsx`),
      path.join(dir, '__tests__', `${baseName}.spec.ts`),
      path.join(dir, '__tests__', `${baseName}.spec.tsx`),
    ];

    patterns.forEach(pattern => {
      if (fs.existsSync(pattern)) {
        tests.push(pattern);
      }
    });

    return tests;
  }

  async executeCommand(cmd) {
    console.log(`🔧 Executing: ${cmd.join(' ')}`);

    return new Promise((resolve, reject) => {
      const process = spawn(cmd[0], cmd.slice(1), {
        stdio: 'inherit',
        shell: true,
      });

      process.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', error => {
        reject(error);
      });
    });
  }
}

// CLI execution
if (require.main === module) {
  const runner = new StreamlinedTestRunner();
  runner.run().catch(console.error);
}

module.exports = StreamlinedTestRunner;
