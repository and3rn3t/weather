# Premium Weather App - Mobile Deployment Setup Script
# Installs Capacitor CLI and configures the project for iOS/Android deployment

Write-Host "🚀 Premium Weather App - Mobile Deployment Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Capacitor CLI and dependencies..." -ForegroundColor Yellow

# Install Capacitor CLI globally
Write-Host "Installing @capacitor/cli globally..." -ForegroundColor Gray
npm install -g @capacitor/cli

# Install Capacitor core and platform packages
Write-Host "Installing Capacitor core packages..." -ForegroundColor Gray
npm install @capacitor/core @capacitor/android @capacitor/ios

# Install Capacitor plugins for mobile features
Write-Host "Installing Capacitor plugins..." -ForegroundColor Gray
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/geolocation @capacitor/device @capacitor/network @capacitor/local-notifications @capacitor/push-notifications @capacitor/share

Write-Host ""
Write-Host "🔧 Initializing Capacitor project..." -ForegroundColor Yellow

# Initialize Capacitor (will use existing capacitor.config.json)
Write-Host "Initializing Capacitor with existing configuration..." -ForegroundColor Gray
npx cap init

# Build the web app first
Write-Host ""
Write-Host "🏗️  Building web app for mobile deployment..." -ForegroundColor Yellow
npm run build

# Add Android platform
Write-Host ""
Write-Host "📱 Adding Android platform..." -ForegroundColor Yellow
npx cap add android

# Add iOS platform (if on macOS)
if ($IsMacOS) {
    Write-Host ""
    Write-Host "🍎 Adding iOS platform..." -ForegroundColor Yellow
    npx cap add ios
} else {
    Write-Host ""
    Write-Host "⚠️  iOS platform can only be added on macOS. Skipping iOS setup." -ForegroundColor Yellow
    Write-Host "   To add iOS support later, run: npx cap add ios (on macOS)" -ForegroundColor Gray
}

# Sync the web app with native platforms
Write-Host ""
Write-Host "🔄 Syncing web app with native platforms..." -ForegroundColor Yellow
npx cap sync

Write-Host ""
Write-Host "✅ Mobile deployment setup complete!" -ForegroundColor Green
Write-Host ""

# Display next steps
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Development:" -ForegroundColor Yellow
Write-Host "  • Run: npm run dev (for web development)" -ForegroundColor White
Write-Host "  • Run: npx cap run android (for Android development)" -ForegroundColor White
if ($IsMacOS) {
    Write-Host "  • Run: npx cap run ios (for iOS development)" -ForegroundColor White
}
Write-Host ""

Write-Host "📱 Opening Native IDEs:" -ForegroundColor Yellow
Write-Host "  • Android: npx cap open android (opens Android Studio)" -ForegroundColor White
if ($IsMacOS) {
    Write-Host "  • iOS: npx cap open ios (opens Xcode)" -ForegroundColor White
}
Write-Host ""

Write-Host "📦 Building for Production:" -ForegroundColor Yellow
Write-Host "  1. Build web app: npm run build" -ForegroundColor White
Write-Host "  2. Sync changes: npx cap sync" -ForegroundColor White
Write-Host "  3. Open native IDE to build and deploy" -ForegroundColor White
Write-Host ""

Write-Host "🔄 Development Workflow:" -ForegroundColor Yellow
Write-Host "  1. Make changes to React code" -ForegroundColor White
Write-Host "  2. Test in browser: npm run dev" -ForegroundColor White
Write-Host "  3. Build for mobile: npm run build" -ForegroundColor White
Write-Host "  4. Sync to native: npx cap sync" -ForegroundColor White
Write-Host "  5. Test on device: npx cap run android/ios" -ForegroundColor White
Write-Host ""

Write-Host "📋 Prerequisites for Mobile Development:" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "🤖 Android Development:" -ForegroundColor Green
Write-Host "  • Android Studio with Android SDK" -ForegroundColor White
Write-Host "  • Java Development Kit (JDK) 11 or higher" -ForegroundColor White
Write-Host "  • Android SDK Build-Tools" -ForegroundColor White
Write-Host "  • Android Emulator or physical device" -ForegroundColor White
Write-Host ""

if ($IsMacOS) {
    Write-Host "🍎 iOS Development (macOS only):" -ForegroundColor Green
    Write-Host "  • Xcode (latest version)" -ForegroundColor White
    Write-Host "  • iOS Simulator or physical device" -ForegroundColor White
    Write-Host "  • Apple Developer Account (for device testing/deployment)" -ForegroundColor White
    Write-Host ""
}

Write-Host "🎯 Ready to start mobile development!" -ForegroundColor Green
Write-Host "For detailed documentation, visit: https://capacitorjs.com/docs" -ForegroundColor Gray
Write-Host ""
