/** @type {import('vitest').Config} */
export default {
  // Test environment and setup
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],

    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2,
        useAtomics: true,
      },
    },

    // Parallel execution
    fileParallelism: true,
    isolate: true,

    // Timeouts
    testTimeout: 5000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // File patterns and sharding
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      '**/*.d.ts',
      '**/*.config.*',
      'backup/**',
      'archive/**',
      'legacy/**',
      'deprecated/**',
      'docs/archive/**',
      'docs/legacy/**',
      'docs/backup/**',
      'docs/deprecated/**',
      'android/**',
      'ios/**',
      'public/*-debug.js',
      'public/*-test.js',
      'public/*-test.html',
      'public/theme-*.js',
      'public/test-*.js',
      'public/instant-*.js',
      'public/comprehensive-*.js',
      'public/targeted-*.js',
      'public/transparent-*.js',
      'public/enhanced-*.js',
      'public/console-*.js',
      'public/background-*.js',
      'public/final-*.js',
      'public/simple-*.js',
      'public/quote-*.js',
      'public/mobile-nav-*.js',
      '**/*.backup',
      '**/*.bak',
      '**/*.old',
      '**/*.temp',
      '**/*.tmp',
    ],

    // Sharding configuration for CI
    ...(process.env.CI && {
      shard: process.env.VITEST_SHARD || '1/4',
    }),

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      // Performance optimization for coverage
      all: false,
      clean: true,
      cleanOnRerun: true,

      // Parallel coverage processing
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95],
      },
    },

    // Reporters optimized for CI/CD
    reporters: process.env.CI ? ['json', 'junit'] : ['verbose', 'html'],

    outputFile: {
      json: './test-results.json',
      junit: './junit-results.xml',
    },

    // Optimizations for faster test execution
    deps: {
      // Inline dependencies for better performance
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom',
        'vitest-canvas-mock',
      ],
    },

    // Global configuration
    globals: true,

    // Watch mode optimizations (for development)
    watch: !process.env.CI,
    watchExclude: ['node_modules/**', 'dist/**', 'coverage/**', '**/*.d.ts'],

    // Memory management
    forceRerunTriggers: [
      '**/package.json/**',
      '**/vitest.config.*/**',
      '**/vite.config.*/**',
    ],

    // Test retry configuration
    retry: process.env.CI ? 2 : 0,

    // Custom test name patterns for better organization
    testNamePattern: process.env.VITEST_TEST_PATTERN,

    // Performance monitoring
    logHeapUsage: process.env.CI === 'true',

    // Optimized for different environments
    ...(process.env.NODE_ENV === 'production' && {
      minify: true,
      sourcemap: false,
    }),
  },

  // Module resolution
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@components': new URL('./src/components', import.meta.url).pathname,
      '@utils': new URL('./src/utils', import.meta.url).pathname,
      '@styles': new URL('./src/styles', import.meta.url).pathname,
    },
  },

  // Transform configuration
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },
};
