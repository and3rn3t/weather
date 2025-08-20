#!/usr/bin/env node

/**
 * Clean up unused imports after reliability fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up unused imports...\n');

class ImportCleaner {
  constructor() {
    this.fixes = [];
    this.projectRoot = process.cwd();
  }

  // Clean unused logger imports
  cleanUnusedLoggerImports() {
    console.log('📝 Cleaning unused logger imports...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Check for logger imports
      const loggerImportRegex =
        /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]*logger['"];?\n?/;
      const match = content.match(loggerImportRegex);

      if (match) {
        const importedItems = match[1].split(',').map(item => item.trim());
        const usedItems = [];

        // Check which logger functions are actually used
        importedItems.forEach(item => {
          const functionName = item.trim();
          if (content.includes(`${functionName}(`)) {
            usedItems.push(functionName);
          }
        });

        // If no logger functions are used, remove the entire import
        if (usedItems.length === 0) {
          content = content.replace(loggerImportRegex, '');
          modified = true;
        }
        // If some but not all are used, update the import
        else if (usedItems.length < importedItems.length) {
          const newImport = `import { ${usedItems.join(
            ', '
          )} } from '../utils/logger';`;
          content = content.replace(loggerImportRegex, newImport + '\n');
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(file, content);
        fixCount++;
        this.fixes.push(
          `✅ Cleaned unused logger imports in ${path.relative(
            this.projectRoot,
            file
          )}`
        );
      }
    }

    if (fixCount > 0) {
      console.log(`   Cleaned unused imports in ${fixCount} files`);
    }
  }

  // Remove empty JSDoc templates
  improveJSDocTemplates() {
    console.log('📚 Improving JSDoc templates...');

    const srcFiles = this.getSourceFiles();
    let fixCount = 0;

    for (const file of srcFiles) {
      if (file.includes('test') || file.includes('spec')) continue;

      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      // Replace generic JSDoc templates with better ones
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes('* exported function - Add description here') ||
          lines[i].includes('- Add description here')
        ) {
          // Try to infer better description from function name/context
          const nextLine = lines[i + 2] || '';
          if (
            nextLine.includes('export function') ||
            nextLine.includes('export const')
          ) {
            const funcMatch = nextLine.match(
              /(?:export\s+function\s+(\w+)|export\s+const\s+(\w+))/
            );
            const funcName = funcMatch ? funcMatch[1] || funcMatch[2] : '';

            if (funcName) {
              let description = this.generateDescription(funcName, file);
              lines[i] = ` * ${description}`;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(file, lines.join('\n'));
        fixCount++;
        this.fixes.push(
          `✅ Improved JSDoc descriptions in ${path.relative(
            this.projectRoot,
            file
          )}`
        );
      }
    }

    if (fixCount > 0) {
      console.log(`   Improved JSDoc in ${fixCount} files`);
    }
  }

  // Generate meaningful descriptions based on function names
  generateDescription(funcName, filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));

    // Common patterns
    if (funcName.startsWith('use')) {
      return `${funcName} - Custom React hook for ${fileName} functionality`;
    }
    if (funcName.startsWith('get')) {
      return `${funcName} - Retrieves ${funcName
        .replace('get', '')
        .toLowerCase()} data`;
    }
    if (funcName.startsWith('set')) {
      return `${funcName} - Sets ${funcName
        .replace('set', '')
        .toLowerCase()} configuration`;
    }
    if (funcName.startsWith('handle')) {
      return `${funcName} - Handles ${funcName
        .replace('handle', '')
        .toLowerCase()} events`;
    }
    if (funcName.startsWith('create')) {
      return `${funcName} - Creates and configures ${funcName
        .replace('create', '')
        .toLowerCase()}`;
    }
    if (funcName.startsWith('init')) {
      return `${funcName} - Initializes ${fileName} system`;
    }
    if (funcName.includes('Theme')) {
      return `${funcName} - Theme management functionality for weather app`;
    }
    if (funcName.includes('Weather')) {
      return `${funcName} - Weather data processing and display`;
    }
    if (funcName.includes('Haptic')) {
      return `${funcName} - Haptic feedback system for mobile interactions`;
    }
    if (funcName.includes('Location')) {
      return `${funcName} - Location services and geolocation handling`;
    }

    // Default
    return `${funcName} - Core ${fileName} functionality`;
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

  // Run all cleanup tasks
  async runCleanup() {
    this.cleanUnusedLoggerImports();
    this.improveJSDocTemplates();

    return this.fixes;
  }

  // Display results
  displayResults() {
    if (this.fixes.length === 0) {
      console.log('✨ No cleanup needed. Code is already optimized!\n');
      return;
    }

    console.log(
      `\n🎉 Successfully applied ${this.fixes.length} cleanup fixes:\n`
    );
    this.fixes.forEach(fix => console.log(fix));

    console.log('\n📋 Final Steps:');
    console.log('1. Run: npm run test');
    console.log('2. Run: npm run build');
    console.log('3. Run: npm run reliability:check');
    console.log('4. Commit changes and check SonarCloud dashboard');
    console.log(
      '\n🎯 Your SonarCloud reliability rating should now be significantly improved!'
    );
    console.log();
  }
}

// Main execution
async function main() {
  try {
    const cleaner = new ImportCleaner();
    await cleaner.runCleanup();
    cleaner.displayResults();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ImportCleaner;
