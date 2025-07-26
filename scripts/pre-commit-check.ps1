# Pre-commit Quality Check Script
# Runs quick quality checks before committing

Write-Host "🔍 Pre-commit Quality Check" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Gray

# Quick lint check
Write-Host "📝 Running lint check..." -ForegroundColor Yellow
npm run lint --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lint issues detected. Run 'npm run fix' to fix automatically." -ForegroundColor Red
    exit 1
}

# Type check
Write-Host "🔍 Running type check..." -ForegroundColor Yellow
npx tsc --noEmit --pretty
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type errors detected. Please fix before committing." -ForegroundColor Red
    exit 1
}

# Quick test run (no coverage to save time)
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm run test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failing. Please fix before committing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All pre-commit checks passed!" -ForegroundColor Green
Write-Host "Ready to commit!" -ForegroundColor Cyan
