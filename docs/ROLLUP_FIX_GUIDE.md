# Rollup Dependencies Fix Guide

This guide explains how to resolve the common Rollup binary dependency issue that can occur in CI/CD environments, particularly with the error:

```text
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

## Problem Description

This error occurs because Rollup's platform-specific binary dependencies (optional dependencies) are not being installed correctly in CI environments. This is a known issue with npm's handling of optional dependencies in certain scenarios.

## Solutions

### Quick Fix (Recommended)

Run one of the automated fix scripts:

**For Windows:**

```powershell
npm run fix:rollup:ps
```

**For Unix/Linux/macOS:**

```bash
npm run fix:rollup:sh
```

**Cross-platform (Node.js):**

```bash
npm run fix:rollup
```

### Manual Fix

1. **Clear npm cache:**

   ```bash
   npm cache clean --force
   ```

2. **Install dependencies with optional packages:**

   ```bash
   npm ci --include=optional
   ```

3. **Manually install the required Rollup binary:**

   ```bash
   # For Linux
   npm install @rollup/rollup-linux-x64-gnu --optional --no-save
   
   # For macOS (Intel)
   npm install @rollup/rollup-darwin-x64 --optional --no-save
   
   # For macOS (Apple Silicon)
   npm install @rollup/rollup-darwin-arm64 --optional --no-save
   
   # For Windows
   npm install @rollup/rollup-win32-x64-msvc --optional --no-save
   ```

### Clean Installation

If the above doesn't work, try a clean installation:

**Windows:**

```powershell
npm run fix:rollup:clean
```

**Unix/Linux/macOS:**

```bash
npm run fix:rollup:sh-clean
```

## Build Scripts

The project includes several build scripts to handle this issue:

- `npm run build` - Standard build with dependency fix
- `npm run build:safe` - Build with fallback options
- `npm run build:deps` - Just fix the dependencies
- `npm run build:fix-rollup` - Run the Rollup fix script

## CI/CD Configuration

The GitHub Actions workflow has been updated to automatically handle this issue:

1. **Clear npm cache** before installation
2. **Install dependencies** with optional packages included
3. **Run the fix script** to ensure Rollup binaries are available
4. **Verify installation** before building

## File Changes Made

### package.json

- Added `@rollup/rollup-linux-x64-gnu` as a devDependency
- Added optional dependencies for all platforms
- Updated build scripts to include dependency fixes
- Added fix scripts for different platforms

### .npmrc

- Configured to include optional dependencies by default
- Set optimal settings for CI environments

### GitHub Actions (.github/workflows/deploy.yml)

- Added npm cache clearing
- Updated dependency installation process
- Added Rollup fix script execution
- Added verification steps

### Fix Scripts

- `scripts/fix-rollup-deps.js` - Cross-platform Node.js script
- `scripts/fix-rollup-deps.ps1` - PowerShell script for Windows
- `scripts/fix-rollup-deps.sh` - Shell script for Unix-like systems

## Verification

After applying any fix, verify it worked:

1. **Check Rollup installation:**

   ```bash
   npm list rollup
   npm list @rollup/rollup-linux-x64-gnu
   ```

2. **Test build:**

   ```bash
   npm run build
   ```

3. **If build fails,** try the safe build:

   ```bash
   npm run build:safe
   ```

## Troubleshooting

### Still Getting Errors?

1. **Try a complete clean:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run fix:rollup
   ```

2. **Check Node.js version:**
   - Ensure you're using Node.js 20+
   - Update npm to latest version: `npm install -g npm@latest`

3. **Disable npm cache temporarily:**

   ```bash
   npm install --cache /tmp/npm-cache-temp
   ```

### Platform-Specific Issues

**Linux CI environments:**

- Some CI environments may need additional binary dependencies
- Try installing build tools: `apt-get install build-essential`

**macOS:**

- Ensure Xcode Command Line Tools are installed: `xcode-select --install`

**Windows:**

- Ensure Visual Studio Build Tools are available
- Try running PowerShell as Administrator

## Alternative Solutions

If all else fails, you can use the fallback build which uses esbuild instead of Rollup:

```bash
npm run build:fallback
```

This creates a basic bundle but may not have all the optimizations of the full Vite build.

## Prevention

To prevent this issue in the future:

1. Always use `npm ci --include=optional` in CI environments
2. Keep the fix scripts updated with new Rollup versions
3. Test builds locally before pushing to CI
4. Monitor Rollup release notes for dependency changes

## Related Issues

- [npm/cli#4828](https://github.com/npm/cli/issues/4828) - npm bug with optional dependencies
- [rollup/rollup#4784](https://github.com/rollup/rollup/issues/4784) - Rollup binary installation issues

## Support

If you continue to experience issues:

1. Run the diagnostic script: `npm run fix:rollup:ps -Verbose` (Windows) or `npm run fix:rollup:sh --verbose` (Unix)
2. Check the build logs for specific error messages
3. Ensure all dependencies are up to date: `npm update`
4. Consider updating Node.js to the latest LTS version
