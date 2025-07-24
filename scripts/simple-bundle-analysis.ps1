# Simple Bundle Size Analysis
Write-Host "Starting bundle size analysis..." -ForegroundColor Cyan

# Build for production
Write-Host "Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful" -ForegroundColor Green
    
    $distPath = "dist"
    if (Test-Path $distPath) {
        $totalSize = (Get-ChildItem -Path $distPath -Recurse | Measure-Object -Property Length -Sum).Sum
        $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
        
        Write-Host "Build Analysis:" -ForegroundColor Cyan
        Write-Host "  Total size: $totalSizeMB MB" -ForegroundColor White
        
        # JavaScript files
        $jsFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.js" | Sort-Object Length -Descending
        Write-Host "  JavaScript files:" -ForegroundColor Yellow
        foreach ($file in $jsFiles) {
            $sizeMB = [math]::Round($file.Length / 1MB, 2)
            Write-Host "    $($file.Name): $sizeMB MB" -ForegroundColor White
        }
        
        # Performance targets
        Write-Host "Performance Targets:" -ForegroundColor Cyan
        $targetMet = if ($totalSizeMB -lt 2) { "Green" } else { "Red" }
        Write-Host "  Total size under 2MB: $($totalSizeMB -lt 2)" -ForegroundColor $targetMet
    }
}

Write-Host "Analysis complete!" -ForegroundColor Green
