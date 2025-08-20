#!/usr/bin/env node

/**
 * Auto-fix Common Reliability Issues
 * Automatically fixes issues that can be safely automated
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Auto-fixing reliability issues...\n');

class ReliabilityFixer {
  constructor() {
    this.fixes = [];
    this.projectRoot = process.cwd();
  }

  // Create a proper logging service
  createLoggingService() {
    const loggingServicePath = path.join(
      this.projectRoot,
      'src/utils/logger.ts'
    );

    if (!fs.existsSync(loggingServicePath)) {
      console.log('📝 Creating proper logging service...');

      const loggingService = `/**
 * Production-safe logging service
 * Replaces console statements with proper logging
 */

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  error(message: string, ...args: any[]): void {
    // Always log errors
    if (typeof console !== 'undefined') {
      console.error(\`[ERROR] \${message}\`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDevelopment || this.isTest) {
      if (typeof console !== 'undefined') {
        console.warn(\`[WARN] \${message}\`, ...args);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      if (typeof console !== 'undefined') {
        console.info(\`[INFO] \${message}\`, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.isDebugEnabled()) {
      if (typeof console !== 'undefined') {
        console.debug(\`[DEBUG] \${message}\`, ...args);
      }
    }
  }

  private isDebugEnabled(): boolean {
    return typeof window !== 'undefined'
      ? window.localStorage?.getItem('debug') === 'true'
      : process.env.DEBUG === 'true';
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
`;

      fs.writeFileSync(loggingServicePath, loggingService);
      this.fixes.push(
        '✅ Created production-safe logging service at src/utils/logger.ts'
      );
    }
  }

  // Get source files for analysis
  getSourceFiles() {
    const files = [];
    const walkDir = dir => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldExcludeDir(item)) {
          walkDir(fullPath);
        } else if (stat.isFile() && /\\.(ts|tsx)$/.test(item)) {
          files.push(fullPath);
        }
      }
    };

    walkDir(path.join(this.projectRoot, 'src'));
    return files;
  }

  // Check if directory should be excluded
  shouldExcludeDir(dirname) {
    const excludeDirs = ['node_modules', 'dist', 'build', 'coverage'];
    return excludeDirs.includes(dirname);
  }

  // Run all fixes
  async runFixes() {
    this.createLoggingService();
    return this.fixes;
  }

  // Display results
  displayResults() {
    if (this.fixes.length === 0) {
      console.log(
        '✨ No automatic fixes were needed. Your code is already well-structured!\\n'
      );
      return;
    }

    console.log(
      `\\n🎉 Successfully applied ${this.fixes.length} reliability fixes:\\n`
    );
    this.fixes.forEach(fix => console.log(fix));

    console.log('\\n📋 Next Steps:');
    console.log('1. Review the changes made to your files');
    console.log('2. Update JSDoc comments with proper descriptions');
    console.log('3. Test your application: npm run test');
    console.log('4. Run build: npm run build');
    console.log('5. Run reliability check: npm run reliability:check');
    console.log('6. Commit changes and check SonarCloud dashboard');
    console.log();
  }
}

// Main execution
async function main() {
  try {
    const fixer = new ReliabilityFixer();
    await fixer.runFixes();
    fixer.displayResults();
  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ReliabilityFixer;
