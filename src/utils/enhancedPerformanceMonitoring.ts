/**
 * Enhanced Performance Monitoring - Phase 3C
 * Real-time performance tracking for CSS optimization and service worker efficiency
 */

interface PerformanceMetrics {
  cssLoadTimes: Record<string, number>;
  cacheHitRates: Record<string, number>;
  bundleSizes: Record<string, number>;
  renderTimes: {
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  optimizationStats: {
    cssChunksLoaded: number;
    totalCSSBytes: number;
    serviceWorkerCacheHits: number;
    memoryUsage: number;
  };
}

class EnhancedPerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observer: PerformanceObserver | null = null;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.metrics = {
      cssLoadTimes: {},
      cacheHitRates: {},
      bundleSizes: {},
      renderTimes: {
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
      },
      optimizationStats: {
        cssChunksLoaded: 0,
        totalCSSBytes: 0,
        serviceWorkerCacheHits: 0,
        memoryUsage: 0,
      },
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize Performance Monitoring
   */
  private initializeMonitoring(): void {
    this.monitorCSSLoading();
    this.monitorRenderTimes();
    this.monitorCacheEfficiency();
    this.monitorMemoryUsage();
    this.setupPeriodicReporting();
  }

  /**
   * Monitor CSS Loading Performance
   */
  private monitorCSSLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    this.observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('.css')) {
          const fileName = this.extractFileName(entry.name);
          this.metrics.cssLoadTimes[fileName] = entry.duration;

          // Track if it was served from cache
          const res = entry as PerformanceResourceTiming & {
            transferSize?: number;
          };
          const wasFromCache = (res.transferSize ?? 0) === 0;
          if (wasFromCache) {
            this.metrics.optimizationStats.serviceWorkerCacheHits++;
          }

          // Track bundle size
          if ((res.transferSize ?? 0) > 0) {
            this.metrics.bundleSizes[fileName] = res.transferSize ?? 0;
            this.metrics.optimizationStats.totalCSSBytes +=
              res.transferSize ?? 0;
          }

          this.logCSSLoadEvent(fileName, entry.duration, wasFromCache);
        }
      });
    });

    this.observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor Core Web Vitals and Render Times
   */
  private monitorRenderTimes(): void {
    // First Paint and First Contentful Paint
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          switch (entry.name) {
            case 'first-paint':
              this.metrics.renderTimes.firstPaint = entry.startTime;
              break;
            case 'first-contentful-paint':
              this.metrics.renderTimes.firstContentfulPaint = entry.startTime;
              break;
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.renderTimes.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Monitor Cache Efficiency
   */
  private monitorCacheEfficiency(): void {
    let cacheHits = 0;
    let totalRequests = 0;

    if ('PerformanceObserver' in window) {
      const cacheObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          totalRequests++;

          // Check if request was served from cache
          const res = entry as PerformanceResourceTiming & {
            transferSize?: number;
          };
          if ((res.transferSize ?? 0) === 0) {
            cacheHits++;
          }

          // Update cache hit rate
          const hitRate =
            totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
          this.metrics.cacheHitRates.overall = hitRate;
        });
      });
      cacheObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Monitor Memory Usage
   */
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const perfWithMemory = performance as Performance & {
          memory?: { usedJSHeapSize: number };
        };
        this.metrics.optimizationStats.memoryUsage =
          perfWithMemory.memory?.usedJSHeapSize ?? 0;
      }, 10000); // Every 10 seconds
    }
  }

  /**
   * Setup Periodic Performance Reporting
   */
  private setupPeriodicReporting(): void {
    // Report every 30 seconds
    setInterval(() => {
      this.generatePerformanceReport();
    }, 30000);

    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.generatePerformanceReport();
      }
    });
  }

  /**
   * Track CSS Chunk Loading
   */
  public trackCSSChunkLoad(
    chunkName: string,
    loadTime: number,
    fromCache: boolean,
  ): void {
    this.metrics.cssLoadTimes[chunkName] = loadTime;
    this.metrics.optimizationStats.cssChunksLoaded++;

    if (fromCache) {
      this.metrics.optimizationStats.serviceWorkerCacheHits++;
    }

    this.logCSSLoadEvent(chunkName, loadTime, fromCache);
  }

  /**
   * Generate Performance Report
   */
  public generatePerformanceReport(): PerformanceReport {
    const totalTime = performance.now() - this.startTime;

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      sessionDuration: totalTime,
      cssOptimization: {
        chunksLoaded: this.metrics.optimizationStats.cssChunksLoaded,
        averageLoadTime: this.calculateAverageLoadTime(),
        totalBytes: this.metrics.optimizationStats.totalCSSBytes,
        cacheHitRate: this.metrics.cacheHitRates.overall || 0,
      },
      renderPerformance: {
        firstPaint: this.metrics.renderTimes.firstPaint,
        firstContentfulPaint: this.metrics.renderTimes.firstContentfulPaint,
        largestContentfulPaint: this.metrics.renderTimes.largestContentfulPaint,
        timeToInteractive: this.calculateTimeToInteractive(),
      },
      memoryUsage: {
        current: this.metrics.optimizationStats.memoryUsage,
        peak: this.calculatePeakMemoryUsage(),
      },
      optimizationEffectiveness: {
        cssReduction: this.calculateCSSReduction(),
        cacheEfficiency: this.metrics.cacheHitRates.overall || 0,
        loadTimeImprovement: this.calculateLoadTimeImprovement(),
      },
    };

    this.reportToAnalytics(report);
    return report;
  }

  /**
   * Calculate Average CSS Load Time
   */
  private calculateAverageLoadTime(): number {
    const loadTimes = Object.values(this.metrics.cssLoadTimes);
    return loadTimes.length > 0
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0;
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTimeToInteractive(): number {
    // Simplified TTI calculation
    return Math.max(
      this.metrics.renderTimes.firstContentfulPaint,
      this.metrics.renderTimes.largestContentfulPaint,
    );
  }

  /**
   * Calculate Peak Memory Usage
   */
  private calculatePeakMemoryUsage(): number {
    // This would be tracked over time in a real implementation
    return this.metrics.optimizationStats.memoryUsage;
  }

  /**
   * Calculate CSS Bundle Size Reduction
   */
  private calculateCSSReduction(): number {
    // Compare against baseline of 127KB (pre-optimization)
    const baselineSize = 127 * 1024; // 127KB
    const currentSize = this.metrics.optimizationStats.totalCSSBytes;

    if (currentSize === 0) return 0;
    return ((baselineSize - currentSize) / baselineSize) * 100;
  }

  /**
   * Calculate Load Time Improvement
   */
  private calculateLoadTimeImprovement(): number {
    // This would compare against historical data
    const averageLoadTime = this.calculateAverageLoadTime();
    const baselineLoadTime = 500; // Assumed baseline in ms

    if (averageLoadTime === 0) return 0;
    return ((baselineLoadTime - averageLoadTime) / baselineLoadTime) * 100;
  }

  /**
   * Extract filename from URL
   */
  private extractFileName(url: string): string {
    return url.split('/').pop() || 'unknown';
  }

  /**
   * Log CSS Load Event
   */
  private logCSSLoadEvent(
    fileName: string,
    duration: number,
    fromCache: boolean,
  ): void {
    // eslint-disable-next-line no-console
    console.log(
      `📊 CSS Load: ${fileName} - ${duration.toFixed(2)}ms ${
        fromCache ? '(cached)' : '(network)'
      }`,
    );
  }

  /**
   * Report to Analytics
   */
  private reportToAnalytics(report: PerformanceReport): void {
    // Send to Dash0 if available
    const dash0 = (
      window as unknown as {
        dash0?: {
          track: (event: string, data: Record<string, unknown>) => void;
        };
      }
    ).dash0;
    if (dash0?.track) {
      dash0.track('performance_report', {
        css_optimization: report.cssOptimization,
        render_performance: report.renderPerformance,
        memory_usage: report.memoryUsage,
      });
    }

    // Log summary for development
    // eslint-disable-next-line no-console
    console.log('📈 Performance Report:', {
      cssChunks: report.cssOptimization.chunksLoaded,
      avgLoadTime: `${report.cssOptimization.averageLoadTime.toFixed(2)}ms`,
      cacheHitRate: `${report.cssOptimization.cacheHitRate.toFixed(1)}%`,
      fcp: `${report.renderPerformance.firstContentfulPaint.toFixed(2)}ms`,
    });
  }

  /**
   * Get Real-time Metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset Metrics
   */
  public resetMetrics(): void {
    this.startTime = performance.now();
    this.metrics = {
      cssLoadTimes: {},
      cacheHitRates: {},
      bundleSizes: {},
      renderTimes: {
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
      },
      optimizationStats: {
        cssChunksLoaded: 0,
        totalCSSBytes: 0,
        serviceWorkerCacheHits: 0,
        memoryUsage: 0,
      },
    };
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Types
interface PerformanceReport {
  timestamp: string;
  sessionDuration: number;
  cssOptimization: {
    chunksLoaded: number;
    averageLoadTime: number;
    totalBytes: number;
    cacheHitRate: number;
  };
  renderPerformance: {
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  };
  memoryUsage: {
    current: number;
    peak: number;
  };
  optimizationEffectiveness: {
    cssReduction: number;
    cacheEfficiency: number;
    loadTimeImprovement: number;
  };
}

// Global instance
let performanceMonitor: EnhancedPerformanceMonitor | null = null;

/**
 * Initialize Enhanced Performance Monitoring
 */
export const initializePerformanceMonitoring =
  (): EnhancedPerformanceMonitor => {
    if (!performanceMonitor) {
      performanceMonitor = new EnhancedPerformanceMonitor();

      // Make available globally for debugging
      if (typeof window !== 'undefined') {
        (
          window as unknown as {
            weatherPerformance?: EnhancedPerformanceMonitor;
          }
        ).weatherPerformance = performanceMonitor;
      }
    }

    return performanceMonitor;
  };

/**
 * Get Performance Monitor Instance
 */
export const getPerformanceMonitor = (): EnhancedPerformanceMonitor | null => {
  return performanceMonitor;
};

/**
 * Generate Performance Report
 */
export const generatePerformanceReport = (): PerformanceReport | null => {
  return performanceMonitor?.generatePerformanceReport() || null;
};

// Global types
declare global {
  interface Window {
    dash0?: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
    weatherPerformance?: EnhancedPerformanceMonitor;
  }
}
