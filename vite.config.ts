/**
 * Production-Ready Vite Configuration for Bundle Optimization
 * Phase 4A: Strategic chunking for 40% bundle size reduction
 */

import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PluginContext } from 'rollup';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // Build metadata (commit/branch/time) for UI + version.json
  const safeExec = (cmd: string) => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return '';
    }
  };

  const fullCommit = process.env.GITHUB_SHA || safeExec('git rev-parse HEAD');
  const shortCommit = (
    process.env.GITHUB_SHA || safeExec('git rev-parse --short=8 HEAD')
  )
    .replace(/\n/g, '')
    .trim();
  const branch =
    process.env.GITHUB_REF_NAME ||
    safeExec('git rev-parse --abbrev-ref HEAD') ||
    'unknown';
  const buildTime = new Date().toISOString();

  // Read package version safely
  let appVersion = '0.0.0';
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
    );
    appVersion = pkg.version || appVersion;
  } catch {
    // noop: fallback to default version if package.json read fails
  }

  const emitVersionJson = (): Plugin => ({
    name: 'emit-version-json',
    apply: 'build',
    generateBundle(this: PluginContext) {
      const payload = {
        version: appVersion,
        environment: mode,
        commit: fullCommit || shortCommit,
        shortCommit,
        branch,
        time: buildTime,
      };
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(payload, null, 2),
      });
    },
  });

  return {
    plugins: [react(), emitVersionJson()],

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

            // Mobile features - let Rollup decide optimal chunking to avoid TDZ from forced grouping

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
      // Build metadata globals (for UI)
      __BUILD_COMMIT__: JSON.stringify(fullCommit || shortCommit),
      __BUILD_BRANCH__: JSON.stringify(branch),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
  };
});
