import { test } from '@playwright/test';

/**
 * App Store Screenshot Generation Tests
 *
 * Captures screenshots for all required iOS App Store device sizes:
 * - iPhone 16 Pro Max (6.9")
 * - iPhone 14 Plus (6.5")
 * - iPhone 8 Plus (5.5")
 * - iPad Pro 12.9"
 *
 * Run with: npm run screenshots
 */

// Screenshot configuration
const SCREENSHOT_DELAY = 2000; // Wait for animations to complete
const WEATHER_LOAD_DELAY = 3000; // Wait for weather API response

test.describe('App Store Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for initial load and animations
    await page.waitForTimeout(SCREENSHOT_DELAY);
  });

  test('01 - Home Screen', async ({ page }, testInfo) => {
    // Capture home screen with weather preview
    await page.waitForTimeout(WEATHER_LOAD_DELAY);

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-01-home.png`,
      fullPage: false,
    });
  });

  test('02 - Weather Details', async ({ page }, testInfo) => {
    // Navigate to weather details (search for a city)
    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('San Francisco');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(WEATHER_LOAD_DELAY);
    }

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-02-weather-details.png`,
      fullPage: false,
    });
  });

  test('03 - Forecast View', async ({ page }, testInfo) => {
    // Look for forecast section or navigate to it
    const forecastSection = page
      .locator('[class*="forecast"], [data-testid="forecast"]')
      .first();

    if (await forecastSection.isVisible()) {
      await forecastSection.scrollIntoViewIfNeeded();
    }

    await page.waitForTimeout(SCREENSHOT_DELAY);

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-03-forecast.png`,
      fullPage: false,
    });
  });

  test('04 - Settings Screen', async ({ page }, testInfo) => {
    // Look for settings button or navigation
    const settingsButton = page
      .locator(
        '[aria-label*="Settings"], [class*="settings"], button:has-text("Settings")'
      )
      .first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(SCREENSHOT_DELAY);
    }

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-04-settings.png`,
      fullPage: false,
    });
  });

  test('05 - Dark Mode', async ({ page }, testInfo) => {
    // Toggle to dark mode if available
    const themeToggle = page
      .locator(
        '[aria-label*="theme"], [class*="theme-toggle"], button:has([class*="moon"])'
      )
      .first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(SCREENSHOT_DELAY);
    }

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-05-dark-mode.png`,
      fullPage: false,
    });
  });

  test('06 - Search Interface', async ({ page }, testInfo) => {
    // Focus on search to show search UI
    const searchInput = page.locator('input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await page.waitForTimeout(SCREENSHOT_DELAY);
    }

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-06-search.png`,
      fullPage: false,
    });
  });
});

// Optional: Full page screenshots for marketing materials
test.describe('Marketing Screenshots', () => {
  test('Full Page - Light Mode', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForTimeout(WEATHER_LOAD_DELAY);

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-full-light.png`,
      fullPage: true,
    });
  });

  test('Full Page - Dark Mode', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForTimeout(SCREENSHOT_DELAY);

    // Toggle to dark mode
    const themeToggle = page
      .locator('[aria-label*="theme"], [class*="theme-toggle"]')
      .first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(SCREENSHOT_DELAY);
    }

    await page.screenshot({
      path: `screenshots/output/${testInfo.project.name}-full-dark.png`,
      fullPage: true,
    });
  });
});
