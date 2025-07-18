#!/bin/bash

# Cloudflare Pages Deployment Setup Script
# This script helps set up the complete CI/CD pipeline

set -e

echo "🚀 Setting up Cloudflare Pages CI/CD Pipeline..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 22 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: Node.js 22"
fi

print_status "Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run tests
print_status "Running tests..."
npm run test:ci

# Test build
print_status "Testing production build..."
npm run build

print_success "Build completed successfully!"

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_warning "Git repository not initialized. Run 'git init' to set up version control."
else
    print_success "Git repository detected."
fi

# Instructions for GitHub setup
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🔗 Push to GitHub:"
echo "   git add ."
echo "   git commit -m \"feat: add Cloudflare Pages CI/CD pipeline\""
echo "   git push origin main"
echo ""
echo "2. 🌐 Set up Cloudflare Pages:"
echo "   - Visit https://dash.cloudflare.com/pages"
echo "   - Connect your GitHub repository"
echo "   - Set build command: npm run build"
echo "   - Set output directory: dist"
echo ""
echo "3. 🔑 Configure GitHub Secrets:"
echo "   - Go to GitHub repository Settings > Secrets > Actions"
echo "   - Add CLOUDFLARE_API_TOKEN (from Cloudflare > My Profile > API Tokens)"
echo "   - Add CLOUDFLARE_ACCOUNT_ID (from Cloudflare Dashboard sidebar)"
echo ""
echo "4. 🚀 Deploy:"
echo "   - Push to main branch triggers production deployment"
echo "   - Open pull requests trigger preview deployments"
echo ""

# Check for Cloudflare CLI
if command -v wrangler &> /dev/null; then
    print_success "Cloudflare Wrangler CLI detected: $(wrangler --version)"
    echo ""
    echo "🎯 Optional: Direct deployment with Wrangler:"
    echo "   wrangler pages publish dist --project-name premium-weather-app"
else
    echo ""
    echo "💡 Optional: Install Cloudflare Wrangler CLI for direct deployments:"
    echo "   npm install -g @cloudflare/wrangler"
fi

echo ""
print_success "Setup complete! Your weather app is ready for deployment! 🎉"
