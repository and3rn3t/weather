/**
 * CSS Optimization System
 * Implements conditional CSS loading to reduce initial bundle size
 * Target: Reduce 127KB CSS bundle to 85-90KB (25-30% reduction)
 */

// Track loaded CSS modules
const loadedCSSModules = new Set<string>();

/**
 * Dynamically load CSS modules only when needed
 */
export const loadCSSModule = async (moduleName: string): Promise<void> => {
  if (loadedCSSModules.has(moduleName)) {
    return; // Already loaded
  }

  try {
    switch (moduleName) {
      // horror-theme removed

      case 'enhanced-mobile':
        await import('../styles/enhancedMobileLayout.css');
        await import('../styles/enhancedMobileNavigation.css');
        await import('../styles/enhancedMobileTypography.css');
        break;

      case 'ios-advanced':
        await import('../styles/ios-hig-enhancements.css');
        await import('../styles/ios26-text-optimization.css');
        await import('../styles/ios26-weather-details-fix.css');
        break;

      case 'layout-enhancements':
        await import('../styles/layout-fixes.css');
        await import('../styles/responsive-layout-consolidated.css');
        await import('../styles/mobile-enhanced-consolidated.css');
        break;

      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown CSS module: ${moduleName}`);
        return;
    }

    loadedCSSModules.add(moduleName);
    // eslint-disable-next-line no-console
    console.log(`✅ CSS Module loaded: ${moduleName}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ Failed to load CSS module: ${moduleName}`, error);
  }
};

/**
 * Load CSS based on theme selection
 */
export const loadThemeCSS = async (_theme: string): Promise<void> => {
  // Only light/dark themes are supported and loaded via index.css
};

/**
 * Load CSS based on screen size and capabilities
 */
export const loadResponsiveCSS = async (): Promise<void> => {
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

  if (isMobile) {
    await loadCSSModule('enhanced-mobile');
  }

  // Only load advanced iOS features on iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    await loadCSSModule('ios-advanced');
  }

  // Load layout enhancements for larger screens
  if (isTablet || !isMobile) {
    await loadCSSModule('layout-enhancements');
  }
};

/**
 * Initialize CSS optimization system
 */
export const initializeCSSOptimization = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('🎨 Initializing CSS Optimization System...');

  // Load responsive CSS based on current device
  await loadResponsiveCSS();

  // Set up resize listener for dynamic loading
  window.addEventListener('resize', () => {
    loadResponsiveCSS();
  });

  // eslint-disable-next-line no-console
  console.log('✅ CSS Optimization System initialized');
};

/**
 * Get current CSS loading status
 */
export const getCSSLoadingStatus = (): {
  loadedModules: string[];
  estimatedSavings: string;
} => {
  const totalModules = 3; // enhanced-mobile, ios-advanced, layout-enhancements
  const loadedCount = loadedCSSModules.size;
  const savingsPercent = Math.round(
    ((totalModules - loadedCount) / totalModules) * 100
  );

  return {
    loadedModules: Array.from(loadedCSSModules),
    estimatedSavings: `${savingsPercent}% CSS not loaded (estimated ${Math.round(
      127 * (savingsPercent / 100)
    )}KB saved)`,
  };
};
