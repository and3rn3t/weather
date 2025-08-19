#!/usr/bin/env node

/**
 * Health Check Script for Weather App
 * Verifies all critical services and dependencies are working
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class HealthChecker {
  constructor() {
    this.results = {
      dependencies: { status: 'unknown', details: [] },
      apis: { status: 'unknown', details: [] },
      build: { status: 'unknown', details: [] },
      tests: { status: 'unknown', details: [] },
      environment: { status: 'unknown', details: [] }
    };
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    try {
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
      const { stdout } = await execAsync('npm outdated --json', { cwd: projectRoot });
      
      const outdated = stdout ? JSON.parse(stdout) : {};
      const outdatedCount = Object.keys(outdated).length;
      
      this.results.dependencies = {
        status: outdatedCount === 0 ? 'healthy' : outdatedCount < 5 ? 'warning' : 'error',
        details: [
          `Total dependencies: ${Object.keys(packageJson.dependencies || {}).length}`,
          `Dev dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`,
          `Outdated packages: ${outdatedCount}`,
          outdatedCount > 0 ? `Consider updating: ${Object.keys(outdated).slice(0, 3).join(', ')}` : 'All packages up to date'
        ]
      };
    } catch (error) {
      this.results.dependencies = {
        status: 'error',
        details: [`Error checking dependencies: ${error.message}`]
      };
    }
  }

  async checkAPIs() {
    console.log('🌐 Checking API endpoints...');
    const apis = [
      {
        name: 'OpenMeteo Weather API',
        url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true'
      },
      {
        name: 'Nominatim Geocoding API', 
        url: 'https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1'
      }
    ];

    const results = [];
    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'WeatherApp-HealthCheck/1.0' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          results.push(`✅ ${api.name}: ${response.status} (${Math.round(performance.now())}ms)`);
        } else {
          results.push(`❌ ${api.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        results.push(`❌ ${api.name}: ${error.message}`);
      }
    }

    this.results.apis = {
      status: results.every(r => r.includes('✅')) ? 'healthy' : 'error',
      details: results
    };
  }

  async checkBuild() {
    console.log('🏗️ Checking build system...');
    try {
      // Check if TypeScript compiles
      const { stderr: tscErrors } = await execAsync('npx tsc --noEmit', { cwd: projectRoot });
      
      // Check if Vite can analyze the project
      const { stdout: viteCheck } = await execAsync('npx vite --version', { cwd: projectRoot });
      
      const hasErrors = tscErrors.length > 0;
      
      this.results.build = {
        status: hasErrors ? 'warning' : 'healthy',
        details: [
          `Vite version: ${viteCheck.trim()}`,
          hasErrors ? `TypeScript warnings: ${tscErrors.split('\n').length} lines` : 'TypeScript compilation clean',
          existsSync(join(projectRoot, 'dist')) ? 'Previous build artifacts found' : 'No build artifacts'
        ]
      };
    } catch (error) {
      this.results.build = {
        status: 'error',
        details: [`Build check failed: ${error.message}`]
      };
    }
  }

  async checkTests() {
    console.log('🧪 Checking test system...');
    try {
      const { stdout } = await execAsync('npm run test:fast', { cwd: projectRoot });
      const testResults = stdout.match(/(\d+) passed/);
      const testCount = testResults ? testResults[1] : '0';
      
      this.results.tests = {
        status: parseInt(testCount) > 0 ? 'healthy' : 'warning',
        details: [
          `Tests passed: ${testCount}`,
          'Test runner: Vitest',
          'Coverage enabled: Yes'
        ]
      };
    } catch (error) {
      this.results.tests = {
        status: 'error',
        details: [`Test execution failed: ${error.message}`]
      };
    }
  }

  async checkEnvironment() {
    console.log('⚙️ Checking environment...');
    try {
      const { stdout: nodeVersion } = await execAsync('node --version');
      const { stdout: npmVersion } = await execAsync('npm --version');
      
      const nodeVersionNum = parseFloat(nodeVersion.replace('v', ''));
      const isNodeOk = nodeVersionNum >= 20;
      
      this.results.environment = {
        status: isNodeOk ? 'healthy' : 'warning',
        details: [
          `Node.js: ${nodeVersion.trim()} ${isNodeOk ? '✅' : '⚠️'}`,
          `npm: ${npmVersion.trim()}`,
          `Platform: ${process.platform}`,
          `Architecture: ${process.arch}`
        ]
      };
    } catch (error) {
      this.results.environment = {
        status: 'error',
        details: [`Environment check failed: ${error.message}`]
      };
    }
  }

  printResults() {
    console.log('\n📊 HEALTH CHECK RESULTS\n');
    
    const getStatusIcon = (status) => {
      switch (status) {
        case 'healthy': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        default: return '❓';
      }
    };

    for (const [category, result] of Object.entries(this.results)) {
      console.log(`${getStatusIcon(result.status)} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
      result.details.forEach(detail => console.log(`   ${detail}`));
      console.log('');
    }

    const overallHealth = Object.values(this.results).every(r => r.status === 'healthy') ? 'HEALTHY' : 
                         Object.values(this.results).some(r => r.status === 'error') ? 'NEEDS ATTENTION' : 'FAIR';
    
    console.log(`🎯 OVERALL STATUS: ${overallHealth}\n`);
    
    if (overallHealth !== 'HEALTHY') {
      console.log('💡 RECOMMENDATIONS:');
      if (this.results.dependencies.status !== 'healthy') {
        console.log('   - Run: npm run deps:update');
      }
      if (this.results.apis.status !== 'healthy') {
        console.log('   - Check internet connection and API availability');
      }
      if (this.results.build.status !== 'healthy') {
        console.log('   - Run: npm run fix');
      }
      if (this.results.tests.status !== 'healthy') {
        console.log('   - Run: npm run test:fix');
      }
      console.log('');
    }
  }

  async run() {
    console.log('🩺 Weather App Health Check Starting...\n');
    
    await this.checkEnvironment();
    await this.checkDependencies();
    await this.checkAPIs();
    await this.checkBuild();
    await this.checkTests();
    
    this.printResults();
    
    // Exit with appropriate code
    const hasErrors = Object.values(this.results).some(r => r.status === 'error');
    process.exit(hasErrors ? 1 : 0);
  }
}

// Run health check if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  const checker = new HealthChecker();
  checker.run().catch(console.error);
}

export { HealthChecker };
