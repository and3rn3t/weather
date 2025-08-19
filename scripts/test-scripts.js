#!/usr/bin/env node

/**
 * Simple Test Script
 * Tests basic functionality of our script setup
 */

console.log('🧪 Testing Weather App Scripts...\n');

// Test 1: Basic Node.js functionality
console.log('✅ Node.js ES modules working');

// Test 2: File system access
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

console.log(`✅ Project root: ${projectRoot}`);

// Test 3: Check important files
const packageJsonPath = join(projectRoot, 'package.json');
if (existsSync(packageJsonPath)) {
  console.log('✅ package.json found');
} else {
  console.log('❌ package.json not found');
}

// Test 4: Check our new scripts exist
const scripts = [
  'health-check.js',
  'test-weather-apis.js',
  'dev-doctor.js',
  'mobile-deploy.js',
  'performance-monitor.js',
  'quick-setup.js'
];

console.log('\n📋 Checking script files:');
scripts.forEach(script => {
  const scriptPath = join(__dirname, script);
  if (existsSync(scriptPath)) {
    console.log(`   ✅ ${script}`);
  } else {
    console.log(`   ❌ ${script} missing`);
  }
});

console.log('\n🎯 Script verification complete!');
console.log('Next: Run individual scripts to test functionality\n');
