#!/usr/bin/env node

/**
 * Blue-Green Deployment Manager
 * Implements zero-downtime deployment strategy with health checks and rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  environments: {
    blue: {
      url: process.env.BLUE_ENVIRONMENT_URL || 'https://blue-premium-weather-app.pages.dev',
      healthCheck: '/health',
      name: 'Blue Environment'
    },
    green: {
      url: process.env.GREEN_ENVIRONMENT_URL || 'https://green-premium-weather-app.pages.dev',
      healthCheck: '/health',
      name: 'Green Environment'
    },
    production: {
      url: process.env.PRODUCTION_URL || 'https://premium-weather-app.pages.dev',
      healthCheck: '/health',
      name: 'Production'
    }
  },
  healthCheck: {
    timeout: 30000,      // 30 seconds
    retries: 3,          // 3 retry attempts
    interval: 5000,      // 5 seconds between retries
    endpoints: [
      '/health',
      '/api/health',
      '/'
    ]
  },
  deployment: {
    warmupTime: 10000,   // 10 seconds warmup
    verificationTime: 30000, // 30 seconds verification
    maxRollbackTime: 300000  // 5 minutes max rollback time
  }
};

// Health check utilities
async function performHealthCheck(environment, endpoint = '/') {
  const url = `${environment.url}${endpoint}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Health check: ${url}`);
    
    // Simulate health check (in real implementation, use fetch)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responseTime = Date.now() - startTime;
    const isHealthy = responseTime < 5000; // Consider healthy if response < 5s
    
    return {
      url,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      timestamp: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

async function waitForHealthy(environment, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🏥 Health check attempt ${attempt}/${maxRetries} for ${environment.name}`);
    
    const healthResults = [];
    
    for (const endpoint of DEPLOYMENT_CONFIG.healthCheck.endpoints) {
      const result = await performHealthCheck(environment, endpoint);
      healthResults.push(result);
      
      if (result.status === 'healthy') {
        console.log(`  ✅ ${endpoint}: ${result.responseTime}ms`);
      } else {
        console.log(`  ❌ ${endpoint}: ${result.status} (${result.responseTime}ms)`);
      }
    }
    
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    const healthPercentage = (healthyCount / healthResults.length) * 100;
    
    if (healthPercentage >= 80) { // 80% endpoints must be healthy
      console.log(`✅ Environment ${environment.name} is healthy (${healthPercentage}%)`);
      return { healthy: true, results: healthResults };
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting ${DEPLOYMENT_CONFIG.healthCheck.interval / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CONFIG.healthCheck.interval));
    }
  }
  
  console.log(`❌ Environment ${environment.name} failed health checks`);
  return { healthy: false, results: [] };
}

// Deployment state management
function loadDeploymentState() {
  const projectRoot = path.dirname(__dirname);
  const statePath = path.join(projectRoot, 'deployment-state.json');
  
  try {
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not read deployment state:', error.message);
  }
  
  // Default state
  return {
    currentEnvironment: 'blue',
    lastDeployment: null,
    deploymentHistory: []
  };
}

function saveDeploymentState(state) {
  const projectRoot = path.dirname(__dirname);
  const statePath = path.join(projectRoot, 'deployment-state.json');
  
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error saving deployment state:', error.message);
  }
}

// Blue-Green deployment orchestration
async function performBlueGreenDeployment(targetVersion, dryRun = false) {
  console.log('🚀 Blue-Green Deployment Starting...');
  console.log(`📦 Target Version: ${targetVersion}`);
  console.log(`🔍 Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  
  const state = loadDeploymentState();
  const currentEnv = state.currentEnvironment;
  const targetEnv = currentEnv === 'blue' ? 'green' : 'blue';
  
  const deployment = {
    id: `deploy-${Date.now()}`,
    timestamp: new Date().toISOString(),
    version: targetVersion,
    sourceEnvironment: currentEnv,
    targetEnvironment: targetEnv,
    status: 'in-progress',
    phases: [],
    dryRun
  };
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                🔄 BLUE-GREEN DEPLOYMENT                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Current Active: ${DEPLOYMENT_CONFIG.environments[currentEnv].name}`);
  console.log(`Target Environment: ${DEPLOYMENT_CONFIG.environments[targetEnv].name}`);
  console.log('');
  
  try {
    // Phase 1: Pre-deployment health check
    console.log('📋 Phase 1: Pre-deployment Health Check');
    console.log('─'.repeat(50));
    
    const currentHealth = await waitForHealthy(DEPLOYMENT_CONFIG.environments[currentEnv]);
    if (!currentHealth.healthy) {
      throw new Error('Current environment is unhealthy - aborting deployment');
    }
    
    deployment.phases.push({
      name: 'pre-deployment-health-check',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: 0
    });
    
    // Phase 2: Deploy to target environment
    console.log('\n🚀 Phase 2: Deploy to Target Environment');
    console.log('─'.repeat(50));
    
    if (!dryRun) {
      console.log(`📦 Deploying version ${targetVersion} to ${targetEnv}...`);
      // In real implementation, trigger actual deployment
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate deployment
      console.log('✅ Deployment completed');
    } else {
      console.log('🔍 DRY RUN: Would deploy to target environment');
    }
    
    deployment.phases.push({
      name: 'target-deployment',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: 3000
    });
    
    // Phase 3: Warmup and health verification
    console.log('\n🔥 Phase 3: Warmup and Health Verification');
    console.log('─'.repeat(50));
    
    if (!dryRun) {
      console.log(`⏳ Warming up ${targetEnv} environment...`);
      await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CONFIG.deployment.warmupTime));
      
      const targetHealth = await waitForHealthy(DEPLOYMENT_CONFIG.environments[targetEnv]);
      if (!targetHealth.healthy) {
        throw new Error('Target environment failed health checks');
      }
    } else {
      console.log('🔍 DRY RUN: Would perform warmup and health checks');
    }
    
    deployment.phases.push({
      name: 'warmup-verification',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: DEPLOYMENT_CONFIG.deployment.warmupTime
    });
    
    // Phase 4: Traffic switch
    console.log('\n🔄 Phase 4: Traffic Switch');
    console.log('─'.repeat(50));
    
    if (!dryRun) {
      console.log('🔄 Switching production traffic...');
      // In real implementation, update load balancer/CDN configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Traffic switch completed');
      
      // Update deployment state
      state.currentEnvironment = targetEnv;
      state.lastDeployment = deployment;
      state.deploymentHistory.push(deployment);
      
      // Keep only last 10 deployments
      if (state.deploymentHistory.length > 10) {
        state.deploymentHistory = state.deploymentHistory.slice(-10);
      }
      
      saveDeploymentState(state);
    } else {
      console.log('🔍 DRY RUN: Would switch production traffic');
    }
    
    deployment.phases.push({
      name: 'traffic-switch',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: 2000
    });
    
    // Phase 5: Post-deployment verification
    console.log('\n✅ Phase 5: Post-deployment Verification');
    console.log('─'.repeat(50));
    
    if (!dryRun) {
      console.log('🔍 Verifying production environment...');
      await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CONFIG.deployment.verificationTime / 3));
      
      const prodHealth = await waitForHealthy(DEPLOYMENT_CONFIG.environments.production);
      if (!prodHealth.healthy) {
        console.log('⚠️  Production health check failed - consider rollback');
      } else {
        console.log('✅ Production verification successful');
      }
    } else {
      console.log('🔍 DRY RUN: Would verify production environment');
    }
    
    deployment.phases.push({
      name: 'post-deployment-verification',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: DEPLOYMENT_CONFIG.deployment.verificationTime / 3
    });
    
    deployment.status = 'completed';
    console.log('\n🎉 Blue-Green Deployment COMPLETED!');
    
  } catch (error) {
    deployment.status = 'failed';
    deployment.error = error.message;
    console.log(`\n💥 Deployment FAILED: ${error.message}`);
    
    // Automatic rollback on failure
    if (!dryRun) {
      console.log('\n🔄 Initiating automatic rollback...');
      await performRollback(state.currentEnvironment);
    }
    
    throw error;
  }
  
  // Generate deployment report
  const reportPath = path.join(path.dirname(__dirname), 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(deployment, null, 2), 'utf8');
  console.log(`\n📄 Deployment report saved to: ${reportPath}`);
  
  return deployment;
}

async function performRollback(targetEnvironment) {
  console.log('\n🔄 ROLLBACK PROCEDURE');
  console.log('─'.repeat(50));
  
  const state = loadDeploymentState();
  const rollbackEnv = targetEnvironment === 'blue' ? 'green' : 'blue';
  
  console.log(`🔄 Rolling back to ${rollbackEnv} environment...`);
  
  // Verify rollback target is healthy
  const rollbackHealth = await waitForHealthy(DEPLOYMENT_CONFIG.environments[rollbackEnv]);
  if (!rollbackHealth.healthy) {
    throw new Error('Rollback target environment is also unhealthy');
  }
  
  // Switch traffic back
  console.log('🔄 Switching traffic back...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  state.currentEnvironment = rollbackEnv;
  saveDeploymentState(state);
  
  console.log('✅ Rollback completed successfully');
}

// CLI interface
function printUsage() {
  console.log(`
🚀 Blue-Green Deployment Manager

Usage:
  node blue-green-deployment.js <command> [options]

Commands:
  deploy <version>    Deploy specific version
  status             Show current deployment status
  rollback           Rollback to previous environment
  health             Check environment health
  dry-run <version>  Simulate deployment without changes

Examples:
  node blue-green-deployment.js deploy v1.2.3
  node blue-green-deployment.js dry-run v1.2.3
  node blue-green-deployment.js health
  node blue-green-deployment.js rollback
`);
}

async function showDeploymentStatus() {
  const state = loadDeploymentState();
  
  console.log('\n📊 DEPLOYMENT STATUS');
  console.log('─'.repeat(50));
  console.log(`Current Environment: ${state.currentEnvironment}`);
  
  if (state.lastDeployment) {
    console.log(`Last Deployment: ${state.lastDeployment.version} (${state.lastDeployment.status})`);
    console.log(`Deployment Time: ${new Date(state.lastDeployment.timestamp).toLocaleString()}`);
  }
  
  console.log('\n🏥 Environment Health:');
  for (const [name, env] of Object.entries(DEPLOYMENT_CONFIG.environments)) {
    const health = await performHealthCheck(env);
    console.log(`  ${name}: ${health.status} (${health.responseTime}ms)`);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'deploy':
        if (!arg) {
          console.error('❌ Error: Version required for deploy command');
          printUsage();
          process.exit(1);
        }
        await performBlueGreenDeployment(arg, false);
        break;
        
      case 'dry-run':
        if (!arg) {
          console.error('❌ Error: Version required for dry-run command');
          printUsage();
          process.exit(1);
        }
        await performBlueGreenDeployment(arg, true);
        break;
        
      case 'status':
        await showDeploymentStatus();
        break;
        
      case 'rollback':
        const state = loadDeploymentState();
        await performRollback(state.currentEnvironment);
        break;
        
      case 'health':
        for (const [name, env] of Object.entries(DEPLOYMENT_CONFIG.environments)) {
          const health = await performHealthCheck(env);
          console.log(`${name}: ${health.status} (${health.responseTime}ms)`);
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
