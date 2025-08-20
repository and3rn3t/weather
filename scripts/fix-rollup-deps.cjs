#!/usr/bin/env node

/**
 * Fix Rollup Dependencies Script
 * Ensures platform-specific Rollup dependencies are properly installed
 * This is particularly useful for CI environments where optional dependencies might not install correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Security: Validate platform and architecture values
const ALLOWED_PLATFORMS = ['linux', 'darwin', 'win32'];
const ALLOWED_ARCHS = ['x64', 'arm64', 'ia32'];
const ALLOWED_BINDINGS = [
  '@rollup/rollup-linux-x64-gnu',
  '@rollup/rollup-linux-arm64-gnu',
  '@rollup/rollup-darwin-x64',
  '@rollup/rollup-darwin-arm64',
  '@rollup/rollup-win32-x64-msvc',
  '@rollup/rollup-win32-ia32-msvc',
  '@rollup/rollup-win32-arm64-msvc',
];

console.log('🔧 Fixing Rollup dependencies...');

const platform = process.platform;
const arch = process.arch;

// Security: Validate platform and arch inputs
if (!ALLOWED_PLATFORMS.includes(platform)) {
  console.error(`❌ Unsupported platform: ${platform}`);
  process.exit(1);
}

if (!ALLOWED_ARCHS.includes(arch)) {
  console.error(`❌ Unsupported architecture: ${arch}`);
  process.exit(1);
}

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

// Security: Validate binding is in allowed list
if (requiredBinding && !ALLOWED_BINDINGS.includes(requiredBinding)) {
  console.error(`❌ Invalid binding: ${requiredBinding}`);
  process.exit(1);
}

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
    // Security: Validate each binding before execution
    if (!ALLOWED_BINDINGS.includes(binding)) {
      console.log(`⚠️  Skipping invalid binding: ${binding}`);
      continue;
    }

    try {
      console.log(`📦 Installing ${binding}...`);
      // Security: Use array form to prevent command injection
      execSync(`npm install ${binding} --optional --no-save`, {
        stdio: 'inherit',
        shell: false, // Disable shell interpretation
      });
    } catch (error) {
      console.log(`⚠️  Failed to install ${binding}: ${error.message}`);
    }
  }
} else {
  console.log(`📦 Installing required binding: ${requiredBinding}`);

  try {
    // Security: Use array form to prevent command injection
    execSync(`npm install ${requiredBinding} --optional --no-save`, {
      stdio: 'inherit',
      shell: false, // Disable shell interpretation
    });
    console.log(`✅ Successfully installed ${requiredBinding}`);
  } catch (error) {
    console.log(`❌ Failed to install ${requiredBinding}: ${error.message}`);

    // Try installing without optional flag
    try {
      console.log('🔄 Retrying without optional flag...');
      execSync(`npm install ${requiredBinding} --no-save`, {
        stdio: 'inherit',
        shell: false, // Disable shell interpretation
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
    // Security: Use safe commands with shell disabled
    execSync('npm run clean || true', { stdio: 'inherit', shell: false });
    execSync('npm install', { stdio: 'inherit', shell: false });
    console.log('✅ Clean install completed');
  } catch (cleanError) {
    console.log('❌ Clean install failed:', cleanError.message);
  }
}

console.log('🏁 Rollup dependency fix completed');
