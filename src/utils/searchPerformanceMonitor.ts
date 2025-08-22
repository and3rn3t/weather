/**
 * Search Performance Monitor
 * Tracks search performance metrics and memory usage
 */

interface SearchPerformanceMetrics {
  searchType: string;
  duration: number;
  timestamp: number;
  resultsCount: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

interface PerformanceStats {
  averageLatency: number;
  totalSearches: number;
  searchTypes: Record<string, number>;
  memoryTrend: Array<{ timestamp: number; used: number }>;
}

class SearchPerformanceMonitor {
  private metrics: SearchPerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 searches
  private readonly STORAGE_KEY = 'weather-search-performance';

  /**
   * Start tracking a search operation
   */
  startSearch(searchType: string): string {
    const trackingId = `search-${searchType}-${Date.now()}`;
    performance.mark(`${trackingId}-start`);
    return trackingId;
  }

  /**
   * End tracking and record metrics
   */
  endSearch(
    trackingId: string,
    searchType: string,
    resultsCount: number = 0
  ): SearchPerformanceMetrics {
    const endMark = `${trackingId}-end`;
    performance.mark(endMark);

    try {
      performance.measure(trackingId, `${trackingId}-start`, endMark);
      const measure = performance.getEntriesByName(trackingId)[0];
      const duration = measure?.duration || 0;

      const metric: SearchPerformanceMetrics = {
        searchType,
        duration,
        timestamp: Date.now(),
        resultsCount,
        memoryUsage: this.getMemoryUsage(),
      };

      this.recordMetric(metric);
      this.cleanup();

      return metric;
    } catch (error) {
      // Fallback metric if performance API fails
      return {
        searchType,
        duration: 0,
        timestamp: Date.now(),
        resultsCount,
      };
    }
  }

  /**
   * Record search metric
   */
  private recordMetric(metric: SearchPerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Persist to localStorage for analysis
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      // Storage quota exceeded or disabled - continue without persistence
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): SearchPerformanceMetrics['memoryUsage'] {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }
    return undefined;
  }

  /**
   * Clean up old performance entries
   */
  private cleanup(): void {
    try {
      // Clear old performance entries to prevent memory leaks
      const entries = performance.getEntriesByType('measure');
      if (entries.length > 50) {
        performance.clearMeasures();
      }
    } catch (error) {
      // Cleanup failed - continue without clearing
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const totalSearches = this.metrics.length;

    if (totalSearches === 0) {
      return {
        averageLatency: 0,
        totalSearches: 0,
        searchTypes: {},
        memoryTrend: [],
      };
    }

    // Calculate average latency
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageLatency = totalDuration / totalSearches;

    // Count search types
    const searchTypes: Record<string, number> = {};
    this.metrics.forEach(m => {
      searchTypes[m.searchType] = (searchTypes[m.searchType] || 0) + 1;
    });

    // Memory trend (last 10 measurements with memory data)
    const memoryTrend = this.metrics
      .filter(m => m.memoryUsage)
      .slice(-10)
      .map(m => ({
        timestamp: m.timestamp,
        used: m.memoryUsage!.used,
      }));

    return {
      averageLatency,
      totalSearches,
      searchTypes,
      memoryTrend,
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 10): SearchPerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      performance.clearMeasures();
      performance.clearMarks();
    } catch (error) {
      // Cleanup failed - continue
    }
  }

  /**
   * Load persisted metrics
   */
  loadPersistedMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.metrics = parsed.slice(-this.MAX_METRICS);
        }
      }
    } catch (error) {
      // Failed to load - start fresh
      this.metrics = [];
    }
  }

  /**
   * Check if performance is degrading
   */
  isPerformanceDegrading(): boolean {
    if (this.metrics.length < 10) return false;

    const recent = this.metrics.slice(-5);
    const previous = this.metrics.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const previousAvg =
      previous.reduce((sum, m) => sum + m.duration, 0) / previous.length;

    // Performance is degrading if recent searches are 50% slower
    return recentAvg > previousAvg * 1.5;
  }
}

// Export singleton instance
export const searchPerformanceMonitor = new SearchPerformanceMonitor();

// Load persisted metrics on initialization
searchPerformanceMonitor.loadPersistedMetrics();

export type { PerformanceStats, SearchPerformanceMetrics };
