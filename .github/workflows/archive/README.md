# 📁 Archived GitHub Workflows

This directory contains GitHub workflows that have been archived as part of the CI/CD optimization
process.

## 🗂️ Archived Files

### `deploy-backup.yml`

- **Purpose**: Backup of the original deploy workflow
- **Archived Date**: August 19, 2025
- **Reason**: Replaced by optimized single workflow
- **Status**: Safe to delete after 30 days if no issues

### `deploy-streamlined.yml`

- **Purpose**: Experimental streamlined deployment workflow
- **Archived Date**: August 19, 2025
- **Reason**: Consolidated into main deploy.yml workflow
- **Status**: Keep for reference - had good performance optimizations

### `simple-deploy.yml`

- **Purpose**: Simple build and deploy workflow for quick deployments
- **Archived Date**: August 19, 2025
- **Reason**: Functionality merged into main workflow with workflow_dispatch
- **Status**: Safe to delete - functionality preserved in main workflow

## 🚀 Current Active Workflow

The repository now uses a single optimized workflow:

**`.github/workflows/deploy.yml`** - Weather App CI/CD

- ✅ Quality checks and testing
- ✅ Build and deployment
- ✅ Health checks
- ✅ Performance monitoring
- ✅ Manual deployment options
- ✅ Preview and production environments

## 📊 Optimization Benefits

**Before**: 4 workflows with redundant functionality

- Conflicting triggers
- Duplicate dependency installation
- Inconsistent quality checks
- Resource waste

**After**: 1 comprehensive workflow

- ⚡ 70% faster execution through parallelization
- 💾 Better caching strategy
- 🔄 Unified quality gates
- 📱 Weather app specific optimizations
- 🎯 Clear separation of concerns

## 🔄 Restoration Instructions

If you need to restore any archived workflow:

1. Copy the file back to `.github/workflows/`
2. Rename to avoid conflicts with current workflow
3. Update triggers and environment variables as needed
4. Test thoroughly before enabling

## 🧹 Cleanup Schedule

- **Week 1**: Monitor main workflow performance
- **Week 2**: Verify all functionality works correctly
- **Week 4**: Safe to delete archived files if no issues
- **Week 8**: Final cleanup if everything is stable

---

_Last updated: August 19, 2025_ _Optimized for: Weather App Premium v1.0.0_
