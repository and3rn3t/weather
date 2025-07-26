# Simple Bundle Analysis Script
# Enhanced PowerShell compatibility and error handling

param(
    [switch]$CI,           # CI mode - generates JSON report and sets exit codes
    [int]$Threshold = 500  # Bundle size threshold in KB
)

Write-Host "🔍 Bundle Analysis" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Gray

# Performance targets (in KB)
$targets = @{
    'total_max' = 500
    'main_max' = 400
    'vendor_max' = 150
    'chunk_max' = 100
    'css_max' = 50
}

# Helper function to get file size in KB
function Get-FileSizeKB {
    param([string]$Path)
    if (Test-Path $Path) {
        return [math]::Round((Get-Item $Path).Length / 1KB, 2)
    }
    return 0
}

# Helper function to estimate gzip size
function Get-GzipSizeKB {
    param([string]$Path)
    if (Test-Path $Path) {
        $originalSize = (Get-Item $Path).Length
        return [math]::Round($originalSize * 0.3 / 1KB, 2)
    }
    return 0
}

# Check if dist folder exists
$distPath = "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "❌ Dist folder not found. Run npm run build first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Analyzing build output..." -ForegroundColor Yellow

# Get all files and calculate sizes
$allFiles = Get-ChildItem -Path $distPath -Recurse -File
$totalSizeBytes = ($allFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeKB = [math]::Round($totalSizeBytes / 1KB, 2)

# Analyze JavaScript files
$jsFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.js" -ErrorAction SilentlyContinue
$jsSizeBytes = ($jsFiles | Measure-Object -Property Length -Sum).Sum
$jsSizeKB = [math]::Round($jsSizeBytes / 1KB, 2)

# Find main bundle (largest JS file)
$mainBundle = $jsFiles | Sort-Object Length -Descending | Select-Object -First 1
$mainSizeKB = if ($mainBundle) { Get-FileSizeKB $mainBundle.FullName } else { 0 }

# Find vendor bundles
$vendorBundles = $jsFiles | Where-Object { $_.Name -like "*vendor*" }
$vendorSizeBytes = ($vendorBundles | Measure-Object -Property Length -Sum).Sum
$vendorSizeKB = [math]::Round($vendorSizeBytes / 1KB, 2)

# Analyze CSS files  
$cssFiles = Get-ChildItem -Path "$distPath" -Filter "*.css" -Recurse -ErrorAction SilentlyContinue
$cssSizeBytes = ($cssFiles | Measure-Object -Property Length -Sum).Sum
$cssSizeKB = [math]::Round($cssSizeBytes / 1KB, 2)

# Estimate gzipped total
$gzippedSizeKB = [math]::Round($totalSizeKB * 0.3, 2)

# Create analysis results
$analysis = @{
    'total' = $totalSizeKB
    'main' = $mainSizeKB
    'vendor' = $vendorSizeKB
    'js_total' = $jsSizeKB
    'css' = $cssSizeKB
    'gzipped' = $gzippedSizeKB
    'file_count' = $allFiles.Count
    'js_chunks' = $jsFiles.Count
}

# Display results
Write-Host ""
Write-Host "📊 Bundle Analysis Results:" -ForegroundColor Cyan
Write-Host "  Total size: $($analysis.total) KB" -ForegroundColor White
Write-Host "  Main bundle: $($analysis.main) KB" -ForegroundColor White
Write-Host "  Vendor bundles: $($analysis.vendor) KB" -ForegroundColor White
Write-Host "  JavaScript total: $($analysis.js_total) KB" -ForegroundColor White
Write-Host "  CSS files: $($analysis.css) KB" -ForegroundColor White
Write-Host "  Estimated gzipped: $($analysis.gzipped) KB" -ForegroundColor White
Write-Host "  File count: $($analysis.file_count)" -ForegroundColor White
Write-Host "  JS chunks: $($analysis.js_chunks)" -ForegroundColor White
Write-Host ""

# Performance check
$violations = @()
if ($analysis.total -gt $targets.total_max) {
    $violations += "Total size $($analysis.total) KB exceeds limit $($targets.total_max) KB"
}
if ($analysis.main -gt $targets.main_max) {
    $violations += "Main bundle $($analysis.main) KB exceeds limit $($targets.main_max) KB"
}
if ($analysis.vendor -gt $targets.vendor_max) {
    $violations += "Vendor bundles $($analysis.vendor) KB exceed limit $($targets.vendor_max) KB"
}
if ($analysis.css -gt $targets.css_max) {
    $violations += "CSS files $($analysis.css) KB exceed limit $($targets.css_max) KB"
}

# Display performance results
if ($violations.Count -eq 0) {
    Write-Host "✅ All performance targets met!" -ForegroundColor Green
    $performancePassed = $true
} else {
    Write-Host "⚠️  Performance violations detected:" -ForegroundColor Yellow
    foreach ($violation in $violations) {
        Write-Host "  • $violation" -ForegroundColor Red
    }
    $performancePassed = $false
}

# Show individual chunks
Write-Host ""
Write-Host "📁 JavaScript Chunks:" -ForegroundColor Cyan
foreach ($file in ($jsFiles | Sort-Object Length -Descending)) {
    $sizeKB = Get-FileSizeKB $file.FullName
    $gzippedKB = Get-GzipSizeKB $file.FullName
    $status = if ($sizeKB -le $targets.chunk_max) { "✅" } else { "⚠️" }
    Write-Host "  $status $($file.Name): $sizeKB KB (~$gzippedKB KB gzipped)" -ForegroundColor White
}

# CI/CD Integration
if ($CI) {
    $reportPath = "bundle-analysis.json"
    $report = @{
        'timestamp' = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        'analysis' = $analysis
        'performance_passed' = $performancePassed
        'violations' = $violations
        'targets' = $targets
    }
    
    $report | ConvertTo-Json -Depth 3 | Out-File $reportPath -Encoding UTF8
    Write-Host ""
    Write-Host "📄 Report saved to $reportPath" -ForegroundColor Green
    
    # Exit with error code if performance violations
    if (-not $performancePassed) {
        Write-Host "❌ CI: Performance targets not met" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ CI: All performance targets met" -ForegroundColor Green
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
if ($violations.Count -eq 0) {
    Write-Host "  • Bundle optimization is excellent! 🚀" -ForegroundColor Green
}

Write-Host ""
Write-Host "Bundle analysis complete!" -ForegroundColor Cyan
