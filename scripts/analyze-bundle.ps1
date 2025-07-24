# Bundle Size Analysis Script
# Analyzes the production build to identify optimization opportunities

Write-Host "🔍 Starting bundle size analysis..." -ForegroundColor Cyan

# Build for production with source maps
Write-Host "📦 Building production bundle..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Get build output size
$distPath = "dist"
if (Test-Path $distPath) {
    $totalSize = (Get-ChildItem -Path $distPath -Recurse | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "📊 Build Analysis:" -ForegroundColor Cyan
    Write-Host "  Total size: $totalSizeMB MB" -ForegroundColor White
    
    # Analyze JavaScript files
    $jsFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.js" | Sort-Object Length -Descending
    Write-Host "  JavaScript files:" -ForegroundColor Yellow
    foreach ($file in $jsFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "    $($file.Name): $sizeMB MB" -ForegroundColor White
    }
    
    # Analyze CSS files
    $cssFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.css" | Sort-Object Length -Descending
    if ($cssFiles.Count -gt 0) {
        Write-Host "  CSS files:" -ForegroundColor Yellow
        foreach ($file in $cssFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            Write-Host "    $($file.Name): $sizeMB MB" -ForegroundColor White
        }
    }
    
    # Check for large files (> 1MB)
    $largeFiles = Get-ChildItem -Path $distPath -Recurse | Where-Object { $_.Length -gt 1MB } | Sort-Object Length -Descending
    if ($largeFiles.Count -gt 0) {
        Write-Host "⚠️  Large files (>1MB):" -ForegroundColor Red
        foreach ($file in $largeFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
            Write-Host "    ${relativePath}: $sizeMB MB" -ForegroundColor Red
        }
    }
    
    # Recommendations
    Write-Host ""
    Write-Host "Optimization Recommendations:" -ForegroundColor Cyan
    
    if ($totalSizeMB -gt 5) {
        Write-Host "  • Consider code splitting for large bundles" -ForegroundColor Yellow
        Write-Host "  • Implement lazy loading for non-critical components" -ForegroundColor Yellow
    }
    
    if ($totalSizeMB -gt 2) {
        Write-Host "  • Enable tree shaking to remove unused code" -ForegroundColor Yellow
        Write-Host "  • Consider using dynamic imports for large dependencies" -ForegroundColor Yellow
    }
    
    if ($jsFiles.Count -gt 5) {
        Write-Host "  • Consider bundling smaller chunks together" -ForegroundColor Yellow
    }
    
    # Check for common optimization opportunities
    $indexJs = $jsFiles | Where-Object { $_.Name -like "index*" }
    if ($indexJs -and $indexJs.Length -gt 500KB) {
        Write-Host "  • Main bundle is large - consider splitting vendor and app code" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Performance Targets:" -ForegroundColor Cyan
    Write-Host "  • Total size: < 2MB (Current: $totalSizeMB MB)" -ForegroundColor $(if ($totalSizeMB -lt 2) { "Green" } else { "Red" })
    Write-Host "  • Main JS: < 500KB" -ForegroundColor $(if ($jsFiles[0].Length -lt 500KB) { "Green" } else { "Red" })
    Write-Host "  • First Load: < 1MB" -ForegroundColor $(if ($totalSizeMB -lt 1) { "Green" } else { "Yellow" })
    
} else {
    Write-Host "❌ Dist folder not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Bundle analysis complete!" -ForegroundColor Green
