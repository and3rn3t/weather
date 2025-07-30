#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the built bundle and provides size information
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Analyzing bundle...');

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.log('❌ Dist directory not found. Run build first.');
  process.exit(1);
}

try {
  const files = fs.readdirSync(distDir, { recursive: true });
  
  let totalSize = 0;
  const fileStats = [];
  
  files.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      totalSize += stats.size;
      
      fileStats.push({
        name: file,
        size: sizeKB,
        type: path.extname(file)
      });
    }
  });
  
  // Sort by size
  fileStats.sort((a, b) => b.size - a.size);
  
  console.log('\n📦 Bundle Analysis Results:');
  console.log('='.repeat(50));
  
  // Group by type
  const jsFiles = fileStats.filter(f => f.type === '.js');
  const cssFiles = fileStats.filter(f => f.type === '.css');
  const otherFiles = fileStats.filter(f => f.type !== '.js' && f.type !== '.css');
  
  if (jsFiles.length > 0) {
    console.log('\n🟨 JavaScript Files:');
    jsFiles.forEach(file => {
      console.log(`  ${file.name}: ${file.size} KB`);
    });
  }
  
  if (cssFiles.length > 0) {
    console.log('\n🟦 CSS Files:');
    cssFiles.forEach(file => {
      console.log(`  ${file.name}: ${file.size} KB`);
    });
  }
  
  if (otherFiles.length > 0) {
    console.log('\n📄 Other Files:');
    otherFiles.forEach(file => {
      console.log(`  ${file.name}: ${file.size} KB`);
    });
  }
  
  const totalSizeKB = Math.round(totalSize / 1024);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log('\n📊 Total Bundle Size:');
  console.log(`  ${totalSizeKB} KB (${totalSizeMB} MB)`);
  
  // Performance warnings
  if (totalSizeKB > 2000) {
    console.log('\n⚠️  Warning: Bundle size is large (>2MB)');
  } else if (totalSizeKB > 1000) {
    console.log('\n💡 Info: Bundle size is moderate (>1MB)');
  } else {
    console.log('\n✅ Good: Bundle size is optimal (<1MB)');
  }
  
  console.log('\n✅ Bundle analysis complete!');
  
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
