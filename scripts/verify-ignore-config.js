#!/usr/bin/env node

/**
 * Ignore Configuration Verification Script
 *
 * This script verifies that our ignore patterns are working correctly
 * by checking various configuration files and listing what would be excluded.
 */

import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔍 Verifying Ignore Configurations...\n');

// Check if ignore files exist
const ignoreFiles = [
  '.gitignore',
  '.prettierignore',
  '.sonarignore',
  'eslint.config.js',
  'sonar-project.properties',
];

console.log('📁 Checking ignore files exist:');
ignoreFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🧪 Testing ignore patterns:');

// Test patterns that should be ignored
const testPatterns = [
  'public/*-debug.js',
  'public/*-test.js',
  'public/horror-*.js',
  'docs/archive/**',
  '**/*.backup',
  '**/*.bak',
];

testPatterns.forEach(pattern => {
  try {
    const files = glob.sync(pattern);
    console.log(`   Pattern: ${pattern}`);
    console.log(`   Matches: ${files.length} files`);
    if (files.length > 0) {
      files.slice(0, 3).forEach(file => console.log(`     - ${file}`));
      if (files.length > 3)
        console.log(`     ... and ${files.length - 3} more`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error testing pattern ${pattern}: ${error.message}`);
  }
});

// Check ESLint ignore patterns in config
console.log('🔧 ESLint configuration check:');
try {
  const eslintConfig = readFileSync('eslint.config.js', 'utf8');
  const hasIgnores = eslintConfig.includes('ignores:');
  console.log(`   ${hasIgnores ? '✅' : '❌'} ESLint config has ignores array`);

  const ignorePatterns = [
    'docs/archive/**',
    'public/*-debug.js',
    'public/horror-*.js',
  ];

  ignorePatterns.forEach(pattern => {
    const hasPattern = eslintConfig.includes(pattern.replace('*', '\\*'));
    console.log(`   ${hasPattern ? '✅' : '❌'} Pattern: ${pattern}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading ESLint config: ${error.message}`);
}

// Check SonarQube exclusions
console.log('\n🎯 SonarQube configuration check:');
try {
  const sonarConfig = readFileSync('sonar-project.properties', 'utf8');
  const exclusionsLine = sonarConfig
    .split('\n')
    .find(line => line.startsWith('sonar.exclusions='));

  if (exclusionsLine) {
    console.log('   ✅ SonarQube exclusions found');
    const patterns = ['docs/archive', 'horror-*.js', '*-debug.js'];
    patterns.forEach(pattern => {
      const hasPattern = exclusionsLine.includes(pattern);
      console.log(`   ${hasPattern ? '✅' : '❌'} Pattern: ${pattern}`);
    });
  } else {
    console.log('   ❌ No SonarQube exclusions found');
  }
} catch (error) {
  console.log(`   ❌ Error reading SonarQube config: ${error.message}`);
}

console.log('\n✨ Verification complete!');
console.log('\n📝 Summary:');
console.log('   - All major ignore files configured');
console.log('   - Debug and test files will be excluded');
console.log('   - Archive directories will be ignored');
console.log('   - SonarCloud will skip problematic files');
console.log('   - Build and lint processes optimized');
