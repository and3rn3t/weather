#!/usr/bin/env node

/**
 * Canary Release Manager
 * Implements gradual rollout with automated monitoring and rollback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canary deployment configuration
const CANARY_CONFIG = {
  stages: [
    { name: 'canary-1', percentage: 5, duration: 300000 },   // 5% for 5 minutes
    { name: 'canary-2', percentage: 10, duration: 600000 },  // 10% for 10 minutes
    { name: 'canary-3', percentage: 25, duration: 900000 },  // 25% for 15 minutes
    { name: 'canary-4', percentage: 50, duration: 1200000 }, // 50% for 20 minutes
    { name: 'full', percentage: 100, duration: 0 }          // 100% (complete)
  ],
  metrics: {
    errorRate: {
      threshold: 0.05,    // 5% error rate threshold
      comparison: 'baseline' // Compare against baseline
    },
    responseTime: {
      threshold: 5000,    // 5 second response time threshold
      comparison: 'absolute'
    },
    throughput: {
      threshold: 0.8,     // 80% of baseline throughput
      comparison: 'baseline'
    }
  },
  monitoring: {
    checkInterval: 30000,   // 30 seconds between checks
    warmupTime: 60000,      // 1 minute warmup before monitoring
    failureThreshold: 3     // 3 consecutive failures trigger rollback
  }
};

// Metrics collection and analysis
class CanaryMetrics {
  constructor() {
    this.metrics = [];
    this.baseline = null;
  }
  
  async collectMetrics(environment, stage) {
    const timestamp = new Date().toISOString();
    
    // Simulate metrics collection (in real implementation, integrate with monitoring tools)
    const metrics = {
      timestamp,
      environment,
      stage: stage.name,
      percentage: stage.percentage,
      errorRate: Math.random() * 0.02, // Simulate 0-2% error rate
      responseTime: 1000 + Math.random() * 500, // 1-1.5s response time
      throughput: 800 + Math.random() * 200, // 800-1000 requests/min
      activeUsers: Math.floor(1000 + Math.random() * 500),
      memoryUsage: 60 + Math.random() * 20, // 60-80% memory usage
      cpuUsage: 30 + Math.random() * 30 // 30-60% CPU usage
    };
    
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    return metrics;
  }
  
  setBaseline(baselineMetrics) {
    this.baseline = baselineMetrics;
  }
  
  analyzeMetrics(currentMetrics) {
    if (!this.baseline) {
      return { healthy: true, warnings: [], errors: [] };
    }
    
    const warnings = [];
    const errors = [];
    
    // Error rate analysis
    if (currentMetrics.errorRate > CANARY_CONFIG.metrics.errorRate.threshold) {
      errors.push(`Error rate too high: ${(currentMetrics.errorRate * 100).toFixed(2)}% > ${(CANARY_CONFIG.metrics.errorRate.threshold * 100)}%`);
    } else if (currentMetrics.errorRate > this.baseline.errorRate * 2) {
      warnings.push(`Error rate increased: ${(currentMetrics.errorRate * 100).toFixed(2)}% vs baseline ${(this.baseline.errorRate * 100).toFixed(2)}%`);
    }
    
    // Response time analysis
    if (currentMetrics.responseTime > CANARY_CONFIG.metrics.responseTime.threshold) {
      errors.push(`Response time too high: ${currentMetrics.responseTime}ms > ${CANARY_CONFIG.metrics.responseTime.threshold}ms`);
    } else if (currentMetrics.responseTime > this.baseline.responseTime * 1.5) {
      warnings.push(`Response time increased: ${currentMetrics.responseTime}ms vs baseline ${this.baseline.responseTime}ms`);
    }
    
    // Throughput analysis
    if (currentMetrics.throughput < this.baseline.throughput * CANARY_CONFIG.metrics.throughput.threshold) {
      errors.push(`Throughput too low: ${currentMetrics.throughput} vs baseline ${this.baseline.throughput}`);
    }
    
    return {
      healthy: errors.length === 0,
      warnings,
      errors
    };
  }
  
  generateReport() {
    const recentMetrics = this.metrics.slice(-10); // Last 10 data points
    
    if (recentMetrics.length === 0) {
      return { error: 'No metrics available' };
    }
    
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    
    return {
      timeWindow: `${recentMetrics.length} samples`,
      averages: {
        errorRate: avgErrorRate,
        responseTime: avgResponseTime,
        throughput: avgThroughput
      },
      latest: recentMetrics[recentMetrics.length - 1],
      baseline: this.baseline
    };
  }
}

// Canary deployment orchestrator
class CanaryDeployment {
  constructor(version, dryRun = false) {
    this.version = version;
    this.dryRun = dryRun;
    this.metrics = new CanaryMetrics();
    this.currentStage = 0;
    this.deploymentId = `canary-${Date.now()}`;
    this.status = 'initializing';
    this.failureCount = 0;
  }
  
  async start() {
    console.log('🐤 Canary Release Starting...');
    console.log(`📦 Version: ${this.version}`);
    console.log(`🔍 Dry Run: ${this.dryRun ? 'YES' : 'NO'}`);
    console.log(`🆔 Deployment ID: ${this.deploymentId}`);
    
    this.status = 'in-progress';
    
    try {
      // Collect baseline metrics
      await this.collectBaseline();
      
      // Execute canary stages
      for (let i = 0; i < CANARY_CONFIG.stages.length; i++) {
        this.currentStage = i;
        const stage = CANARY_CONFIG.stages[i];
        
        console.log(`\n🎯 Stage ${i + 1}: ${stage.name} (${stage.percentage}%)`);
        await this.executeStage(stage);
        
        if (stage.percentage === 100) {
          console.log('🎉 Canary deployment completed successfully!');
          this.status = 'completed';
          break;
        }
      }
      
    } catch (error) {
      console.log(`💥 Canary deployment failed: ${error.message}`);
      this.status = 'failed';
      await this.rollback();
      throw error;
    }
    
    this.saveDeploymentReport();
  }
  
  async collectBaseline() {
    console.log('\n📊 Collecting Baseline Metrics');
    console.log('─'.repeat(50));
    
    if (!this.dryRun) {
      // Collect metrics from current production
      const baselineMetrics = await this.metrics.collectMetrics('production', { name: 'baseline', percentage: 100 });
      this.metrics.setBaseline(baselineMetrics);
      
      console.log(`✅ Baseline collected:`);
      console.log(`  Error Rate: ${(baselineMetrics.errorRate * 100).toFixed(2)}%`);
      console.log(`  Response Time: ${baselineMetrics.responseTime}ms`);
      console.log(`  Throughput: ${baselineMetrics.throughput} req/min`);
    } else {
      console.log('🔍 DRY RUN: Would collect baseline metrics');
    }
  }
  
  async executeStage(stage) {
    console.log(`🚀 Deploying ${stage.percentage}% traffic to canary...`);
    
    if (!this.dryRun) {
      // Deploy canary version
      await this.deployCanary(stage.percentage);
      
      // Warmup period
      console.log(`⏳ Warmup period (${CANARY_CONFIG.monitoring.warmupTime / 1000}s)...`);
      await new Promise(resolve => setTimeout(resolve, CANARY_CONFIG.monitoring.warmupTime));
      
      // Monitor stage
      await this.monitorStage(stage);
    } else {
      console.log(`🔍 DRY RUN: Would deploy ${stage.percentage}% and monitor for ${stage.duration / 1000}s`);
    }
  }
  
  async deployCanary(percentage) {
    // In real implementation, this would update load balancer configuration
    console.log(`📡 Updating traffic routing: ${percentage}% → canary`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deployment
  }
  
  async monitorStage(stage) {
    const startTime = Date.now();
    const endTime = startTime + stage.duration;
    
    console.log(`👁️  Monitoring stage for ${stage.duration / 1000}s...`);
    
    while (Date.now() < endTime && this.status === 'in-progress') {
      const metrics = await this.metrics.collectMetrics('canary', stage);
      const analysis = this.metrics.analyzeMetrics(metrics);
      
      // Display current metrics
      console.log(`📊 ${new Date().toLocaleTimeString()}: Error: ${(metrics.errorRate * 100).toFixed(2)}%, Response: ${metrics.responseTime}ms, Throughput: ${metrics.throughput}`);
      
      // Check for issues
      if (!analysis.healthy) {
        this.failureCount++;
        console.log(`⚠️  Health issues detected (${this.failureCount}/${CANARY_CONFIG.monitoring.failureThreshold}):`);
        analysis.errors.forEach(error => console.log(`  ❌ ${error}`));
        
        if (this.failureCount >= CANARY_CONFIG.monitoring.failureThreshold) {
          throw new Error('Too many consecutive failures - triggering rollback');
        }
      } else {
        this.failureCount = 0; // Reset failure count on successful check
        
        if (analysis.warnings.length > 0) {
          analysis.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
        }
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, CANARY_CONFIG.monitoring.checkInterval));
    }
    
    console.log(`✅ Stage ${stage.name} completed successfully`);
  }
  
  async rollback() {
    console.log('\n🔄 CANARY ROLLBACK');
    console.log('─'.repeat(50));
    
    if (!this.dryRun) {
      console.log('🔄 Rolling back to 100% stable version...');
      await this.deployCanary(0); // Route 0% to canary (100% to stable)
      
      console.log('🔍 Verifying rollback...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s verification
      
      console.log('✅ Rollback completed');
    } else {
      console.log('🔍 DRY RUN: Would rollback to stable version');
    }
  }
  
  saveDeploymentReport() {
    const report = {
      deploymentId: this.deploymentId,
      version: this.version,
      status: this.status,
      dryRun: this.dryRun,
      stages: CANARY_CONFIG.stages.map((stage, index) => ({
        ...stage,
        completed: index <= this.currentStage,
        timestamp: new Date().toISOString()
      })),
      metrics: this.metrics.generateReport(),
      duration: Date.now() - parseInt(this.deploymentId.split('-')[1]),
      timestamp: new Date().toISOString()
    };
    
    const reportPath = path.join(__dirname, 'canary-deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📄 Canary report saved to: ${reportPath}`);
  }
}

// CLI interface
function printUsage() {
  console.log(`
🐤 Canary Release Manager

Usage:
  node canary-release.js <command> [options]

Commands:
  deploy <version>    Start canary deployment
  dry-run <version>   Simulate canary deployment
  status             Show current canary status
  abort              Abort current canary deployment

Examples:
  node canary-release.js deploy v1.2.3
  node canary-release.js dry-run v1.2.3
  node canary-release.js status
`);
}

async function main() {
  const command = process.argv[2];
  const version = process.argv[3];
  
  try {
    switch (command) {
      case 'deploy':
        if (!version) {
          console.error('❌ Error: Version required');
          printUsage();
          process.exit(1);
        }
        const deployment = new CanaryDeployment(version, false);
        await deployment.start();
        break;
        
      case 'dry-run':
        if (!version) {
          console.error('❌ Error: Version required');
          printUsage();
          process.exit(1);
        }
        const dryRunDeployment = new CanaryDeployment(version, true);
        await dryRunDeployment.start();
        break;
        
      case 'status':
        // Read and display current canary status
        const reportPath = path.join(__dirname, 'canary-deployment-report.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          console.log('📊 Current Canary Status:');
          console.log(`  Version: ${report.version}`);
          console.log(`  Status: ${report.status}`);
          console.log(`  Current Stage: ${report.stages.filter(s => s.completed).length}/${report.stages.length}`);
        } else {
          console.log('📊 No active canary deployment');
        }
        break;
        
      default:
        printUsage();
        break;
    }
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
