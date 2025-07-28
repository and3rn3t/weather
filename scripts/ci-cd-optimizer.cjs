#!/usr/bin/env node

/**
 * CI/CD Pipeline Optimization Recommendations
 * Provides actionable recommendations for faster, more efficient CI/CD
 */

const fs = require('fs');
const path = require('path');

class CICDOptimizer {
  constructor() {
    this.recommendations = {
      timestamp: new Date().toISOString(),
      priority: {
        high: [],
        medium: [],
        low: []
      },
      estimatedSavings: {
        time: 0,
        cost: 0,
        reliability: 0
      },
      implementations: []
    };
  }

  async analyzeCurrentSetup() {
    console.log('🔍 Analyzing Current CI/CD Setup...');
    console.log('═'.repeat(50));
    
    await this.analyzeTestPerformance();
    await this.analyzeParallelization();
    await this.analyzeCaching();
    await this.analyzeResourceUtilization();
    await this.generateImplementationPlan();
    
    this.displayRecommendations();
    await this.saveRecommendations();
    
    return this.recommendations;
  }

  async analyzeTestPerformance() {
    console.log('🧪 Analyzing Test Performance...');
    
    // Check current test configuration
    const hasVitest = fs.existsSync('vitest.config.ts') || fs.existsSync('vitest.config.js');
    const hasJest = fs.existsSync('jest.config.js') || fs.existsSync('jest.config.ts');
    const hasOptimizedConfig = fs.existsSync('vitest.config.optimized.ts');
    
    if (!hasOptimizedConfig) {
      this.recommendations.priority.high.push({
        title: 'Implement Test Sharding',
        description: 'Split tests into multiple shards for parallel execution',
        impact: 'Reduce test execution time by 60-75%',
        effort: 'Medium',
        timeSaving: 25, // minutes
        implementation: 'Use Vitest sharding with 4 parallel runners'
      });
    }

    if (hasVitest) {
      this.recommendations.priority.medium.push({
        title: 'Optimize Vitest Configuration',
        description: 'Enable thread pooling and parallel execution',
        impact: 'Reduce test time by 40%',
        effort: 'Low',
        timeSaving: 15,
        implementation: 'Configure pool: threads, maxThreads: 4'
      });
    }

    // Check for test patterns
    const testFiles = this.getTestFiles();
    if (testFiles.length > 20) {
      this.recommendations.priority.high.push({
        title: 'Implement Smart Test Selection',
        description: 'Run only tests affected by code changes',
        impact: 'Reduce test time by 80% for incremental builds',
        effort: 'High',
        timeSaving: 30,
        implementation: 'Use affected test detection based on git diff'
      });
    }

    console.log(`  📋 Found ${testFiles.length} test files`);
    console.log(`  ⚡ Optimization config exists: ${hasOptimizedConfig ? '✅' : '❌'}`);
  }

  async analyzeParallelization() {
    console.log('\n🔄 Analyzing Parallelization Opportunities...');
    
    // Check GitHub Actions workflow
    const workflowFiles = fs.readdirSync('.github/workflows/').filter(f => f.endsWith('.yml'));
    
    for (const file of workflowFiles) {
      const content = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
      
      if (!content.includes('strategy:')) {
        this.recommendations.priority.high.push({
          title: `Add Matrix Strategy to ${file}`,
          description: 'Implement parallel job execution using GitHub Actions matrix',
          impact: 'Reduce pipeline time by 50-70%',
          effort: 'Medium',
          timeSaving: 20,
          implementation: 'Add matrix strategy for quality gates and tests'
        });
      }

      if (!content.includes('max-parallel:')) {
        this.recommendations.priority.medium.push({
          title: `Optimize Parallel Execution in ${file}`,
          description: 'Set max-parallel limits for optimal resource usage',
          impact: 'Improve resource utilization by 30%',
          effort: 'Low',
          timeSaving: 5,
          implementation: 'Set max-parallel: 6 for quality gates'
        });
      }
    }

    console.log(`  📄 Analyzed ${workflowFiles.length} workflow files`);
  }

  async analyzeCaching() {
    console.log('\n💾 Analyzing Caching Strategies...');
    
    const packageLock = fs.existsSync('package-lock.json');
    const yarnLock = fs.existsSync('yarn.lock');
    const pnpmLock = fs.existsSync('pnpm-lock.yaml');
    
    this.recommendations.priority.medium.push({
      title: 'Implement Advanced Dependency Caching',
      description: 'Use composite cache keys for better cache hit rates',
      impact: 'Reduce dependency installation time by 80%',
      effort: 'Low',
      timeSaving: 10,
      implementation: 'Use cache: npm with composite keys including OS and Node version'
    });

    if (fs.existsSync('dist/')) {
      this.recommendations.priority.medium.push({
        title: 'Implement Build Artifact Caching',
        description: 'Cache build outputs between pipeline stages',
        impact: 'Reduce build time by 50% for unchanged code',
        effort: 'Medium',
        timeSaving: 15,
        implementation: 'Upload/download build artifacts between jobs'
      });
    }

    this.recommendations.priority.low.push({
      title: 'Implement ESLint Cache',
      description: 'Cache ESLint results to speed up linting',
      impact: 'Reduce linting time by 60%',
      effort: 'Low',
      timeSaving: 3,
      implementation: 'Use --cache flag with ESLint and cache the .eslintcache file'
    });

    console.log(`  📦 Lock file found: ${packageLock ? 'npm' : yarnLock ? 'yarn' : pnpmLock ? 'pnpm' : 'none'}`);
  }

  async analyzeResourceUtilization() {
    console.log('\n⚡ Analyzing Resource Utilization...');
    
    this.recommendations.priority.high.push({
      title: 'Implement Conditional Job Execution',
      description: 'Skip unnecessary jobs based on changed files',
      impact: 'Reduce unnecessary job execution by 70%',
      effort: 'Medium',
      timeSaving: 20,
      implementation: 'Use GitHub Actions path filters and conditional execution'
    });

    this.recommendations.priority.medium.push({
      title: 'Optimize Runner Selection',
      description: 'Use appropriate runner sizes for different job types',
      impact: 'Reduce costs by 30% and improve performance by 20%',
      effort: 'Low',
      timeSaving: 8,
      implementation: 'Use ubuntu-latest-4-cores for heavy builds, ubuntu-latest for light tasks'
    });

    this.recommendations.priority.low.push({
      title: 'Implement Job Timeout Optimization',
      description: 'Set appropriate timeouts for different job types',
      impact: 'Prevent resource waste from hanging jobs',
      effort: 'Low',
      timeSaving: 5,
      implementation: 'Set timeout-minutes based on job complexity'
    });
  }

  async generateImplementationPlan() {
    console.log('\n📋 Generating Implementation Plan...');
    
    // Calculate total potential savings
    const totalTimeSavings = [
      ...this.recommendations.priority.high,
      ...this.recommendations.priority.medium,
      ...this.recommendations.priority.low
    ].reduce((total, rec) => total + (rec.timeSaving || 0), 0);

    this.recommendations.estimatedSavings = {
      time: totalTimeSavings,
      cost: Math.round(totalTimeSavings * 0.008 * 30), // Assuming $0.008/minute for GitHub Actions
      reliability: 25 // Estimated reliability improvement percentage
    };

    // Implementation phases
    this.recommendations.implementations = [
      {
        phase: 'Phase 1: Quick Wins (1-2 days)',
        items: this.recommendations.priority.high.filter(r => r.effort === 'Low'),
        estimatedTime: '4-8 hours',
        expectedSavings: '40% pipeline time reduction'
      },
      {
        phase: 'Phase 2: Parallelization (3-5 days)',
        items: this.recommendations.priority.high.filter(r => r.effort === 'Medium'),
        estimatedTime: '1-2 days',
        expectedSavings: '60% pipeline time reduction'
      },
      {
        phase: 'Phase 3: Advanced Optimizations (1-2 weeks)',
        items: this.recommendations.priority.high.filter(r => r.effort === 'High'),
        estimatedTime: '3-5 days',
        expectedSavings: '80% pipeline time reduction'
      },
      {
        phase: 'Phase 4: Fine-tuning (ongoing)',
        items: [...this.recommendations.priority.medium, ...this.recommendations.priority.low],
        estimatedTime: 'Ongoing',
        expectedSavings: '90% pipeline efficiency'
      }
    ];
  }

  getTestFiles() {
    const testFiles = [];
    
    function findTestFiles(dir) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findTestFiles(filePath);
          } else if (file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
            testFiles.push(filePath);
          }
        }
      } catch (err) {
        // Directory doesn't exist or can't be read
      }
    }
    
    findTestFiles('src');
    return testFiles;
  }

  displayRecommendations() {
    console.log('\n🎯 CI/CD OPTIMIZATION RECOMMENDATIONS');
    console.log('═'.repeat(60));
    
    console.log('\n🔥 HIGH PRIORITY (Immediate Impact)');
    this.recommendations.priority.high.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.title}`);
      console.log(`   📝 ${rec.description}`);
      console.log(`   💪 Impact: ${rec.impact}`);
      console.log(`   ⏱️  Time Saving: ${rec.timeSaving} minutes`);
      console.log(`   🔧 Implementation: ${rec.implementation}`);
      console.log('');
    });

    console.log('\n⚡ MEDIUM PRIORITY (Incremental Improvements)');
    this.recommendations.priority.medium.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.title} (${rec.timeSaving}min saving)`);
    });

    console.log('\n💡 LOW PRIORITY (Nice to Have)');
    this.recommendations.priority.low.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.title} (${rec.timeSaving}min saving)`);
    });

    console.log('\n📊 ESTIMATED TOTAL SAVINGS');
    console.log('═'.repeat(40));
    console.log(`⏱️  Time Saved per Pipeline: ${this.recommendations.estimatedSavings.time} minutes`);
    console.log(`💰 Monthly Cost Savings: $${this.recommendations.estimatedSavings.cost}`);
    console.log(`🔒 Reliability Improvement: +${this.recommendations.estimatedSavings.reliability}%`);

    console.log('\n🚀 IMPLEMENTATION ROADMAP');
    console.log('═'.repeat(40));
    this.recommendations.implementations.forEach((phase, i) => {
      console.log(`${phase.phase}`);
      console.log(`  📅 Time: ${phase.estimatedTime}`);
      console.log(`  🎯 Expected: ${phase.expectedSavings}`);
      console.log(`  📋 Items: ${phase.items.length} optimizations`);
      console.log('');
    });
  }

  async saveRecommendations() {
    const reportPath = 'ci-cd-optimization-recommendations.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.recommendations, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const optimizer = new CICDOptimizer();
  
  const command = process.argv[2] || 'analyze';
  
  switch (command) {
    case 'analyze':
      optimizer.analyzeCurrentSetup()
        .then(() => {
          console.log('\n🎉 Analysis complete! Review recommendations above.');
        })
        .catch(console.error);
      break;
      
    default:
      console.log('Usage: node ci-cd-optimizer.cjs [analyze]');
      break;
  }
}

module.exports = CICDOptimizer;
