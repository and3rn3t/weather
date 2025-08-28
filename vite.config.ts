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
        manualChunks(id) {
          // React core - loaded once, heavily cached
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'react-vendor';
          }

          // Capacitor features - mobile-only conditional loading
          if (id.includes('node_modules/@capacitor/')) {
            return 'capacitor-vendor';
          }

          // UI utilities - shared across components
          if (
            id.includes('/src/utils/themeConfig') ||
            id.includes('/src/utils/themeContext') ||
            id.includes('/src/utils/ThemeToggle') ||
            id.includes('/src/utils/hapticContext')
          ) {
            return 'ui-utils';
          }

          // Weather functionality - core features
          if (
            id.includes('/src/utils/weatherIcons') ||
            id.includes('/src/utils/useEnhancedSearch') ||
            id.includes('/src/utils/autocorrectEngine')
          ) {
            return 'weather-core';
          }

          // Mobile features - conditionally loaded
          if (
            id.includes('/src/utils/hapticHooks') ||
            id.includes('/src/utils/usePullToRefresh') ||
            id.includes('/src/utils/mobileScreenOptimization') ||
            id.includes('/src/components/MobileNavigation')
          ) {
            return 'haptic-features';
          }

          // iOS26 suite - modern UI components grouped
          if (id.includes('/src/components/modernWeatherUI/')) {
            return 'ios26-suite';
          }

          // Optimized visualizations - charts and gauges
          if (
            id.includes(
              '/src/components/optimized/EnhancedWeatherVisualization'
            ) ||
            id.includes(
              '/src/components/optimized/OptimizedMobileWeatherDisplay'
            ) ||
            id.includes('/src/components/optimized/SmartWeatherSkeleton')
          ) {
            return 'visualizations-optimized';
          }

          return undefined;
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
