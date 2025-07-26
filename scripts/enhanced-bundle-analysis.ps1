# Enhanced Bundle Analysis and Performance Monitoring
# Provides detailed analysis with performance targets and CI/CD integration

param(
    [switch]$CI,           # CI mode - generates JSON report and sets exit codes
    [switch]$Watch,        # Watch mode - continuous monitoring during development
    [int]$Threshold = 500  # Bundle size threshold in KB
)

Write-Host "🔍 Enhanced Bundle Analysis" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

# Performance targets (in KB)
$targets = @{
    'total_max' = 500
    'main_max' = 400
    'vendor_max' = 150
    'chunk_max' = 100
    'css_max' = 50
    'gzipped_max' = 150
}

function Get-FileSize {
    param($Path)
    if (Test-Path $Path) {
        return [math]::Round((Get-Item $Path).Length / 1KB, 2)
    }
    return 0
}

function Get-GzipSize {
    param($Path)
    if (Test-Path $Path) {
        # Estimate gzip size (roughly 30% of original for minified JS)
        $originalSize = (Get-Item $Path).Length
        return [math]::Round($originalSize * 0.3 / 1KB, 2)
    }
    return 0
}

function Test-Performance {
    param($Analysis)
    
    $results = @{
        'passed' = $true
        'violations' = @()
    }
    
    foreach ($target in $targets.GetEnumerator()) {
        $actualValue = $Analysis[$target.Key.Replace('_max', '')]
        if ($actualValue -gt $target.Value) {
            $results.passed = $false
            $results.violations += @{
                'metric' = $target.Key
                'expected' = $target.Value
                'actual' = $actualValue
                'difference' = $actualValue - $target.Value
            }
        }
    }
    
    return $results
}

# Build the project
Write-Host "📦 Building production bundle..." -ForegroundColor Yellow
$buildStart = Get-Date
npm run build:production 2>&1 | Out-Null
$buildTime = (Get-Date) - $buildStart

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed in $([math]::Round($buildTime.TotalSeconds, 2))s" -ForegroundColor Green

# Analyze build output
$distPath = "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "❌ Dist folder not found" -ForegroundColor Red
    exit 1
}

# Get all files
$allFiles = Get-ChildItem -Path $distPath -Recurse -File
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum / 1KB

# Analyze by type
$jsFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.js" -ErrorAction SilentlyContinue | Sort-Object Length -Descending
$cssFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.css" -ErrorAction SilentlyContinue
$imageFiles = @()
$imageFiles += Get-ChildItem -Path $distPath -Filter "*.png" -Recurse -ErrorAction SilentlyContinue
$imageFiles += Get-ChildItem -Path $distPath -Filter "*.jpg" -Recurse -ErrorAction SilentlyContinue
$imageFiles += Get-ChildItem -Path $distPath -Filter "*.svg" -Recurse -ErrorAction SilentlyContinue
$imageFiles += Get-ChildItem -Path $distPath -Filter "*.ico" -Recurse -ErrorAction SilentlyContinue

# Calculate sizes
$jsSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum / 1KB
$cssSize = ($cssFiles | Measure-Object -Property Length -Sum).Sum / 1KB
$imageSize = ($imageFiles | Measure-Object -Property Length -Sum).Sum / 1KB

# Estimate gzipped sizes
$gzippedTotal = $totalSize * 0.3

# Main bundle analysis
$mainBundle = $jsFiles | Where-Object { $_.Name -like "*index*" } | Select-Object -First 1
$mainSize = if ($mainBundle) { Get-FileSize $mainBundle.FullName } else { 0 }

$vendorBundle = $jsFiles | Where-Object { $_.Name -like "*vendor*" }
$vendorSize = ($vendorBundle | Measure-Object -Property Length -Sum).Sum / 1KB

# Create analysis object
$analysis = @{
    'total' = [math]::Round($totalSize, 2)
    'main' = $mainSize
    'vendor' = [math]::Round($vendorSize, 2)
    'css' = [math]::Round($cssSize, 2)
    'images' = [math]::Round($imageSize, 2)
    'gzipped' = [math]::Round($gzippedTotal, 2)
    'build_time' = [math]::Round($buildTime.TotalSeconds, 2)
    'file_count' = $allFiles.Count
    'js_chunks' = $jsFiles.Count
}

# Display results
Write-Host "📊 Bundle Analysis Results:" -ForegroundColor Cyan
Write-Host "  Total size: $($analysis.total) KB" -ForegroundColor White
Write-Host "  Main bundle: $($analysis.main) KB" -ForegroundColor White  
Write-Host "  Vendor bundles: $($analysis.vendor) KB" -ForegroundColor White
Write-Host "  CSS files: $($analysis.css) KB" -ForegroundColor White
Write-Host "  Images: $($analysis.images) KB" -ForegroundColor White
Write-Host "  Estimated gzipped: $($analysis.gzipped) KB" -ForegroundColor White
Write-Host ""

# Performance assessment
$performance = Test-Performance $analysis
if ($performance.passed) {
    Write-Host "✅ All performance targets met!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Performance violations detected:" -ForegroundColor Yellow
    foreach ($violation in $performance.violations) {
        Write-Host "  $($violation.metric): $($violation.actual) KB (limit: $($violation.expected) KB, over by $($violation.difference) KB)" -ForegroundColor Red
    }
}

# Detailed chunk analysis
Write-Host "📁 JavaScript Chunks:" -ForegroundColor Cyan
foreach ($file in $jsFiles) {
    $size = Get-FileSize $file.FullName
    $gzipped = Get-GzipSize $file.FullName
    $status = if ($size -le $targets.chunk_max) { "✅" } else { "⚠️" }
    Write-Host "  $status $($file.Name): $size KB (~$gzipped KB gzipped)" -ForegroundColor White
}

# CI/CD Integration
if ($CI) {
    $reportPath = "bundle-analysis.json"
    $report = @{
        'timestamp' = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        'analysis' = $analysis
        'performance' = $performance
        'targets' = $targets
    }
    
    $report | ConvertTo-Json -Depth 3 | Out-File $reportPath
    Write-Host "📄 Report saved to $reportPath" -ForegroundColor Green
    
    # Exit with error code if performance violations
    if (-not $performance.passed) {
        Write-Host "❌ CI: Performance targets not met" -ForegroundColor Red
        exit 1
    }
}

# Recommendations
Write-Host ""
Write-Host "💡 Optimization Recommendations:" -ForegroundColor Cyan
if ($analysis.main -gt $targets.main_max) {
    Write-Host "  • Consider code splitting for main bundle" -ForegroundColor Yellow
}
if ($analysis.vendor -gt $targets.vendor_max) {
    Write-Host "  • Review vendor dependencies and consider tree shaking" -ForegroundColor Yellow
}
if ($analysis.total -gt $targets.total_max) {
    Write-Host "  • Overall bundle size exceeds target - review all assets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Performance Score: $(if ($performance.passed) { '100%' } else { "$([math]::Round((($targets.Count - $performance.violations.Count) / $targets.Count) * 100))%" })" -ForegroundColor $(if ($performance.passed) { 'Green' } else { 'Yellow' })
