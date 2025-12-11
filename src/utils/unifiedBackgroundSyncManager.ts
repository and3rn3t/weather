/**
 * Unified Background Sync Manager
 * Phase 1.3: Consolidates backgroundSyncManager and enhancedBackgroundSyncManager
 * - Single source of truth for offline queue
 * - Conflict resolution for concurrent sync operations
 * - Optimized sync frequency based on network conditions
 * - SmartCacheManager integration
 * - Service worker background sync support
 */

import { SmartCacheManager } from '../services/mobile/SmartCacheManager';
import { logger } from './logger';
import { offlineStorage } from './offlineWeatherStorage';
import { optimizedFetchJson } from './optimizedFetch';
import { reverseGeocodeCached } from './reverseGeocodingCache';
import { nominatimQueue, openMeteoQueue } from './apiRequestQueue';

interface SyncTask {
  id: string;
  type: 'weather-update' | 'city-search' | 'location-fetch';
  data:
    | { cityName: string; latitude: number; longitude: number }
    | { query: string }
    | { latitude: number; longitude: number };
  priority: 'high' | 'medium' | 'low';
  retries: number;
  maxRetries: number;
  createdAt: number;
  scheduledAt: number;
  lastAttemptAt?: number;
}

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

interface SyncStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  lastSyncAt: number | null;
  averageLatency: number;
  conflictResolutions: number;
}

class UnifiedBackgroundSyncManager {
  private static instance: UnifiedBackgroundSyncManager;
  private syncQueue: Map<string, SyncTask> = new Map();
  private isOnline = navigator.onLine;
  private isProcessing = false;
  private syncStats: SyncStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingTasks: 0,
    lastSyncAt: null,
    averageLatency: 0,
    conflictResolutions: 0,
  };
  private readonly smartCacheManager: SmartCacheManager;
  private syncIntervalId: number | null = null;
  private readonly STORAGE_KEY = 'weather-pending-sync';
  private readonly STORAGE_STATS_KEY = 'weather-sync-stats';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MS = 5000;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly FAST_SYNC_INTERVAL_MS = 10000; // 10 seconds for high priority
  private currentSyncInterval: number = this.SYNC_INTERVAL_MS;

  private constructor() {
    this.smartCacheManager = new SmartCacheManager();
    this.setupEventListeners();
    this.loadQueueFromStorage();
    this.startPeriodicSync();
  }

  static getInstance(): UnifiedBackgroundSyncManager {
    if (!UnifiedBackgroundSyncManager.instance) {
      UnifiedBackgroundSyncManager.instance =
        new UnifiedBackgroundSyncManager();
    }
    return UnifiedBackgroundSyncManager.instance;
  }

  /**
   * Queue a request for background sync (backward compatible API)
   */
  queueRequest(
    type: SyncTask['type'],
    data: SyncTask['data'],
    priority: SyncTask['priority'] = 'medium'
  ): string {
    return this.queueTask(type, data, priority);
  }

  /**
   * Queue a new sync task
   */
  queueTask(
    type: SyncTask['type'],
    data: SyncTask['data'],
    priority: SyncTask['priority'] = 'medium'
  ): string {
    const taskId = this.generateTaskId();

    // Check for duplicate tasks (conflict detection)
    const existingTask = this.findDuplicateTask(type, data);
    if (existingTask) {
      // Conflict resolution: upgrade priority if new task has higher priority
      if (
        this.getPriorityValue(priority) >
        this.getPriorityValue(existingTask.priority)
      ) {
        existingTask.priority = priority;
        existingTask.scheduledAt = this.calculateScheduledTime(priority);
        this.syncStats.conflictResolutions++;
        logger.info(
          `🔄 Resolved conflict: upgraded task ${existingTask.id} priority`
        );
        this.persistQueue();
        return existingTask.id;
      }
      // Otherwise, return existing task ID
      return existingTask.id;
    }

    const task: SyncTask = {
      id: taskId,
      type,
      data,
      priority,
      retries: 0,
      maxRetries: this.getMaxRetries(type),
      createdAt: Date.now(),
      scheduledAt: this.calculateScheduledTime(priority),
    };

    this.syncQueue.set(taskId, task);
    this.syncStats.totalTasks++;
    this.syncStats.pendingTasks++;

    this.persistQueue();
    logger.info(`📋 Queued ${type} task with priority ${priority}`);

    // Process immediately if online and not busy
    if (this.isOnline && !this.isProcessing) {
      this.processPendingRequests();
    }

    return taskId;
  }

  /**
   * Process all pending requests (backward compatible API)
   */
  async processPendingRequests(): Promise<SyncResult> {
    if (this.isProcessing || !this.isOnline) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: ['Sync already in progress or offline'],
      };
    }

    return this.processQueue();
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<SyncResult> {
    if (this.isProcessing || !this.isOnline) return this.getEmptyResult();

    this.isProcessing = true;
    logger.info('🔄 Starting background sync processing');

    const sortedTasks = this.getSortedTasks();
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const task of sortedTasks) {
        if (Date.now() >= task.scheduledAt) {
          const startTime = Date.now();
          const success = await this.processTask(task);
          const latency = Date.now() - startTime;

          if (success) {
            processed++;
            this.syncStats.completedTasks++;
            this.syncStats.pendingTasks--;
            this.syncStats.lastSyncAt = Date.now();
            this.updateAverageLatency(latency);
            this.syncQueue.delete(task.id);
            logger.info(`✅ Completed ${task.type} task in ${latency}ms`);
          } else {
            task.retries++;
            task.lastAttemptAt = Date.now();

            if (task.retries >= task.maxRetries) {
              failed++;
              this.syncStats.failedTasks++;
              this.syncStats.pendingTasks--;
              this.syncQueue.delete(task.id);
              errors.push(`Task ${task.id} exceeded retry limit`);
              logger.error(
                `❌ Task ${task.type} failed after ${task.maxRetries} attempts`
              );
            } else {
              // Reschedule with exponential backoff
              const backoffDelay = Math.pow(2, task.retries) * 1000;
              task.scheduledAt = Date.now() + backoffDelay;
              logger.warn(
                `⚠️ Task ${task.type} failed, retrying in ${backoffDelay}ms`
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error('❌ Error processing sync queue:', error);
      errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      this.isProcessing = false;
      this.persistQueue();
    }

    // Optimize sync frequency based on queue state
    this.optimizeSyncFrequency();

    return {
      success: errors.length === 0,
      processed,
      failed,
      errors,
    };
  }

  /**
   * Process individual sync task
   */
  private async processTask(task: SyncTask): Promise<boolean> {
    try {
      switch (task.type) {
        case 'weather-update': {
          return await this.processWeatherUpdate(
            task.data as {
              cityName: string;
              latitude: number;
              longitude: number;
            }
          );
        }
        case 'city-search': {
          return await this.processCitySearch(task.data as { query: string });
        }
        case 'location-fetch': {
          return await this.processLocationFetch(
            task.data as { latitude: number; longitude: number }
          );
        }
        default: {
          logger.warn(`Unknown task type: ${task.type}`);
          return false;
        }
      }
    } catch (error) {
      logger.error(`Failed to process ${task.type} task:`, error);
      return false;
    }
  }

  /**
   * Process weather update task
   */
  private async processWeatherUpdate(data: {
    cityName: string;
    latitude: number;
    longitude: number;
  }): Promise<boolean> {
    const { cityName, latitude, longitude } = data;

    try {
      const {
        getStoredUnits,
        getTemperatureUnitParam,
        getWindSpeedUnitParam,
        getPrecipitationUnitParam,
      } = await import('./units');
      const units = getStoredUnits();
      const unit = getTemperatureUnitParam(units);
      const wind = getWindSpeedUnitParam(units);
      const precip = getPrecipitationUnitParam(units);
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&temperature_unit=${unit}&wind_speed_unit=${wind}&precipitation_unit=${precip}&timezone=auto`;

      // Use queued API call
      const weatherData = await openMeteoQueue.enqueue(
        `sync:weather:${cityName}:${latitude},${longitude}`,
        () =>
          optimizedFetchJson<Record<string, unknown>>(
            weatherUrl,
            {},
            `weather:${cityName}:${latitude},${longitude}`
          ),
        'medium'
      );

      // Cache using both systems
      await Promise.all([
        offlineStorage.cacheWeatherData(cityName, weatherData),
        this.smartCacheManager.set(`weather:${cityName}`, weatherData, {
          priority: 'high',
        }),
      ]);

      logger.info(`☁️ Updated weather data for ${cityName}`);
      return true;
    } catch (error) {
      logger.error('Weather update failed:', error);
      return false;
    }
  }

  /**
   * Process city search task
   */
  private async processCitySearch(data: { query: string }): Promise<boolean> {
    const { query } = data;

    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`;

      // Use queued API call
      interface NominatimSearchResult {
        lat: string;
        lon: string;
        display_name?: string;
      }
      const results = await nominatimQueue.enqueue(
        `sync:search:${query}`,
        () =>
          optimizedFetchJson<NominatimSearchResult[]>(
            searchUrl,
            {},
            `search:${query}`
          ),
        'low'
      );

      // Cache the search results
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        const lat = Number.parseFloat(first.lat);
        const lon = Number.parseFloat(first.lon);
        await Promise.all([
          offlineStorage.cacheRecentCity(query, lat, lon),
          this.smartCacheManager.set(`search:${query}`, results, {
            priority: 'medium',
          }),
        ]);
      }

      logger.info(`🔍 Cached search results for "${query}"`);
      return true;
    } catch (error) {
      logger.error('City search failed:', error);
      return false;
    }
  }

  /**
   * Process location fetch task
   */
  private async processLocationFetch(data: {
    latitude: number;
    longitude: number;
  }): Promise<boolean> {
    const { latitude, longitude } = data;

    try {
      // Use cached reverse geocoding
      const location = await reverseGeocodeCached(latitude, longitude);
      const cityName = location.city || 'Current Location';

      // Cache the location
      await Promise.all([
        offlineStorage.cacheRecentCity(cityName, latitude, longitude),
        this.smartCacheManager.set(
          `location:${latitude},${longitude}`,
          location,
          { priority: 'medium' }
        ),
      ]);

      logger.info(`📍 Cached location data for ${latitude}, ${longitude}`);
      return true;
    } catch (error) {
      logger.error('Location fetch failed:', error);
      return false;
    }
  }

  /**
   * Optimize sync frequency based on network conditions and queue state
   */
  private optimizeSyncFrequency(): void {
    const highPriorityCount = Array.from(this.syncQueue.values()).filter(
      t => t.priority === 'high'
    ).length;

    // Use faster interval if there are high priority tasks
    const newInterval =
      highPriorityCount > 0
        ? this.FAST_SYNC_INTERVAL_MS
        : this.SYNC_INTERVAL_MS;

    if (newInterval !== this.currentSyncInterval) {
      this.currentSyncInterval = newInterval;
      this.stopPeriodicSync();
      this.startPeriodicSync();
      logger.info(
        `⚡ Adjusted sync interval to ${newInterval}ms (${highPriorityCount} high priority tasks)`
      );
    }
  }

  /**
   * Find duplicate task to prevent conflicts
   */
  private findDuplicateTask(
    type: SyncTask['type'],
    data: SyncTask['data']
  ): SyncTask | undefined {
    for (const task of this.syncQueue.values()) {
      if (task.type === type && this.isDataEqual(task.data, data)) {
        return task;
      }
    }
    return undefined;
  }

  /**
   * Check if two data objects are equal
   */
  private isDataEqual(
    data1: SyncTask['data'],
    data2: SyncTask['data']
  ): boolean {
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  /**
   * Get priority value for comparison
   */
  private getPriorityValue(priority: SyncTask['priority']): number {
    const order = { high: 3, medium: 2, low: 1 };
    return order[priority];
  }

  /**
   * Get sync statistics (backward compatible)
   */
  getSyncStats() {
    const pendingTasks = Array.from(this.syncQueue.values());
    return {
      pendingCount: pendingTasks.length,
      highPriority: pendingTasks.filter(t => t.priority === 'high').length,
      mediumPriority: pendingTasks.filter(t => t.priority === 'medium').length,
      lowPriority: pendingTasks.filter(t => t.priority === 'low').length,
      isProcessing: this.isProcessing,
      oldestRequest:
        pendingTasks.length > 0
          ? Math.min(...pendingTasks.map(t => t.createdAt))
          : null,
    };
  }

  /**
   * Get enhanced sync statistics
   */
  getStats(): SyncStats {
    return { ...this.syncStats };
  }

  /**
   * Clear all pending requests (backward compatible)
   */
  clearPendingRequests(): void {
    this.clearQueue();
  }

  /**
   * Clear all pending tasks
   */
  clearQueue(): void {
    this.syncQueue.clear();
    this.syncStats.pendingTasks = 0;
    this.persistQueue();
    logger.info('🗑️ Cleared all pending sync tasks');
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<SyncResult> {
    if (this.isOnline) {
      return await this.processPendingRequests();
    } else {
      logger.warn('⚠️ Cannot force sync while offline');
      return this.getEmptyResult();
    }
  }

  /**
   * Register service worker background sync
   */
  async registerBackgroundSync(): Promise<boolean> {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          // @ts-expect-error types may not include sync in some envs
          await registration.sync.register('weather-background-sync');
        }
        return true;
      } catch (error) {
        logger.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('🌐 Connection restored, processing queued tasks');
      this.processPendingRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('📱 Connection lost, queuing tasks for later');
    });

    // Process queue when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processPendingRequests();
      }
    });
  }

  /**
   * Start periodic sync processing
   */
  private startPeriodicSync(): void {
    this.syncIntervalId = window.setInterval(() => {
      if (this.isOnline && this.syncQueue.size > 0 && !this.isProcessing) {
        this.processPendingRequests();
      }
    }, this.currentSyncInterval);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Helper methods
   */
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getMaxRetries(type: SyncTask['type']): number {
    switch (type) {
      case 'weather-update':
        return this.MAX_RETRY_COUNT;
      case 'city-search':
        return 2;
      case 'location-fetch':
        return 2;
      default:
        return 1;
    }
  }

  private calculateScheduledTime(priority: SyncTask['priority']): number {
    const now = Date.now();
    switch (priority) {
      case 'high':
        return now;
      case 'medium':
        return now + 5000; // 5 seconds
      case 'low':
        return now + 30000; // 30 seconds
      default:
        return now;
    }
  }

  private getSortedTasks(): SyncTask[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return Array.from(this.syncQueue.values()).sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.scheduledAt - b.scheduledAt;
    });
  }

  private updateAverageLatency(latency: number): void {
    const count = this.syncStats.completedTasks;
    this.syncStats.averageLatency =
      count > 0
        ? (this.syncStats.averageLatency * (count - 1) + latency) / count
        : latency;
  }

  private persistQueue(): void {
    try {
      const queueData = Array.from(this.syncQueue.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queueData));
      localStorage.setItem(
        this.STORAGE_STATS_KEY,
        JSON.stringify(this.syncStats)
      );
    } catch (error) {
      logger.error('Failed to persist sync queue:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const queueData = localStorage.getItem(this.STORAGE_KEY);
      const statsData = localStorage.getItem(this.STORAGE_STATS_KEY);

      if (queueData) {
        const entries = JSON.parse(queueData);
        this.syncQueue = new Map(entries);
        this.syncStats.pendingTasks = this.syncQueue.size;
      }

      if (statsData) {
        const loadedStats = JSON.parse(statsData);
        this.syncStats = { ...this.syncStats, ...loadedStats };
      }
    } catch (error) {
      logger.error('Failed to load sync queue from storage:', error);
    }
  }

  private getEmptyResult(): SyncResult {
    return {
      success: false,
      processed: 0,
      failed: 0,
      errors: [],
    };
  }
}

// Export singleton instance with backward compatible name
export const backgroundSyncManager = UnifiedBackgroundSyncManager.getInstance();
export const unifiedBackgroundSyncManager =
  UnifiedBackgroundSyncManager.getInstance();

// Export types
export type { SyncResult, SyncStats, SyncTask };
