#!/usr/bin/env node

/**
 * Simple Health Check Script
 * Basic health monitoring for the weather app
 */

console.log('🩺 Weather App Health Check Starting...\n');

// Test 1: Check Node.js version
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    console.log(`✅ Node.js: ${version}`);
    return true;
  } catch (error) {
    console.log(`❌ Node.js check failed: ${error.message}`);
    return false;
  }
}

// Test 2: Check npm
async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    const version = stdout.trim();
    console.log(`✅ npm: ${version}`);
    return true;
  } catch (error) {
    console.log(`❌ npm check failed: ${error.message}`);
    return false;
  }
}

// Test 3: Check package.json
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

function checkPackageJson() {
  const packagePath = join(projectRoot, 'package.json');
  if (!existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    console.log(`✅ package.json: ${packageJson.name} v${packageJson.version}`);
    return true;
  } catch (error) {
    console.log(`❌ package.json invalid: ${error.message}`);
    return false;
  }
}

// Test 4: Check weather APIs
async function checkWeatherAPIs() {
  console.log('🌐 Testing weather APIs...');

  try {
    // Test OpenMeteo API
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true'
    );
    if (response.ok) {
      const data = await response.json();
      if (
        data.current_weather &&
        typeof data.current_weather.temperature === 'number'
      ) {
        console.log(`✅ OpenMeteo API: ${data.current_weather.temperature}°F`);
        return true;
      }
    }
    throw new Error('Invalid API response');
  } catch (error) {
    console.log(`❌ Weather API failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function runHealthCheck() {
  const checks = [
    await checkNodeVersion(),
    await checkNpm(),
    checkPackageJson(),
    await checkWeatherAPIs(),
  ];

  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  console.log(`\n📊 Health Check Results: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('🎉 All systems healthy!\n');
    process.exit(0);
  } else {
    console.log(
      '⚠️ Some issues detected. Run npm run doctor for detailed diagnosis.\n'
    );
    process.exit(1);
  }
}

// Execute the health check
runHealthCheck().catch(error => {
  console.error(`❌ Health check failed: ${error.message}`);
  process.exit(1);
});
