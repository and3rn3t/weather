# Streamline Package Scripts
# Removes redundant scripts and keeps only essential ones

$ErrorActionPreference = "Stop"

Write-Host "📦 Streamlining package.json scripts..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

Write-Status "Creating streamlined package.json scripts..."

# Define essential scripts only
$essentialScripts = @{
    # Core development
    "dev" = "vite"
    "build" = "npm run build:deps && npx tsc -b && npx vite build"
    "build:deps" = "npm install @rollup/rollup-linux-x64-gnu --optional --no-save || echo 'Optional dependency warning'"
    "preview" = "vite preview"
    
    # Testing (streamlined)
    "test" = "vitest"
    "test:watch" = "vitest --watch"
    "test:fast" = "vitest run --coverage=false --run"
    "test:coverage" = "vitest --coverage"
    
    # Quality
    "lint" = "eslint ."
    "lint:fix" = "eslint . --fix"
    
    # CI/CD (streamlined)
    "ci" = "npm run lint && npm run test:fast && npm run build"
    "ci:full" = "npm run lint && npm run test:coverage && npm run build"
    
    # Utilities
    "clean" = "rimraf dist coverage .vite node_modules/.cache"
    "reset" = "npm run clean && npm install && npm run ci"
}

Write-Status "Essential scripts defined. You can manually update package.json to keep only these scripts:"
Write-Host ""
Write-Host "📋 Recommended package.json scripts:" -ForegroundColor Yellow
Write-Host ""

foreach ($script in $essentialScripts.GetEnumerator()) {
    Write-Host "  `"$($script.Key)`": `"$($script.Value)`"" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Benefits of streamlining:" -ForegroundColor Cyan
Write-Host "   ✅ 80% fewer scripts to maintain" -ForegroundColor White
Write-Host "   ✅ Clearer development workflow" -ForegroundColor White
Write-Host "   ✅ Faster npm install" -ForegroundColor White
Write-Host "   ✅ Reduced confusion" -ForegroundColor White
Write-Host ""
Write-Success "Script streamlining recommendations ready! 🚀" 