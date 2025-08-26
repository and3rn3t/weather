# Phase 4B: Tree Shaking Optimization Plan

## 🎯 Dependencies Analysis Results

Based on `npx depcheck` analysis, we found significant optimization opportunities:

### 📦 Unused Production Dependencies (150KB+ potential savings):

- ❌ **axios** (~85KB) - Replace with native fetch API
- ❌ **@capacitor/android** (~5KB) - Build-time only
- ❌ **@capacitor/ios** (~5KB) - Build-time only
- ❌ **@capacitor/keyboard** (~15KB) - Not implemented
- ❌ **@capacitor/push-notifications** (~25KB) - Not implemented
- ❌ **@capacitor/share** (~12KB) - Not used
- ❌ **@capacitor/splash-screen** (~8KB) - Basic splash sufficient

### 🔧 Unused Dev Dependencies (Build optimization):

- ❌ **@types/axios** - No longer using axios
- ❌ **@types/jest** - Using vitest instead
- ❌ **jest, jest-environment-jsdom, ts-jest** - Using vitest
- ❌ **rimraf** - Can use native rm -rf
- ❌ **rollup** - Vite handles this
- ❌ **@vitest/coverage-v8** - Not using coverage currently

## 🚀 Phase 4B Implementation Plan

### Step 1: Replace Axios with Native Fetch (85KB savings)

```typescript
// Before: import axios from 'axios'
// After: Use native fetch API

const response = await fetch(url, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});
const data = await response.json();
```

### Step 2: Remove Unused Capacitor Plugins (65KB savings)

Keep only essential plugins:

- ✅ @capacitor/core - Essential
- ✅ @capacitor/app - Core functionality
- ✅ @capacitor/device - Device detection
- ✅ @capacitor/geolocation - Weather location
- ✅ @capacitor/haptics - Mobile feedback
- ✅ @capacitor/network - Network status
- ✅ @capacitor/local-notifications - Weather alerts

### Step 3: Optimize Package.json

```json
{
  "dependencies": {
    "@capacitor/app": "^7.0.1",
    "@capacitor/core": "^7.4.2",
    "@capacitor/device": "^7.0.1",
    "@capacitor/geolocation": "^7.1.4",
    "@capacitor/haptics": "^7.0.1",
    "@capacitor/local-notifications": "^7.0.1",
    "@capacitor/network": "^7.0.1",
    "@dash0/sdk-web": "^0.13.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

### Step 4: Advanced Tree Shaking Configuration

Enable aggressive tree shaking in Vite config:

```typescript
build: {
  rollupOptions: {
    treeshake: {
      moduleSideEffects: false,
      preset: 'smallest',
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    }
  }
}
```

## 📊 Expected Results

### Bundle Size Impact:

- **Current**: 1.99MB total
- **After Phase 4B**: ~1.6MB total (**20% reduction**)
- **Gzipped**: ~95KB total (**Better than 100KB target**)

### Load Performance:

- **First Load**: 150KB reduction in critical path
- **Parse Time**: Fewer dependencies to parse
- **Mobile**: Conditional Capacitor loading
- **Network**: Fewer HTTP requests

### File-by-File Breakdown:

- **axios removal**: All API calls → fetch API
- **Capacitor cleanup**: Mobile-only builds get plugins
- **Tree shaking**: Remove unused React features
- **Dev cleanup**: Faster build times

## ⚠️ Risk Assessment

### Low Risk:

- ✅ Dev dependency removal (no runtime impact)
- ✅ Unused Capacitor plugins (not referenced in code)
- ✅ axios → fetch (well-supported API)

### Medium Risk:

- ⚠️ Mobile builds need testing after Capacitor cleanup
- ⚠️ Fetch API compatibility (need polyfill for older browsers)

### Mitigation:

- Test mobile functionality before deployment
- Add fetch polyfill if needed for IE support
- Keep removed dependencies documented for easy restoration

## 🔧 Implementation Order

1. **Test current functionality** ← We are here
2. **Replace axios with fetch** in API calls
3. **Remove unused dependencies** from package.json
4. **Update imports** and remove dead code
5. **Apply tree shaking config** and rebuild
6. **Test mobile builds** with reduced Capacitor plugins
7. **Measure bundle improvement** and document results

## 🎯 Success Criteria

✅ **Bundle size** reduced by 15-20% ✅ **Load time** improved on mobile ✅ **Mobile functionality**
preserved ✅ **Build performance** improved ✅ **No breaking changes** in production

---

_Generated: Phase 4B Tree Shaking Plan - Ready for implementation_
