#!/usr/bin/env node

/**
 * Mobile Deployment Assistant
 * Comprehensive mobile build and deployment automation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

class MobileDeploymentAssistant {
  constructor() {
    this.platform = process.argv[2] || 'ios';
    this.buildType = process.argv[3] || 'debug';
    this.steps = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${icon} ${message}`);
    
    this.steps.push({ timestamp, type, message });
  }

  async runCommand(command, description) {
    this.log(`Executing: ${description}...`);
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: projectRoot });
      if (stderr && !stderr.includes('warning')) {
        this.log(`Warning: ${stderr}`, 'warning');
      }
      return { success: true, output: stdout };
    } catch (error) {
      this.log(`Failed: ${error.message}`, 'error');
      this.errors.push({ command, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeResult = await this.runCommand('node --version', 'Node.js version check');
    if (nodeResult.success) {
      const version = nodeResult.output.trim();
      const versionNumber = parseFloat(version.replace('v', ''));
      if (versionNumber < 20) {
        this.log(`Node.js ${version} detected. Recommend upgrading to v20+`, 'warning');
      } else {
        this.log(`Node.js ${version} ✓`, 'success');
      }
    }
    
    // Check Capacitor CLI
    const capacitorResult = await this.runCommand('npx cap --version', 'Capacitor CLI check');
    if (capacitorResult.success) {
      this.log(`Capacitor ${capacitorResult.output.trim()} ✓`, 'success');
    }
    
    // Platform-specific checks
    if (this.platform === 'ios') {
      await this.checkiOSPrerequisites();
    } else if (this.platform === 'android') {
      await this.checkAndroidPrerequisites();
    }
  }

  async checkiOSPrerequisites() {
    this.log('📱 Checking iOS prerequisites...');
    
    // Check Xcode (macOS only)
    if (process.platform === 'darwin') {
      const xcodeResult = await this.runCommand('xcodebuild -version', 'Xcode version check');
      if (xcodeResult.success) {
        this.log('Xcode detected ✓', 'success');
      } else {
        this.log('Xcode not found. Required for iOS development.', 'error');
      }
      
      // Check iOS Simulator
      const simulatorResult = await this.runCommand('xcrun simctl list devices', 'iOS Simulator check');
      if (simulatorResult.success) {
        this.log('iOS Simulator available ✓', 'success');
      }
    } else {
      this.log('iOS development requires macOS. Using web preview mode.', 'warning');
    }
    
    // Check CocoaPods (if Podfile exists)
    if (existsSync(join(projectRoot, 'ios', 'Podfile'))) {
      const podResult = await this.runCommand('pod --version', 'CocoaPods check');
      if (podResult.success) {
        this.log(`CocoaPods ${podResult.output.trim()} ✓`, 'success');
      }
    }
  }

  async checkAndroidPrerequisites() {
    this.log('🤖 Checking Android prerequisites...');
    
    // Check Android SDK
    if (process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT) {
      this.log('Android SDK path configured ✓', 'success');
      
      // Check ADB
      const adbResult = await this.runCommand('adb version', 'ADB check');
      if (adbResult.success) {
        this.log('ADB available ✓', 'success');
      }
    } else {
      this.log('Android SDK not configured. Set ANDROID_HOME environment variable.', 'warning');
    }
    
    // Check Java
    const javaResult = await this.runCommand('java -version', 'Java version check');
    if (javaResult.success) {
      this.log('Java runtime detected ✓', 'success');
    }
    
    // Check Gradle
    if (existsSync(join(projectRoot, 'android', 'gradlew'))) {
      this.log('Gradle wrapper found ✓', 'success');
    }
  }

  async buildWebAssets() {
    this.log('🏗️ Building web assets...');
    
    // Clean previous build
    await this.runCommand('npm run clean', 'Cleaning previous build');
    
    // Run production build
    const buildResult = await this.runCommand('npm run build', 'Building for production');
    if (!buildResult.success) {
      throw new Error('Web build failed');
    }
    
    // Verify build output
    if (existsSync(join(projectRoot, 'dist'))) {
      this.log('Web assets built successfully ✓', 'success');
    } else {
      throw new Error('Build output not found');
    }
  }

  async setupCapacitor() {
    this.log('⚡ Setting up Capacitor...');
    
    // Check if Capacitor is initialized
    const configPath = join(projectRoot, 'capacitor.config.json');
    if (!existsSync(configPath)) {
      this.log('Initializing Capacitor...', 'info');
      await this.runCommand('npx cap init', 'Capacitor initialization');
    }
    
    // Read and validate config
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      this.log(`App ID: ${config.appId}`, 'info');
      this.log(`App Name: ${config.appName}`, 'info');
      
      // Ensure web dir is correct
      if (config.webDir !== 'dist') {
        config.webDir = 'dist';
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        this.log('Updated webDir to "dist"', 'info');
      }
    }
    
    // Copy web assets
    await this.runCommand('npx cap copy', 'Copying web assets to native projects');
  }

  async addPlatform() {
    this.log(`📱 Adding ${this.platform} platform...`);
    
    const platformPath = join(projectRoot, this.platform);
    if (!existsSync(platformPath)) {
      const addResult = await this.runCommand(`npx cap add ${this.platform}`, `Adding ${this.platform} platform`);
      if (!addResult.success) {
        throw new Error(`Failed to add ${this.platform} platform`);
      }
    } else {
      this.log(`${this.platform} platform already exists ✓`, 'success');
    }
  }

  async syncPlatform() {
    this.log(`🔄 Syncing ${this.platform} platform...`);
    
    const syncResult = await this.runCommand(`npx cap sync ${this.platform}`, `Syncing ${this.platform}`);
    if (!syncResult.success) {
      this.log('Sync failed, attempting to continue...', 'warning');
    }
  }

  async runOnDevice() {
    this.log(`🚀 Running on ${this.platform} device/simulator...`);
    
    if (this.platform === 'ios') {
      if (process.platform === 'darwin') {
        await this.runCommand('npx cap run ios', 'Running on iOS simulator');
      } else {
        this.log('iOS simulator not available on this platform. Opening Xcode project...', 'info');
        this.log(`Please open: ${join(projectRoot, 'ios', 'App.xcworkspace')}`, 'info');
      }
    } else if (this.platform === 'android') {
      // Check for connected devices
      const devicesResult = await this.runCommand('adb devices', 'Checking connected devices');
      if (devicesResult.success && devicesResult.output.includes('device')) {
        await this.runCommand('npx cap run android', 'Running on Android device');
      } else {
        this.log('No Android devices detected. Opening Android Studio...', 'info');
        await this.runCommand('npx cap open android', 'Opening in Android Studio');
      }
    }
  }

  async openInIDE() {
    this.log(`💻 Opening in ${this.platform === 'ios' ? 'Xcode' : 'Android Studio'}...`);
    
    if (this.platform === 'ios' && process.platform === 'darwin') {
      await this.runCommand('npx cap open ios', 'Opening in Xcode');
    } else if (this.platform === 'android') {
      await this.runCommand('npx cap open android', 'Opening in Android Studio');
    } else {
      this.log('IDE not available on this platform', 'warning');
    }
  }

  async generateAppIcons() {
    this.log('🎨 Checking app icons...');
    
    const iconPath = join(projectRoot, 'public', 'icon.png');
    if (existsSync(iconPath)) {
      this.log('App icon found ✓', 'success');
      
      // TODO: Add icon generation for different sizes
      this.log('Icon generation not implemented yet', 'warning');
    } else {
      this.log('No app icon found. Consider adding public/icon.png', 'warning');
    }
  }

  async generateSplashScreens() {
    this.log('🖼️ Checking splash screens...');
    
    const splashPath = join(projectRoot, 'public', 'splash.png');
    if (existsSync(splashPath)) {
      this.log('Splash screen found ✓', 'success');
    } else {
      this.log('No splash screen found. Consider adding public/splash.png', 'warning');
    }
  }

  async validateBuildConfig() {
    this.log('⚙️ Validating build configuration...');
    
    // Check package.json scripts
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    const requiredScripts = ['build', 'dev'];
    
    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        this.log(`Script "${script}" configured ✓`, 'success');
      } else {
        this.log(`Missing script: ${script}`, 'warning');
      }
    }
    
    // Check for required dependencies
    const capacitorDeps = ['@capacitor/core', '@capacitor/cli'];
    for (const dep of capacitorDeps) {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        this.log(`Dependency "${dep}" found ✓`, 'success');
      } else {
        this.log(`Missing dependency: ${dep}`, 'warning');
      }
    }
  }

  async runQualityChecks() {
    this.log('🧪 Running quality checks...');
    
    // Run linting
    await this.runCommand('npm run lint', 'Running ESLint');
    
    // Run type checking
    await this.runCommand('npx tsc --noEmit', 'Type checking');
    
    // Run fast tests
    await this.runCommand('npm run test:fast', 'Running tests');
  }

  generateDeploymentReport() {
    this.log('📊 Generating deployment report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      buildType: this.buildType,
      steps: this.steps,
      errors: this.errors,
      success: this.errors.length === 0,
      environment: {
        os: process.platform,
        node: process.version,
        cwd: process.cwd()
      }
    };
    
    const reportPath = join(projectRoot, `deployment-report-${this.platform}-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report saved: ${reportPath}`, 'info');
    return report;
  }

  printSummary() {
    console.log('\n📊 MOBILE DEPLOYMENT SUMMARY\n');
    
    const successSteps = this.steps.filter(s => s.type === 'success').length;
    const warningSteps = this.steps.filter(s => s.type === 'warning').length;
    const errorSteps = this.steps.filter(s => s.type === 'error').length;
    
    console.log(`✅ Successful steps: ${successSteps}`);
    console.log(`⚠️ Warnings: ${warningSteps}`);
    console.log(`❌ Errors: ${errorSteps}`);
    
    if (this.errors.length === 0) {
      console.log(`\n🎉 ${this.platform.toUpperCase()} deployment completed successfully!`);
      
      if (this.platform === 'ios') {
        console.log('\n📱 Next steps for iOS:');
        console.log('   1. Open Xcode project');
        console.log('   2. Configure signing certificates');
        console.log('   3. Test on physical device');
        console.log('   4. Submit to App Store Connect');
      } else if (this.platform === 'android') {
        console.log('\n🤖 Next steps for Android:');
        console.log('   1. Open Android Studio project');
        console.log('   2. Generate signed APK/AAB');
        console.log('   3. Test on physical device');
        console.log('   4. Upload to Google Play Console');
      }
    } else {
      console.log(`\n❌ Deployment failed with ${this.errors.length} error(s)`);
      console.log('\n🔧 To resolve issues:');
      console.log('   1. Check the error messages above');
      console.log('   2. Ensure all prerequisites are installed');
      console.log('   3. Run: npm run mobile:doctor');
      console.log('   4. Re-run this script');
    }
    
    console.log('\n');
  }

  async run() {
    console.log(`📱 Mobile Deployment Assistant - ${this.platform.toUpperCase()} ${this.buildType.toUpperCase()}\n`);
    
    try {
      await this.checkPrerequisites();
      await this.validateBuildConfig();
      await this.buildWebAssets();
      await this.setupCapacitor();
      await this.addPlatform();
      await this.syncPlatform();
      await this.generateAppIcons();
      await this.generateSplashScreens();
      
      if (this.buildType === 'release') {
        await this.runQualityChecks();
      }
      
      // Ask user if they want to run on device
      if (process.argv.includes('--run')) {
        await this.runOnDevice();
      } else if (process.argv.includes('--open')) {
        await this.openInIDE();
      }
      
      this.generateDeploymentReport();
      this.printSummary();
      
    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
      this.printSummary();
      process.exit(1);
    }
  }
}

// Show usage if no arguments
if (process.argv.length === 2) {
  console.log('📱 Mobile Deployment Assistant\n');
  console.log('Usage: node mobile-deploy.js <platform> [buildType] [options]');
  console.log('\nPlatforms: ios, android');
  console.log('Build Types: debug, release');
  console.log('Options: --run, --open\n');
  console.log('Examples:');
  console.log('  node mobile-deploy.js ios debug --run');
  console.log('  node mobile-deploy.js android release --open');
  process.exit(0);
}

// Run deployment if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  const assistant = new MobileDeploymentAssistant();
  assistant.run().catch(console.error);
}

export { MobileDeploymentAssistant };
