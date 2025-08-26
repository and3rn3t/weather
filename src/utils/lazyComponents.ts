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

// Core heavy weather components - using existing exports from below
export const NativeStatusDisplay = lazy(
  () => import('../utils/NativeStatusDisplay')
);

// Screen Components - Route-based code splitting for better performance
export const LazyHomeScreen = lazy(() => import('../screens/LazyHomeScreen'));
export const LazyWeatherDetailsScreen = lazy(
  () => import('../screens/LazyWeatherDetailsScreen')
);
export const LazySearchScreen = lazy(
  () => import('../screens/LazySearchScreen')
);
export const LazySettingsScreen = lazy(
  () => import('../screens/LazySettingsScreen')
);

// Feature Components - Feature-based code splitting for modular loading
export const HorrorModeFeature = lazy(() => import('../features/HorrorMode'));
export const VoiceSearchFeature = lazy(() => import('../features/VoiceSearch'));
export const AdvancedChartsFeature = lazy(
  () => import('../features/AdvancedCharts')
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

// Performance and Debug Components - Loaded only in development
export const PerformanceDashboard = lazy(
  () => import('../components/PerformanceDashboard')
);

export const MobileDebug = lazy(() => import('../utils/MobileDebug'));

// PWA Components - Loaded only when PWA features are needed
export const PWAStatus = lazy(() => import('../components/PWAStatus'));

export const PWAInstallPrompt = lazy(
  () => import('../components/PWAInstallPrompt')
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
