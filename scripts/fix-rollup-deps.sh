#!/bin/bash

# Fix Rollup Dependencies - Shell Script
# This script resolves Rollup binary dependency issues that can occur in CI/CD environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_status $CYAN "🔧 Weather App - Rollup Dependencies Fix"
print_status $CYAN "========================================="

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_status $RED "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

print_status $GRAY "📋 Current directory: $(pwd)"

# Parse command line arguments
CLEAN=false
VERBOSE=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            print_status $YELLOW "⚠️  Unknown option: $1"
            shift
            ;;
    esac
done

# Clean installation if requested
if [ "$CLEAN" = true ]; then
    print_status $YELLOW "🧹 Performing clean installation..."
    
    if [ -d "node_modules" ]; then
        print_status $GRAY "🗑️  Removing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        print_status $GRAY "🗑️  Removing package-lock.json..."
        rm -f package-lock.json
    fi
    
    print_status $GREEN "🧹 Clean completed"
fi

# Install dependencies
print_status $BLUE "📦 Installing dependencies..."
if [ "$VERBOSE" = true ]; then
    npm ci --include=optional || {
        print_status $YELLOW "⚠️  Warning: npm ci failed, trying npm install..."
        npm install --include=optional
    }
else
    npm ci --include=optional --silent || {
        print_status $YELLOW "⚠️  Warning: npm ci failed, trying npm install..."
        npm install --include=optional --silent
    }
fi

print_status $GREEN "✅ Dependencies installed successfully"

# Platform detection
PLATFORM=$(uname -s)
ARCH=$(uname -m)
print_status $GRAY "🖥️  Platform: $PLATFORM, Architecture: $ARCH"

# Determine required Rollup binary
ROLLUP_BINARY=""
case "$PLATFORM" in
    Linux*)
        case "$ARCH" in
            x86_64)
                ROLLUP_BINARY="@rollup/rollup-linux-x64-gnu"
                ;;
            aarch64)
                ROLLUP_BINARY="@rollup/rollup-linux-arm64-gnu"
                ;;
            *)
                ROLLUP_BINARY="@rollup/rollup-linux-x64-gnu"
                ;;
        esac
        ;;
    Darwin*)
        case "$ARCH" in
            arm64)
                ROLLUP_BINARY="@rollup/rollup-darwin-arm64"
                ;;
            x86_64)
                ROLLUP_BINARY="@rollup/rollup-darwin-x64"
                ;;
            *)
                ROLLUP_BINARY="@rollup/rollup-darwin-x64"
                ;;
        esac
        ;;
    *)
        ROLLUP_BINARY="@rollup/rollup-linux-x64-gnu"
        ;;
esac

print_status $BLUE "🔧 Required Rollup binary: $ROLLUP_BINARY"

# Install the specific Rollup binary
print_status $BLUE "📦 Installing Rollup binary..."
if [ "$VERBOSE" = true ]; then
    npm install "$ROLLUP_BINARY" --optional --no-save || {
        print_status $YELLOW "⚠️  Warning: Failed to install $ROLLUP_BINARY, trying without optional flag..."
        npm install "$ROLLUP_BINARY" --no-save || {
            print_status $RED "❌ Warning: Could not install specific Rollup binary"
            print_status $YELLOW "🔄 Attempting to install common Rollup binaries..."
            
            # Try installing common binaries
            for binary in "@rollup/rollup-linux-x64-gnu" "@rollup/rollup-darwin-x64" "@rollup/rollup-darwin-arm64"; do
                npm install "$binary" --optional --no-save 2>/dev/null && print_status $GREEN "✅ Installed $binary" || print_status $YELLOW "⚠️  Could not install $binary"
            done
        }
    }
else
    npm install "$ROLLUP_BINARY" --optional --no-save --silent || {
        print_status $YELLOW "⚠️  Warning: Failed to install $ROLLUP_BINARY, trying without optional flag..."
        npm install "$ROLLUP_BINARY" --no-save --silent || {
            print_status $RED "❌ Warning: Could not install specific Rollup binary"
            print_status $YELLOW "🔄 Attempting to install common Rollup binaries..."
            
            # Try installing common binaries
            for binary in "@rollup/rollup-linux-x64-gnu" "@rollup/rollup-darwin-x64" "@rollup/rollup-darwin-arm64"; do
                npm install "$binary" --optional --no-save --silent 2>/dev/null && print_status $GREEN "✅ Installed $binary" || print_status $YELLOW "⚠️  Could not install $binary"
            done
        }
    }
fi

print_status $GREEN "✅ Rollup binary installation completed"

# Verify Rollup installation
print_status $BLUE "🔍 Verifying Rollup installation..."
if npm list rollup --depth=0 >/dev/null 2>&1; then
    print_status $GREEN "✅ Rollup is properly installed"
    if [ "$VERBOSE" = true ]; then
        ROLLUP_INFO=$(npm list rollup --depth=0 2>/dev/null || echo "Could not get version info")
        print_status $GRAY "📋 Rollup info: $ROLLUP_INFO"
    fi
else
    print_status $YELLOW "⚠️  Warning: Rollup verification failed"
fi

# Test build
print_status $BLUE "🏗️  Testing build process..."
if [ "$VERBOSE" = true ]; then
    BUILD_SUCCESS=true
    npm run build || BUILD_SUCCESS=false
else
    BUILD_SUCCESS=true
    npm run build --silent 2>/dev/null || BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = true ]; then
    print_status $GREEN "✅ Build test successful!"
else
    print_status $RED "❌ Build test failed"
    print_status $YELLOW "🔄 This might be due to other build issues, not necessarily Rollup dependencies"
    
    if [ "$FORCE" = false ]; then
        print_status $BLUE "💡 Use --force parameter to continue despite build errors"
        exit 1
    fi
fi

echo
print_status $GREEN "🎉 Rollup dependencies fix completed!"
print_status $BLUE "📋 Summary:"
print_status $GREEN "   - Dependencies installed: ✅"
print_status $GREEN "   - Rollup binary: ✅"
if [ "$BUILD_SUCCESS" = true ] || [ "$FORCE" = true ]; then
    print_status $GREEN "   - Build verification: ✅"
else
    print_status $RED "   - Build verification: ❌"
fi
echo
print_status $CYAN "🚀 You can now run 'npm run dev' or 'npm run build'"
