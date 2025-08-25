/**
 * Performance Monitor for Search Enhancement Features
 *
 * Provides comprehensive performance tracking, analysis, and optimization
 * for all search-related functionality including memory management.
 */

// Performance Configuration
const PERFORMANCE_CONFIG = {
  // Sampling rates
  SAMPLING_RATE: 0.1, // 10% sampling for production
  DEBUG_SAMPLING_RATE: 1.0, // 100% sampling for development

  // Thresholds (in milliseconds)
  THRESHOLDS: {
    SEARCH_QUERY: 500, // Search should complete under 500ms
    AUTOCORRECT: 100, // Autocorrect should complete under 100ms
    VOICE_RECOGNITION: 2000, // Voice recognition timeout
    CACHE_RETRIEVAL: 50, // Cache access should be under 50ms
    API_REQUEST: 5000, // API requests timeout
    MEMORY_USAGE: 50 * 1024 * 1024, // 50MB memory limit
  },

  // Collection intervals
  COLLECTION_INTERVAL: 30000, // Collect metrics every 30 seconds
  CLEANUP_INTERVAL: 300000, // Cleanup old metrics every 5 minutes
  REPORT_INTERVAL: 60000, // Send performance reports every minute

  // Storage limits
  MAX_METRICS_STORED: 1000,
  MAX_MEMORY_SAMPLES: 100,
  METRICS_TTL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Performance Metric Types
interface PerformanceMetric {
  id: string;
  type: string;
  name: string;
  value: number;
  timestamp: number;
  details?: Record<string, unknown>;
  tags?: string[];
}

interface MemoryMetric {
  timestamp: number;
  used: number;
  total: number;
  limit: number;
  heapUsed?: number;
  heapTotal?: number;
  external?: number;
}

interface SearchPerformanceData {
  query: string;
  duration: number;
  source: 'api' | 'cache' | 'popular' | 'autocorrect' | 'voice';
  resultCount: number;
  cacheHit: boolean;
  accuracy?: number;
  confidence?: number;
}

interface PerformanceSummary {
  averageSearchTime: number;
  cacheHitRate: number;
  memoryUsage: MemoryMetric;
  errorRate: number;
  totalSearches: number;
  performanceScore: number;
  recommendations: string[];
}

/**
 * Advanced Performance Monitor
 * Tracks and analyzes all search enhancement performance metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private isCollecting = false;
  private collectionTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private reportTimer: NodeJS.Timeout | null = null;
  private observer: PerformanceObserver | null = null;
  private memoryObserver: NodeJS.Timeout | null = null;

  // Performance tracking state
  private activeOperations = new Map<string, number>();
  private searchCache = new Map<string, SearchPerformanceData>();
  private errorCount = 0;
  private totalOperations = 0;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.isCollecting) return;

    try {
      this.setupPerformanceObserver();
      this.setupMemoryMonitoring();
      this.startPeriodicCollection();
      this.isCollecting = true;

      console.log('📊 Performance Monitor initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Monitor:', error);
    }
  }

  /**
   * Setup Performance Observer for browser performance metrics
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported in this environment');
      return;
    }

    try {
      this.observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (this.shouldSample()) {
            this.recordMetric({
              id: this.generateId(),
              type: 'performance',
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              details: {
                entryType: entry.entryType,
                startTime: entry.startTime,
                ...this.extractPerformanceDetails(entry),
              },
              tags: ['browser', entry.entryType],
            });
          }
        });
      });

      // Observe different types of performance entries
      this.observer.observe({
        entryTypes: ['measure', 'navigation', 'resource', 'paint'],
      });
    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    this.memoryObserver = setInterval(() => {
      this.collectMemoryMetrics();
    }, PERFORMANCE_CONFIG.COLLECTION_INTERVAL);
  }

  /**
   * Start periodic metric collection and cleanup
   */
  private startPeriodicCollection(): void {
    // Periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, PERFORMANCE_CONFIG.CLEANUP_INTERVAL);

    // Periodic reporting
    this.reportTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, PERFORMANCE_CONFIG.REPORT_INTERVAL);
  }

  /**
   * Track search operation start
   */
  startSearchOperation(
    operationId: string,
    type: string,
    details?: Record<string, unknown>
  ): void {
    const startTime = performance.now();
    this.activeOperations.set(operationId, startTime);

    // Record operation start
    this.recordMetric({
      id: this.generateId(),
      type: 'search_operation_start',
      name: type,
      value: startTime,
      timestamp: Date.now(),
      details: {
        operationId,
        ...details,
      },
      tags: ['search', 'start', type],
    });
  }

  /**
   * Track search operation completion
   */
  endSearchOperation(
    operationId: string,
    type: string,
    data: Partial<SearchPerformanceData>
  ): number {
    const endTime = performance.now();
    const startTime = this.activeOperations.get(operationId);

    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.activeOperations.delete(operationId);
    this.totalOperations++;

    // Record operation completion
    const searchData: SearchPerformanceData = {
      query: data.query || '',
      duration,
      source: data.source || 'api',
      resultCount: data.resultCount || 0,
      cacheHit: data.cacheHit || false,
      accuracy: data.accuracy,
      confidence: data.confidence,
    };

    this.searchCache.set(operationId, searchData);

    this.recordMetric({
      id: this.generateId(),
      type: 'search_operation_complete',
      name: type,
      value: duration,
      timestamp: Date.now(),
      details: {
        operationId,
        ...searchData,
      },
      tags: ['search', 'complete', type, data.source || 'api'],
    });

    // Check performance thresholds
    this.checkPerformanceThreshold(type, duration);

    return duration;
  }

  /**
   * Track search errors
   */
  recordSearchError(
    type: string,
    error: Error,
    details?: Record<string, unknown>
  ): void {
    this.errorCount++;

    this.recordMetric({
      id: this.generateId(),
      type: 'search_error',
      name: type,
      value: 1,
      timestamp: Date.now(),
      details: {
        error: error.message,
        stack: error.stack,
        ...details,
      },
      tags: ['search', 'error', type],
    });
  }

  /**
   * Track memory usage patterns
   */
  recordMemoryUsage(context: string, details?: Record<string, unknown>): void {
    if ('memory' in performance) {
      const perf = performance as unknown as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      const memory = perf.memory ?? {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: PERFORMANCE_CONFIG.THRESHOLDS.MEMORY_USAGE,
      };

      this.recordMetric({
        id: this.generateId(),
        type: 'memory_usage',
        name: context,
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        details: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          ...details,
        },
        tags: ['memory', context],
      });
    }
  }

  /**
   * Collect comprehensive memory metrics
   */
  private collectMemoryMetrics(): void {
    let memoryMetric: MemoryMetric = {
      timestamp: Date.now(),
      used: 0,
      total: 0,
      limit: PERFORMANCE_CONFIG.THRESHOLDS.MEMORY_USAGE,
    };

    // Browser memory API
    if ('memory' in performance) {
      const perf = performance as unknown as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      const memory = perf.memory ?? {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: PERFORMANCE_CONFIG.THRESHOLDS.MEMORY_USAGE,
      };
      memoryMetric = {
        ...memoryMetric,
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
      };
    }

    // Estimate memory usage for Node.js environments
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const nodeMemory = process.memoryUsage();
      memoryMetric = {
        ...memoryMetric,
        heapUsed: nodeMemory.heapUsed,
        heapTotal: nodeMemory.heapTotal,
        external: nodeMemory.external,
        used: nodeMemory.heapUsed,
        total: nodeMemory.heapTotal + nodeMemory.external,
      };
    }

    this.memoryMetrics.push(memoryMetric);

    // Limit stored memory metrics
    if (this.memoryMetrics.length > PERFORMANCE_CONFIG.MAX_MEMORY_SAMPLES) {
      this.memoryMetrics = this.memoryMetrics.slice(
        -PERFORMANCE_CONFIG.MAX_MEMORY_SAMPLES
      );
    }

    // Check memory thresholds
    if (memoryMetric.used > PERFORMANCE_CONFIG.THRESHOLDS.MEMORY_USAGE) {
      this.recordMetric({
        id: this.generateId(),
        type: 'memory_warning',
        name: 'high_memory_usage',
        value: memoryMetric.used,
        timestamp: Date.now(),
        // @ts-expect-error - Type compatibility issue
        details: memoryMetric,
        tags: ['memory', 'warning'],
      });
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Limit stored metrics
    if (this.metrics.length > PERFORMANCE_CONFIG.MAX_METRICS_STORED) {
      this.metrics = this.metrics.slice(-PERFORMANCE_CONFIG.MAX_METRICS_STORED);
    }
  }

  /**
   * Check if measurement should be sampled
   */
  private shouldSample(): boolean {
    const rate =
      process.env.NODE_ENV === 'development'
        ? PERFORMANCE_CONFIG.DEBUG_SAMPLING_RATE
        : PERFORMANCE_CONFIG.SAMPLING_RATE;

    return Math.random() < rate;
  }

  /**
   * Check performance threshold violations
   */
  private checkPerformanceThreshold(type: string, duration: number): void {
    const threshold = this.getThresholdForType(type);

    if (threshold && duration > threshold) {
      this.recordMetric({
        id: this.generateId(),
        type: 'performance_warning',
        name: `slow_${type}`,
        value: duration,
        timestamp: Date.now(),
        details: {
          threshold,
          overage: duration - threshold,
        },
        tags: ['performance', 'warning', type],
      });
    }
  }

  /**
   * Get performance threshold for operation type
   */
  private getThresholdForType(type: string): number | null {
    const typeMap: Record<string, keyof typeof PERFORMANCE_CONFIG.THRESHOLDS> =
      {
        search_query: 'SEARCH_QUERY',
        autocorrect: 'AUTOCORRECT',
        voice_recognition: 'VOICE_RECOGNITION',
        cache_retrieval: 'CACHE_RETRIEVAL',
        api_request: 'API_REQUEST',
      };

    const thresholdKey = typeMap[type];
    return thresholdKey ? PERFORMANCE_CONFIG.THRESHOLDS[thresholdKey] : null;
  }

  /**
   * Extract additional details from performance entries
   */
  private extractPerformanceDetails(
    entry: PerformanceEntry
  ): Record<string, unknown> {
    const details: Record<string, unknown> = {};

    // Navigation timing details
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      details.domContentLoaded =
        navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
      details.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
    }

    // Resource timing details
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      details.transferSize = resourceEntry.transferSize;
      details.encodedBodySize = resourceEntry.encodedBodySize;
      details.decodedBodySize = resourceEntry.decodedBodySize;
    }

    return details;
  }

  /**
   * Generate performance summary report
   */
  generatePerformanceReport(): PerformanceSummary {
    const searchMetrics = Array.from(this.searchCache.values());
    const latestMemory = this.memoryMetrics[this.memoryMetrics.length - 1] || {
      timestamp: Date.now(),
      used: 0,
      total: 0,
      limit: 0,
    };

    // Calculate averages
    const searchTimes = searchMetrics.map(m => m.duration);
    const averageSearchTime =
      searchTimes.length > 0
        ? searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length
        : 0;

    const cacheHits = searchMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate =
      searchMetrics.length > 0 ? cacheHits / searchMetrics.length : 0;

    const errorRate =
      this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0;

    // Calculate performance score (0-100)
    const performanceScore = this.calculatePerformanceScore({
      averageSearchTime,
      cacheHitRate,
      errorRate,
      memoryUsage: latestMemory.used / latestMemory.limit,
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averageSearchTime,
      cacheHitRate,
      errorRate,
      memoryUsage: latestMemory.used,
    });

    const summary: PerformanceSummary = {
      averageSearchTime,
      cacheHitRate,
      memoryUsage: latestMemory,
      errorRate,
      totalSearches: searchMetrics.length,
      performanceScore,
      recommendations,
    };

    // Log summary for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Summary:', summary);
    }

    return summary;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: {
    averageSearchTime: number;
    cacheHitRate: number;
    errorRate: number;
    memoryUsage: number;
  }): number {
    let score = 100;

    // Search time penalty (0-30 points)
    const searchTimePenalty = Math.min(
      30,
      (metrics.averageSearchTime / 1000) * 10
    );
    score -= searchTimePenalty;

    // Cache hit rate bonus (0-20 points)
    const cacheBonus = metrics.cacheHitRate * 20;
    score += cacheBonus - 20; // Subtract 20 to make it penalty-based

    // Error rate penalty (0-25 points)
    const errorPenalty = Math.min(25, metrics.errorRate * 100);
    score -= errorPenalty;

    // Memory usage penalty (0-25 points)
    const memoryPenalty = Math.min(25, metrics.memoryUsage * 25);
    score -= memoryPenalty;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: {
    averageSearchTime: number;
    cacheHitRate: number;
    errorRate: number;
    memoryUsage: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.averageSearchTime > 500) {
      recommendations.push(
        'Consider optimizing search algorithms or implementing better caching'
      );
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push(
        'Improve cache strategy to increase hit rate above 50%'
      );
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push(
        'Investigate and fix search errors (>5% error rate detected)'
      );
    }

    if (
      metrics.memoryUsage >
      PERFORMANCE_CONFIG.THRESHOLDS.MEMORY_USAGE * 0.8
    ) {
      recommendations.push('Monitor memory usage - approaching 80% of limit');
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Performance is optimal - no immediate improvements needed'
      );
    }

    return recommendations;
  }

  /**
   * Get metrics from recent time period
   */
  private getRecentMetrics(timeWindow: number): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - PERFORMANCE_CONFIG.METRICS_TTL;

    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.memoryMetrics = this.memoryMetrics.filter(
      metric => metric.timestamp >= cutoff
    );

    // Clear old search cache entries
    const oldOperations = Array.from(this.searchCache.entries())
      .filter(
        ([, data]) =>
          Date.now() - data.duration > PERFORMANCE_CONFIG.METRICS_TTL
      )
      .map(([id]) => id);

    oldOperations.forEach(id => this.searchCache.delete(id));

    console.log(
      `🧹 Cleaned up ${oldOperations.length} old performance metrics`
    );
  }

  /**
   * Generate unique identifier
   */
  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(filter?: {
    type?: string;
    timeRange?: { start: number; end: number };
    tags?: string[];
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filter?.type) {
      filtered = filtered.filter(m => m.type === filter.type);
    }

    if (filter?.timeRange) {
      const start = filter.timeRange?.start ?? Number.NEGATIVE_INFINITY;
      const end = filter.timeRange?.end ?? Number.POSITIVE_INFINITY;
      filtered = filtered.filter(
        m => m.timestamp >= start && m.timestamp <= end
      );
    }

    if (filter?.tags && filter.tags.length > 0) {
      const tags = filter.tags ?? [];
      filtered = filtered.filter(m => m.tags?.some(tag => tags.includes(tag)));
    }

    return filtered;
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemoryMetric[] {
    return [...this.memoryMetrics];
  }

  /**
   * Reset all metrics and counters
   */
  reset(): void {
    this.metrics = [];
    this.memoryMetrics = [];
    this.searchCache.clear();
    this.activeOperations.clear();
    this.errorCount = 0;
    this.totalOperations = 0;

    console.log('🔄 Performance Monitor reset successfully');
  }

  /**
   * Stop performance monitoring and cleanup
   */
  destroy(): void {
    this.isCollecting = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    if (this.memoryObserver) {
      clearInterval(this.memoryObserver);
      this.memoryObserver = null;
    }

    this.reset();
    console.log('🔌 Performance Monitor destroyed');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types for use in other modules
export type {
  MemoryMetric,
  PerformanceMetric,
  PerformanceSummary,
  SearchPerformanceData,
};
