/**
 * Bundle Size and Performance Monitor
 * Tracks bundle performance and lazy loading efficiency
 */
import { logDebug, logWarn } from './logger';

interface BundleMetrics {
  totalBundleSize: number;
  loadedChunks: string[];
  lazyLoadedComponents: string[];
  memoryUsage: number;
  timestamp: number;
}

interface LazyLoadMetrics {
  componentName: string;
  loadTime: number;
  chunkSize?: number;
  timestamp: number;
}

class BundleSizeMonitor {
  private metrics: BundleMetrics[] = [];
  private lazyLoadMetrics: LazyLoadMetrics[] = [];
  private readonly STORAGE_KEY = 'weather-bundle-metrics';
  private readonly MAX_METRICS = 50;

  /**
   * Record bundle load metrics
   */
  recordBundleMetrics(): void {
    try {
      // Navigation entries available if needed in future
      performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[];
      const resourceEntries = performance.getEntriesByType(
        'resource',
      ) as PerformanceResourceTiming[];

      // Calculate total bundle size from resource entries
      const totalBundleSize = resourceEntries
        .filter(
          entry =>
            entry.name.includes('.js') ||
            entry.name.includes('.css') ||
            entry.name.includes('.wasm'),
        )
        .reduce((total, entry) => {
          // Use transferSize if available, otherwise decodedBodySize
          const resource = entry as PerformanceResourceTiming & {
            transferSize?: number;
            decodedBodySize?: number;
          };
          const size = resource.transferSize ?? resource.decodedBodySize ?? 0;
          return total + size;
        }, 0);

      // Get loaded chunks from resource entries
      const loadedChunks = resourceEntries
        .filter(entry => entry.name.includes('.js'))
        .map(entry => {
          const url = new URL(entry.name);
          return url.pathname.split('/').pop() || 'unknown';
        });

      // Get memory usage if available
      const memoryUsage = this.getCurrentMemoryUsage();

      const metric: BundleMetrics = {
        totalBundleSize,
        loadedChunks,
        lazyLoadedComponents: [], // Will be populated by component tracking
        memoryUsage,
        timestamp: Date.now(),
      };

      this.metrics.push(metric);
      this.cleanup();
      this.persistMetrics();
    } catch (error) {
      logDebug('bundleSizeMonitor.recordBundleMetrics failed', error);
    }
  }

  /**
   * Track lazy component loading
   */
  trackLazyComponent(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      const metric: LazyLoadMetrics = {
        componentName,
        loadTime,
        timestamp: Date.now(),
      };

      this.lazyLoadMetrics.push(metric);

      // Update latest bundle metrics with lazy component
      if (this.metrics.length > 0) {
        const latest = this.metrics[this.metrics.length - 1];
        latest.lazyLoadedComponents.push(componentName);
      }

      this.cleanup();
      this.persistMetrics();
    };
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    try {
      const perfWithMemory = performance as Performance & {
        memory?: { usedJSHeapSize: number };
      };
      if (perfWithMemory.memory) {
        return perfWithMemory.memory.usedJSHeapSize;
      }
    } catch (error) {
      logDebug('bundleSizeMonitor.getCurrentMemoryUsage failed', error);
    }
    return 0;
  }

  /**
   * Cleanup old metrics
   */
  private cleanup(): void {
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    if (this.lazyLoadMetrics.length > this.MAX_METRICS) {
      this.lazyLoadMetrics = this.lazyLoadMetrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Persist metrics to storage
   */
  private persistMetrics(): void {
    try {
      const data = {
        bundleMetrics: this.metrics,
        lazyLoadMetrics: this.lazyLoadMetrics,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logWarn('bundleSizeMonitor.persistMetrics failed', error);
    }
  }

  /**
   * Load persisted metrics
   */
  loadPersistedMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = data.bundleMetrics || [];
        this.lazyLoadMetrics = data.lazyLoadMetrics || [];
      }
    } catch (error) {
      logDebug('bundleSizeMonitor.loadPersistedMetrics failed', error);
    }
  }

  /**
   * Get bundle statistics
   */
  getBundleStats(): {
    averageBundleSize: number;
    totalLazyComponents: number;
    averageLazyLoadTime: number;
    memoryTrend: Array<{ timestamp: number; memory: number }>;
    largestChunks: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageBundleSize: 0,
        totalLazyComponents: 0,
        averageLazyLoadTime: 0,
        memoryTrend: [],
        largestChunks: [],
      };
    }

    // Average bundle size
    const totalSize = this.metrics.reduce(
      (sum, m) => sum + m.totalBundleSize,
      0,
    );
    const averageBundleSize = totalSize / this.metrics.length;

    // Lazy component stats
    const totalLazyComponents = this.lazyLoadMetrics.length;
    const averageLazyLoadTime =
      totalLazyComponents > 0
        ? this.lazyLoadMetrics.reduce((sum, m) => sum + m.loadTime, 0) /
          totalLazyComponents
        : 0;

    // Memory trend
    const memoryTrend = this.metrics.slice(-10).map(m => ({
      timestamp: m.timestamp,
      memory: m.memoryUsage,
    }));

    // Most common chunks (largest bundles)
    const chunkCounts: Record<string, number> = {};
    this.metrics.forEach(m => {
      m.loadedChunks.forEach(chunk => {
        chunkCounts[chunk] = (chunkCounts[chunk] || 0) + 1;
      });
    });

    const largestChunks = Object.entries(chunkCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([chunk]) => chunk);

    return {
      averageBundleSize,
      totalLazyComponents,
      averageLazyLoadTime,
      memoryTrend,
      largestChunks,
    };
  }

  /**
   * Format bundle size for display
   */
  formatBundleSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Check if bundle size is increasing
   */
  isBundleSizeIncreasing(): boolean {
    if (this.metrics.length < 3) return false;

    const recent = this.metrics.slice(-3);
    const [first, second, third] = recent;

    return (
      third.totalBundleSize > second.totalBundleSize &&
      second.totalBundleSize > first.totalBundleSize
    );
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getBundleStats();

    if (stats.averageBundleSize > 1024 * 1024) {
      // > 1MB
      recommendations.push('Consider code splitting for large bundle size');
    }

    if (stats.averageLazyLoadTime > 1000) {
      // > 1 second
      recommendations.push(
        'Lazy loaded components are taking too long to load',
      );
    }

    if (this.isBundleSizeIncreasing()) {
      recommendations.push('Bundle size is consistently increasing');
    }

    if (stats.memoryTrend.length > 0) {
      const latestMemory =
        stats.memoryTrend[stats.memoryTrend.length - 1].memory;
      if (latestMemory > 50 * 1024 * 1024) {
        // > 50MB
        recommendations.push('High memory usage detected');
      }
    }

    return recommendations;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.lazyLoadMetrics = [];
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      logWarn('bundleSizeMonitor.clearMetrics storage remove failed', error);
    }
  }
}

// Export singleton instance
export const bundleSizeMonitor = new BundleSizeMonitor();

// Initialize on load
bundleSizeMonitor.loadPersistedMetrics();

// Record initial bundle metrics after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => bundleSizeMonitor.recordBundleMetrics(), 1000);
  });
}

export type { BundleMetrics, LazyLoadMetrics };
