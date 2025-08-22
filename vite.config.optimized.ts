/**
 * Advanced Vite Configuration for Bundle Optimization
 * Phase 4A: Reduces bundle size through strategic chunking and tree shaking
 */

import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],

  build: {
    // Enable advanced code splitting
    rollupOptions: {
      output: {
        // Strategic chunk splitting for optimal loading
        manualChunks: {
          // React core (loaded once, cached)
          'react-vendor': ['react', 'react-dom'],

          // Heavy Capacitor features (mobile-only)
          'capacitor-vendor': [
            '@capacitor/app',
            '@capacitor/device',
            '@capacitor/geolocation',
            '@capacitor/haptics',
            '@capacitor/network',
            '@capacitor/status-bar',
          ],

          // UI utilities (shared across components)
          'ui-utils': [
            './src/utils/themeConfig.ts',
            './src/utils/themeContext.tsx',
            './src/utils/ThemeToggle.tsx',
          ],

          // Weather core functionality
          'weather-core': [
            './src/utils/weatherIcons.tsx',
            './src/utils/useEnhancedSearch.ts',
            './src/utils/autocorrectEngine.ts',
          ],

          // Mobile/haptic features (conditionally loaded)
          'haptic-features': [
            './src/utils/hapticHooks.ts',
            './src/utils/usePullToRefresh.ts',
            './src/utils/mobileScreenOptimization.ts',
            './src/components/MobileNavigation.tsx',
          ],
        },

        // Optimize chunk naming for caching
        chunkFileNames: chunkInfo => {
          if (chunkInfo.name === 'react-vendor') {
            return 'assets/react-vendor-[hash].js';
          }
          if (chunkInfo.name === 'capacitor-vendor') {
            return 'assets/capacitor-vendor-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },

        // Optimize asset naming
        assetFileNames: assetInfo => {
          if (assetInfo.name?.endsWith('.css')) {
            // Group CSS by type for better caching
            if (assetInfo.name.includes('mobile')) {
              return 'styles/mobile-[hash].css';
            }
            if (assetInfo.name.includes('ios26')) {
              return 'styles/ios26-[hash].css';
            }
            if (assetInfo.name.includes('horror')) {
              return 'styles/horror-[hash].css';
            }
            return 'styles/[name]-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },

      // Tree shaking optimizations
      treeshake: {
        // Enable aggressive tree shaking
        moduleSideEffects: false,
        // Remove unused React features
        pureExternalModules: ['react', 'react-dom'],
        // Remove unused Capacitor modules
        preset: 'smallest',
      },

      // External dependencies optimization
      external: id => {
        // Keep large dependencies external if they're loaded via CDN
        if (id.includes('chart.js') || id.includes('three.js')) {
          return true;
        }
        return false;
      },
    },

    // Optimize minification
    minify: 'esbuild',
    cssMinify: 'esbuild',

    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Enable source maps for debugging (but optimize them)
    sourcemap: true,

    // Optimize chunk size limits
    chunkSizeWarningLimit: 600, // Warn at 600KB chunks

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets < 4KB

    // CSS code splitting
    cssCodeSplit: true,

    // Module preload
    modulePreload: {
      polyfill: true,
    },
  },

  // Optimize imports resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },

  // Development optimizations
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: ['react', 'react-dom', '@capacitor/core'],

    // Exclude from pre-bundling (load dynamically)
    exclude: [
      '@capacitor/geolocation',
      '@capacitor/haptics',
      '@capacitor/local-notifications',
    ],
  },

  // CSS optimization
  css: {
    // Enable CSS modules with optimization
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[local]_[hash:base64:5]',
    },

    // PostCSS optimizations
    postcss: {
      plugins: [
        // Remove unused CSS
        {
          postcssPlugin: 'remove-unused',
          Once(root) {
            // Custom logic to remove unused CSS
            root.walkRules(rule => {
              // Remove rules that are never used
              if (rule.selector.includes('.unused-')) {
                rule.remove();
              }
            });
          },
        },
      ],
    },
  },

  // Performance optimizations
  define: {
    // Remove development-only code in production
    __DEV__: JSON.stringify(false),
    __MOBILE_ONLY__: JSON.stringify(true),
    __CAPACITOR_ENABLED__: JSON.stringify(true),
    __BUNDLE_OPTIMIZED__: JSON.stringify(true),
  },
});
