#!/usr/bin/env node

/**
 * Feature Flag Management System
 * Advanced feature toggles with A/B testing, gradual rollouts, and analytics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Feature flag configuration
const FEATURE_CONFIG = {
  flags: {
    'dark-theme-v2': {
      name: 'Dark Theme V2',
      description: 'New improved dark theme with better contrast',
      type: 'release',
      defaultValue: false,
      rollout: {
        enabled: true,
        percentage: 25,
        strategy: 'gradual',
        targetGroups: ['beta-users', 'premium-users']
      }
    },
    'weather-radar': {
      name: 'Weather Radar Integration',
      description: 'Interactive weather radar maps',
      type: 'experiment',
      defaultValue: false,
      rollout: {
        enabled: true,
        percentage: 10,
        strategy: 'ab-test',
        variants: ['control', 'radar-v1', 'radar-v2']
      }
    },
    'premium-features': {
      name: 'Premium Weather Features',
      description: 'Extended forecasts and alerts',
      type: 'operational',
      defaultValue: false,
      rollout: {
        enabled: true,
        percentage: 100,
        strategy: 'targeted',
        targetGroups: ['premium-users']
      }
    },
    'performance-optimizations': {
      name: 'Performance Optimizations',
      description: 'New caching and loading improvements',
      type: 'kill-switch',
      defaultValue: true,
      rollout: {
        enabled: true,
        percentage: 100,
        strategy: 'kill-switch'
      }
    },
    'mobile-app-banner': {
      name: 'Mobile App Download Banner',
      description: 'Promote mobile app downloads',
      type: 'experiment',
      defaultValue: false,
      rollout: {
        enabled: true,
        percentage: 50,
        strategy: 'ab-test',
        variants: ['control', 'banner-top', 'banner-bottom']
      }
    }
  },
  strategies: {
    gradual: {
      name: 'Gradual Rollout',
      description: 'Slowly increase percentage over time'
    },
    'ab-test': {
      name: 'A/B Testing',
      description: 'Split users into control and treatment groups'
    },
    targeted: {
      name: 'Targeted Release',
      description: 'Release to specific user groups'
    },
    'kill-switch': {
      name: 'Kill Switch',
      description: 'Quickly disable features in production'
    }
  },
  analytics: {
    trackingEnabled: true,
    metricsRetentionDays: 90,
    conversionEvents: ['sign_up', 'premium_upgrade', 'app_download'],
    performanceMetrics: ['page_load_time', 'api_response_time', 'error_rate']
  }
};

// User segmentation and targeting
class UserSegmentation {
  constructor() {
    this.userProfiles = new Map();
  }
  
  createUserProfile(userId, attributes = {}) {
    const profile = {
      id: userId,
      createdAt: new Date().toISOString(),
      attributes: {
        userType: 'free',
        registrationDate: new Date().toISOString(),
        location: 'US',
        deviceType: 'desktop',
        browser: 'chrome',
        ...attributes
      },
      groups: this.calculateUserGroups(attributes),
      experiments: new Map(),
      featureUsage: new Map()
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }
  
  calculateUserGroups(attributes) {
    const groups = ['all-users'];
    
    // Add groups based on user attributes
    if (attributes.userType === 'premium') {
      groups.push('premium-users');
    }
    
    if (attributes.registrationDate) {
      const regDate = new Date(attributes.registrationDate);
      const daysAgo = (Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysAgo < 7) groups.push('new-users');
      if (daysAgo < 30) groups.push('recent-users');
      if (daysAgo > 365) groups.push('veteran-users');
    }
    
    if (attributes.engagementLevel === 'high') {
      groups.push('beta-users');
    }
    
    if (attributes.deviceType === 'mobile') {
      groups.push('mobile-users');
    }
    
    return groups;
  }
  
  getUserProfile(userId) {
    return this.userProfiles.get(userId);
  }
  
  isUserInGroup(userId, group) {
    const profile = this.getUserProfile(userId);
    return profile?.groups.includes(group) || false;
  }
  
  getUserHash(userId, salt = '') {
    // Consistent hash for A/B testing
    const combined = userId + salt;
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash) % 100;
  }
}

// A/B testing and experiment management
class ExperimentManager {
  constructor(userSegmentation) {
    this.userSegmentation = userSegmentation;
    this.experiments = new Map();
    this.results = new Map();
  }
  
  createExperiment(flagKey, variants, trafficAllocation = {}) {
    const experiment = {
      id: `exp-${flagKey}-${Date.now()}`,
      flagKey,
      variants: variants.map((variant, index) => ({
        name: variant,
        allocation: trafficAllocation[variant] || Math.floor(100 / variants.length),
        users: new Set()
      })),
      startDate: new Date().toISOString(),
      status: 'active',
      metrics: {
        exposures: 0,
        conversions: new Map(),
        performance: new Map()
      }
    };
    
    this.experiments.set(experiment.id, experiment);
    return experiment;
  }
  
  assignUserToVariant(experimentId, userId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return 'control';
    }
    
    const userHash = this.userSegmentation.getUserHash(userId, experimentId);
    let cumulativeAllocation = 0;
    
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (userHash < cumulativeAllocation) {
        variant.users.add(userId);
        experiment.metrics.exposures++;
        return variant.name;
      }
    }
    
    return 'control';
  }
  
  trackConversion(experimentId, userId, event, value = 1) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;
    
    const variant = this.getUserVariant(experimentId, userId);
    if (!variant) return;
    
    if (!experiment.metrics.conversions.has(variant)) {
      experiment.metrics.conversions.set(variant, new Map());
    }
    
    const variantConversions = experiment.metrics.conversions.get(variant);
    const currentCount = variantConversions.get(event) || 0;
    variantConversions.set(event, currentCount + value);
  }
  
  getUserVariant(experimentId, userId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    for (const variant of experiment.variants) {
      if (variant.users.has(userId)) {
        return variant.name;
      }
    }
    
    return null;
  }
  
  calculateResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    const results = {
      experimentId,
      totalExposures: experiment.metrics.exposures,
      variants: experiment.variants.map(variant => {
        const conversions = experiment.metrics.conversions.get(variant.name) || new Map();
        const totalConversions = Array.from(conversions.values()).reduce((sum, count) => sum + count, 0);
        
        return {
          name: variant.name,
          users: variant.users.size,
          allocation: variant.allocation,
          conversions: Object.fromEntries(conversions),
          conversionRate: variant.users.size > 0 ? totalConversions / variant.users.size : 0
        };
      })
    };
    
    this.results.set(experimentId, results);
    return results;
  }
}

// Feature flag evaluation engine
class FeatureFlagEngine {
  constructor() {
    this.userSegmentation = new UserSegmentation();
    this.experimentManager = new ExperimentManager(this.userSegmentation);
    this.flagStates = new Map();
    this.analytics = new Map();
  }
  
  evaluateFlag(flagKey, userId, context = {}) {
    const flag = FEATURE_CONFIG.flags[flagKey];
    if (!flag) {
      return flag?.defaultValue || false;
    }
    
    // Ensure user profile exists
    let userProfile = this.userSegmentation.getUserProfile(userId);
    if (!userProfile) {
      userProfile = this.userSegmentation.createUserProfile(userId, context.userAttributes || {});
    }
    
    // Check if flag is enabled
    if (!flag.rollout.enabled) {
      return flag.defaultValue;
    }
    
    // Apply rollout strategy
    const result = this.applyRolloutStrategy(flag, userId, userProfile, context);
    
    // Track flag evaluation
    this.trackFlagEvaluation(flagKey, userId, result, context);
    
    return result;
  }
  
  applyRolloutStrategy(flag, userId, userProfile, context) {
    const { strategy, percentage, targetGroups, variants } = flag.rollout;
    
    switch (strategy) {
      case 'gradual':
        return this.applyGradualRollout(flag, userId, percentage, targetGroups);
        
      case 'ab-test':
        return this.applyABTest(flag, userId, variants);
        
      case 'targeted':
        return this.applyTargetedRollout(flag, userId, targetGroups);
        
      case 'kill-switch':
        return flag.defaultValue;
        
      default:
        return flag.defaultValue;
    }
  }
  
  applyGradualRollout(flag, userId, percentage, targetGroups) {
    // Check if user is in target groups
    if (targetGroups && targetGroups.length > 0) {
      const userInTargetGroup = targetGroups.some(group => 
        this.userSegmentation.isUserInGroup(userId, group)
      );
      
      if (!userInTargetGroup) {
        return flag.defaultValue;
      }
    }
    
    // Use consistent hash to determine if user gets feature
    const userHash = this.userSegmentation.getUserHash(userId, flag.name);
    return userHash < percentage;
  }
  
  applyABTest(flag, userId, variants) {
    if (!variants || variants.length === 0) {
      return flag.defaultValue;
    }
    
    // Create or get existing experiment
    let experiment = Array.from(this.experimentManager.experiments.values())
      .find(exp => exp.flagKey === flag.name);
    
    if (!experiment) {
      experiment = this.experimentManager.createExperiment(flag.name, variants);
    }
    
    const variant = this.experimentManager.assignUserToVariant(experiment.id, userId);
    
    // Return boolean for control, true for any treatment variant
    return variant !== 'control';
  }
  
  applyTargetedRollout(flag, userId, targetGroups) {
    if (!targetGroups || targetGroups.length === 0) {
      return flag.defaultValue;
    }
    
    // User must be in at least one target group
    return targetGroups.some(group => 
      this.userSegmentation.isUserInGroup(userId, group)
    );
  }
  
  trackFlagEvaluation(flagKey, userId, result, context) {
    const timestamp = new Date().toISOString();
    
    if (!this.analytics.has(flagKey)) {
      this.analytics.set(flagKey, {
        evaluations: [],
        exposures: 0,
        truthy: 0,
        falsy: 0,
        userBreakdown: new Map()
      });
    }
    
    const flagAnalytics = this.analytics.get(flagKey);
    
    flagAnalytics.evaluations.push({
      userId,
      result,
      timestamp,
      context
    });
    
    flagAnalytics.exposures++;
    
    if (result) {
      flagAnalytics.truthy++;
    } else {
      flagAnalytics.falsy++;
    }
    
    // Track user-specific data
    if (!flagAnalytics.userBreakdown.has(userId)) {
      flagAnalytics.userBreakdown.set(userId, { exposures: 0, lastSeen: timestamp });
    }
    
    const userData = flagAnalytics.userBreakdown.get(userId);
    userData.exposures++;
    userData.lastSeen = timestamp;
    
    // Keep only recent evaluations to prevent memory issues
    if (flagAnalytics.evaluations.length > 1000) {
      flagAnalytics.evaluations = flagAnalytics.evaluations.slice(-500);
    }
  }
  
  getFlagAnalytics(flagKey, timeWindow = 3600000) { // 1 hour default
    const flagAnalytics = this.analytics.get(flagKey);
    if (!flagAnalytics) return null;
    
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentEvaluations = flagAnalytics.evaluations.filter(evaluation => 
      new Date(evaluation.timestamp).getTime() > windowStart
    );
    
    const truthyCount = recentEvaluations.filter(evaluation => evaluation.result).length;
    const falsyCount = recentEvaluations.filter(evaluation => evaluation.result === false).length;
    
    return {
      flagKey,
      timeWindow: timeWindow / 1000 / 60, // minutes
      totalEvaluations: recentEvaluations.length,
      exposureRate: recentEvaluations.length / flagAnalytics.exposures,
      truthyRate: truthyCount / (truthyCount + falsyCount) || 0,
      uniqueUsers: new Set(recentEvaluations.map(evaluation => evaluation.userId)).size,
      avgEvaluationsPerUser: recentEvaluations.length / new Set(recentEvaluations.map(evaluation => evaluation.userId)).size || 0
    };
  }
  
  updateFlagConfiguration(flagKey, updates) {
    const flag = FEATURE_CONFIG.flags[flagKey];
    if (!flag) {
      throw new Error(`Flag ${flagKey} not found`);
    }
    
    // Apply updates
    Object.assign(flag, updates);
    
    // Log configuration change
    console.log(`🚩 Flag ${flagKey} configuration updated:`, updates);
    
    return flag;
  }
}

// Main feature flag management system
class FeatureFlagManager {
  constructor() {
    this.engine = new FeatureFlagEngine();
    this.isRunning = false;
  }
  
  start() {
    console.log('🚩 Starting Feature Flag Management System...');
    console.log(`📊 Flags configured: ${Object.keys(FEATURE_CONFIG.flags).length}`);
    console.log(`🎯 Strategies available: ${Object.keys(FEATURE_CONFIG.strategies).length}`);
    
    this.isRunning = true;
    this.simulateUsage();
  }
  
  stop() {
    console.log('🛑 Stopping feature flag management...');
    this.isRunning = false;
  }
  
  async simulateUsage() {
    // Simulate feature flag usage for demonstration
    const users = Array.from({ length: 100 }, (_, i) => `user-${i + 1}`);
    const flags = Object.keys(FEATURE_CONFIG.flags);
    
    let evaluationCount = 0;
    
    while (this.isRunning && evaluationCount < 500) { // Simulate 500 evaluations
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomFlag = flags[Math.floor(Math.random() * flags.length)];
      
      // Create diverse user attributes
      const userAttributes = {
        userType: Math.random() > 0.8 ? 'premium' : 'free',
        deviceType: Math.random() > 0.6 ? 'mobile' : 'desktop',
        engagementLevel: Math.random() > 0.7 ? 'high' : 'medium',
        registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const result = this.engine.evaluateFlag(randomFlag, randomUser, { userAttributes });
      
      // Simulate conversions for experiments
      if (result && Math.random() < 0.1) { // 10% conversion rate
        const experiments = Array.from(this.engine.experimentManager.experiments.values());
        experiments.forEach(exp => {
          if (exp.flagKey === randomFlag) {
            this.engine.experimentManager.trackConversion(exp.id, randomUser, 'conversion');
          }
        });
      }
      
      evaluationCount++;
      
      if (evaluationCount % 100 === 0) {
        console.log(`📊 Processed ${evaluationCount} flag evaluations...`);
      }
      
      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  generateReport() {
    console.log('\n🚩 FEATURE FLAG MANAGEMENT REPORT');
    console.log('═'.repeat(50));
    
    // Flag overview
    console.log('\n📊 Flag Overview:');
    Object.entries(FEATURE_CONFIG.flags).forEach(([key, flag]) => {
      const analytics = this.engine.getFlagAnalytics(key);
      const status = flag.rollout.enabled ? '✅' : '❌';
      
      console.log(`  ${status} ${flag.name} (${key})`);
      console.log(`     Type: ${flag.type} | Rollout: ${flag.rollout.percentage}% | Strategy: ${flag.rollout.strategy}`);
      
      if (analytics) {
        console.log(`     Evaluations: ${analytics.totalEvaluations} | Truthy Rate: ${(analytics.truthyRate * 100).toFixed(1)}% | Users: ${analytics.uniqueUsers}`);
      }
    });
    
    // Experiment results
    console.log('\n🧪 Experiment Results:');
    const experiments = Array.from(this.engine.experimentManager.experiments.values());
    
    experiments.forEach(experiment => {
      console.log(`  📈 ${experiment.flagKey}:`);
      const results = this.engine.experimentManager.calculateResults(experiment.id);
      
      if (results) {
        results.variants.forEach(variant => {
          console.log(`    ${variant.name}: ${variant.users} users | ${(variant.conversionRate * 100).toFixed(2)}% conversion`);
        });
      }
    });
    
    // User segmentation
    console.log('\n👥 User Segmentation:');
    const totalUsers = this.engine.userSegmentation.userProfiles.size;
    console.log(`  Total Users: ${totalUsers}`);
    
    // Calculate group distribution
    const groupCounts = new Map();
    this.engine.userSegmentation.userProfiles.forEach(profile => {
      profile.groups.forEach(group => {
        groupCounts.set(group, (groupCounts.get(group) || 0) + 1);
      });
    });
    
    groupCounts.forEach((count, group) => {
      console.log(`  ${group}: ${count} users (${(count / totalUsers * 100).toFixed(1)}%)`);
    });
    
    // Save detailed report
    this.saveDetailedReport();
    
    return {
      flags: Object.keys(FEATURE_CONFIG.flags).length,
      experiments: experiments.length,
      users: totalUsers,
      evaluations: Array.from(this.engine.analytics.values()).reduce((sum, analytics) => sum + analytics.exposures, 0)
    };
  }
  
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      config: FEATURE_CONFIG,
      flags: Object.fromEntries(
        Object.entries(FEATURE_CONFIG.flags).map(([key, flag]) => [
          key,
          {
            ...flag,
            analytics: this.engine.getFlagAnalytics(key)
          }
        ])
      ),
      experiments: Array.from(this.engine.experimentManager.experiments.values()).map(exp => ({
        ...exp,
        results: this.engine.experimentManager.calculateResults(exp.id),
        variants: exp.variants.map(variant => ({
          ...variant,
          users: Array.from(variant.users) // Convert Set to Array for JSON
        }))
      })),
      userSegmentation: {
        totalUsers: this.engine.userSegmentation.userProfiles.size,
        profiles: Array.from(this.engine.userSegmentation.userProfiles.entries()).map(([id, profile]) => ({
          id,
          ...profile,
          experiments: Object.fromEntries(profile.experiments),
          featureUsage: Object.fromEntries(profile.featureUsage)
        }))
      }
    };
    
    const reportPath = path.join(__dirname, 'feature-flags-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📄 Detailed feature flag report saved to: ${reportPath}`);
  }
}

// CLI interface
function printUsage() {
  console.log(`
🚩 Feature Flag Management System

Usage:
  node feature-flags.js <command> [options]

Commands:
  start              Start feature flag management
  report             Generate feature flag analytics report
  evaluate <flag> <user>  Evaluate flag for specific user
  update <flag> <config>  Update flag configuration
  experiment <flag>  Show experiment results for flag

Examples:
  node feature-flags.js start
  node feature-flags.js report
  node feature-flags.js evaluate dark-theme-v2 user-123
  node feature-flags.js experiment weather-radar
`);
}

async function main() {
  const command = process.argv[2];
  const flagKey = process.argv[3];
  const userId = process.argv[4];
  
  try {
    switch (command) {
      case 'start':
        const manager = new FeatureFlagManager();
        manager.start();
        break;
        
      case 'report':
        const reportManager = new FeatureFlagManager();
        await reportManager.simulateUsage();
        reportManager.generateReport();
        break;
        
      case 'evaluate':
        if (!flagKey || !userId) {
          console.error('❌ Error: Flag key and user ID required');
          printUsage();
          process.exit(1);
        }
        
        const evalManager = new FeatureFlagManager();
        const result = evalManager.engine.evaluateFlag(flagKey, userId);
        console.log(`🚩 Flag ${flagKey} for user ${userId}: ${result}`);
        break;
        
      case 'experiment':
        if (!flagKey) {
          console.error('❌ Error: Flag key required');
          printUsage();
          process.exit(1);
        }
        
        const expManager = new FeatureFlagManager();
        // Simulate usage first
        await expManager.simulateUsage();
        
        const experiments = Array.from(expManager.engine.experimentManager.experiments.values())
          .filter(exp => exp.flagKey === flagKey);
        
        if (experiments.length === 0) {
          console.log(`❌ No experiments found for flag: ${flagKey}`);
        } else {
          experiments.forEach(exp => {
            const results = expManager.engine.experimentManager.calculateResults(exp.id);
            console.log(`🧪 Experiment Results for ${flagKey}:`);
            console.log(JSON.stringify(results, null, 2));
          });
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
