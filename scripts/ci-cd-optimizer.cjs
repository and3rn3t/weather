#!/usr/bin/env node

/**
 * CI/CD Pipeline Optimizer
 * Analyzes current pipeline performance and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance thresholds
const THRESHOLDS = {
  buildTime: 120000, // 2 minutes
  testTime: 60000, // 1 minute
  bundleSize: 600 * 1024, // 600KB
  cacheHitRate: 0.8, // 80%
  parallelJobs: 4,
};

class CICDOptimizer {
  constructor() {
    this.projectRoot = path.dirname(__dirname);
    this.recommendations = [];
    this.metrics = {};
  }

  async analyze() {
    console.log('🔍 Analyzing CI/CD Pipeline Performance...\n');

    await this.analyzeBuildPerformance();
    await this.analyzeTestPerformance();
    await this.analyzeCacheEfficiency();
    await this.analyzeBundleOptimization();
    await this.analyzeParallelization();
    await this.generateRecommendations();
  }

  async analyzeBuildPerformance() {
    console.log('📊 Analyzing Build Performance...');

    try {
      const startTime = Date.now();
      execSync('npm run build', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 300000, // 5 minutes
        shell: false, // Security: disable shell interpretation
      });
      const buildTime = Date.now() - startTime;

      this.metrics.buildTime = buildTime;
      console.log(`   ⏱️  Build Time: ${this.formatDuration(buildTime)}`);

      if (buildTime > THRESHOLDS.buildTime) {
        this.recommendations.push({
          type: 'build',
          priority: 'high',
          issue: 'Build time exceeds 2 minutes',
          solution: 'Implement build caching and parallel processing',
          impact: 'Reduces feedback loop by 60-80%',
        });
      }
    } catch (error) {
      console.log('   ❌ Build analysis failed:', error.message);
    }
  }

  async analyzeTestPerformance() {
    console.log('🧪 Analyzing Test Performance...');

    try {
      const startTime = Date.now();
      execSync('npm run test:ci', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 180000, // 3 minutes
        shell: false, // Security: disable shell interpretation
      });
      const testTime = Date.now() - startTime;

      this.metrics.testTime = testTime;
      console.log(`   ⏱️  Test Time: ${this.formatDuration(testTime)}`);

      if (testTime > THRESHOLDS.testTime) {
        this.recommendations.push({
          type: 'test',
          priority: 'high',
          issue: 'Test execution time exceeds 1 minute',
          solution: 'Implement test sharding and parallel execution',
          impact: 'Reduces test time by 70-80%',
        });
      }
    } catch (error) {
      console.log('   ❌ Test analysis failed:', error.message);
    }
  }

  async analyzeCacheEfficiency() {
    console.log('🗄️  Analyzing Cache Efficiency...');

    // Check for existing cache configurations
    // workflow file path not needed here; using optimizedWorkflow for checks
    const optimizedWorkflow = path.join(
      this.projectRoot,
      '.github/workflows/deploy-optimized.yml'
    );

    let hasOptimizedCache = false;
    if (fs.existsSync(optimizedWorkflow)) {
      const content = fs.readFileSync(optimizedWorkflow, 'utf8');
      hasOptimizedCache =
        content.includes('actions/cache@v4') &&
        content.includes('BUILD_CACHE_KEY');
    }

    if (!hasOptimizedCache) {
      this.recommendations.push({
        type: 'cache',
        priority: 'medium',
        issue: 'No build cache implementation',
        solution:
          'Implement intelligent caching for dependencies and build artifacts',
        impact: 'Reduces build time by 40-60%',
      });
    }

    console.log(
      `   ${hasOptimizedCache ? '✅' : '❌'} Cache Optimization: ${
        hasOptimizedCache ? 'Implemented' : 'Not implemented'
      }`
    );
  }

  async analyzeBundleOptimization() {
    console.log('📦 Analyzing Bundle Optimization...');

    try {
      // Run bundle analysis
      execSync('npm run analyze:bundle', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 60000,
        shell: false, // Security: disable shell interpretation
      });

      // Check bundle size
      const distPath = path.join(this.projectRoot, 'dist');
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        let totalSize = 0;

        files.forEach(file => {
          const filePath = path.join(distPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        });

        this.metrics.bundleSize = totalSize;
        console.log(`   📏 Bundle Size: ${this.formatBytes(totalSize)}`);

        if (totalSize > THRESHOLDS.bundleSize) {
          this.recommendations.push({
            type: 'bundle',
            priority: 'medium',
            issue: 'Bundle size exceeds 600KB',
            solution: 'Implement code splitting and tree shaking optimizations',
            impact: 'Improves load time by 30-50%',
          });
        }
      }
    } catch (error) {
      console.log('   ❌ Bundle analysis failed:', error.message);
    }
  }

  async analyzeParallelization() {
    console.log('🔄 Analyzing Parallelization...');

    // workflow file path not needed here; using optimizedWorkflow for checks
    const optimizedWorkflow = path.join(
      this.projectRoot,
      '.github/workflows/deploy-optimized.yml'
    );

    let hasParallelJobs = false;
    if (fs.existsSync(optimizedWorkflow)) {
      const content = fs.readFileSync(optimizedWorkflow, 'utf8');
      hasParallelJobs =
        content.includes('strategy:') &&
        content.includes('matrix:') &&
        content.includes('shard:');
    }

    if (!hasParallelJobs) {
      this.recommendations.push({
        type: 'parallel',
        priority: 'high',
        issue: 'No parallel job execution',
        solution: 'Implement test sharding and parallel quality checks',
        impact: 'Reduces total pipeline time by 50-70%',
      });
    }

    console.log(
      `   ${hasParallelJobs ? '✅' : '❌'} Parallelization: ${
        hasParallelJobs ? 'Implemented' : 'Not implemented'
      }`
    );
  }

  async generateRecommendations() {
    console.log('\n📋 Optimization Recommendations:\n');

    if (this.recommendations.length === 0) {
      console.log('✅ Your CI/CD pipeline is already optimized!');
      return;
    }

    // Group by priority
    const highPriority = this.recommendations.filter(
      r => r.priority === 'high'
    );
    const mediumPriority = this.recommendations.filter(
      r => r.priority === 'medium'
    );
    const lowPriority = this.recommendations.filter(r => r.priority === 'low');

    if (highPriority.length > 0) {
      console.log('🔴 High Priority Optimizations:');
      highPriority.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.issue}`);
        console.log(`      💡 Solution: ${rec.solution}`);
        console.log(`      📈 Impact: ${rec.impact}\n`);
      });
    }

    if (mediumPriority.length > 0) {
      console.log('🟡 Medium Priority Optimizations:');
      mediumPriority.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.issue}`);
        console.log(`      💡 Solution: ${rec.solution}`);
        console.log(`      📈 Impact: ${rec.impact}\n`);
      });
    }

    if (lowPriority.length > 0) {
      console.log('🟢 Low Priority Optimizations:');
      lowPriority.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.issue}`);
        console.log(`      💡 Solution: ${rec.solution}`);
        console.log(`      📈 Impact: ${rec.impact}\n`);
      });
    }

    // Generate implementation plan
    this.generateImplementationPlan();
  }

  generateImplementationPlan() {
    console.log('🚀 Implementation Plan:\n');

    console.log('1. 📦 Install Optimized Workflow:');
    console.log(
      '   - Replace .github/workflows/ci-cd.yml with deploy-optimized.yml'
    );
    console.log('   - Configure GitHub secrets for Cloudflare deployment');
    console.log('');

    console.log('2. 🔧 Update Package Scripts:');
    console.log('   - Add test sharding scripts');
    console.log('   - Implement build caching');
    console.log('   - Add performance monitoring');
    console.log('');

    console.log('3. 📊 Monitor Performance:');
    console.log('   - Set up performance budgets');
    console.log('   - Configure alerts for regressions');
    console.log('   - Track build and test times');
    console.log('');

    console.log('4. 🔄 Continuous Optimization:');
    console.log('   - Run this optimizer regularly');
    console.log('   - Update thresholds based on project growth');
    console.log('   - Monitor cache hit rates');
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new CICDOptimizer();
  optimizer.analyze().catch(console.error);
}

module.exports = CICDOptimizer;
