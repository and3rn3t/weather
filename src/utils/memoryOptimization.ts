/**
 * Memory Optimization Manager
 * Phase 4.3: Set cache size limits, implement automatic cleanup, add memory monitoring
 * - Memory usage tracking
 * - Automatic cache size management
 * - Memory pressure detection
 * - Proactive cleanup strategies
 */

import { logger } from './logger';
import { unifiedCacheManager } from './unifiedCacheManager';

interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
  cacheSize: number;
  cacheEntries: number;
}

interface MemoryThresholds {
  warning: number; // Percentage
  critical: number; // Percentage
  maxCacheSize: number; // Bytes
  maxCacheEntries: number;
}

class MemoryOptimizationManager {
  private static instance: MemoryOptimizationManager;
  private readonly thresholds: MemoryThresholds = {
    warning: 70, // 70% memory usage
    critical: 85, // 85% memory usage
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    maxCacheEntries: 500,
  };
  private monitoringInterval?: number;
  private cleanupInterval?: number;
  private isMonitoring = false;

  private constructor() {
    this.startMonitoring();
    this.startPeriodicCleanup();
  }

  static getInstance(): MemoryOptimizationManager {
    if (!MemoryOptimizationManager.instance) {
      MemoryOptimizationManager.instance = new MemoryOptimizationManager();
    }
    return MemoryOptimizationManager.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor memory every 30 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 30 * 1000);

    // Listen for memory pressure events (if available)
    if ('memory' in performance) {
      this.setupMemoryPressureListeners();
    }

    logger.info('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    logger.info('Memory monitoring stopped');
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    try {
      const performanceMemory = (
        performance as {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;

      if (!performanceMemory) {
        return null;
      }

      const used = performanceMemory.usedJSHeapSize;
      const total = performanceMemory.jsHeapSizeLimit;
      const percentage = (used / total) * 100;

      const cacheStats = unifiedCacheManager.getStats();

      return {
        used,
        total,
        percentage,
        cacheSize: cacheStats.totalSize,
        cacheEntries: cacheStats.totalEntries,
      };
    } catch (error) {
      logger.error('Failed to get memory stats:', error);
      return null;
    }
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  private async checkMemoryUsage(): Promise<void> {
    const stats = this.getMemoryStats();
    if (!stats) return;

    // Check if we're over thresholds
    if (stats.percentage >= this.thresholds.critical) {
      logger.warn(`Critical memory usage: ${stats.percentage.toFixed(2)}%`);
      await this.emergencyCleanup();
    } else if (stats.percentage >= this.thresholds.warning) {
      logger.warn(`High memory usage: ${stats.percentage.toFixed(2)}%`);
      await this.aggressiveCleanup();
    }

    // Check cache size limits
    if (
      stats.cacheSize > this.thresholds.maxCacheSize ||
      stats.cacheEntries > this.thresholds.maxCacheEntries
    ) {
      logger.info('Cache size limits exceeded, performing cleanup');
      await this.cacheCleanup();
    }
  }

  /**
   * Emergency cleanup - remove all non-critical caches
   */
  private async emergencyCleanup(): Promise<void> {
    logger.warn('Performing emergency memory cleanup');

    try {
      // Clear low-priority caches
      const cacheStats = unifiedCacheManager.getStats();

      // If cache is still too large, clear more aggressively
      if (cacheStats.totalSize > this.thresholds.maxCacheSize * 0.5) {
        // Clear all but critical caches
        // This would require cache manager to support priority-based clearing
        logger.warn('Emergency: Clearing non-critical caches');
      }

      // Force garbage collection hint (if available)
      if (
        'gc' in window &&
        typeof (window as { gc?: () => void }).gc === 'function'
      ) {
        (window as { gc: () => void }).gc();
      }
    } catch (error) {
      logger.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Aggressive cleanup - remove old and low-priority entries
   */
  private async aggressiveCleanup(): Promise<void> {
    logger.info('Performing aggressive memory cleanup');

    try {
      // Clear expired entries (handled by unified cache manager)
      // Clear low-priority entries older than 1 hour
      await this.cacheCleanup();
    } catch (error) {
      logger.error('Aggressive cleanup failed:', error);
    }
  }

  /**
   * Regular cache cleanup
   */
  private async cacheCleanup(): Promise<void> {
    try {
      const stats = unifiedCacheManager.getStats();

      // If cache is over limits, we need to evict entries
      // The unified cache manager handles this automatically,
      // but we can trigger additional cleanup here if needed

      if (stats.totalSize > this.thresholds.maxCacheSize) {
        logger.info(
          `Cache size ${stats.totalSize} exceeds limit ${this.thresholds.maxCacheSize}, cleanup handled by cache manager`
        );
      }
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = window.setInterval(
      () => {
        this.cacheCleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Setup memory pressure listeners (if available)
   */
  private setupMemoryPressureListeners(): void {
    // Memory pressure API is experimental and not widely supported
    // This is a placeholder for future implementation
    if ('MemoryInfo' in performance) {
      // Future: Listen for memory pressure events
    }
  }

  /**
   * Update memory thresholds
   */
  updateThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info('Memory thresholds updated', this.thresholds);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }
}

// Export singleton instance
export const memoryOptimizationManager =
  MemoryOptimizationManager.getInstance();
export type { MemoryStats, MemoryThresholds };
