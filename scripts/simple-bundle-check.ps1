# Simple Bundle Analysis for CI/CD
param(
    [switch]$CI
)

Write-Host "Bundle Analysis Starting..." -ForegroundColor Cyan

# Check dist folder
if (-not (Test-Path "dist")) {
    Write-Host "ERROR: dist folder not found" -ForegroundColor Red
    exit 1
}

# Get JavaScript files
$jsFiles = Get-ChildItem -Path "dist/assets" -Filter "*.js" -ErrorAction SilentlyContinue
$cssFiles = Get-ChildItem -Path "dist" -Filter "*.css" -Recurse -ErrorAction SilentlyContinue

if ($jsFiles.Count -eq 0) {
    Write-Host "ERROR: No JavaScript files found" -ForegroundColor Red
    exit 1
}

# Calculate sizes
$totalJsSize = 0
foreach ($file in $jsFiles) {
    $totalJsSize += $file.Length
}

$totalCssSize = 0
foreach ($file in $cssFiles) {
    $totalCssSize += $file.Length
}

$totalJsSizeKB = [math]::Round($totalJsSize / 1024, 2)
$totalCssSizeKB = [math]::Round($totalCssSize / 1024, 2)
$totalSizeKB = $totalJsSizeKB + $totalCssSizeKB

Write-Host "Bundle Analysis Results:" -ForegroundColor Green
Write-Host "  JavaScript: $totalJsSizeKB KB" -ForegroundColor White
Write-Host "  CSS: $totalCssSizeKB KB" -ForegroundColor White  
Write-Host "  Total: $totalSizeKB KB" -ForegroundColor White
Write-Host "  Chunks: $($jsFiles.Count)" -ForegroundColor White

# Performance check
$maxSize = 500
if ($totalSizeKB -le $maxSize) {
    Write-Host "✅ Performance target met!" -ForegroundColor Green
    $success = $true
} else {
    Write-Host "⚠️  Bundle exceeds $maxSize KB target" -ForegroundColor Yellow
    $success = $false
}

# List chunks
Write-Host "JavaScript Chunks:" -ForegroundColor Cyan
foreach ($file in ($jsFiles | Sort-Object Length -Descending)) {
    $sizeKB = [math]::Round($file.Length / 1024, 2)
    Write-Host "  $($file.Name): $sizeKB KB" -ForegroundColor White
}

if ($CI) {
    $report = @{
        javascript_kb = $totalJsSizeKB
        css_kb = $totalCssSizeKB
        total_kb = $totalSizeKB
        chunk_count = $jsFiles.Count
        performance_passed = $success
    }
    
    $report | ConvertTo-Json | Out-File "bundle-analysis.json"
    Write-Host "Report saved to bundle-analysis.json" -ForegroundColor Green
    
    if (-not $success) {
        exit 1
    }
}

Write-Host "Analysis complete!" -ForegroundColor Cyan
