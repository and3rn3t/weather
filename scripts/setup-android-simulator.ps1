# Android Studio & Simulator Setup Script for Windows
# This script helps install Android Studio and set up simulators

Write-Host "📱 Android Studio & Simulator Setup for Weather App" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Android Studio is already installed
$androidStudioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
$androidStudioExists = Test-Path $androidStudioPath

if ($androidStudioExists) {
    Write-Host "✅ Android Studio is already installed!" -ForegroundColor Green
    Write-Host "   Location: $androidStudioPath" -ForegroundColor Gray
} else {
    Write-Host "📥 Android Studio needs to be installed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host "1. Download Android Studio from: https://developer.android.com/studio" -ForegroundColor White
    Write-Host "2. Run the installer and follow the setup wizard" -ForegroundColor White
    Write-Host "3. Accept all license agreements" -ForegroundColor White
    Write-Host "4. Let it install SDK Platform, SDK Build-Tools, and Android Emulator" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to open download page
    $openBrowser = Read-Host "Would you like to open the Android Studio download page? (y/n)"
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
        Start-Process "https://developer.android.com/studio"
    }
    
    Write-Host ""
    Write-Host "⏳ After installing Android Studio, run this script again to continue setup." -ForegroundColor Yellow
    pause
    exit
}

# Check for Android SDK
Write-Host "🔍 Checking for Android SDK..." -ForegroundColor Yellow

# Common Android SDK locations on Windows
$sdkPaths = @(
    "${env:LOCALAPPDATA}\Android\Sdk",
    "${env:USERPROFILE}\AppData\Local\Android\Sdk",
    "${env:ProgramFiles(x86)}\Android\android-sdk",
    "${env:ProgramFiles}\Android\Sdk"
)

$androidSDK = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $androidSDK = $path
        break
    }
}

if ($androidSDK) {
    Write-Host "✅ Android SDK found at: $androidSDK" -ForegroundColor Green
    
    # Set environment variable if not already set
    if (-not $env:ANDROID_HOME) {
        Write-Host "🔧 Setting ANDROID_HOME environment variable..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSDK, [EnvironmentVariableTarget]::User)
        $env:ANDROID_HOME = $androidSDK
        Write-Host "✅ ANDROID_HOME set to: $androidSDK" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Android SDK not found in common locations" -ForegroundColor Red
    Write-Host "   Please ensure Android Studio is properly installed with SDK" -ForegroundColor Gray
    Write-Host "   SDK should be located in one of these paths:" -ForegroundColor Gray
    foreach ($path in $sdkPaths) {
        Write-Host "   - $path" -ForegroundColor Gray
    }
    exit 1
}

# Check for AVD Manager
$avdManager = Join-Path $androidSDK "cmdline-tools\latest\bin\avdmanager.bat"
if (-not (Test-Path $avdManager)) {
    $avdManager = Join-Path $androidSDK "tools\bin\avdmanager.bat"
}

if (Test-Path $avdManager) {
    Write-Host "✅ AVD Manager found" -ForegroundColor Green
} else {
    Write-Host "❌ AVD Manager not found. Please install Android SDK Command-line Tools" -ForegroundColor Red
    Write-Host "   1. Open Android Studio" -ForegroundColor Gray
    Write-Host "   2. Go to Tools > SDK Manager" -ForegroundColor Gray
    Write-Host "   3. SDK Tools tab > Check 'Android SDK Command-line Tools'" -ForegroundColor Gray
    Write-Host "   4. Click Apply to install" -ForegroundColor Gray
    exit 1
}

# List existing AVDs
Write-Host ""
Write-Host "📱 Checking existing Android Virtual Devices..." -ForegroundColor Yellow

try {
    $existingAVDs = & $avdManager list avd
    if ($existingAVDs -match "Available Android Virtual Devices") {
        Write-Host "✅ Found existing AVDs:" -ForegroundColor Green
        Write-Host $existingAVDs -ForegroundColor Gray
    } else {
        Write-Host "📱 No existing AVDs found. Let's create one!" -ForegroundColor Yellow
        
        # Create a new AVD
        Write-Host ""
        Write-Host "🔧 Creating Weather App Test AVD..." -ForegroundColor Yellow
        
        # Use sdkmanager to list available system images
        $sdkManager = Join-Path $androidSDK "cmdline-tools\latest\bin\sdkmanager.bat"
        if (-not (Test-Path $sdkManager)) {
            $sdkManager = Join-Path $androidSDK "tools\bin\sdkmanager.bat"
        }
        
        if (Test-Path $sdkManager) {
            Write-Host "📥 Installing latest system image..." -ForegroundColor Yellow
            & $sdkManager "system-images;android-34;google_apis;x86_64"
            
            Write-Host "🏗️  Creating AVD..." -ForegroundColor Yellow
            & $avdManager create avd -n "WeatherApp_Pixel7" -k "system-images;android-34;google_apis;x86_64" -d "pixel_7"
            
            Write-Host "✅ AVD 'WeatherApp_Pixel7' created successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ SDK Manager not found" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Error checking AVDs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Setup Complete! Next Steps:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 To run your Weather App on Android simulator:" -ForegroundColor Yellow
Write-Host "  1. npx cap run android" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Alternative methods:" -ForegroundColor Yellow
Write-Host "  • Open Android Studio and start emulator manually:" -ForegroundColor White
Write-Host "    - Tools > AVD Manager > Click ▶️ on your device" -ForegroundColor White
Write-Host "  • Then run: npx cap run android" -ForegroundColor White
Write-Host ""

Write-Host "🛠️  If you encounter issues:" -ForegroundColor Yellow
Write-Host "  • Run: npx cap doctor (to check environment)" -ForegroundColor White
Write-Host "  • Run: npx cap run android --list (to see devices)" -ForegroundColor White
Write-Host ""

Write-Host "📖 For detailed guidance, see: docs/development/SIMULATOR_SETUP.md" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 Ready to test your weather app on Android!" -ForegroundColor Green
pause
