# === PowerShell 7 Performance Optimizations ===
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSStyle.OutputRendering = 'ANSI'
$PSStyle.Progress.View = 'Minimal'

# === Enhanced PSReadLine with FIXED prediction settings ===
Import-Module PSReadLine
Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -PredictionViewStyle InlineView
Set-PSReadLineOption -EditMode Windows
Set-PSReadLineOption -BellStyle None
Set-PSReadLineOption -HistorySearchCursorMovesToEnd

# === GitHub Copilot optimized colors ===
Set-PSReadLineOption -Colors @{
  Command                = 'Cyan'
  Parameter              = 'Gray'
  Operator               = 'DarkGray'
  Variable               = 'Green'
  String                 = 'Yellow'
  Number                 = 'Red'
  Type                   = 'DarkCyan'
  Comment                = 'DarkGreen'
  Keyword                = 'Blue'
  Member                 = 'DarkCyan'
  Emphasis               = 'Magenta'
  Error                  = 'Red'
  Selection              = 'DarkGray'
  InlinePrediction       = 'DarkGray'
  ListPrediction         = 'Yellow'
  ListPredictionSelected = 'DarkBlue'
}

# === Advanced Keyboard Shortcuts ===
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Key 'Ctrl+d' -Function DeleteChar
Set-PSReadLineKeyHandler -Key 'Ctrl+w' -Function BackwardDeleteWord
Set-PSReadLineKeyHandler -Key 'Ctrl+LeftArrow' -Function BackwardWord
Set-PSReadLineKeyHandler -Key 'Ctrl+RightArrow' -Function ForwardWord
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key 'Ctrl+r' -Function ReverseSearchHistory
Set-PSReadLineKeyHandler -Key 'Ctrl+s' -Function ForwardSearchHistory

# === VS Code + GitHub Copilot Integration ===
function Open-VSCode {
  code . --enable-extension github.copilot --enable-extension github.copilot-chat
}
Set-Alias -Name c -Value Open-VSCode

function Open-File-VSCode {
  param([Parameter(Mandatory)][string]$File, [int]$Line = 1)
  if (Test-Path $File) {
    code --goto "$($File):$($Line):1"
  }
  else {
    Write-Host "❌ File not found: $File" -ForegroundColor Red
  }
}
Set-Alias -Name cf -Value Open-File-VSCode

# === WEATHER APP SPECIFIC OPTIMIZATIONS ===
function Open-Component {
  param([Parameter(Mandatory)][string]$ComponentName)
  $possiblePaths = @(
    "src/components/$ComponentName.tsx",
    "src/components/$ComponentName.ts",
    "src/components/modernWeatherUI/$ComponentName.tsx",
    "src/components/mobile/$ComponentName.tsx",
    "src/navigation/$ComponentName.tsx",
    "src/utils/$ComponentName.tsx",
    "src/utils/$ComponentName.ts"
  )
  $found = $false
  foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
      code $path
      Write-Host "✅ Opened $path" -ForegroundColor Green
      $found = $true
      break
    }
  }
  if (-not $found) {
    Write-Host "❌ Component '$ComponentName' not found" -ForegroundColor Red
    Write-Host "🔍 Searching for similar files..." -ForegroundColor Yellow
    Get-ChildItem -Recurse "src" -Name "*$ComponentName*" -ErrorAction SilentlyContinue |
    Select-Object -First 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
  }
}
Set-Alias -Name comp -Value Open-Component

function Open-Weather-Script {
  param([Parameter(Mandatory)][string]$ScriptName)
  $scriptPath = "scripts/$ScriptName"
  $possibleExts = @(".ts", ".js", ".cjs")
  $found = $false

  foreach ($ext in $possibleExts) {
    $fullPath = "$scriptPath$ext"
    if (Test-Path $fullPath) {
      code $fullPath
      Write-Host "✅ Opened $fullPath" -ForegroundColor Green
      $found = $true
      break
    }
  }

  if (-not $found) {
    Write-Host "❌ Script '$ScriptName' not found" -ForegroundColor Red
    Write-Host "📋 Available scripts:" -ForegroundColor Yellow
    Get-ChildItem "scripts" -Name "*.ts", "*.js", "*.cjs" |
    Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
  }
}
Set-Alias -Name script -Value Open-Weather-Script

# === Enhanced Git Integration ===
function Git-Status-Weather {
  Write-Host "🌤️  Weather App - Git Status" -ForegroundColor Cyan
  git status --short --branch --ahead-behind
  Write-Host ""
  $stash = git stash list --oneline 2>$null
  if ($stash) {
    Write-Host "💾 Stashes:" -ForegroundColor Yellow
    $stash | ForEach-Object { Write-Host "   $_" }
  }

  # Show recent weather app specific changes
  $recentFiles = git log --name-only --oneline -5 --pretty=format:"" 2>$null |
  Where-Object { $_ -match "(Weather|Component|Mobile|Theme)" } |
  Select-Object -Unique -First 5
  if ($recentFiles) {
    Write-Host "🔄 Recent weather component changes:" -ForegroundColor Green
    $recentFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
  }
}
Set-Alias -Name gs -Value Git-Status-Weather

function Git-Quick-Commit-Weather {
  param(
    [Parameter(Mandatory)]
    [ValidateSet('feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ui', 'mobile', 'theme', 'weather')]
    [string]$Type,
    [Parameter(Mandatory)][string]$Message
  )
  git add .
  git commit -m "${Type}: ${Message}"
  Write-Host "✅ Committed: $Type - $Message" -ForegroundColor Green
}
Set-Alias -Name qc -Value Git-Quick-Commit-Weather

# === WEATHER APP DEVELOPMENT COMMANDS ===
function Start-Weather-Dev {
  Write-Host "🌤️  Starting Weather App development server..." -ForegroundColor Green
  Write-Host "📱 Mobile-optimized React + TypeScript + Vite" -ForegroundColor Cyan
  npm run dev
}
Set-Alias -Name dev -Value Start-Weather-Dev

function Build-Weather {
  Write-Host "🔨 Building Weather App for production..." -ForegroundColor Blue
  npm run build
}
Set-Alias -Name build -Value Build-Weather

function Test-Weather {
  param([switch]$Fast, [switch]$Coverage, [switch]$Watch)

  if ($Fast) {
    Write-Host "⚡ Running fast tests..." -ForegroundColor Yellow
    npm run test:fast
  }
  elseif ($Coverage) {
    Write-Host "📊 Running tests with coverage..." -ForegroundColor Cyan
    npm run test:coverage
  }
  elseif ($Watch) {
    Write-Host "👀 Running tests in watch mode..." -ForegroundColor Green
    npm run test:watch
  }
  else {
    Write-Host "🧪 Running all tests..." -ForegroundColor Blue
    npm run test
  }
}
Set-Alias -Name test -Value Test-Weather

function Lint-Weather {
  param([switch]$Fix, [switch]$Check)

  if ($Fix) {
    Write-Host "🔧 Running ESLint with auto-fix..." -ForegroundColor Green
    npm run lint:fix
  }
  elseif ($Check) {
    Write-Host "🔍 Running strict lint check (zero warnings)..." -ForegroundColor Yellow
    npm run lint:check
  }
  else {
    Write-Host "📋 Running ESLint..." -ForegroundColor Cyan
    npm run lint
  }
}
Set-Alias -Name lint -Value Lint-Weather

function Format-Weather {
  param([switch]$Check)

  if ($Check) {
    Write-Host "🔍 Checking code formatting..." -ForegroundColor Yellow
    npm run format:check
  }
  else {
    Write-Host "✨ Formatting code with Prettier..." -ForegroundColor Green
    npm run format
  }
}
Set-Alias -Name fmt -Value Format-Weather

function Health-Check-Weather {
  Write-Host "🩺 Running Weather App health check..." -ForegroundColor Cyan
  npm run health
}
Set-Alias -Name health -Value Health-Check-Weather

function Pre-Commit-Weather {
  param([switch]$Fix)

  if ($Fix) {
    Write-Host "🔧 Running pre-commit with auto-fix..." -ForegroundColor Green
    npm run precommit:fix
  }
  else {
    Write-Host "🔍 Running pre-commit quality checks..." -ForegroundColor Yellow
    npm run precommit
  }
}
Set-Alias -Name pc -Value Pre-Commit-Weather

function Fix-Rollup-Deps {
  param([switch]$Clean)

  if ($Clean) {
    Write-Host "🧹 Cleaning and fixing Rollup dependencies..." -ForegroundColor Yellow
    npm run fix:rollup:clean
  }
  else {
    Write-Host "🔧 Fixing Rollup dependencies..." -ForegroundColor Green
    npm run fix:rollup
  }
}
Set-Alias -Name rollup -Value Fix-Rollup-Deps

function Mobile-Deploy-Setup {
  Write-Host "📱 Setting up mobile deployment..." -ForegroundColor Magenta
  npm run mobile:setup
}
Set-Alias -Name mobile -Value Mobile-Deploy-Setup

# === GitHub CLI Integration ===
function GitHub-Create-PR {
  param(
    [string]$Title,
    [string]$Body = "Weather app improvements and optimizations"
  )

  if (-not $Title) {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    $Title = "feat: Weather app updates from $branch"
  }

  gh pr create --title "$Title" --body "$Body" --assignee "@me"
  Write-Host "✅ Pull request created!" -ForegroundColor Green
}
Set-Alias -Name pr -Value GitHub-Create-PR

function GitHub-View-Workflows {
  Write-Host "🔄 GitHub Actions Workflows:" -ForegroundColor Cyan
  gh workflow list
  Write-Host ""
  Write-Host "🏃 Recent runs:" -ForegroundColor Yellow
  gh run list --limit 5
}
Set-Alias -Name workflows -Value GitHub-View-Workflows

function GitHub-Trigger-Deploy {
  Write-Host "🚀 Triggering deployment workflow..." -ForegroundColor Green
  gh workflow run "ci-cd.yml"
  Write-Host "✅ Deployment triggered! Check GitHub Actions for progress." -ForegroundColor Cyan
}
Set-Alias -Name deploy -Value GitHub-Trigger-Deploy

# === Weather App Context Helper ===
function Copy-Weather-Context {
  $context = @"
🌤️ Weather App Project Context:
- Premium weather app with React 19 + TypeScript
- Vite build system with HMR optimization
- iOS 26 design system integration
- Dark/light theme system with animated SVG icons
- Mobile-first responsive design
- OpenMeteo API + Nominatim geocoding (no API keys)
- Current directory: $(Get-Location)
- Git branch: $(git rev-parse --abbrev-ref HEAD 2>$null)
- Modified files: $(git diff --name-only 2>$null | Join-String -Separator ', ')

🧩 Key Components:
$(Get-ChildItem src/components -Name "*.tsx" -ErrorAction SilentlyContinue | Select-Object -First 8 | Join-String -Separator ', ')

🎨 Modern UI Components:
$(Get-ChildItem src/components/modernWeatherUI -Name "*.tsx" -ErrorAction SilentlyContinue | Join-String -Separator ', ')

📱 Mobile Features:
- Pull-to-refresh functionality
- Touch gestures and haptic feedback
- iOS-style navigation and animations
- Responsive design with glassmorphism

🔧 Recent commits:
$(git log --oneline -5 2>$null)

📦 Available Scripts:
$(if (Test-Path "package.json") { (Get-Content "package.json" | ConvertFrom-Json).scripts.PSObject.Properties | Select-Object -First 10 | ForEach-Object { "$($_.Name)" } | Join-String -Separator ', ' })
"@
  $context | Set-Clipboard
  Write-Host "📋 Weather App context copied to clipboard for Copilot Chat!" -ForegroundColor Green
  Write-Host "🤖 Use this context to get better suggestions from GitHub Copilot" -ForegroundColor Cyan
}
Set-Alias -Name ctx -Value Copy-Weather-Context

function Show-Weather-Info {
  Write-Host "🌤️  Premium Weather App - Development Dashboard" -ForegroundColor Magenta
  Write-Host "=" * 65 -ForegroundColor DarkGray

  if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "📦 Package: $($pkg.name) v$($pkg.version)" -ForegroundColor Green
    Write-Host "🎯 Description: $($pkg.description)" -ForegroundColor Cyan

    Write-Host "`n🛠️  Key Development Scripts:" -ForegroundColor Yellow
    $keyScripts = @('dev', 'build', 'test:fast', 'lint:fix', 'format', 'health', 'precommit')
    $pkg.scripts.PSObject.Properties | Where-Object { $_.Name -in $keyScripts } | ForEach-Object {
      Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
    }

    Write-Host "`n🧪 Testing Scripts:" -ForegroundColor Yellow
    $pkg.scripts.PSObject.Properties | Where-Object { $_.Name -like "test*" } | Select-Object -First 5 | ForEach-Object {
      Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
    }

    Write-Host "`n🔧 Utility Scripts:" -ForegroundColor Yellow
    $utilScripts = @('fix:rollup', 'cleanup', 'mobile:setup', 'streamline', 'workflows:cleanup')
    $pkg.scripts.PSObject.Properties | Where-Object { $_.Name -in $utilScripts } | ForEach-Object {
      Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor White
    }
  }

  Write-Host "`n📱 Mobile Features Status:" -ForegroundColor Green
  if (Test-Path "src/utils/usePullToRefresh.ts") { Write-Host "   ✅ Pull-to-refresh" -ForegroundColor Green }
  if (Test-Path "src/utils/hapticHooks.ts") { Write-Host "   ✅ Haptic feedback" -ForegroundColor Green }
  if (Test-Path "src/components/MobileNavigation.tsx") { Write-Host "   ✅ Mobile navigation" -ForegroundColor Green }
  if (Test-Path "src/utils/themeContext.tsx") { Write-Host "   ✅ Theme system" -ForegroundColor Green }

  Write-Host "`n🎨 Design System:" -ForegroundColor Blue
  if (Test-Path "src/components/modernWeatherUI") { Write-Host "   ✅ Modern UI components" -ForegroundColor Green }
  if (Test-Path "src/styles/iOS26DesignSystem.css") { Write-Host "   ✅ iOS 26 design system" -ForegroundColor Green }
  if (Test-Path "src/utils/weatherIcons.tsx") { Write-Host "   ✅ Animated weather icons" -ForegroundColor Green }

  Write-Host ""
}
Set-Alias -Name info -Value Show-Weather-Info

# === Performance Monitoring ===
function Watch-Build-Performance {
  Write-Host "📊 Monitoring Weather App build performance..." -ForegroundColor Cyan
  $lastSize = 0
  while ($true) {
    if (Test-Path "dist") {
      $size = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
      $sizeMB = [math]::Round($size / 1MB, 2)
      if ($size -ne $lastSize) {
        $change = if ($lastSize -gt 0) {
          $diff = $size - $lastSize
          $diffMB = [math]::Round($diff / 1MB, 2)
          if ($diff -gt 0) { " (+$diffMB MB)" } else { " ($diffMB MB)" }
        }
        else { "" }
        $color = if ($change -and $change.Contains('+')) { 'Red' } else { 'Green' }
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] 📦 Bundle: $sizeMB MB$change" -ForegroundColor $color
        $lastSize = $size
      }
    }
    Start-Sleep -Seconds 3
  }
}
Set-Alias -Name perf -Value Watch-Build-Performance

# === Enhanced Prompt with Weather App Context ===
function prompt {
  $currentPath = $PWD.Path
  $shortPath = if ($currentPath.Length -gt 50) {
    "..." + $currentPath.Substring($currentPath.Length - 47)
  }
  else { $currentPath }

  # Git status with weather app context
  $gitInfo = ""
  try {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($branch) {
      $status = git status --porcelain 2>$null
      $statusIcon = if ($status) { "🔴" } else { "🟢" }
      $gitInfo = " [$statusIcon $branch]"
    }
  }
  catch { }

  # Node.js version
  $nodeInfo = ""
  if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeInfo = " [node:$(node --version)]"
  }

  # Weather app specific indicators
  $weatherInfo = ""
  if (Test-Path "package.json") {
    $weatherInfo = " [🌤️]"
    # Add mobile indicator if mobile features detected
    if (Test-Path "src/utils/usePullToRefresh.ts") { $weatherInfo += " [📱]" }
  }

  $timeStamp = Get-Date -Format "HH:mm:ss"
  Write-Host "┌─[" -NoNewline -ForegroundColor DarkGray
  Write-Host $timeStamp -NoNewline -ForegroundColor DarkCyan
  Write-Host "]─[" -NoNewline -ForegroundColor DarkGray
  Write-Host $shortPath -NoNewline -ForegroundColor Cyan
  Write-Host "]" -NoNewline -ForegroundColor DarkGray
  Write-Host $gitInfo -NoNewline -ForegroundColor Yellow
  Write-Host $nodeInfo -NoNewline -ForegroundColor DarkGreen
  Write-Host $weatherInfo -ForegroundColor Magenta
  Write-Host "└─❯ " -NoNewline -ForegroundColor DarkGray
  return " "
}

# === Module Loading ===
$modules = @('posh-git', 'Terminal-Icons')
foreach ($module in $modules) {
  try {
    if (Get-Module -ListAvailable -Name $module) {
      Import-Module $module -ErrorAction SilentlyContinue
    }
  }
  catch { }
}

# === Weather App Welcome Message ===
Clear-Host
Write-Host "🌤️  Weather App - Development Environment Ready!" -ForegroundColor Magenta
Write-Host "🤖 GitHub Copilot optimized PowerShell profile loaded" -ForegroundColor Cyan
Write-Host "📱 Mobile-first React + TypeScript + Vite development setup" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Quick Commands:" -ForegroundColor Yellow
Write-Host "   dev, build, test -Fast, lint -Fix, fmt, health, pc -Fix" -ForegroundColor White
Write-Host "🔧 Weather Tools:" -ForegroundColor Cyan
Write-Host "   comp <name>, script <name>, rollup, mobile, deploy, workflows" -ForegroundColor White
Write-Host "📋 GitHub:" -ForegroundColor Green
Write-Host "   pr, workflows, ctx, info" -ForegroundColor White
Write-Host ""
