#!/usr/bin/env node

/**
 * SonarCloud Reliability Improvement Script
 * Identifies and fixes common reliability issues to improve SonarCloud ratings
 */

const fs = require('fs');
const path = require('path');

console.log('📈 SonarCloud Reliability Improvement Analysis...\n');

class ReliabilityImprover {
  constructor() {
    this.issues = [];
    this.suggestions = [];
    this.projectRoot = process.cwd();
  }

  // Check for console statements in production code
  checkConsoleStatements() {
    console.log('🖥️ Checking for console statements in production code...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      if (
        file.includes('test') ||
        file.includes('spec') ||
        file.includes('__tests__')
      ) {
        continue; // Skip test files
      }

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (
          /console\.(log|debug|info|warn|error)/.test(line) &&
          !line.includes('// Production logging') &&
          !line.includes('production')
        ) {
          this.issues.push({
            type: 'reliability',
            severity: 'minor',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'Remove console statements from production code',
            rule: 'typescript:S2189',
            fix: 'Replace with proper logging service or remove',
          });
        }
      });
    }
  }

  // Check for empty catch blocks
  checkEmptyCatchBlocks() {
    console.log('🎯 Checking for empty catch blocks...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Look for catch blocks with minimal or no content
      const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
      const minimalCatchPattern =
        /catch\s*\([^)]*\)\s*\{\s*\/\/[^\n]*\n?\s*\}/g;

      let match;
      const lines = content.split('\n');

      while ((match = emptyCatchPattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        this.issues.push({
          type: 'reliability',
          severity: 'major',
          file: path.relative(this.projectRoot, file),
          line: lineNum,
          message: 'Empty catch block should handle or re-throw the exception',
          rule: 'typescript:S108',
          fix: 'Add proper error handling or logging',
        });
      }
    }
  }

  // Check for proper error handling
  checkErrorHandling() {
    console.log('⚠️ Checking error handling patterns...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for generic error messages
        if (
          line.includes('throw new Error(') &&
          (line.includes('"Error"') || line.includes("'Error'"))
        ) {
          this.issues.push({
            type: 'reliability',
            severity: 'minor',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'Use specific error messages instead of generic "Error"',
            rule: 'typescript:S112',
            fix: 'Provide descriptive error messages',
          });
        }

        // Check for promise rejections without proper error types
        if (line.includes('Promise.reject(') && !line.includes('Error(')) {
          this.issues.push({
            type: 'reliability',
            severity: 'minor',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'Promise rejections should use Error objects',
            rule: 'typescript:S3799',
            fix: 'Use new Error() for promise rejections',
          });
        }
      });
    }
  }

  // Check for unused imports and variables
  checkUnusedCode() {
    console.log('🧹 Checking for unused code...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // Simple check for potentially unused imports
      const imports = [];
      const usage = new Set();

      lines.forEach((line, index) => {
        // Collect imports
        const importMatch = line.match(
          /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from/
        );
        if (importMatch) {
          if (importMatch[1]) {
            // Named imports
            const namedImports = importMatch[1]
              .split(',')
              .map(imp => imp.trim().split(' as ')[0]);
            imports.push(...namedImports);
          } else if (importMatch[2] || importMatch[3]) {
            // Namespace or default imports
            imports.push(importMatch[2] || importMatch[3]);
          }
        }

        // Check usage of imported items
        imports.forEach(imp => {
          if (line.includes(imp) && !line.startsWith('import')) {
            usage.add(imp);
          }
        });
      });

      // Find potentially unused imports
      imports.forEach(imp => {
        if (!usage.has(imp) && imp.length > 2) {
          // Skip very short names that might be used in complex ways
          this.suggestions.push({
            type: 'maintainability',
            severity: 'info',
            file: path.relative(this.projectRoot, file),
            message: `Potentially unused import: ${imp}`,
            rule: 'typescript:S1481',
            fix: 'Remove if not used or check for dynamic usage',
          });
        }
      });
    }
  }

  // Check for code complexity
  checkComplexity() {
    console.log('🔄 Checking code complexity...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // Look for functions with high cyclomatic complexity indicators
      lines.forEach((line, index) => {
        const ifCount = (line.match(/\bif\b/g) || []).length;
        const switchCount = (line.match(/\bswitch\b/g) || []).length;
        const caseCount = (line.match(/\bcase\b/g) || []).length;
        const forCount = (line.match(/\bfor\b/g) || []).length;
        const whileCount = (line.match(/\bwhile\b/g) || []).length;

        const complexityIndicators =
          ifCount + switchCount + caseCount + forCount + whileCount;

        if (complexityIndicators > 3) {
          this.suggestions.push({
            type: 'maintainability',
            severity: 'minor',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message:
              'Consider breaking down complex logic into smaller functions',
            rule: 'typescript:S3776',
            fix: 'Extract methods to reduce complexity',
          });
        }
      });
    }
  }

  // Check for missing JSDoc documentation
  checkDocumentation() {
    console.log('📚 Checking documentation coverage...');

    const srcFiles = this.getSourceFiles();
    for (const file of srcFiles) {
      if (file.includes('test') || file.includes('spec')) continue;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for public functions without JSDoc
        if (
          /^export\s+(function|const\s+\w+\s*=\s*\([^)]*\)\s*=>|class)/.test(
            line.trim()
          )
        ) {
          const prevLine = lines[index - 1] || '';
          if (!prevLine.includes('/**') && !prevLine.includes('//')) {
            this.suggestions.push({
              type: 'maintainability',
              severity: 'info',
              file: path.relative(this.projectRoot, file),
              line: index + 1,
              message:
                'Consider adding JSDoc documentation for exported functions/classes',
              rule: 'typescript:S1176',
              fix: 'Add JSDoc comments to improve code documentation',
            });
          }
        }
      });
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

  // Run all reliability checks
  async runChecks() {
    this.checkConsoleStatements();
    this.checkEmptyCatchBlocks();
    this.checkErrorHandling();
    this.checkUnusedCode();
    this.checkComplexity();
    this.checkDocumentation();

    return { issues: this.issues, suggestions: this.suggestions };
  }

  // Display results with priority
  displayResults() {
    const totalIssues = this.issues.length + this.suggestions.length;

    if (totalIssues === 0) {
      console.log(
        '✅ No reliability issues found! Your code quality is excellent.\n'
      );
      return true;
    }

    console.log(
      `📊 Found ${totalIssues} reliability improvement opportunities:\n`
    );

    // Group by severity
    const critical = this.issues.filter(i => i.severity === 'critical');
    const major = this.issues.filter(i => i.severity === 'major');
    const minor = this.issues.filter(i => i.severity === 'minor');
    const info = [
      ...this.issues.filter(i => i.severity === 'info'),
      ...this.suggestions,
    ];

    if (critical.length > 0) {
      console.log('🚨 CRITICAL Issues (Fix immediately):');
      critical.forEach(this.displayIssue);
      console.log();
    }

    if (major.length > 0) {
      console.log('❌ MAJOR Issues (High priority):');
      major.forEach(this.displayIssue);
      console.log();
    }

    if (minor.length > 0) {
      console.log('⚠️ MINOR Issues (Medium priority):');
      minor.slice(0, 10).forEach(this.displayIssue); // Show top 10
      if (minor.length > 10) {
        console.log(`   ... and ${minor.length - 10} more minor issues`);
      }
      console.log();
    }

    if (info.length > 0) {
      console.log('💡 SUGGESTIONS (Nice to have):');
      info.slice(0, 5).forEach(this.displayIssue); // Show top 5
      if (info.length > 5) {
        console.log(`   ... and ${info.length - 5} more suggestions`);
      }
      console.log();
    }

    this.displaySummary();
    return false;
  }

  displayIssue(issue) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    console.log(`   📍 ${location}`);
    console.log(`      ${issue.message}`);
    console.log(`      Rule: ${issue.rule} | Fix: ${issue.fix}`);
    console.log();
  }

  displaySummary() {
    console.log('🎯 PRIORITY ACTIONS TO IMPROVE SONARCLOUD RATING:');
    console.log('================================================');
    console.log('1. 🔧 Fix CRITICAL and MAJOR issues first');
    console.log('2. 🧹 Remove console.log statements from production code');
    console.log('3. ⚠️ Add proper error handling to empty catch blocks');
    console.log('4. 📝 Improve error messages with specific descriptions');
    console.log('5. 📚 Add JSDoc documentation to public APIs');
    console.log('6. 🔄 Break down complex functions into smaller ones');
    console.log();
    console.log(
      '💡 These improvements will significantly boost your SonarCloud reliability rating!'
    );
    console.log();
  }
}

// Main execution
async function main() {
  try {
    const improver = new ReliabilityImprover();
    await improver.runChecks();
    improver.displayResults();

    console.log('🚀 Next steps:');
    console.log('   1. Fix critical/major issues identified above');
    console.log('   2. Run: npm run reliability:fix');
    console.log('   3. Run: npm run test && npm run build');
    console.log('   4. Commit changes and check SonarCloud dashboard');
    console.log();
  } catch (error) {
    console.error('❌ Reliability analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ReliabilityImprover;
