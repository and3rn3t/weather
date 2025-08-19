#!/usr/bin/env node

/**
 * Performance Monitoring & Bundle Analysis
 * Advanced performance tracking for weather app
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      build: {},
      bundle: {},
      dependencies: {},
      lighthouse: {},
      runtime: {},
    };
    this.thresholds = {
      bundleSize: 500, // KB
      chunkSize: 200, // KB
      dependencies: 50,
      buildTime: 60, // seconds
      lighthouse: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 90,
      },
    };
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');

    const distPath = join(projectRoot, 'dist');
    if (!existsSync(distPath)) {
      console.log('⚠️ No build found. Running build first...');
      await execAsync('npm run build', { cwd: projectRoot });
    }

    const bundleInfo = await this.calculateBundleSize(distPath);
    this.metrics.bundle = bundleInfo;

    // Check thresholds
    const totalSizeKB = bundleInfo.totalSize / 1024;
    if (totalSizeKB > this.thresholds.bundleSize) {
      console.log(
        `⚠️ Bundle size ${totalSizeKB.toFixed(1)}KB exceeds threshold ${this.thresholds.bundleSize}KB`
      );
    } else {
      console.log(
        `✅ Bundle size ${totalSizeKB.toFixed(1)}KB within threshold`
      );
    }

    return bundleInfo;
  }

  async calculateBundleSize(distPath) {
    const files = await this.getFilesRecursively(distPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    const assetFiles = files.filter(
      f => !f.endsWith('.js') && !f.endsWith('.css') && !f.endsWith('.html')
    );

    const calculateSize = filePaths => {
      return filePaths.reduce((total, file) => {
        const fullPath = join(distPath, file);
        return total + statSync(fullPath).size;
      }, 0);
    };

    return {
      totalSize: calculateSize(files),
      jsSize: calculateSize(jsFiles),
      cssSize: calculateSize(cssFiles),
      assetsSize: calculateSize(assetFiles),
      fileCount: files.length,
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length,
      assetFiles: assetFiles.length,
      largestFiles: this.findLargestFiles(distPath, files).slice(0, 5),
    };
  }

  async getFilesRecursively(dir, basePath = '') {
    const { readdir } = await import('fs/promises');
    const files = [];
    const entries = await readdir(join(dir, basePath), { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = join(basePath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.getFilesRecursively(dir, relativePath)));
      } else {
        files.push(relativePath);
      }
    }

    return files;
  }

  findLargestFiles(distPath, files) {
    return files
      .map(file => ({
        file,
        size: statSync(join(distPath, file)).size,
      }))
      .sort((a, b) => b.size - a.size)
      .map(item => ({
        file: item.file,
        sizeKB: (item.size / 1024).toFixed(1),
      }));
  }

  async analyzeDependencies() {
    console.log('📚 Analyzing dependencies...');

    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, 'package.json'), 'utf8')
    );
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    // Check for outdated packages
    let outdatedPackages = {};
    try {
      const { stdout } = await execAsync('npm outdated --json', {
        cwd: projectRoot,
      });
      outdatedPackages = JSON.parse(stdout || '{}');
    } catch {
      // npm outdated returns non-zero exit code when outdated packages exist
    }

    // Check for unused dependencies
    let unusedDeps = [];
    try {
      const { stdout } = await execAsync('npx depcheck --json', {
        cwd: projectRoot,
      });
      const depcheckResult = JSON.parse(stdout);
      unusedDeps = depcheckResult.dependencies || [];
    } catch {
      // depcheck might not be available
    }

    const depMetrics = {
      totalDependencies: deps.length + devDeps.length,
      dependencies: deps.length,
      devDependencies: devDeps.length,
      outdatedCount: Object.keys(outdatedPackages).length,
      unusedCount: unusedDeps.length,
      heaviestDeps: await this.findHeaviestDependencies(deps.slice(0, 10)),
    };

    this.metrics.dependencies = depMetrics;

    if (depMetrics.totalDependencies > this.thresholds.dependencies) {
      console.log(`⚠️ High dependency count: ${depMetrics.totalDependencies}`);
    } else {
      console.log(
        `✅ Dependency count within threshold: ${depMetrics.totalDependencies}`
      );
    }

    return depMetrics;
  }

  async findHeaviestDependencies(deps) {
    const heaviest = [];

    for (const dep of deps) {
      try {
        const depPath = join(projectRoot, 'node_modules', dep);
        if (existsSync(depPath)) {
          const size = await this.calculateDirectorySize(depPath);
          heaviest.push({
            name: dep,
            sizeMB: (size / (1024 * 1024)).toFixed(2),
          });
        }
      } catch {
        // Skip if can't calculate size
      }
    }

    return heaviest
      .sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB))
      .slice(0, 5);
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const files = await this.getFilesRecursively(dirPath);
      for (const file of files) {
        try {
          totalSize += statSync(join(dirPath, file)).size;
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Skip if directory can't be read
    }

    return totalSize;
  }

  async measureBuildTime() {
    console.log('⏱️ Measuring build performance...');

    const startTime = Date.now();

    try {
      await execAsync('npm run build', { cwd: projectRoot });
      const buildTime = (Date.now() - startTime) / 1000;

      this.metrics.build = {
        buildTime,
        timestamp: new Date().toISOString(),
        success: true,
      };

      if (buildTime > this.thresholds.buildTime) {
        console.log(
          `⚠️ Build time ${buildTime.toFixed(1)}s exceeds threshold ${this.thresholds.buildTime}s`
        );
      } else {
        console.log(`✅ Build time ${buildTime.toFixed(1)}s within threshold`);
      }

      return buildTime;
    } catch (error) {
      this.metrics.build = {
        buildTime: (Date.now() - startTime) / 1000,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      };
      throw error;
    }
  }

  async runLighthouseAnalysis() {
    console.log('🏮 Running Lighthouse analysis...');

    try {
      // Check if lighthouse is available
      await execAsync('npx lighthouse --version');

      // Start preview server
      const server = exec('npm run preview', { cwd: projectRoot });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Run lighthouse
      const { stdout } = await execAsync(
        'npx lighthouse http://localhost:4173 --output=json --quiet --chrome-flags="--headless"',
        { cwd: projectRoot }
      );

      const lighthouseResult = JSON.parse(stdout);
      const scores = {
        performance: Math.round(
          lighthouseResult.lhr.categories.performance.score * 100
        ),
        accessibility: Math.round(
          lighthouseResult.lhr.categories.accessibility.score * 100
        ),
        bestPractices: Math.round(
          lighthouseResult.lhr.categories['best-practices'].score * 100
        ),
        seo: Math.round(lighthouseResult.lhr.categories.seo.score * 100),
      };

      this.metrics.lighthouse = scores;

      // Kill server
      server.kill();

      // Check thresholds
      const failedThresholds = [];
      for (const [metric, score] of Object.entries(scores)) {
        if (score < this.thresholds.lighthouse[metric]) {
          failedThresholds.push(
            `${metric}: ${score} < ${this.thresholds.lighthouse[metric]}`
          );
        }
      }

      if (failedThresholds.length > 0) {
        console.log(
          `⚠️ Lighthouse scores below threshold: ${failedThresholds.join(', ')}`
        );
      } else {
        console.log('✅ All Lighthouse scores meet thresholds');
      }

      return scores;
    } catch (error) {
      console.log(`⚠️ Lighthouse analysis failed: ${error.message}`);
      this.metrics.lighthouse = { error: error.message };
      return null;
    }
  }

  async checkRuntimePerformance() {
    console.log('⚡ Checking runtime performance patterns...');

    const srcFiles = await this.getFilesRecursively(join(projectRoot, 'src'));
    const jsFiles = srcFiles.filter(
      f => f.endsWith('.ts') || f.endsWith('.tsx')
    );

    let performanceIssues = [];

    for (const file of jsFiles.slice(0, 20)) {
      // Check first 20 files
      try {
        const content = readFileSync(join(projectRoot, 'src', file), 'utf8');

        // Check for potential performance issues
        if (
          content.includes('useEffect(') &&
          content.includes('[]') === false
        ) {
          const effectCount = (content.match(/useEffect\(/g) || []).length;
          if (effectCount > 3) {
            performanceIssues.push(
              `${file}: Multiple useEffect hooks (${effectCount})`
            );
          }
        }

        if (content.includes('useState') && content.includes('map(')) {
          performanceIssues.push(`${file}: State updates in map operations`);
        }

        if (content.includes('console.log') && !file.includes('test')) {
          performanceIssues.push(
            `${file}: Console.log statements in production code`
          );
        }
      } catch {
        // Skip files that can't be read
      }
    }

    this.metrics.runtime = {
      checkedFiles: jsFiles.length,
      performanceIssues: performanceIssues.slice(0, 10), // Limit to 10
      issueCount: performanceIssues.length,
    };

    if (performanceIssues.length > 0) {
      console.log(
        `⚠️ Found ${performanceIssues.length} potential runtime performance issues`
      );
    } else {
      console.log('✅ No obvious runtime performance issues detected');
    }

    return this.metrics.runtime;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds,
      metrics: this.metrics,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
    };

    const reportPath = join(
      projectRoot,
      `performance-report-${Date.now()}.json`
    );
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Performance report saved: ${reportPath}`);
    return report;
  }

  generateSummary() {
    const issues = [];
    const successes = [];

    // Bundle analysis
    if (this.metrics.bundle.totalSize) {
      const sizeMB = (this.metrics.bundle.totalSize / (1024 * 1024)).toFixed(2);
      if (this.metrics.bundle.totalSize / 1024 > this.thresholds.bundleSize) {
        issues.push(`Bundle size: ${sizeMB}MB`);
      } else {
        successes.push(`Bundle size: ${sizeMB}MB`);
      }
    }

    // Build time
    if (this.metrics.build.buildTime) {
      if (this.metrics.build.buildTime > this.thresholds.buildTime) {
        issues.push(`Build time: ${this.metrics.build.buildTime.toFixed(1)}s`);
      } else {
        successes.push(
          `Build time: ${this.metrics.build.buildTime.toFixed(1)}s`
        );
      }
    }

    // Dependencies
    if (
      this.metrics.dependencies.totalDependencies > this.thresholds.dependencies
    ) {
      issues.push(
        `Dependencies: ${this.metrics.dependencies.totalDependencies}`
      );
    } else {
      successes.push(
        `Dependencies: ${this.metrics.dependencies.totalDependencies}`
      );
    }

    // Lighthouse
    if (this.metrics.lighthouse && !this.metrics.lighthouse.error) {
      const avgScore =
        Object.values(this.metrics.lighthouse).reduce((a, b) => a + b, 0) / 4;
      if (avgScore < 90) {
        issues.push(`Lighthouse average: ${avgScore.toFixed(0)}%`);
      } else {
        successes.push(`Lighthouse average: ${avgScore.toFixed(0)}%`);
      }
    }

    return {
      overallScore: this.calculateOverallScore(),
      issues: issues.length,
      successes: successes.length,
      issueDetails: issues,
      successDetails: successes,
    };
  }

  calculateOverallScore() {
    let score = 100;

    // Deduct points for issues
    if (
      this.metrics.bundle.totalSize &&
      this.metrics.bundle.totalSize / 1024 > this.thresholds.bundleSize
    ) {
      score -= 15;
    }

    if (
      this.metrics.build.buildTime &&
      this.metrics.build.buildTime > this.thresholds.buildTime
    ) {
      score -= 10;
    }

    if (
      this.metrics.dependencies.totalDependencies > this.thresholds.dependencies
    ) {
      score -= 10;
    }

    if (this.metrics.runtime.issueCount > 5) {
      score -= 15;
    }

    if (this.metrics.lighthouse && !this.metrics.lighthouse.error) {
      const avgScore =
        Object.values(this.metrics.lighthouse).reduce((a, b) => a + b, 0) / 4;
      if (avgScore < 80) {
        score -= 20;
      } else if (avgScore < 90) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.bundle.totalSize / 1024 > this.thresholds.bundleSize) {
      recommendations.push(
        'Consider code splitting and lazy loading for large bundles'
      );
      recommendations.push('Review and remove unused dependencies');
      recommendations.push('Optimize images and assets');
    }

    if (this.metrics.build.buildTime > this.thresholds.buildTime) {
      recommendations.push('Enable build caching');
      recommendations.push('Consider parallel builds');
      recommendations.push('Review TypeScript configuration for optimization');
    }

    if (this.metrics.dependencies.outdatedCount > 5) {
      recommendations.push('Update outdated dependencies');
    }

    if (this.metrics.dependencies.unusedCount > 0) {
      recommendations.push('Remove unused dependencies');
    }

    if (this.metrics.runtime.issueCount > 0) {
      recommendations.push('Review React hooks dependencies');
      recommendations.push(
        'Remove console.log statements from production code'
      );
      recommendations.push('Optimize state management patterns');
    }

    return recommendations;
  }

  printResults() {
    console.log('\n📊 PERFORMANCE MONITORING RESULTS\n');

    const summary = this.generateSummary();
    console.log(`🎯 Overall Performance Score: ${summary.overallScore}/100\n`);

    if (this.metrics.bundle.totalSize) {
      const sizeMB = (this.metrics.bundle.totalSize / (1024 * 1024)).toFixed(2);
      console.log(
        `📦 Bundle Size: ${sizeMB}MB (${this.metrics.bundle.fileCount} files)`
      );
      console.log(
        `   - JavaScript: ${(this.metrics.bundle.jsSize / 1024).toFixed(1)}KB`
      );
      console.log(
        `   - CSS: ${(this.metrics.bundle.cssSize / 1024).toFixed(1)}KB`
      );
      console.log(
        `   - Assets: ${(this.metrics.bundle.assetsSize / 1024).toFixed(1)}KB\n`
      );
    }

    if (this.metrics.build.buildTime) {
      console.log(
        `⏱️ Build Time: ${this.metrics.build.buildTime.toFixed(1)}s\n`
      );
    }

    if (this.metrics.dependencies.totalDependencies) {
      console.log(
        `📚 Dependencies: ${this.metrics.dependencies.totalDependencies} total`
      );
      console.log(`   - Production: ${this.metrics.dependencies.dependencies}`);
      console.log(
        `   - Development: ${this.metrics.dependencies.devDependencies}`
      );
      console.log(`   - Outdated: ${this.metrics.dependencies.outdatedCount}`);
      console.log(`   - Unused: ${this.metrics.dependencies.unusedCount}\n`);
    }

    if (this.metrics.lighthouse && !this.metrics.lighthouse.error) {
      console.log('🏮 Lighthouse Scores:');
      Object.entries(this.metrics.lighthouse).forEach(([metric, score]) => {
        const icon = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
        console.log(`   ${icon} ${metric}: ${score}%`);
      });
      console.log('');
    }

    if (summary.issues > 0) {
      console.log('⚠️ PERFORMANCE ISSUES:');
      summary.issueDetails.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    }

    if (summary.successes > 0) {
      console.log('✅ PERFORMANCE SUCCESSES:');
      summary.successDetails.forEach(success => console.log(`   - ${success}`));
      console.log('');
    }

    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      recommendations.forEach(rec => console.log(`   - ${rec}`));
      console.log('');
    }
  }

  async run() {
    console.log('📊 Performance Monitoring Starting...\n');

    try {
      await this.measureBuildTime();
      await this.analyzeBundleSize();
      await this.analyzeDependencies();
      await this.checkRuntimePerformance();

      // Lighthouse is optional and can be slow
      if (process.argv.includes('--lighthouse')) {
        await this.runLighthouseAnalysis();
      }

      this.generatePerformanceReport();
      this.printResults();

      const summary = this.generateSummary();
      process.exit(summary.overallScore < 70 ? 1 : 0);
    } catch (error) {
      console.error(`❌ Performance monitoring failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Show usage if --help
if (process.argv.includes('--help')) {
  console.log('📊 Performance Monitor\n');
  console.log('Usage: node performance-monitor.js [options]');
  console.log('\nOptions:');
  console.log('  --lighthouse    Include Lighthouse analysis (slower)');
  console.log('  --help          Show this help message\n');
  console.log('Examples:');
  console.log(
    '  node performance-monitor.js              # Basic performance check'
  );
  console.log(
    '  node performance-monitor.js --lighthouse # Include Lighthouse scores'
  );
  process.exit(0);
}

// Run monitoring if called directly
if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] &&
  import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))
) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

export { PerformanceMonitor };
