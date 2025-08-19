/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build configuration for production deployment
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Node modules chunking
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('capacitor')) {
              return 'capacitor-vendor';
            }
            if (id.includes('axios')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }

          // Feature-based chunking
          if (id.includes('components/modernWeatherUI')) {
            return 'modern-ui';
          }
          if (
            id.includes('utils/haptic') ||
            id.includes('utils/weatherHaptic')
          ) {
            return 'haptic-features';
          }
          if (id.includes('utils/weather') || id.includes('utils/location')) {
            return 'weather-core';
          }
          if (id.includes('utils/theme') || id.includes('utils/mobile')) {
            return 'ui-utils';
          }

          return undefined;
        },
        chunkFileNames: chunkInfo => {
          return chunkInfo.isDynamicEntry
            ? 'chunks/[name]-[hash].js'
            : 'assets/[name]-[hash].js';
        },
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/css/i.test(ext)) {
            return `styles/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Performance optimization
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },

  // Base URL for deployment (will be updated per environment)
  base: '/',

  optimizeDeps: {
    exclude: ['react-native'],
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'dist/',
        'coverage/',
        'vite.config.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
