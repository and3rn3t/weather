#!/usr/bin/env node

/**
 * Fix Rollup Dependencies Script
 * Ensures platform-specific Rollup dependencies are properly installed
 * This is particularly useful for CI environments where optional dependencies might not install correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rollup dependencies...');

const platform = process.platform;
const arch = process.arch;

console.log(`📋 Platform: ${platform}, Architecture: ${arch}`);

// Map platform/arch to Rollup binary packages
const rollupBindings = {
  'linux-x64': '@rollup/rollup-linux-x64-gnu',
  'linux-arm64': '@rollup/rollup-linux-arm64-gnu',
  'darwin-x64': '@rollup/rollup-darwin-x64',
  'darwin-arm64': '@rollup/rollup-darwin-arm64',
  'win32-x64': '@rollup/rollup-win32-x64-msvc',
  'win32-ia32': '@rollup/rollup-win32-ia32-msvc',
  'win32-arm64': '@rollup/rollup-win32-arm64-msvc',
};

const platformKey = `${platform}-${arch}`;
const requiredBinding = rollupBindings[platformKey];

if (!requiredBinding) {
  console.log(`⚠️  Unknown platform: ${platformKey}`);
  console.log('🔄 Installing all common Rollup bindings...');

  // Install all common bindings as fallback
  const commonBindings = [
    '@rollup/rollup-linux-x64-gnu',
    '@rollup/rollup-darwin-x64',
    '@rollup/rollup-darwin-arm64',
    '@rollup/rollup-win32-x64-msvc',
  ];

  for (const binding of commonBindings) {
    try {
      console.log(`📦 Installing ${binding}...`);
      execSync(`npm install ${binding} --optional --no-save`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.log(`⚠️  Failed to install ${binding}: ${error.message}`);
    }
  }
} else {
  console.log(`📦 Installing required binding: ${requiredBinding}`);

  try {
    execSync(`npm install ${requiredBinding} --optional --no-save`, {
      stdio: 'inherit',
    });
    console.log(`✅ Successfully installed ${requiredBinding}`);
  } catch (error) {
    console.log(`❌ Failed to install ${requiredBinding}: ${error.message}`);

    // Try installing without optional flag
    try {
      console.log('🔄 Retrying without optional flag...');
      execSync(`npm install ${requiredBinding} --no-save`, {
        stdio: 'inherit',
      });
      console.log(
        `✅ Successfully installed ${requiredBinding} (without optional flag)`
      );
    } catch (retryError) {
      console.log(`❌ Retry failed: ${retryError.message}`);
    }
  }
}

// Verify rollup can be required
try {
  require('rollup');
  console.log('✅ Rollup can be loaded successfully');
} catch (error) {
  console.log('❌ Rollup still cannot be loaded:', error.message);

  // Last resort: clean install
  console.log('🧹 Attempting clean install...');
  try {
    execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Clean install completed');
  } catch (cleanError) {
    console.log('❌ Clean install failed:', cleanError.message);
  }
}

console.log('🏁 Rollup dependency fix completed');
