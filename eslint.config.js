import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  {
    ignores: [
      'dist',
      'backup/**',
      'android/**',
      'coverage/**',
      'node_modules/**',
      'docs/archive/**',
      'docs/legacy/**',
      'docs/backup/**',
      'docs/deprecated/**',
      'public/*-debug.js',
      'public/*-test.js',
      'public/*-test.html',
      'public/horror-*.js',
      'public/horror-*.html',
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
      'archive/**',
      'legacy/**',
      'deprecated/**',
      '**/*.backup',
      '**/*.bak',
      '**/*.old',
      '**/*.temp',
      '**/*.tmp',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React specific rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // General code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

    // Code style (should match Prettier)
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    // Trailing commas aligned with Prettier; ESLint core rule supports TS in v9+
    'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
      // NOTE: ESLint core handles TS constructs via typescript-eslint parser
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Dev-only diagnostics: allow console usage without warnings
    files: [
      'src/App-diagnostic.tsx',
      'src/utils/logger.ts',
      'src/utils/horrorEffectsDebug.ts',
      'src/utils/locationDiagnostic.ts',
      'src/components/Dash0ErrorBoundary.tsx',
      'src/dash0/components/Dash0ErrorBoundary.tsx',
      'src/utils/performanceMonitor.ts',
      'src/utils/backgroundSyncManager.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]);
