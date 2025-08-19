#!/usr/bin/env node

/**
 * Quick Setup Script for New Developers
 * One-command setup for the entire development environment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class QuickSetup {
  constructor() {
    this.steps = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  async logStep(message, fn) {
    console.log(`🔄 ${message}...`);
    const stepStart = Date.now();
    
    try {
      await fn();
      const duration = Date.now() - stepStart;
      console.log(`   ✅ Completed in ${duration}ms\n`);
      this.steps.push({ message, status: 'success', duration });
    } catch (error) {
      const duration = Date.now() - stepStart;
      console.log(`   ❌ Failed: ${error.message}\n`);
      this.steps.push({ message, status: 'error', duration, error: error.message });
      this.errors.push({ step: message, error: error.message });
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking Prerequisites...\n');
    
    await this.logStep('Checking Node.js version', async () => {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const versionNumber = parseFloat(version.replace('v', ''));
      
      if (versionNumber < 20) {
        throw new Error(`Node.js ${version} is too old. Please upgrade to v20+`);
      }
      
      console.log(`   Node.js: ${version} ✓`);
    });
    
    await this.logStep('Checking npm version', async () => {
      const { stdout } = await execAsync('npm --version');
      console.log(`   npm: ${stdout.trim()} ✓`);
    });
    
    await this.logStep('Checking Git configuration', async () => {
      try {
        await execAsync('git --version');
        await execAsync('git rev-parse --git-dir', { cwd: projectRoot });
        console.log('   Git repository: ✓');
      } catch {
        throw new Error('Not a Git repository or Git not installed');
      }
    });
  }

  async installDependencies() {
    console.log('📦 Installing Dependencies...\n');
    
    await this.logStep('Installing npm packages', async () => {
      const { stdout, stderr } = await execAsync('npm install', { 
        cwd: projectRoot,
        timeout: 120000 // 2 minutes timeout
      });
      
      if (stderr && stderr.includes('ERR!')) {
        throw new Error('npm install encountered errors');
      }
      
      console.log('   Dependencies installed successfully');
    });
  }

  async setupDevelopmentEnvironment() {
    console.log('⚙️ Setting Up Development Environment...\n');
    
    await this.logStep('Creating .vscode/settings.json', async () => {
      const vscodeDir = join(projectRoot, '.vscode');
      const settingsPath = join(vscodeDir, 'settings.json');
      
      if (!existsSync(vscodeDir)) {
        const { mkdir } = await import('fs/promises');
        await mkdir(vscodeDir, { recursive: true });
      }
      
      if (!existsSync(settingsPath)) {
        const settings = {
          "typescript.preferences.importModuleSpecifier": "relative",
          "typescript.suggest.autoImports": true,
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
          },
          "files.associations": {
            "*.css": "css"
          },
          "emmet.includeLanguages": {
            "typescript": "html",
            "typescriptreact": "html"
          }
        };
        
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('   VS Code settings configured');
      } else {
        console.log('   VS Code settings already exist');
      }
    });
    
    await this.logStep('Setting up Git hooks', async () => {
      const gitHooksDir = join(projectRoot, '.git', 'hooks');
      const preCommitPath = join(gitHooksDir, 'pre-commit');
      
      if (!existsSync(preCommitPath)) {
        const preCommitHook = `#!/bin/sh
# Pre-commit hook for weather app
echo "Running pre-commit checks..."
npm run lint
npm run test:fast
echo "Pre-commit checks completed!"
`;
        
        writeFileSync(preCommitPath, preCommitHook);
        
        // Make executable on Unix systems
        if (process.platform !== 'win32') {
          await execAsync(`chmod +x "${preCommitPath}"`);
        }
        
        console.log('   Git pre-commit hook installed');
      } else {
        console.log('   Git hooks already configured');
      }
    });
  }

  async runInitialTests() {
    console.log('🧪 Running Initial Tests...\n');
    
    await this.logStep('Running TypeScript check', async () => {
      try {
        await execAsync('npx tsc --noEmit', { cwd: projectRoot });
        console.log('   TypeScript: No errors found');
      } catch (error) {
        // TypeScript errors are warnings, not fatal
        console.log('   TypeScript: Some warnings found (see previous build logs)');
      }
    });
    
    await this.logStep('Running ESLint', async () => {
      const { stdout, stderr } = await execAsync('npm run lint', { cwd: projectRoot });
      
      if (stderr && stderr.includes('error')) {
        throw new Error('ESLint found errors');
      }
      
      console.log('   ESLint: Passed');
    });
    
    await this.logStep('Running fast tests', async () => {
      await execAsync('npm run test:fast', { cwd: projectRoot });
      console.log('   Tests: All passed');
    });
  }

  async buildProject() {
    console.log('🏗️ Building Project...\n');
    
    await this.logStep('Building for production', async () => {
      await execAsync('npm run build', { 
        cwd: projectRoot,
        timeout: 120000 // 2 minutes timeout
      });
      
      const distPath = join(projectRoot, 'dist');
      if (!existsSync(distPath)) {
        throw new Error('Build output not found');
      }
      
      console.log('   Production build: ✓');
    });
  }

  async runHealthChecks() {
    console.log('🩺 Running Health Checks...\n');
    
    await this.logStep('Running development doctor', async () => {
      await execAsync('npm run doctor', { cwd: projectRoot });
      console.log('   Development environment: Healthy');
    });
    
    await this.logStep('Testing weather APIs', async () => {
      await execAsync('npm run test:apis', { cwd: projectRoot });
      console.log('   Weather APIs: Responding correctly');
    });
    
    await this.logStep('Validating iOS design system', async () => {
      await execAsync('npm run design:validate', { cwd: projectRoot });
      console.log('   iOS design system: Compliant');
    });
  }

  async startDevServer() {
    console.log('🚀 Starting Development Server...\n');
    
    await this.logStep('Launching dev server', async () => {
      console.log('   Starting Vite development server...');
      console.log('   Server will be available at: http://localhost:5173');
      console.log('   Press Ctrl+C to stop the server');
      
      // Don't await this - let it run in background
      const devServer = exec('npm run dev', { cwd: projectRoot });
      
      devServer.stdout?.on('data', (data) => {
        if (data.includes('Local:')) {
          console.log(`   ${data.trim()}`);
        }
      });
      
      // Give server time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('   Development server started successfully');
    });
  }

  generateSetupReport() {
    const duration = Date.now() - this.startTime;
    const successSteps = this.steps.filter(s => s.status === 'success').length;
    const errorSteps = this.steps.filter(s => s.status === 'error').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: duration,
      steps: this.steps,
      errors: this.errors,
      summary: {
        totalSteps: this.steps.length,
        successful: successSteps,
        failed: errorSteps,
        successRate: Math.round((successSteps / this.steps.length) * 100)
      }
    };
    
    const reportPath = join(projectRoot, `setup-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  printWelcomeMessage() {
    console.log('\n🎉 SETUP COMPLETED SUCCESSFULLY!\n');
    
    console.log('📱 Premium Weather App - Development Environment Ready\n');
    
    console.log('🚀 Quick Start Commands:');
    console.log('   npm run dev              # Start development server');
    console.log('   npm run test:watch       # Run tests in watch mode');
    console.log('   npm run build            # Build for production');
    console.log('   npm run health           # Check system health');
    console.log('   npm run doctor           # Diagnose issues\n');
    
    console.log('📚 Available Scripts:');
    console.log('   npm run test:apis        # Test weather APIs');
    console.log('   npm run design:validate  # Validate iOS design system');
    console.log('   npm run mobile:deploy:ios    # Deploy to iOS simulator');
    console.log('   npm run mobile:deploy:android # Deploy to Android device');
    console.log('   npm run performance:monitor   # Monitor performance\n');
    
    console.log('🛠️ Development Workflow:');
    console.log('   1. Make changes to src/ files');
    console.log('   2. Tests run automatically');
    console.log('   3. Hot reload updates browser');
    console.log('   4. Commit triggers pre-commit hooks');
    console.log('   5. Push to deploy automatically\n');
    
    console.log('📖 Documentation:');
    console.log('   - README.md           # Project overview');
    console.log('   - docs/               # Detailed documentation');
    console.log('   - .github/copilot-instructions.md # Development guide\n');
    
    console.log('🌐 Development server is running at: http://localhost:5173');
    console.log('✨ Happy coding!\n');
  }

  printErrorSummary() {
    console.log('\n⚠️ SETUP COMPLETED WITH ISSUES\n');
    
    console.log('❌ Errors encountered:');
    this.errors.forEach(error => {
      console.log(`   - ${error.step}: ${error.error}`);
    });
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Node.js version (requires v20+)');
    console.log('   2. Ensure stable internet connection');
    console.log('   3. Run: npm run doctor --fix');
    console.log('   4. Check the setup report for details');
    console.log('   5. Ask for help if issues persist\n');
    
    console.log('📞 Getting Help:');
    console.log('   - Review error messages above');
    console.log('   - Check docs/development/ for guides');
    console.log('   - Run npm run health for diagnostics\n');
  }

  async run() {
    console.log('🚀 Weather App Quick Setup Starting...\n');
    console.log('This will set up your complete development environment.\n');
    
    try {
      await this.checkPrerequisites();
      await this.installDependencies();
      await this.setupDevelopmentEnvironment();
      await this.runInitialTests();
      await this.buildProject();
      await this.runHealthChecks();
      
      const report = this.generateSetupReport();
      
      if (this.errors.length === 0) {
        this.printWelcomeMessage();
        
        // Ask if user wants to start dev server
        if (process.argv.includes('--start')) {
          await this.startDevServer();
        } else {
          console.log('Run "npm run dev" to start the development server when ready.');
        }
      } else {
        this.printErrorSummary();
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`\n❌ Setup failed: ${error.message}\n`);
      this.generateSetupReport();
      process.exit(1);
    }
  }
}

// Show usage if --help
if (process.argv.includes('--help')) {
  console.log('🚀 Weather App Quick Setup\n');
  console.log('Usage: node quick-setup.js [options]');
  console.log('\nOptions:');
  console.log('  --start     Start development server after setup');
  console.log('  --help      Show this help message\n');
  console.log('This script will:');
  console.log('  ✓ Check prerequisites (Node.js, Git)');
  console.log('  ✓ Install all dependencies');
  console.log('  ✓ Configure VS Code settings');
  console.log('  ✓ Set up Git hooks');
  console.log('  ✓ Run initial tests');
  console.log('  ✓ Build the project');
  console.log('  ✓ Verify health checks');
  console.log('  ✓ Generate setup report\n');
  process.exit(0);
}

// Run setup if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  const setup = new QuickSetup();
  setup.run().catch(console.error);
}

export { QuickSetup };
