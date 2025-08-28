/**
 * Production-Ready Vite Configuration for Bundle Optimization
 * Phase 4A: Strategic chunking for 40% bundle size reduction
 */

import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Configure Vite to load .env files from .env directory
  envDir: '.env',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - loaded once, heavily cached
          'react-vendor': ['react', 'react-dom'],

          // Capacitor features - mobile-only conditional loading
          'capacitor-vendor': [
            '@capacitor/app',
            '@capacitor/device',
            '@capacitor/geolocation',
            '@capacitor/haptics',
            '@capacitor/network',
            '@capacitor/status-bar',
          ],

          // UI utilities - shared across components
          'ui-utils': [
            './src/utils/themeConfig.ts',
            './src/utils/themeContext.tsx',
            './src/utils/ThemeToggle.tsx',
            './src/utils/hapticContext.tsx',
          ],

          // Weather functionality - core features
          'weather-core': [
            './src/utils/weatherIcons.tsx',
            './src/utils/useEnhancedSearch.ts',
            './src/utils/autocorrectEngine.ts',
          ],

          // Mobile features - conditionally loaded
          'haptic-features': [
            './src/utils/hapticHooks.ts',
            './src/utils/usePullToRefresh.ts',
            './src/utils/mobileScreenOptimization.ts',
            './src/components/MobileNavigation.tsx',
          ],

          // iOS26 suite - modern UI components grouped
          'ios26-suite': [
            './src/components/modernWeatherUI/iOS26Components.tsx',
            './src/components/modernWeatherUI/iOSComponents.tsx',
            './src/components/modernWeatherUI/NavigationBar.tsx',
            './src/components/modernWeatherUI/iOS26WeatherDemo.tsx',
            './src/components/modernWeatherUI/iOS26WeatherInterface.tsx',
            './src/components/modernWeatherUI/IOSComponentShowcase.tsx',
          ],

          // Optimized visualizations - charts and gauges
          'visualizations-optimized': [
            './src/components/optimized/EnhancedWeatherVisualization.tsx',
            './src/components/optimized/OptimizedMobileWeatherDisplay.tsx',
            './src/components/optimized/SmartWeatherSkeleton.tsx',
          ],
        },

        chunkFileNames: 'assets/[name]-[hash].js',

        assetFileNames: (assetInfo: { fileName?: string; name?: string }) => {
          const assetName = assetInfo.fileName ?? assetInfo.name;
          if (assetName?.endsWith('.css')) {
            if (assetName.includes('mobile')) {
              return 'styles/mobile-[hash].css';
            }
            if (assetName.includes('ios26')) {
              return 'styles/ios26-[hash].css';
            }
            return 'styles/[name]-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },

      treeshake: {
        moduleSideEffects: false,
        preset: 'smallest',
      },
    },

    minify: 'esbuild',
    cssMinify: 'esbuild',
    target: 'es2020',
    // Disable source maps in production to reduce bundle size and meet perf budget
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,

    modulePreload: {
      polyfill: true,
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
    dedupe: ['react', 'react-dom'],
  },

  server: {
    fs: {
      allow: ['..'],
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', '@capacitor/core'],

    exclude: [
      '@capacitor/geolocation',
      '@capacitor/haptics',
      '@capacitor/local-notifications',
    ],
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[local]_[hash:base64:5]',
    },
  },

  define: {
    __DEV__: JSON.stringify(false),
    __MOBILE_ONLY__: JSON.stringify(true),
    __CAPACITOR_ENABLED__: JSON.stringify(true),
    __BUNDLE_OPTIMIZED__: JSON.stringify(true),
    // Provide compatibility shims for process.env usage in browser code
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
    'process.env': {},
  },
}));
