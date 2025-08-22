/**
 * Global Type Declarations
 * Extends global interfaces and window objects
 */

declare global {
  interface Window {
    FORCE_HORROR_NOW?: () => void;
    horror?: () => void;
    bundleSizeMonitor?: {
      trackLazyComponent: (name: string) => void;
      recordBundleMetrics: () => void;
      getBundleStats: () => {
        averageBundleSize: number;
        totalLazyComponents: number;
        averageLazyLoadTime: number;
        memoryTrend: Array<{ timestamp: number; memory: number }>;
        largestChunks: string[];
      };
    };
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export {};
