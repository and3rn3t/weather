import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for App Store screenshot generation
 * Covers required device sizes for iOS App Store submissions
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './screenshots/output',

  /* Maximum time one test can run */
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: 'html',

  /* Shared settings for all the projects below */
  use: {
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers and devices */
  projects: [
    // ======================================
    // iOS App Store Required Screenshots
    // ======================================

    // iPhone 6.9" (Required for App Store - iPhone 16 Pro Max)
    {
      name: 'iPhone 16 Pro Max',
      use: {
        ...devices['iPhone 14 Pro Max'],
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
      },
    },

    // iPhone 6.5" (iPhone 14 Plus / 15 Plus)
    {
      name: 'iPhone 14 Plus',
      use: {
        ...devices['iPhone 14 Plus'],
        viewport: { width: 428, height: 926 },
        deviceScaleFactor: 3,
      },
    },

    // iPhone 5.5" (Legacy - iPhone 8 Plus)
    {
      name: 'iPhone 8 Plus',
      use: {
        ...devices['iPhone 8 Plus'],
        viewport: { width: 414, height: 736 },
        deviceScaleFactor: 3,
      },
    },

    // iPad Pro 12.9" (Required for App Store)
    {
      name: 'iPad Pro 12.9',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 2,
      },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
