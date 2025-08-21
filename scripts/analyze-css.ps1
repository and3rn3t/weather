#!/usr/bin/env pwsh
# CSS Optimization Script for Weather App
# Run this script to analyze and optimize CSS imports

Write-Host "🎨 CSS Optimization Analysis" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check current CSS file sizes
Write-Host "`n📊 Current CSS File Analysis:" -ForegroundColor Yellow

$stylesPath = "src\styles"
$totalLines = 0
$fileCount = 0

Get-ChildItem "$stylesPath\*.css" | ForEach-Object {
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  $totalLines += $lines
  $fileCount++

  $color = "White"
  if ($lines -gt 500) { $color = "Red" }
  elseif ($lines -gt 200) { $color = "Yellow" }
  else { $color = "Green" }

  Write-Host "  $($_.Name): $lines lines" -ForegroundColor $color
}

Write-Host "`n📈 Summary:" -ForegroundColor Cyan
Write-Host "  Total Files: $fileCount" -ForegroundColor White
Write-Host "  Total Lines: $totalLines" -ForegroundColor White
Write-Host "  Average per file: $([math]::Round($totalLines / $fileCount, 1)) lines" -ForegroundColor White

# Identify potential conflicts
Write-Host "`n🔍 Analyzing CSS Conflicts..." -ForegroundColor Yellow

# Check for duplicate selectors
$duplicateSelectors = @()
$selectorPattern = '\.([\w-]+)\s*\{'
$allSelectors = @{}

Get-ChildItem "$stylesPath\*.css" | ForEach-Object {
  $fileName = $_.Name
  $content = Get-Content $_.FullName -Raw
  $matches = [regex]::Matches($content, $selectorPattern)

  foreach ($match in $matches) {
    $selector = $match.Groups[1].Value
    if ($allSelectors.ContainsKey($selector)) {
      $allSelectors[$selector] += @($fileName)
    }
    else {
      $allSelectors[$selector] = @($fileName)
    }
  }
}

Write-Host "`n⚠️  Potential CSS Conflicts (selectors in multiple files):" -ForegroundColor Red
$conflictCount = 0
$allSelectors.GetEnumerator() | ForEach-Object {
  if ($_.Value.Count -gt 1) {
    $conflictCount++
    Write-Host "  .$($_.Key): found in $($_.Value -join ', ')" -ForegroundColor Yellow
  }
}

if ($conflictCount -eq 0) {
  Write-Host "  ✅ No obvious selector conflicts found!" -ForegroundColor Green
}
else {
  Write-Host "  Found $conflictCount potential conflicts" -ForegroundColor Red
}

# Check import order in index.css
Write-Host "`n📝 Current Import Order in index.css:" -ForegroundColor Cyan
$indexContent = Get-Content "src\index.css"
$imports = $indexContent | Where-Object { $_ -match "@import" }

foreach ($import in $imports) {
  if ($import -match "horror") {
    Write-Host "  $import" -ForegroundColor Magenta
  }
  elseif ($import -match "mobile|layout") {
    Write-Host "  $import" -ForegroundColor Yellow
  }
  elseif ($import -match "iOS26|ios") {
    Write-Host "  $import" -ForegroundColor Blue
  }
  else {
    Write-Host "  $import" -ForegroundColor White
  }
}

# Recommendations
Write-Host "`n💡 Optimization Recommendations:" -ForegroundColor Green

if ($totalLines -gt 6000) {
  Write-Host "  🔴 HIGH PRIORITY: $totalLines total lines suggests significant optimization needed" -ForegroundColor Red
}

$largeFiles = Get-ChildItem "$stylesPath\*.css" | Where-Object {
  (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 500
}

if ($largeFiles.Count -gt 0) {
  Write-Host "  📦 Consider consolidating these large files:" -ForegroundColor Yellow
  $largeFiles | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    Write-Host "    - $($_.Name) ($lines lines)" -ForegroundColor Yellow
  }
}

# Horror theme specific analysis
$horrorFiles = Get-ChildItem "$stylesPath\*horror*.css"
if ($horrorFiles.Count -gt 1) {
  $horrorLines = ($horrorFiles | ForEach-Object {
      (Get-Content $_.FullName | Measure-Object -Line).Lines
    } | Measure-Object -Sum).Sum

  Write-Host "  🎃 Horror theme optimization:" -ForegroundColor Magenta
  Write-Host "    - $($horrorFiles.Count) horror files with $horrorLines total lines" -ForegroundColor Magenta
  Write-Host "    - Recommend consolidating into single horror-theme.css" -ForegroundColor Magenta
}

# Layout fixes analysis
$layoutFiles = Get-ChildItem "$stylesPath\*layout*fix*.css", "$stylesPath\*fix*.css"
if ($layoutFiles.Count -gt 1) {
  Write-Host "  🔧 Layout fixes optimization:" -ForegroundColor Blue
  Write-Host "    - $($layoutFiles.Count) separate fix files detected" -ForegroundColor Blue
  Write-Host "    - Consider merging into core layout files" -ForegroundColor Blue
}

Write-Host "`n🚀 Next Steps:" -ForegroundColor Green
Write-Host "  1. Backup current styles: cp -r src/styles src/styles-backup" -ForegroundColor White
Write-Host "  2. Start with horror theme consolidation (highest impact)" -ForegroundColor White
Write-Host "  3. Merge layout fix files into core responsive layout" -ForegroundColor White
Write-Host "  4. Organize remaining files by component type" -ForegroundColor White
Write-Host "  5. Test thoroughly across all themes and devices" -ForegroundColor White

Write-Host "`n✨ Expected Benefits:" -ForegroundColor Cyan
$estimatedReduction = [math]::Round($totalLines * 0.3)
$estimatedFiles = [math]::Round($fileCount * 0.5)
Write-Host "  - Reduce CSS by ~$estimatedReduction lines (30%)" -ForegroundColor Green
Write-Host "  - Reduce file count to ~$estimatedFiles files (50%)" -ForegroundColor Green
Write-Host "  - Eliminate selector conflicts" -ForegroundColor Green
Write-Host "  - Improve build performance" -ForegroundColor Green

Write-Host "`n📋 Ready to start optimization? (y/n)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "y" -or $response -eq "yes") {
  Write-Host "`n🔄 Creating backup..." -ForegroundColor Blue
  Copy-Item -Path "src\styles" -Destination "src\styles-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Recurse
  Write-Host "✅ Backup created! Safe to proceed with optimization." -ForegroundColor Green
}
else {
  Write-Host "📝 Run this script again when ready to optimize." -ForegroundColor Yellow
}
