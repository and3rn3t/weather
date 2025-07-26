# Quick Optimization Test Script
# Tests the key optimizations without running full lint/test suite

Write-Host "🚀 Testing Application Lifecycle Optimizations" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Gray

# Test 1: Enhanced Build with Chunking
Write-Host "📦 Testing optimized build process..." -ForegroundColor Yellow
$buildStart = Get-Date
npm run build:production --silent
$buildTime = (Get-Date) - $buildStart

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Optimized build completed in $([math]::Round($buildTime.TotalSeconds, 2))s" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Test 2: Analyze Bundle Structure
Write-Host "📊 Analyzing optimized bundle structure..." -ForegroundColor Yellow
$distPath = "dist"

if (Test-Path $distPath) {
    $allFiles = Get-ChildItem -Path $distPath -Recurse -File
    $totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum / 1KB
    
    # Check for optimized chunking
    $jsFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.js" -ErrorAction SilentlyContinue
    $chunkCount = $jsFiles.Count
    
    Write-Host "Bundle Analysis:" -ForegroundColor Cyan
    Write-Host "  Total size: $([math]::Round($totalSize, 2)) KB" -ForegroundColor White
    Write-Host "  JavaScript chunks: $chunkCount" -ForegroundColor White
    
    # Look for specific optimized chunks
    $hasReactChunk = $jsFiles | Where-Object { $_.Name -like "*react-vendor*" }
    $hasCapacitorChunk = $jsFiles | Where-Object { $_.Name -like "*capacitor-vendor*" }
    $hasModernUIChunk = $jsFiles | Where-Object { $_.Name -like "*modern-ui*" }
    $hasHapticChunk = $jsFiles | Where-Object { $_.Name -like "*haptic-features*" }
    
    Write-Host "Optimized Chunks:" -ForegroundColor Cyan
    Write-Host "  React vendor chunk: $(if ($hasReactChunk) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasReactChunk) { 'Green' } else { 'Red' })
    Write-Host "  Capacitor vendor chunk: $(if ($hasCapacitorChunk) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasCapacitorChunk) { 'Green' } else { 'Red' })
    Write-Host "  Modern UI chunk: $(if ($hasModernUIChunk) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasModernUIChunk) { 'Green' } else { 'Red' })
    Write-Host "  Haptic features chunk: $(if ($hasHapticChunk) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasHapticChunk) { 'Green' } else { 'Red' })
    
    # Check CSS organization
    $cssFiles = Get-ChildItem -Path "$distPath/styles" -Filter "*.css" -ErrorAction SilentlyContinue
    if ($cssFiles) {
        Write-Host "  CSS organization: ✅ (in styles/ folder)" -ForegroundColor Green
    } else {
        $cssFiles = Get-ChildItem -Path "$distPath/assets" -Filter "*.css" -ErrorAction SilentlyContinue
        Write-Host "  CSS organization: ⚠️  (in assets/ folder)" -ForegroundColor Yellow
    }
}

# Test 3: Performance Targets
Write-Host "🎯 Checking performance targets..." -ForegroundColor Yellow

$targets = @{
    'Total' = 500  # KB
    'Main Bundle' = 150  # KB (after chunking optimization)
    'Chunk Count' = 8   # Minimum chunks for good optimization
}

$mainBundle = $jsFiles | Where-Object { $_.Name -like "*index*" } | Select-Object -First 1
$mainSize = if ($mainBundle) { [math]::Round($mainBundle.Length / 1KB, 2) } else { 0 }

$results = @{
    'Total' = @{
        'actual' = [math]::Round($totalSize, 2)
        'target' = $targets['Total']
        'passed' = $totalSize -le $targets['Total']
    }
    'Main Bundle' = @{
        'actual' = $mainSize
        'target' = $targets['Main Bundle']
        'passed' = $mainSize -le $targets['Main Bundle']
    }
    'Chunk Count' = @{
        'actual' = $chunkCount
        'target' = $targets['Chunk Count']
        'passed' = $chunkCount -ge $targets['Chunk Count']
    }
}

Write-Host "Performance Results:" -ForegroundColor Cyan
foreach ($result in $results.GetEnumerator()) {
    $status = if ($result.Value.passed) { "✅" } else { "❌" }
    $color = if ($result.Value.passed) { "Green" } else { "Red" }
    Write-Host "  $status $($result.Key): $($result.Value.actual) (target: $($result.Value.target))" -ForegroundColor $color
}

# Test 4: NPM Scripts Functionality
Write-Host "⚙️  Testing enhanced npm scripts..." -ForegroundColor Yellow

$scriptsToTest = @(
    @{ name = "clean"; description = "Cleaning build artifacts" },
    @{ name = "check"; description = "TypeScript compilation check" }
)

foreach ($script in $scriptsToTest) {
    Write-Host "  Testing '$($script.name)' - $($script.description)..." -ForegroundColor Gray
    
    # Run the script silently
    $output = npm run $script.name --silent 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ $($script.name) script works" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  $($script.name) script issues (may be expected)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "📋 Optimization Summary:" -ForegroundColor Cyan

$totalOptimizations = 0
$passedOptimizations = 0

# Count chunk optimizations
$chunkOptimizations = @($hasReactChunk, $hasCapacitorChunk, $hasModernUIChunk, $hasHapticChunk)
$passedChunks = ($chunkOptimizations | Where-Object { $_ }).Count
$totalOptimizations += 4
$passedOptimizations += $passedChunks

# Count performance targets
foreach ($result in $results.Values) {
    $totalOptimizations++
    if ($result.passed) {
        $passedOptimizations++
    }
}

$optimizationScore = [math]::Round(($passedOptimizations / $totalOptimizations) * 100)

Write-Host "  Optimization Score: $optimizationScore% ($passedOptimizations/$totalOptimizations)" -ForegroundColor $(if ($optimizationScore -ge 80) { 'Green' } elseif ($optimizationScore -ge 60) { 'Yellow' } else { 'Red' })
Write-Host "  Build Time: $([math]::Round($buildTime.TotalSeconds, 2))s" -ForegroundColor White
Write-Host "  Bundle Size: $([math]::Round($totalSize, 2)) KB" -ForegroundColor White
Write-Host "  Chunks Created: $chunkCount" -ForegroundColor White

if ($optimizationScore -ge 80) {
    Write-Host ""
    Write-Host "🎉 Optimizations are working excellently!" -ForegroundColor Green
} elseif ($optimizationScore -ge 60) {
    Write-Host ""
    Write-Host "✅ Optimizations are working well with room for improvement." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️  Some optimizations need attention." -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Optimization test complete!" -ForegroundColor Cyan
