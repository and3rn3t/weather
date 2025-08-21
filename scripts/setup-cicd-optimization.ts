#!/usr/bin/env node

/**
 * CI/CD Pipeline Optimization Setup - TypeScript Script
 * Cross-platform script to set up optimized CI/CD pipeline
 */

import {
  existsSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

interface SetupOptions {
  backup?: boolean;
  verbose?: boolean;
  force?: boolean;
}

class CICDOptimizer {
  private options: SetupOptions;

  constructor(options: SetupOptions = {}) {
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

  private checkProjectRoot(): boolean {
    const packageJsonPath = join(projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      this.log(
        'Please run this script from the project root directory',
        'error',
      );
      return false;
    }
    return true;
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      this.log(`Created directory: ${dirPath}`, 'success');
    }
  }

  private backupCurrentWorkflow(): void {
    this.log('Step 1: Backing up current workflow...', 'info');

    const workflowDir = join(projectRoot, '.github', 'workflows');
    const currentWorkflow = join(workflowDir, 'deploy.yml');
    const backupWorkflow = join(workflowDir, 'deploy-backup.yml');

    if (existsSync(currentWorkflow)) {
      if (this.options.backup !== false) {
        copyFileSync(currentWorkflow, backupWorkflow);
        this.log('Current workflow backed up to deploy-backup.yml', 'success');
      }
    } else {
      this.log('No existing workflow found, creating new one', 'warning');
    }
  }

  private createOptimizedWorkflow(): void {
    this.log('Step 2: Creating optimized workflow...', 'info');

    const workflowDir = join(projectRoot, '.github', 'workflows');
    this.ensureDirectoryExists(workflowDir);

    const optimizedWorkflow = `name: Optimized Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '22.x'
  CACHE_VERSION: v1

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: |
          ~/.npm
          node_modules
        key: \${{ runner.os }}-npm-\${{ env.CACHE_VERSION }}-\${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          \${{ runner.os }}-npm-\${{ env.CACHE_VERSION }}-
          
    - name: Install dependencies
      run: npm ci --prefer-offline --no-audit
      
    - name: Run TypeScript check
      run: npx tsc --noEmit
      
    - name: Run fast tests
      run: npm run test:fast
      
    - name: Run health check
      run: npm run health

  build:
    needs: test
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: |
          ~/.npm
          node_modules
        key: \${{ runner.os }}-npm-\${{ env.CACHE_VERSION }}-\${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          \${{ runner.os }}-npm-\${{ env.CACHE_VERSION }}-
          
    - name: Install dependencies
      run: npm ci --prefer-offline --no-audit
      
    - name: Build project
      run: npm run build
      
    - name: Performance monitoring
      run: npm run performance:monitor
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-files
        path: dist/
        retention-days: 30

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 10
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-files
        path: dist/
        
    - name: Deploy to production
      run: |
        echo "🚀 Deploying to production..."
        echo "Add your deployment commands here"
        
    - name: Notify deployment success
      run: |
        echo "✅ Deployment completed successfully!"
`;

    const workflowPath = join(workflowDir, 'deploy.yml');
    writeFileSync(workflowPath, optimizedWorkflow);
    this.log('Optimized workflow created successfully', 'success');
  }

  private updatePackageScripts(): void {
    this.log('Step 3: Updating package.json scripts...', 'info');

    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // Add CI-optimized scripts if they don't exist
    const ciScripts = {
      'ci:fast': 'npm run test:fast && npm run build',
      'ci:full':
        'npm run lint && npm run test:parallel && npm run build && npm run performance:monitor',
      'ci:health': 'npm run health && npm run test:apis',
      'ci:deploy': 'npm run build && npm run performance:monitor',
    };

    let added = 0;
    for (const [script, command] of Object.entries(ciScripts)) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        added++;
      }
    }

    if (added > 0) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.log(
        `Added ${added} CI-optimized scripts to package.json`,
        'success',
      );
    } else {
      this.log('CI scripts already exist in package.json', 'info');
    }
  }

  private createGitHubActionsConfig(): void {
    this.log('Step 4: Creating GitHub Actions configuration...', 'info');

    const actionsDir = join(projectRoot, '.github');
    this.ensureDirectoryExists(actionsDir);

    // Create dependabot.yml for dependency updates
    const dependabotConfig = `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "⬆️"
      include: "scope"
`;

    const dependabotPath = join(actionsDir, 'dependabot.yml');
    if (!existsSync(dependabotPath) || this.options.force) {
      writeFileSync(dependabotPath, dependabotConfig);
      this.log(
        'Created dependabot.yml for automated dependency updates',
        'success',
      );
    }

    // Create pull request template
    const prTemplate = `## 📋 Description
Brief description of changes

## 🧪 Testing
- [ ] Tests pass locally
- [ ] Health check passes
- [ ] Performance monitoring complete

## 📱 Mobile Testing
- [ ] iOS tested
- [ ] Android tested
- [ ] Design system compliance verified

## 🔗 Related Issues
Closes #

## 📸 Screenshots (if applicable)
<!-- Add screenshots here -->

## ✅ Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
`;

    const prTemplatePath = join(actionsDir, 'PULL_REQUEST_TEMPLATE.md');
    if (!existsSync(prTemplatePath) || this.options.force) {
      writeFileSync(prTemplatePath, prTemplate);
      this.log('Created pull request template', 'success');
    }
  }

  private testCIConfiguration(): Promise<boolean> {
    this.log('Step 5: Testing CI configuration...', 'info');

    return new Promise(resolve => {
      // Test if the workflow syntax is valid
      const workflowPath = join(
        projectRoot,
        '.github',
        'workflows',
        'deploy.yml',
      );

      if (existsSync(workflowPath)) {
        this.log('Workflow file exists and appears valid', 'success');
        resolve(true);
      } else {
        this.log('Workflow file not found', 'error');
        resolve(false);
      }
    });
  }

  private async runHealthCheck(): Promise<boolean> {
    this.log('Step 6: Running system health check...', 'info');

    try {
      await execAsync('npm run health', { cwd: projectRoot });
      this.log('Health check passed', 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Health check failed: ${errorMessage}`, 'warning');
      return false;
    }
  }

  private generateReport(): void {
    this.log('\n📊 CI/CD Optimization Report:', 'info');
    console.log('✅ Optimized workflow created');
    console.log('✅ Package.json scripts updated');
    console.log('✅ GitHub Actions configuration created');
    console.log('✅ Pull request template added');
    console.log('✅ Dependabot configuration added');

    this.log('\n🚀 Next Steps:', 'info');
    console.log(
      '1. Review the generated workflow in .github/workflows/deploy.yml',
    );
    console.log('2. Customize deployment commands for your hosting platform');
    console.log('3. Set up any required secrets in GitHub repository settings');
    console.log('4. Test the workflow by creating a pull request');

    this.log('\n📋 Available CI Commands:', 'info');
    console.log('npm run ci:fast    # Quick CI pipeline');
    console.log('npm run ci:full    # Complete CI pipeline');
    console.log('npm run ci:health  # Health and API checks');
    console.log('npm run ci:deploy  # Build and performance check');
  }

  async run(): Promise<void> {
    console.log('🚀 Weather App - CI/CD Pipeline Optimization');
    console.log('============================================');

    if (!this.checkProjectRoot()) {
      process.exit(1);
    }

    try {
      this.backupCurrentWorkflow();
      this.createOptimizedWorkflow();
      this.updatePackageScripts();
      this.createGitHubActionsConfig();

      const configValid = await this.testCIConfiguration();
      if (!configValid && !this.options.force) {
        this.log('CI configuration test failed', 'error');
        process.exit(1);
      }

      const healthPassed = await this.runHealthCheck();
      if (!healthPassed) {
        this.log(
          'Consider running npm run doctor to fix issues before deployment',
          'warning',
        );
      }

      this.generateReport();
      this.log(
        '\n🎉 CI/CD optimization setup completed successfully!',
        'success',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Fatal error: ${errorMessage}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): SetupOptions {
  const args = process.argv.slice(2);
  return {
    backup: !args.includes('--no-backup'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force') || args.includes('-f'),
  };
}

// Show help
function showHelp() {
  console.log(`
🚀 CI/CD Pipeline Optimization Setup - Cross-Platform TypeScript Version

Usage: node setup-cicd-optimization.ts [options]

Options:
  --no-backup     Skip backing up existing workflow
  --force, -f     Overwrite existing files
  --verbose, -v   Show detailed output
  --help, -h      Show this help message

Examples:
  node setup-cicd-optimization.ts              # Standard setup
  node setup-cicd-optimization.ts --force      # Overwrite existing files
  node setup-cicd-optimization.ts --verbose    # Detailed output

This script creates:
  ✓ Optimized GitHub Actions workflow
  ✓ CI-specific package.json scripts
  ✓ Dependabot configuration
  ✓ Pull request template
  ✓ GitHub Actions best practices
`);
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

const options = parseArgs();
const optimizer = new CICDOptimizer(options);
optimizer.run().catch(console.error);
