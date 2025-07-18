# Cloudflare Pages Deployment Setup Script (PowerShell)
# This script helps set up the complete CI/CD pipeline on Windows

$ErrorActionPreference = "Stop"

Write-Host "Setting up Cloudflare Pages CI/CD Pipeline..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion"
    
    # Extract major version number
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Warning "Node.js version $majorVersion detected. Recommended: Node.js 22"
    }
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 22 or later."
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Status "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm."
    exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."
npm ci

# Run tests
Write-Status "Running tests..."
npm run test:ci

# Test build
Write-Status "Testing production build..."
npm run build

Write-Success "Build completed successfully!"

# Check if git is initialized
if (Test-Path ".git") {
    Write-Success "Git repository detected."
} else {
    Write-Warning "Git repository not initialized. Run 'git init' to set up version control."
}

# Instructions for GitHub setup
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "==============" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Push to GitHub:"
Write-Host "   git add ."
Write-Host "   git commit -m `"feat: add Cloudflare Pages CI/CD pipeline`""
Write-Host "   git push origin main"
Write-Host ""
Write-Host "2. Set up Cloudflare Pages:"
Write-Host "   - Visit https://dash.cloudflare.com/pages"
Write-Host "   - Connect your GitHub repository"
Write-Host "   - Set build command: npm run build"
Write-Host "   - Set output directory: dist"
Write-Host ""
Write-Host "3. Configure GitHub Secrets:"
Write-Host "   - Go to GitHub repository Settings > Secrets > Actions"
Write-Host "   - Add CLOUDFLARE_API_TOKEN (from Cloudflare My Profile API Tokens)"
Write-Host "   - Add CLOUDFLARE_ACCOUNT_ID (from Cloudflare Dashboard sidebar)"
Write-Host ""
Write-Host "4. Deploy:"
Write-Host "   - Push to main branch triggers production deployment"
Write-Host "   - Open pull requests trigger preview deployments"
Write-Host ""

# Check for Cloudflare CLI
try {
    $wranglerVersion = wrangler --version
    Write-Success "Cloudflare Wrangler CLI detected: $wranglerVersion"
    Write-Host ""
    Write-Host "Optional: Direct deployment with Wrangler:"
    Write-Host "   wrangler pages publish dist --project-name premium-weather-app"
} catch {
    Write-Host ""
    Write-Host "Optional: Install Cloudflare Wrangler CLI for direct deployments:"
    Write-Host "   npm install -g @cloudflare/wrangler"
}

Write-Host ""
Write-Success "Setup complete! Your weather app is ready for deployment!"
