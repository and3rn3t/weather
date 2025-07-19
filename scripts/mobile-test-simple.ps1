# Simple Mobile Testing Script for Weather App
# Run this to start immediate mobile testing

param(
    [string]$Mode = "browser"  # Options: "browser", "android", "all"
)

Write-Host "Weather App - Mobile Testing Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

function Test-DevServer {
    $weatherAppUrl = "http://localhost:5173"
    
    try {
        $response = Invoke-WebRequest -Uri $weatherAppUrl -UseBasicParsing -TimeoutSec 3
        Write-Host "SUCCESS: Weather app is running at $weatherAppUrl" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "INFO: Dev server not running, starting it now..." -ForegroundColor Yellow
        return $false
    }
}

function Start-DevServer {
    Write-Host "Starting Vite dev server..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    Write-Host "Waiting for server to start..." -ForegroundColor Gray
    Start-Sleep 8
}

function Open-MobileBrowser {
    $weatherAppUrl = "http://localhost:5173"
    
    # Find Chrome installation
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
        Write-Host "Opening Chrome in mobile simulation mode..." -ForegroundColor Green
        
        # Open Chrome with mobile user agent
        $chromeArgs = @(
            "--new-window",
            "--disable-extensions",
            "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
            $weatherAppUrl
        )
        
        Start-Process -FilePath $chromePath -ArgumentList $chromeArgs
        
        Write-Host ""
        Write-Host "MOBILE TESTING INSTRUCTIONS:" -ForegroundColor Cyan
        Write-Host "1. Press F12 to open Developer Tools" -ForegroundColor White
        Write-Host "2. Click the phone icon (Toggle Device Mode)" -ForegroundColor White
        Write-Host "3. Select 'iPhone 14 Pro' or 'Pixel 7'" -ForegroundColor White
        Write-Host "4. Test your weather app with touch!" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "Chrome not found. Please open manually: $weatherAppUrl" -ForegroundColor Red
        Write-Host "Then press F12 and click the phone icon for mobile mode" -ForegroundColor Gray
    }
}

function Test-Capacitor {
    Write-Host "Testing Capacitor setup..." -ForegroundColor Yellow
    
    try {
        $capVersion = npx cap --version 2>$null
        if ($capVersion) {
            Write-Host "SUCCESS: Capacitor is installed - $capVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "INFO: Capacitor not found, installing..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "Running Capacitor doctor..." -ForegroundColor Gray
    npx cap doctor
    
    Write-Host "Checking for Android devices..." -ForegroundColor Gray
    try {
        npx cap run android --list
    } catch {
        Write-Host "INFO: No Android simulators found (install Android Studio)" -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "Mode: $Mode" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "browser" -or $Mode -eq "all") {
    Write-Host "PHASE 1: Browser Mobile Testing" -ForegroundColor Magenta
    Write-Host "===============================" -ForegroundColor Magenta
    
    $serverRunning = Test-DevServer
    if (-not $serverRunning) {
        Start-DevServer
    }
    
    Open-MobileBrowser
    Write-Host ""
}

if ($Mode -eq "android" -or $Mode -eq "all") {
    Write-Host "PHASE 2: Android Setup Check" -ForegroundColor Magenta
    Write-Host "============================" -ForegroundColor Magenta
    Test-Capacitor
    Write-Host ""
}

Write-Host "TESTING OPTIONS SUMMARY:" -ForegroundColor Green
Write-Host "1. Browser Mobile: Open http://localhost:5173 and press F12" -ForegroundColor White
Write-Host "2. Android Native: Run 'npx cap run android'" -ForegroundColor White
Write-Host "3. Capacitor Check: Run 'npx cap doctor'" -ForegroundColor White
Write-Host ""
Write-Host "Your weather app is ready for mobile testing!" -ForegroundColor Green

Read-Host "Press Enter to continue..."
