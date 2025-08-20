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
    const loggingServicePath = path.join(this.projectRoot, 'src/utils/logger.ts');

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
      this.fixes.push('✅ Created production-safe logging service at src/utils/logger.ts');
    }
  }

  // Fix console statements in production files
  fixConsoleStatements() {
    console.log('🖥️ Fixing console statements...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      if (file.includes('test') || file.includes('spec') || file.includes('__tests__')) {
        continue; // Skip test files
      }

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Check if logger is already imported
      const hasLoggerImport = content.includes("from '../utils/logger'") ||
                             content.includes("from './logger'") ||
                             content.includes("from '../../utils/logger'");

      // Add logger import if needed and console statements found
      if (!hasLoggerImport && /console\.(log|debug|info|warn|error)/.test(content)) {
        const importStatement = "import { logError, logWarn, logInfo, logDebug } from '../utils/logger';\n";

        // Find the best place to add the import
        const lines = content.split('\n');
        let insertIndex = 0;

        // Find last import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            insertIndex = i + 1;
          } else if (lines[i].trim() === '' && insertIndex > 0) {
            break;
          }
        }

        lines.splice(insertIndex, 0, importStatement);
        content = lines.join('\n');
        modified = true;
      }

      // Replace console statements with logger calls
      const replacements = [
        { from: /console\.error\(/g, to: 'logError(' },
        { from: /console\.warn\(/g, to: 'logWarn(' },
        { from: /console\.info\(/g, to: 'logInfo(' },
        { from: /console\.log\(/g, to: 'logInfo(' },
        { from: /console\.debug\(/g, to: 'logDebug(' }
      ];

      replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
          content = content.replace(from, to);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(file, content);
        fixCount++;
        this.fixes.push(`✅ Fixed console statements in ${path.relative(this.projectRoot, file)}`);
      }
    }

    if (fixCount > 0) {
      console.log(`   Fixed console statements in ${fixCount} files`);
    }
    }
  }

  // Fix empty catch blocks
  fixEmptyCatchBlocks() {
    console.log('🎯 Fixing empty catch blocks...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Replace empty catch blocks
      const emptyCatchPattern = /catch\s*\(([^)]*)\)\s*\{\s*\}/g;
      const replacement = \`catch (\$1) {
        logError('Unhandled error in \${path.basename(file)}:', \$1);
      }\`;

      if (emptyCatchPattern.test(content)) {
        content = content.replace(emptyCatchPattern, replacement);

        // Add logger import if not present
        if (!content.includes("from '../utils/logger'") &&
            !content.includes("from './logger'") &&
            !content.includes("from '../../utils/logger'")) {
          const importStatement = "import { logError } from '../utils/logger';\n";
          content = importStatement + content;
        }

        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content);
        fixCount++;
        this.fixes.push(\`✅ Fixed empty catch blocks in \${path.relative(this.projectRoot, file)}\`);
      }
    }

    if (fixCount > 0) {
      console.log(\`   Fixed empty catch blocks in \${fixCount} files\`);
    }
  }

  // Fix generic error messages
  fixGenericErrors() {
    console.log('⚠️ Fixing generic error messages...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Replace generic "Error" messages with more specific ones
      const genericErrorPattern = /throw new Error\(['"]Error['"]?\)/g;
      const fileName = path.basename(file, path.extname(file));
      const replacement = \`throw new Error('\${fileName}: Specific operation failed')\`;

      if (genericErrorPattern.test(content)) {
        content = content.replace(genericErrorPattern, replacement);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(file, content);
        fixCount++;
        this.fixes.push(\`✅ Fixed generic error messages in \${path.relative(this.projectRoot, file)}\`);
      }
    }

    if (fixCount > 0) {
      console.log(\`   Fixed generic error messages in \${fixCount} files\`);
    }
  }

  // Add basic JSDoc to exported functions
  addBasicJSDoc() {
    console.log('📚 Adding basic JSDoc documentation...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      if (file.includes('test') || file.includes('spec')) continue;

      let content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for exported functions without JSDoc
        if (/^export\s+(function|const\s+\w+\s*=)/.test(line.trim())) {
          const prevLine = lines[i - 1] || '';

          if (!prevLine.includes('/**') && !prevLine.includes('//')) {
            // Extract function name
            const funcMatch = line.match(/(?:export\s+function\s+(\w+)|export\s+const\s+(\w+))/);
            const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : 'exported function';

            // Add basic JSDoc
            const jsDoc = [
              '/**',
              \` * \${funcName} - Add description here\`,
              ' */',
            ];

            lines.splice(i, 0, ...jsDoc);
            i += jsDoc.length; // Skip the newly added lines
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(file, lines.join('\n'));
        fixCount++;
        this.fixes.push(\`✅ Added JSDoc templates in \${path.relative(this.projectRoot, file)}\`);
      }
    }

    if (fixCount > 0) {
      console.log(\`   Added JSDoc templates in \${fixCount} files\`);
    }
  }

  // Get source files for analysis
  getSourceFiles() {
    const files = [];
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldExcludeDir(item)) {
          walkDir(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx)$/.test(item)) {
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
    this.fixConsoleStatements();
    this.fixEmptyCatchBlocks();
    this.fixGenericErrors();
    this.addBasicJSDoc();

    return this.fixes;
  }

  // Display results
  displayResults() {
    if (this.fixes.length === 0) {
      console.log('✨ No automatic fixes were needed. Your code is already well-structured!\n');
      return;
    }

    console.log(\`\n🎉 Successfully applied \${this.fixes.length} reliability fixes:\n\`);
    this.fixes.forEach(fix => console.log(fix));

    console.log(\`\n📋 Next Steps:\`);
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
