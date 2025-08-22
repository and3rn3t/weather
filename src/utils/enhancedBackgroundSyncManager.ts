/**
 * Enhanced Background Sync Manager - Phase 5B
 * Integrates with SmartCacheManager for intelligent background updates
 */

import { SmartCacheManager } from '../services/mobile/SmartCacheManager';
import { logger } from './logger';
import { offlineStorage } from './offlineWeatherStorage';

interface SyncTask {
  id: string;
  type: 'weather-update' | 'city-search' | 'location-fetch';
  data: unknown;
  priority: 'high' | 'medium' | 'low';
  retries: number;
  maxRetries: number;
  createdAt: number;
  scheduledAt: number;
}

interface SyncStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  lastSyncAt: number | null;
  averageLatency: number;
}

export class EnhancedBackgroundSyncManager {
  private static instance: EnhancedBackgroundSyncManager;
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
  };
  private readonly smartCacheManager: SmartCacheManager;
  private syncIntervalId: number | null = null;

  private constructor() {
    this.smartCacheManager = new SmartCacheManager();
    this.setupEventListeners();
    this.startPeriodicSync();
    this.loadQueueFromStorage();
  }

  static getInstance(): EnhancedBackgroundSyncManager {
    if (!EnhancedBackgroundSyncManager.instance) {
      EnhancedBackgroundSyncManager.instance =
        new EnhancedBackgroundSyncManager();
    }
    return EnhancedBackgroundSyncManager.instance;
  }

  /**
   * Queue a new sync task
   */
  queueTask(
    type: SyncTask['type'],
    data: unknown,
    priority: SyncTask['priority'] = 'medium'
  ): string {
    const taskId = this.generateTaskId();
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
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline) return;

    this.isProcessing = true;
    logger.info('🔄 Starting background sync processing');

    try {
      const sortedTasks = this.getSortedTasks();

      for (const task of sortedTasks) {
        if (Date.now() >= task.scheduledAt) {
          await this.processTask(task);
        }
      }
    } catch (error) {
      logger.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sync task
   */
  private async processTask(task: SyncTask): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(
        `🔄 Processing ${task.type} task (attempt ${task.retries + 1})`
      );

      switch (task.type) {
        case 'weather-update':
          await this.processWeatherUpdate(task.data as WeatherUpdateData);
          break;
        case 'city-search':
          await this.processCitySearch(task.data as CitySearchData);
          break;
        case 'location-fetch':
          await this.processLocationFetch(task.data as LocationFetchData);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Task completed successfully
      this.syncQueue.delete(task.id);
      this.syncStats.completedTasks++;
      this.syncStats.pendingTasks--;
      this.syncStats.lastSyncAt = Date.now();

      const latency = Date.now() - startTime;
      this.updateAverageLatency(latency);

      logger.info(`✅ Completed ${task.type} task in ${latency}ms`);
    } catch (error) {
      logger.error('❌ Task processing failed:', error);
      task.retries++;

      if (task.retries >= task.maxRetries) {
        // Max retries reached, remove from queue
        this.syncQueue.delete(task.id);
        this.syncStats.failedTasks++;
        this.syncStats.pendingTasks--;
        logger.error(
          `❌ Task ${task.type} failed after ${task.maxRetries} attempts`
        );
      } else {
        // Reschedule with exponential backoff
        task.scheduledAt = Date.now() + Math.pow(2, task.retries) * 1000;
        logger.warn(
          `⚠️ Task ${task.type} failed, retrying in ${Math.pow(
            2,
            task.retries
          )}s`
        );
      }
    }

    this.persistQueue();
  }

  /**
   * Process weather update task
   */
  private async processWeatherUpdate(data: WeatherUpdateData): Promise<void> {
    const { cityName, latitude, longitude } = data;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&temperature_unit=fahrenheit&timezone=auto`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const weatherData = await response.json();

    // Cache using both systems
    await Promise.all([
      offlineStorage.cacheWeatherData(cityName, weatherData),
      this.smartCacheManager.set(`weather:${cityName}`, weatherData, {
        priority: 'high',
      }),
    ]);

    logger.info(`☁️ Updated weather data for ${cityName}`);
  }

  /**
   * Process city search task
   */
  private async processCitySearch(data: CitySearchData): Promise<void> {
    const { query } = data;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const results = await response.json();

    await this.smartCacheManager.set(`search:${query}`, results, {
      priority: 'medium',
    });
    logger.info(`🔍 Cached search results for "${query}"`);
  }

  /**
   * Process location fetch task
   */
  private async processLocationFetch(data: LocationFetchData): Promise<void> {
    const { latitude, longitude } = data;

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const locationData = await response.json();

    await this.smartCacheManager.set(
      `location:${latitude},${longitude}`,
      locationData,
      { priority: 'medium' }
    );

    logger.info(`📍 Cached location data for ${latitude}, ${longitude}`);
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return { ...this.syncStats };
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
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processQueue();
      logger.info('⚡ Forced immediate sync completed');
    } else {
      logger.warn('⚠️ Cannot force sync while offline');
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('🌐 Connection restored, processing queued tasks');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('📱 Connection lost, queuing tasks for later');
    });

    // Process queue when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Start periodic sync processing
   */
  private startPeriodicSync(): void {
    this.syncIntervalId = window.setInterval(() => {
      if (this.isOnline && this.syncQueue.size > 0) {
        this.processQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
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
        return 3;
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
      (this.syncStats.averageLatency * (count - 1) + latency) / count;
  }

  private persistQueue(): void {
    try {
      const queueData = Array.from(this.syncQueue.entries());
      localStorage.setItem('background-sync-queue', JSON.stringify(queueData));
      localStorage.setItem(
        'background-sync-stats',
        JSON.stringify(this.syncStats)
      );
    } catch (error) {
      logger.error('Failed to persist sync queue:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const queueData = localStorage.getItem('background-sync-queue');
      const statsData = localStorage.getItem('background-sync-stats');

      if (queueData) {
        const entries = JSON.parse(queueData);
        this.syncQueue = new Map(entries);
      }

      if (statsData) {
        this.syncStats = { ...this.syncStats, ...JSON.parse(statsData) };
      }
    } catch (error) {
      logger.error('Failed to load sync queue from storage:', error);
    }
  }
}

// Type definitions for task data
interface WeatherUpdateData {
  cityName: string;
  latitude: number;
  longitude: number;
}

interface CitySearchData {
  query: string;
}

interface LocationFetchData {
  latitude: number;
  longitude: number;
}

// Export singleton instance
export const enhancedBackgroundSyncManager =
  EnhancedBackgroundSyncManager.getInstance();
export type {
  CitySearchData,
  LocationFetchData,
  SyncStats,
  SyncTask,
  WeatherUpdateData,
};
