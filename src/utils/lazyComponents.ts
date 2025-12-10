/**
 * Enhanced Lazy Component Loader
 * Implements advanced code splitting, lazy loading, and performance monitoring
 * for heavy weather components with loading states and error handling
 */

import { lazy, ComponentType } from 'react';
import { safeTelemetry } from './buildOptimizations';

// Enhanced lazy loading with performance tracking
const createLazyComponent = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) => {
  return lazy(async () => {
    const startTime = performance.now();
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;

      safeTelemetry.trackTiming(`lazy-load-${componentName}`, loadTime);

      return module;
    } catch (error) {
      safeTelemetry.trackEvent('lazy-load-error', {
        component: componentName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

// Large iOS26 Components - Heavy bundle contributors
export const iOS26WeatherInterface = createLazyComponent(
  () => import('../components/modernWeatherUI/iOS26WeatherInterface'),
  'iOS26WeatherInterface'
);

export const iOS26WeatherDemo = createLazyComponent(
  () => import('../components/modernWeatherUI/iOS26WeatherDemo'),
  'iOS26WeatherDemo'
);

// Core heavy weather components
export const NativeStatusDisplay = createLazyComponent(
  () => import('../utils/NativeStatusDisplay'),
  'NativeStatusDisplay'
);

// Screen Components - Route-based code splitting for better performance
export const LazyHomeScreen = createLazyComponent(
  () => import('../screens/LazyHomeScreen'),
  'LazyHomeScreen'
);

export const LazyWeatherDetailsScreen = createLazyComponent(
  () => import('../screens/LazyWeatherDetailsScreen'),
  'LazyWeatherDetailsScreen'
);

export const LazySearchScreen = createLazyComponent(
  () => import('../screens/LazySearchScreen'),
  'LazySearchScreen'
);

export const LazySettingsScreen = createLazyComponent(
  () => import('../screens/LazySettingsScreen'),
  'LazySettingsScreen'
);

// Feature Components - Feature-based code splitting for modular loading
export const VoiceSearchFeature = createLazyComponent(
  () => import('../features/VoiceSearch'),
  'VoiceSearchFeature'
);

export const AdvancedChartsFeature = createLazyComponent(
  () => import('../features/AdvancedCharts'),
  'AdvancedChartsFeature'
);

// Chart and Visualization Components - Heavy calculation components
export const PrecipitationChart = createLazyComponent(
  () =>
    import('../components/optimized/EnhancedWeatherVisualization').then(
      module => ({
        default: module.PrecipitationChart,
      })
    ),
  'PrecipitationChart'
);

export const TemperatureTrend = createLazyComponent(
  () =>
    import('../components/optimized/EnhancedWeatherVisualization').then(
      module => ({
        default: module.TemperatureTrend,
      })
    ),
  'TemperatureTrend'
);

export const UVIndexBar = createLazyComponent(
  () =>
    import('../components/optimized/EnhancedWeatherVisualization').then(
      module => ({
        default: module.UVIndexBar,
      })
    ),
  'UVIndexBar'
);

export const WindCompass = createLazyComponent(
  () =>
    import('../components/optimized/EnhancedWeatherVisualization').then(
      module => ({
        default: module.WindCompass,
      })
    ),
  'WindCompass'
);

// Advanced Components - Loaded only when needed
export const OptimizedMobileWeatherDisplay = createLazyComponent(
  () => import('../components/optimized/OptimizedMobileWeatherDisplay'),
  'OptimizedMobileWeatherDisplay'
);

export const IOSComponentShowcase = createLazyComponent(
  () => import('../components/modernWeatherUI/IOSComponentShowcase'),
  'IOSComponentShowcase'
);

export const AnimatedWeatherCard = createLazyComponent(
  () => import('../components/AnimatedWeatherCard'),
  'AnimatedWeatherCard'
);

// Performance and Debug Components - Loaded only in development
export const PerformanceDashboard = createLazyComponent(
  () => import('../components/PerformanceDashboard'),
  'PerformanceDashboard'
);

export const MobileDebug = createLazyComponent(
  () => import('../utils/MobileDebug'),
  'MobileDebug'
);

// PWA Components - Loaded only when PWA features are needed
export const PWAStatus = createLazyComponent(
  () => import('../components/PWAStatus'),
  'PWAStatus'
);

export const PWAInstallPrompt = createLazyComponent(
  () => import('../components/PWAInstallPrompt'),
  'PWAInstallPrompt'
);

// Theme-specific components removed; only light/dark supported

// Theme-specific components removed; only light/dark supported

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
