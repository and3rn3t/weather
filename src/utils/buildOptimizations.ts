/**
 * Build-time optimizations and production enhancements
 *
 * This module provides utilities for optimizing the app in production builds,
 * including console.log removal, performance monitoring, and bundle optimization.
 */

// Production console.log suppression
const isProduction = import.meta.env.PROD;

// Create optimized console functions for production
const noop = (): void => {};
export const prodConsole = {
  // eslint-disable-next-line no-console
  log: isProduction ? noop : console.log,
  // eslint-disable-next-line no-console
  warn: isProduction ? noop : console.warn,
  // eslint-disable-next-line no-console
  error: console.error, // Always keep errors
  // eslint-disable-next-line no-console
  info: isProduction ? noop : console.info,
  // eslint-disable-next-line no-console
  debug: isProduction ? noop : console.debug,
  // eslint-disable-next-line no-console
  trace: isProduction ? noop : console.trace,
};

// Bundle size monitoring utility
export interface BundleMetrics {
  timestamp: number;
  userAgent: string;
  memoryUsage?: number;
  performanceEntries: number;
}

export const trackBundleMetrics = (): BundleMetrics => {
  const metrics: BundleMetrics = {
    timestamp: Date.now(),
    userAgent: navigator.userAgent.substring(0, 100), // Truncate for privacy
    performanceEntries: performance.getEntriesByType('navigation').length,
  };

  // Add memory info if available (Chrome only)
  if ('memory' in performance) {
    interface PerformanceMemory {
      usedJSHeapSize: number;
    }
    const memInfo = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (memInfo) {
      metrics.memoryUsage = memInfo.usedJSHeapSize;
    }
  }

  return metrics;
};

// Production-safe telemetry helper
export const safeTelemetry = {
  trackEvent: (event: string, data?: Record<string, unknown>) => {
    if (isProduction) {
      // Only track essential metrics in production
      if (event.includes('error') || event.includes('performance')) {
        prodConsole.log(`[Telemetry] ${event}`, data);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[Dev Telemetry] ${event}`, data);
    }
  },

  trackTiming: (name: string, duration: number) => {
    if (duration > 100) { // Only track slow operations
      prodConsole.log(`[Timing] ${name}: ${duration}ms`);
    }
  },
};

// Code splitting detection utility
export const detectCodeSplitting = () => {
  const scripts = Array.from(document.getElementsByTagName('script'));
  const dynamicScripts = scripts.filter(s => s.src && s.src.includes('chunk'));

  return {
    totalScripts: scripts.length,
    dynamicChunks: dynamicScripts.length,
    isOptimized: dynamicScripts.length > 3, // More than 3 chunks indicates good splitting
  };
};

// Memory usage monitoring for production
export const monitorMemoryUsage = (component: string) => {
  if (!isProduction && 'memory' in performance) {
    interface PerformanceMemory {
      usedJSHeapSize: number;
    }
    const memInfo = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (memInfo) {
      const usageMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);

      if (usageMB > 50) { // Alert if memory usage is high
        prodConsole.warn(`[Memory] High usage in ${component}: ${usageMB}MB`);
      }
    }
  }
};

export { isProduction };
