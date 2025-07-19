# ========================================
# Premium Weather App - Complete Mobile Setup Script
# ========================================
# This script sets up Android simulators and browser-based mobile testing
# Run this script as Administrator for best results

param(
    [string]$Mode = "all"  # Options: "all", "android", "browser"
)

Write-Host "🚀 Premium Weather App - Complete Mobile Setup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to download and install Android Studio
function Install-AndroidStudio {
    Write-Host "📥 Android Studio Installation" -ForegroundColor Yellow
    Write-Host "==============================" -ForegroundColor Yellow
    
    $androidStudioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
    
    if (Test-Path $androidStudioPath) {
        Write-Host "✅ Android Studio is already installed!" -ForegroundColor Green
        return $true
    }
    
    Write-Host "🔍 Android Studio not found. Starting installation process..." -ForegroundColor Yellow
    
    # Download URL for Android Studio
    $downloadUrl = "https://redirector.gvt1.com/edgedl/android/studio/install/2023.1.1.28/android-studio-2023.1.1.28-windows.exe"
    $installerPath = "$env:TEMP\android-studio-installer.exe"
    
    try {
        Write-Host "📥 Downloading Android Studio installer..." -ForegroundColor Gray
        Write-Host "   This may take several minutes (1GB download)" -ForegroundColor Gray
        
        # Use Start-BitsTransfer if available, otherwise use Invoke-WebRequest
        if (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $downloadUrl -Destination $installerPath -Description "Downloading Android Studio"
        } else {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        }
        
        if (Test-Path $installerPath) {
            Write-Host "✅ Download completed!" -ForegroundColor Green
            Write-Host "🚀 Starting Android Studio installer..." -ForegroundColor Yellow
            Write-Host "   Please follow the installation wizard and accept all default settings" -ForegroundColor Gray
            
            # Run installer
            Start-Process -FilePath $installerPath -Wait
            
            # Clean up installer
            Remove-Item $installerPath -Force
            
            # Check if installation was successful
            if (Test-Path $androidStudioPath) {
                Write-Host "✅ Android Studio installed successfully!" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Android Studio installation may have failed" -ForegroundColor Red
                return $false
            }
        }
    } catch {
        Write-Host "❌ Failed to download Android Studio: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Please download manually from: https://developer.android.com/studio" -ForegroundColor Gray
        return $false
    }
}

# Function to setup Android SDK and environment variables
function Setup-AndroidSDK {
    Write-Host "🔧 Android SDK Configuration" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    # Find Android SDK location
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
        
        # Set environment variables
        [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSDK, [EnvironmentVariableTarget]::User)
        [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSDK, [EnvironmentVariableTarget]::User)
        
        # Update PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
        $platformTools = Join-Path $androidSDK "platform-tools"
        $cmdlineTools = Join-Path $androidSDK "cmdline-tools\latest\bin"
        
        if ($currentPath -notlike "*$platformTools*") {
            $newPath = "$currentPath;$platformTools"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::User)
        }
        
        if ($currentPath -notlike "*$cmdlineTools*") {
            $newPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User) + ";$cmdlineTools"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::User)
        }
        
        # Refresh current session environment
        $env:ANDROID_HOME = $androidSDK
        $env:ANDROID_SDK_ROOT = $androidSDK
        $env:PATH += ";$platformTools;$cmdlineTools"
        
        Write-Host "✅ Environment variables configured" -ForegroundColor Green
        return $androidSDK
    } else {
        Write-Host "❌ Android SDK not found" -ForegroundColor Red
        Write-Host "   Please install Android Studio first" -ForegroundColor Gray
        return $null
    }
}

# Function to create Android Virtual Device
function Create-AndroidAVD {
    param([string]$SdkPath)
    
    Write-Host "📱 Creating Android Virtual Device" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Yellow
    
    $avdManager = Join-Path $SdkPath "cmdline-tools\latest\bin\avdmanager.bat"
    $sdkManager = Join-Path $SdkPath "cmdline-tools\latest\bin\sdkmanager.bat"
    
    if (-not (Test-Path $avdManager)) {
        $avdManager = Join-Path $SdkPath "tools\bin\avdmanager.bat"
        $sdkManager = Join-Path $SdkPath "tools\bin\sdkmanager.bat"
    }
    
    if (Test-Path $avdManager) {
        try {
            # Accept licenses
            Write-Host "📋 Accepting Android SDK licenses..." -ForegroundColor Gray
            echo "y" | & $sdkManager --licenses
            
            # Install system image
            Write-Host "📥 Installing Android system image..." -ForegroundColor Gray
            & $sdkManager "system-images;android-34;google_apis;x86_64"
            
            # Create AVD
            Write-Host "Building Creating Weather App AVD..." -ForegroundColor Gray
            & $avdManager create avd -n "WeatherApp_Pixel7" -k "system-images;android-34;google_apis;x86_64" -d "pixel_7" --force
            
            Write-Host "✅ Android Virtual Device 'WeatherApp_Pixel7' created!" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed to create AVD: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ AVD Manager not found" -ForegroundColor Red
        return $false
    }
}

# Function to open browser in mobile mode
function Open-BrowserMobileMode {
    Write-Host "🌐 Opening Browser Mobile Simulator" -ForegroundColor Yellow
    Write-Host "===================================" -ForegroundColor Yellow
    
    $weatherAppUrl = "http://localhost:5173"
    
    # Check if the dev server is running
    try {
        $response = Invoke-WebRequest -Uri $weatherAppUrl -UseBasicParsing -TimeoutSec 3
        Write-Host "✅ Weather app is running at $weatherAppUrl" -ForegroundColor Green
    } catch {
        Write-Host "WARNING Weather app dev server not detected" -ForegroundColor Yellow
        Write-Host "   Starting dev server..." -ForegroundColor Gray
        
        # Start the dev server in a new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
        Start-Sleep 5
    }
    
    # Open Chrome with mobile simulation
    $chromeArgs = @(
        "--new-window",
        "--disable-extensions",
        "--disable-plugins",
        "--user-agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'",
        $weatherAppUrl
    )
    
    # Try to find Chrome
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
    )
    
    $chromePath = $null
    foreach ($path in $chromePaths) {
        if (Test-Path $path) {
            $chromePath = $path
            break
        }
    }
    
    if ($chromePath) {
        Write-Host "🚀 Opening Chrome in mobile mode..." -ForegroundColor Green
        Start-Process -FilePath $chromePath -ArgumentList $chromeArgs
        
        Write-Host ""
        Write-Host "📱 Chrome Mobile Simulation Instructions:" -ForegroundColor Cyan
        Write-Host "1. Press F12 to open Developer Tools" -ForegroundColor White
        Write-Host "2. Click the phone/tablet icon (Toggle Device Mode)" -ForegroundColor White
        Write-Host "3. Select 'iPhone 14 Pro' or 'Pixel 7' from dropdown" -ForegroundColor White
        Write-Host "4. Test your weather app with touch interactions!" -ForegroundColor White
    } else {
        Write-Host "❌ Chrome not found" -ForegroundColor Red
        Write-Host "   Please install Google Chrome or open $weatherAppUrl manually" -ForegroundColor Gray
    }
}

# Function to test Capacitor setup
function Test-CapacitorSetup {
    Write-Host "🧪 Testing Capacitor Mobile Setup" -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    # Check if Capacitor is installed
    try {
        $capVersion = npx cap --version
        Write-Host "✅ Capacitor installed: $capVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Capacitor not found. Installing..." -ForegroundColor Red
        npm install
    }
    
    # Run Capacitor doctor
    Write-Host "🏥 Running Capacitor doctor..." -ForegroundColor Gray
    npx cap doctor
    
    # Check available devices
    Write-Host "📱 Checking available Android devices..." -ForegroundColor Gray
    try {
        npx cap run android --list
    } catch {
        Write-Host "WARNING No Android devices/emulators found yet" -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "🎯 Setup Mode: $Mode" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "all" -or $Mode -eq "browser") {
    Write-Host "🌐 PHASE 1: Browser Mobile Testing (Immediate)" -ForegroundColor Magenta
    Write-Host "=============================================" -ForegroundColor Magenta
    Open-BrowserMobileMode
    Write-Host ""
}

if ($Mode -eq "all" -or $Mode -eq "android") {
    Write-Host "🤖 PHASE 2: Android Native Simulator Setup" -ForegroundColor Magenta
    Write-Host "===========================================" -ForegroundColor Magenta
    
    # Check if running as admin
    if (-not (Test-Administrator)) {
        Write-Host "WARNING For best results, run as Administrator" -ForegroundColor Yellow
        Write-Host "   Some features may require elevated privileges" -ForegroundColor Gray
    }
    
    # Install Android Studio
    $studioInstalled = Install-AndroidStudio
    
    if ($studioInstalled) {
        # Setup SDK
        $sdkPath = Setup-AndroidSDK
        
        if ($sdkPath) {
            # Create AVD
            Create-AndroidAVD -SdkPath $sdkPath
            
            # Test Capacitor
            Test-CapacitorSetup
        }
    }
}

Write-Host ""
Write-Host "🎉 Mobile Setup Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

Write-Host "📱 Available Testing Options:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣ Browser Mobile Simulation (Ready Now!):" -ForegroundColor Yellow
Write-Host "   • Open: http://localhost:5173" -ForegroundColor White
Write-Host "   • Press F12 → Click phone icon" -ForegroundColor White
Write-Host "   • Select iPhone/Android device" -ForegroundColor White
Write-Host "   • Test immediately!" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ Android Native Simulator:" -ForegroundColor Yellow
Write-Host "   • Run: npx cap run android" -ForegroundColor White
Write-Host "   • Or: npx cap open android (opens Android Studio)" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ Development Commands:" -ForegroundColor Yellow
Write-Host "   • npm run mobile:build    (Build + sync)" -ForegroundColor White
Write-Host "   • npx cap sync           (Sync changes)" -ForegroundColor White
Write-Host "   • npx cap doctor         (Check setup)" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Your Premium Weather App is ready for mobile testing!" -ForegroundColor Green
Write-Host ""

# Pause to let user read the output
Read-Host "Press Enter to exit..."
