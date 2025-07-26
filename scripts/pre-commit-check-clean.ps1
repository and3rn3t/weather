# Pre-commit Quality Gate
# Runs fast quality checks before allowing commits

Write-Host "Pre-commit Quality Gate" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Gray

$ErrorActionPreference = "Stop"

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check for staged files
$stagedFiles = git diff --cached --name-only
if ($stagedFiles.Count -eq 0) {
    Write-Host "No staged files found. Skipping pre-commit checks." -ForegroundColor Blue
    exit 0
}

Write-Host "Checking $($stagedFiles.Count) staged files..." -ForegroundColor Blue
Write-Host ""

# Quick TypeScript check (fastest first)
Write-Host "TypeScript compilation..." -ForegroundColor Yellow
npx tsc --noEmit --pretty
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript compilation failed" -ForegroundColor Red
    exit 1
}

# Quick lint check
Write-Host "ESLint check..." -ForegroundColor Yellow
npm run lint --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "Lint issues detected. Run 'npm run lint:fix' to fix automatically." -ForegroundColor Red
    exit 1
}

# Quick test run (no coverage to save time)
Write-Host "Quick test run..." -ForegroundColor Yellow
npm test -- --run --reporter=basic 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failing. Please fix before committing." -ForegroundColor Red
    exit 1
}

# Check for common issues
$tsFiles = $stagedFiles | Where-Object { $_ -match '\.(ts|tsx)$' -and $_ -notmatch '\.(test|spec)\.' }
if ($tsFiles) {
    $consoleLogFound = $false
    foreach ($file in $tsFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match 'console\.(log|debug|info)') {
                if (-not $consoleLogFound) {
                    Write-Host "console.log statements detected in:" -ForegroundColor Yellow
                    $consoleLogFound = $true
                }
                Write-Host "  $file" -ForegroundColor Yellow
            }
        }
    }
    if ($consoleLogFound) {
        Write-Host "Consider removing console statements before committing" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "All pre-commit checks passed!" -ForegroundColor Green
Write-Host "Ready to commit!" -ForegroundColor Cyan
