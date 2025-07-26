# Release Preparation Script
# Comprehensive release preparation with quality gates

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("patch", "minor", "major")]
    [string]$Type
)

Write-Host "🚀 Release Preparation" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Gray
Write-Host "Release type: $Type" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean environment
Write-Host "🧹 Cleaning environment..." -ForegroundColor Yellow
npm run clean 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clean environment" -ForegroundColor Red
    exit 1
}

# Step 2: Install fresh dependencies
Write-Host "📦 Installing fresh dependencies..." -ForegroundColor Yellow
npm ci 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Run comprehensive QA
Write-Host "🔍 Running comprehensive quality assurance..." -ForegroundColor Yellow
npm run qa
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Quality assurance failed. Please fix issues before release." -ForegroundColor Red
    exit 1
}

# Step 4: Performance analysis
Write-Host "📊 Running performance analysis..." -ForegroundColor Yellow
npm run analyze:ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Performance targets not met. Please optimize before release." -ForegroundColor Red
    exit 1
}

# Step 5: Security audit
Write-Host "🔒 Running security audit..." -ForegroundColor Yellow
npm audit --audit-level=high
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Security vulnerabilities detected. Consider fixing before release." -ForegroundColor Yellow
    Read-Host "Press Enter to continue or Ctrl+C to abort"
}

# Step 6: Version bump
Write-Host "📝 Bumping version..." -ForegroundColor Yellow
$oldVersion = (Get-Content package.json | ConvertFrom-Json).version
npm version $Type --no-git-tag-version 2>&1 | Out-Null
$newVersion = (Get-Content package.json | ConvertFrom-Json).version

Write-Host "✅ Version updated: $oldVersion → $newVersion" -ForegroundColor Green

# Step 7: Production build test
Write-Host "🏗️  Testing production build..." -ForegroundColor Yellow
npm run build:production 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Production build failed" -ForegroundColor Red
    exit 1
}

# Step 8: Final verification
Write-Host "🔍 Final verification..." -ForegroundColor Yellow
npm run analyze:ci 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Final verification failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Release preparation complete!" -ForegroundColor Green
Write-Host "📦 Version: $newVersion" -ForegroundColor Cyan
Write-Host "🏗️  Production build: Ready" -ForegroundColor Green
Write-Host "🔍 Quality gates: Passed" -ForegroundColor Green
Write-Host "📊 Performance: Within targets" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes: git diff" -ForegroundColor White
Write-Host "2. Commit version: git add . && git commit -m 'chore: release v$newVersion'" -ForegroundColor White
Write-Host "3. Create tag: git tag v$newVersion" -ForegroundColor White
Write-Host "4. Push: git push && git push --tags" -ForegroundColor White
Write-Host "5. Deploy: npm run deploy:production" -ForegroundColor White
