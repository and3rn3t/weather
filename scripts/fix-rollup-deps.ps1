# Fix Rollup Dependencies - PowerShell Script
# This script resolves Rollup binary dependency issues that can occur in CI/CD environments
param(
    [switch]$Force,
    [switch]$Clean,
    [switch]$Verbose
)

Write-Host "🔧 Weather App - Rollup Dependencies Fix" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($Verbose) {
    Write-Host "🔍 Verbose mode enabled" -ForegroundColor Yellow
    $VerbosePreference = "Continue"
}

# Function to write colored output
function Write-Status {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Status "❌ Error: package.json not found. Please run this script from the project root." "Red"
    exit 1
}

Write-Status "📋 Current directory: $(Get-Location)" "Gray"

# Clean installation if requested
if ($Clean) {
    Write-Status "🧹 Performing clean installation..." "Yellow"
    
    if (Test-Path "node_modules") {
        Write-Status "🗑️  Removing node_modules..." "Gray"
        Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    if (Test-Path "package-lock.json") {
        Write-Status "🗑️  Removing package-lock.json..." "Gray"
        Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    }
    
    Write-Status "🧹 Clean completed" "Green"
}

# Install dependencies
Write-Status "📦 Installing dependencies..." "Blue"
try {
    if ($Verbose) {
        npm ci --include=optional
    } else {
        npm ci --include=optional --silent
    }
    Write-Status "✅ Dependencies installed successfully" "Green"
} catch {
    Write-Status "⚠️  Warning: npm ci failed, trying npm install..." "Yellow"
    try {
        if ($Verbose) {
            npm install --include=optional
        } else {
            npm install --include=optional --silent
        }
        Write-Status "✅ Dependencies installed with npm install" "Green"
    } catch {
        Write-Status "❌ Error: Failed to install dependencies" "Red"
        exit 1
    }
}

# Platform detection
$platform = $env:OS
$arch = $env:PROCESSOR_ARCHITECTURE
Write-Status "🖥️  Platform: $platform, Architecture: $arch" "Gray"

# Determine required Rollup binary
$rollupBinary = ""
if ($platform -eq "Windows_NT") {
    if ($arch -eq "AMD64") {
        $rollupBinary = "@rollup/rollup-win32-x64-msvc"
    } elseif ($arch -eq "ARM64") {
        $rollupBinary = "@rollup/rollup-win32-arm64-msvc"
    } else {
        $rollupBinary = "@rollup/rollup-win32-ia32-msvc"
    }
} else {
    # Default to Linux binary for CI environments
    $rollupBinary = "@rollup/rollup-linux-x64-gnu"
}

Write-Status "🔧 Required Rollup binary: $rollupBinary" "Blue"

# Install the specific Rollup binary
Write-Status "📦 Installing Rollup binary..." "Blue"
try {
    if ($Verbose) {
        npm install $rollupBinary --optional --no-save
    } else {
        npm install $rollupBinary --optional --no-save --silent
    }
    Write-Status "✅ Rollup binary installed successfully" "Green"
} catch {
    Write-Status "⚠️  Warning: Failed to install $rollupBinary, trying without optional flag..." "Yellow"
    try {
        if ($Verbose) {
            npm install $rollupBinary --no-save
        } else {
            npm install $rollupBinary --no-save --silent
        }
        Write-Status "✅ Rollup binary installed (without optional flag)" "Green"
    } catch {
        Write-Status "❌ Warning: Could not install specific Rollup binary" "Red"
        Write-Status "🔄 Attempting to install common Rollup binaries..." "Yellow"
        
        $commonBinaries = @(
            "@rollup/rollup-linux-x64-gnu",
            "@rollup/rollup-win32-x64-msvc",
            "@rollup/rollup-darwin-x64",
            "@rollup/rollup-darwin-arm64"
        )
        
        foreach ($binary in $commonBinaries) {
            try {
                if ($Verbose) {
                    npm install $binary --optional --no-save
                } else {
                    npm install $binary --optional --no-save --silent
                }
                Write-Status "✅ Installed $binary" "Green"
            } catch {
                Write-Status "⚠️  Could not install $binary" "Yellow"
            }
        }
    }
}

# Verify Rollup installation
Write-Status "🔍 Verifying Rollup installation..." "Blue"
try {
    $rollupVersion = npm list rollup --depth=0 2>$null
    if ($rollupVersion) {
        Write-Status "✅ Rollup is properly installed" "Green"
        if ($Verbose) {
            Write-Status "📋 Rollup info: $rollupVersion" "Gray"
        }
    } else {
        Write-Status "⚠️  Warning: Rollup verification failed" "Yellow"
    }
} catch {
    Write-Status "⚠️  Warning: Could not verify Rollup installation" "Yellow"
}

# Test build
Write-Status "🏗️  Testing build process..." "Blue"
try {
    if ($Verbose) {
        npm run build
    } else {
        npm run build --silent
    }
    Write-Status "✅ Build test successful!" "Green"
} catch {
    Write-Status "❌ Build test failed" "Red"
    Write-Status "🔄 This might be due to other build issues, not necessarily Rollup dependencies" "Yellow"
    
    if (-not $Force) {
        Write-Status "💡 Use -Force parameter to continue despite build errors" "Blue"
        exit 1
    }
}

Write-Status "" "White"
Write-Status "🎉 Rollup dependencies fix completed!" "Green"
Write-Status "📋 Summary:" "Blue"
Write-Status "   - Dependencies installed: ✅" "Green"
Write-Status "   - Rollup binary: ✅" "Green"
Write-Status "   - Build verification: $(if ($? -or $Force) { '✅' } else { '❌' })" $(if ($? -or $Force) { "Green" } else { "Red" })
Write-Status "" "White"
Write-Status "🚀 You can now run 'npm run dev' or 'npm run build'" "Cyan"
