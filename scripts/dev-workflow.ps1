# Development Workflow Helper
# Streamlines common development tasks and ensures quality

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start', 'check', 'fix', 'test', 'build', 'deploy', 'reset', 'analyze')]
    [string]$Command,
    
    [switch]$Fast,     # Skip some checks for faster execution
    [switch]$Verbose,  # Enable verbose output
    [switch]$CI        # CI mode
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param($Message, $Color = "Cyan")
    Write-Host "🔄 $Message" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check Node.js version
    $nodeVersion = node --version
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$Matches[1]
        if ($majorVersion -lt 18) {
            Write-Error "Node.js 18+ required. Current: $nodeVersion"
            exit 1
        }
    }
    
    # Check if dependencies are installed
    if (-not (Test-Path "node_modules")) {
        Write-Warning "Dependencies not installed. Running npm install..."
        npm install
    }
    
    Write-Success "Prerequisites checked"
}

function Invoke-QualityCheck {
    param([switch]$Fix)
    
    Write-Step "Running quality checks..."
    
    # TypeScript compilation check
    Write-Step "Checking TypeScript compilation..."
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript compilation failed:"
        Write-Host $tscResult -ForegroundColor Red
        return $false
    }
    
    # Linting
    Write-Step "Running ESLint..."
    if ($Fix) {
        npm run lint:fix
    } else {
        npm run lint
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed"
        return $false
    }
    
    Write-Success "Quality checks passed"
    return $true
}

function Invoke-TestSuite {
    param([switch]$Coverage, [switch]$Watch)
    
    Write-Step "Running test suite..."
    
    if ($Watch) {
        npm run test:watch
    } elseif ($Coverage) {
        npm run test:coverage
    } else {
        npm test
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        return $false
    }
    
    Write-Success "All tests passed"
    return $true
}

function Invoke-Build {
    param([switch]$Production)
    
    Write-Step "Building application..."
    
    if ($Production) {
        npm run build:production
    } else {
        npm run build
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        return $false
    }
    
    Write-Success "Build completed successfully"
    return $true
}

function Invoke-BundleAnalysis {
    Write-Step "Analyzing bundle..."
    
    if (Test-Path "scripts\enhanced-bundle-analysis.ps1") {
        & "scripts\enhanced-bundle-analysis.ps1" -CI:$CI
    } else {
        npm run analyze:size
    }
    
    return $LASTEXITCODE -eq 0
}

function Reset-Environment {
    Write-Step "Resetting development environment..."
    
    # Clean build artifacts
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Step "Cleaned dist folder"
    }
    
    if (Test-Path "coverage") {
        Remove-Item -Recurse -Force "coverage"
        Write-Step "Cleaned coverage folder"
    }
    
    # Clean cache
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache"
        Write-Step "Cleaned node_modules cache"
    }
    
    if (Test-Path ".vite") {
        Remove-Item -Recurse -Force ".vite"
        Write-Step "Cleaned Vite cache"
    }
    
    Write-Success "Environment reset complete"
}

# Main execution
Write-Host "🚀 Weather App Development Workflow" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Gray

switch ($Command) {
    'start' {
        Test-Prerequisites
        if (-not $Fast) {
            $checkPassed = Invoke-QualityCheck
            if (-not $checkPassed -and -not $CI) {
                Write-Warning "Quality checks failed. Starting anyway..."
            }
        }
        Write-Step "Starting development server..."
        npm run dev
    }
    
    'check' {
        Test-Prerequisites
        $success = Invoke-QualityCheck
        if (-not $success) { exit 1 }
    }
    
    'fix' {
        Test-Prerequisites
        $success = Invoke-QualityCheck -Fix
        if (-not $success) { exit 1 }
    }
    
    'test' {
        Test-Prerequisites
        $success = Invoke-TestSuite -Coverage:(!$Fast)
        if (-not $success) { exit 1 }
    }
    
    'build' {
        Test-Prerequisites
        
        if (-not $Fast) {
            $checkPassed = Invoke-QualityCheck
            if (-not $checkPassed) { exit 1 }
            
            $testPassed = Invoke-TestSuite -Coverage
            if (-not $testPassed) { exit 1 }
        }
        
        $buildPassed = Invoke-Build -Production:$CI
        if (-not $buildPassed) { exit 1 }
        
        if (-not $Fast) {
            $analysisPassed = Invoke-BundleAnalysis
            if (-not $analysisPassed) { exit 1 }
        }
    }
    
    'deploy' {
        Test-Prerequisites
        
        # Full quality assurance
        $checkPassed = Invoke-QualityCheck
        if (-not $checkPassed) { exit 1 }
        
        $testPassed = Invoke-TestSuite -Coverage
        if (-not $testPassed) { exit 1 }
        
        $buildPassed = Invoke-Build -Production
        if (-not $buildPassed) { exit 1 }
        
        $analysisPassed = Invoke-BundleAnalysis
        if (-not $analysisPassed) { exit 1 }
        
        Write-Step "Ready for deployment!"
        Write-Host "Run 'npm run deploy:production' to deploy" -ForegroundColor Yellow
    }
    
    'reset' {
        Reset-Environment
        Test-Prerequisites
    }
    
    'analyze' {
        Test-Prerequisites
        $buildPassed = Invoke-Build
        if (-not $buildPassed) { exit 1 }
        $analysisPassed = Invoke-BundleAnalysis
        if (-not $analysisPassed) { exit 1 }
    }
}

Write-Success "Workflow completed successfully!"
