# Build Performance Optimization Script
# Analyzes and optimizes build performance

param(
    [switch]$Analyze,
    [switch]$Clean,
    [switch]$Verbose
)

Write-Host "⚡ Build Performance Optimization" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray

$ErrorActionPreference = "Stop"

function Write-Step {
    param($Message)
    Write-Host "⏳ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param($Message)
    if ($Verbose) {
        Write-Host "ℹ️  $Message" -ForegroundColor Blue
    }
}

# Clean cache if requested
if ($Clean) {
    Write-Step "Cleaning build cache..."
    
    $cacheItems = @(".vite", "node_modules/.cache", "dist", "coverage")
    foreach ($item in $cacheItems) {
        if (Test-Path $item) {
            Remove-Item -Recurse -Force $item
            Write-Info "Removed $item"
        }
    }
    Write-Success "Cache cleaned"
}

# Analyze dependencies
Write-Step "Analyzing dependencies..."
$packageJson = Get-Content "package.json" | ConvertFrom-Json

$depCount = ($packageJson.dependencies | Get-Member -Type NoteProperty).Count
$devDepCount = ($packageJson.devDependencies | Get-Member -Type NoteProperty).Count
$totalDeps = $depCount + $devDepCount

Write-Host "📦 Dependencies:" -ForegroundColor Blue
Write-Host "  Production: $depCount" -ForegroundColor White
Write-Host "  Development: $devDepCount" -ForegroundColor White
Write-Host "  Total: $totalDeps" -ForegroundColor White

if ($totalDeps -gt 150) {
    Write-Host "⚠️  High dependency count may impact build time" -ForegroundColor Yellow
}

# Test build performance
Write-Step "Testing build performance..."

$buildStart = Get-Date
if ($Verbose) {
    npm run build:production
} else {
    npm run build:production 2>&1 | Out-Null
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

$buildTime = (Get-Date) - $buildStart
$buildSeconds = [math]::Round($buildTime.TotalSeconds, 2)

Write-Success "Build completed in ${buildSeconds}s"

# Analyze build output
if (Test-Path "dist") {
    $distSize = (Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $distSizeMB = [math]::Round($distSize / 1MB, 2)
    
    Write-Host "📊 Build Output:" -ForegroundColor Blue
    Write-Host "  Total size: $distSizeMB MB" -ForegroundColor White
    Write-Host "  Build time: ${buildSeconds}s" -ForegroundColor White
    
    # Performance targets
    $targetTime = 10 # seconds
    $targetSize = 2  # MB
    
    if ($buildSeconds -lt $targetTime) {
        Write-Success "Build time within target (< ${targetTime}s)"
    } else {
        Write-Host "⚠️  Build time above target (${buildSeconds}s > ${targetTime}s)" -ForegroundColor Yellow
    }
    
    if ($distSizeMB -lt $targetSize) {
        Write-Success "Build size within target (< ${targetSize}MB)"
    } else {
        Write-Host "⚠️  Build size above target (${distSizeMB}MB > ${targetSize}MB)" -ForegroundColor Yellow
    }
}

# Run detailed analysis if requested
if ($Analyze) {
    Write-Step "Running detailed bundle analysis..."
    npm run analyze:ci
    
    if (Test-Path "bundle-analysis.json") {
        $analysis = Get-Content "bundle-analysis.json" | ConvertFrom-Json
        
        Write-Host "📈 Bundle Analysis:" -ForegroundColor Blue
        Write-Host "  JavaScript: $($analysis.javascript_kb)KB" -ForegroundColor White
        Write-Host "  CSS: $($analysis.css_kb)KB" -ForegroundColor White
        Write-Host "  Status: $($analysis.status)" -ForegroundColor $(if ($analysis.status -eq "PASS") { "Green" } else { "Red" })
        
        if ($analysis.recommendations -and $analysis.recommendations.Count -gt 0) {
            Write-Host "💡 Recommendations:" -ForegroundColor Yellow
            $analysis.recommendations | ForEach-Object {
                Write-Host "  • $_" -ForegroundColor Yellow
            }
        }
    }
}

# Generate optimization recommendations
Write-Host ""
Write-Host "🚀 Optimization Recommendations:" -ForegroundColor Cyan

$recommendations = @()

if ($buildSeconds -gt 5) {
    $recommendations += "Consider enabling persistent cache with npm ci --cache"
}

if ($totalDeps -gt 100) {
    $recommendations += "Audit dependencies: npx depcheck"
}

if ($distSizeMB -gt 1.5) {
    $recommendations += "Enable code splitting for better performance"
}

$recommendations += "Use 'npm run analyze' for detailed bundle analysis"
$recommendations += "Run 'npm run clean' to clear all caches"

$recommendations | ForEach-Object {
    Write-Host "  • $_" -ForegroundColor White
}

Write-Host ""
Write-Success "Build optimization analysis complete!"

# Save performance metrics for tracking
$metrics = @{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    build_time_seconds = $buildSeconds
    build_size_mb = $distSizeMB
    dependency_count = $totalDeps
    node_version = (node --version)
    npm_version = (npm --version)
}

$metrics | ConvertTo-Json | Out-File "build-metrics.json"
Write-Info "Performance metrics saved to build-metrics.json"
