/**
 * Lazy Component Loader
 * Implements code splitting and lazy loading for heavy weather components
 */

import { lazy } from 'react';

// Large iOS26 Components - Heavy bundle contributors
export const iOS26WeatherInterface = lazy(
  () => import('../components/modernWeatherUI/iOS26WeatherInterface')
);

export const iOS26WeatherDemo = lazy(
  () => import('../components/modernWeatherUI/iOS26WeatherDemo')
);

// Chart and Visualization Components - Heavy calculation components
export const PrecipitationChart = lazy(() =>
  import('../components/optimized/EnhancedWeatherVisualization').then(
    module => ({
      default: module.PrecipitationChart,
    })
  )
);

export const TemperatureTrend = lazy(() =>
  import('../components/optimized/EnhancedWeatherVisualization').then(
    module => ({
      default: module.TemperatureTrend,
    })
  )
);

export const UVIndexBar = lazy(() =>
  import('../components/optimized/EnhancedWeatherVisualization').then(
    module => ({
      default: module.UVIndexBar,
    })
  )
);

export const WindCompass = lazy(() =>
  import('../components/optimized/EnhancedWeatherVisualization').then(
    module => ({
      default: module.WindCompass,
    })
  )
);

// Advanced Components - Loaded only when needed
export const OptimizedMobileWeatherDisplay = lazy(
  () => import('../components/optimized/OptimizedMobileWeatherDisplay')
);

export const IOSComponentShowcase = lazy(
  () => import('../components/modernWeatherUI/IOSComponentShowcase')
);

export const AnimatedWeatherCard = lazy(
  () => import('../components/AnimatedWeatherCard')
);

// Horror Theme Components - Loaded only in horror mode
export const HorrorThemeActivator = lazy(
  () => import('../components/HorrorThemeActivator')
);

/**
 * Bundle size tracking for lazy components
 */
export const trackLazyComponentLoad = (componentName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Track with existing bundle monitor if available
      const globalWindow = window as unknown as {
        bundleSizeMonitor?: { trackLazyComponent: (name: string) => void };
      };
      if (globalWindow.bundleSizeMonitor) {
        globalWindow.bundleSizeMonitor.trackLazyComponent(componentName);
      }

      // Performance tracking (only in development)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          `🚀 Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`
        );
      }
    };
  }

  return () => {}; // No-op for SSR
};
