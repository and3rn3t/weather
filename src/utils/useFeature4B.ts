/**
 * Feature 4B Integration Hook
 * Unified interface for advanced background sync, push notifications, and caching
 */

import { useCallback, useEffect, useState } from 'react';
import { advancedCachingManager } from './advancedCachingManager';
import { backgroundSyncManager } from './backgroundSyncManager';
import { logError } from './logger';
import { pushNotificationManager } from './pushNotificationManager';

interface WeatherData {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

interface Feature4BStats {
  backgroundSync: {
    pendingCount: number;
    isProcessing: boolean;
    lastSync: number | null;
  };
  notifications: {
    permission: NotificationPermission;
    enabled: boolean;
    alertHistory: number;
  };
  caching: {
    hitRate: number;
    entries: number;
    memoryUsage: number;
    recommendations: string[];
  };
}

interface Feature4BSettings {
  backgroundSyncEnabled: boolean;
  notificationsEnabled: boolean;
  advancedCachingEnabled: boolean;
  autoOptimization: boolean;
}

export const useFeature4B = () => {
  const [stats, setStats] = useState<Feature4BStats>({
    backgroundSync: {
      pendingCount: 0,
      isProcessing: false,
      lastSync: null,
    },
    notifications: {
      permission: 'default',
      enabled: false,
      alertHistory: 0,
    },
    caching: {
      hitRate: 0,
      entries: 0,
      memoryUsage: 0,
      recommendations: [],
    },
  });

  const [settings, setSettings] = useState<Feature4BSettings>({
    backgroundSyncEnabled: true,
    notificationsEnabled: true,
    advancedCachingEnabled: true,
    autoOptimization: true,
  });

  /**
   * Update statistics from all components
   */
  const updateStats = useCallback(() => {
    const syncStats = backgroundSyncManager.getSyncStats();
    const notificationStats = pushNotificationManager.getNotificationStats();
    const cacheStats = advancedCachingManager.getStats();
    const cacheRecommendations =
      advancedCachingManager.getCacheRecommendations();

    setStats({
      backgroundSync: {
        pendingCount: syncStats.pendingCount,
        isProcessing: syncStats.isProcessing,
        lastSync: null, // Would be tracked in a real implementation
      },
      notifications: {
        permission: notificationStats.permission,
        enabled: notificationStats.settings.enabled,
        alertHistory: notificationStats.alertHistory.total,
      },
      caching: {
        hitRate: cacheStats.hitRate,
        entries: cacheStats.entries,
        memoryUsage: cacheStats.memoryUsage,
        recommendations: cacheRecommendations,
      },
    });
  }, []);

  /**
   * Initialize Feature 4B components
   */
  const initialize = useCallback(async () => {
    try {
      // Load persisted cache
      await advancedCachingManager.loadPersistedCache();

      // Register background sync
      await backgroundSyncManager.registerBackgroundSync();

      // Request notification permission if needed
      if (
        settings.notificationsEnabled &&
        !pushNotificationManager.isNotificationAvailable()
      ) {
        await pushNotificationManager.requestPermission();
      }

      // Update stats
      updateStats();
    } catch (error) {
      logError('Feature 4B initialization failed:', error);
    }
  }, [settings.notificationsEnabled, updateStats]);

  /**
   * Cache weather data with intelligent strategy
   */
  const cacheWeatherData = useCallback(
    async (
      cityName: string,
      weatherData: WeatherData,
      priority: 'low' | 'medium' | 'high' = 'medium',
    ) => {
      if (!settings.advancedCachingEnabled) return false;

      const cacheKey = `weather-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
      return await advancedCachingManager.set(
        cacheKey,
        weatherData,
        'weather-data',
        priority,
      );
    },
    [settings.advancedCachingEnabled],
  );

  /**
   * Get cached weather data
   */
  const getCachedWeatherData = useCallback(
    async (cityName: string) => {
      if (!settings.advancedCachingEnabled) return null;

      const cacheKey = `weather-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
      return await advancedCachingManager.get(cacheKey, 'weather-data');
    },
    [settings.advancedCachingEnabled],
  );

  /**
   * Queue background sync request
   */
  const queueBackgroundSync = useCallback(
    (
      type: 'weather-update' | 'city-search' | 'location-fetch',
      data:
        | { cityName: string; latitude: number; longitude: number }
        | { query: string }
        | { latitude: number; longitude: number },
      priority: 'high' | 'medium' | 'low' = 'medium',
    ) => {
      if (!settings.backgroundSyncEnabled) return;

      backgroundSyncManager.queueRequest(type, data, priority);
      updateStats();
    },
    [settings.backgroundSyncEnabled, updateStats],
  );

  /**
   * Process pending sync requests
   */
  const processPendingSync = useCallback(async () => {
    if (!settings.backgroundSyncEnabled) return null;

    const result = await backgroundSyncManager.processPendingRequests();
    updateStats();
    return result;
  }, [settings.backgroundSyncEnabled, updateStats]);

  /**
   * Send weather alert notification
   */
  const sendWeatherAlert = useCallback(
    async (
      title: string,
      message: string,
      priority: 'low' | 'normal' | 'high' = 'normal',
      weatherData?: WeatherData,
    ) => {
      if (!settings.notificationsEnabled) return false;

      const result = await pushNotificationManager.sendWeatherAlert({
        type: 'severe-weather',
        title,
        message,
        icon: '/icons/icon-192x192.png',
        priority,
        weatherData,
      });

      updateStats();
      return result;
    },
    [settings.notificationsEnabled, updateStats],
  );

  /**
   * Check for severe weather and auto-send alerts
   */
  const checkSevereWeather = useCallback(
    async (weatherData: WeatherData, cityName: string) => {
      if (!settings.notificationsEnabled) return [];

      const alerts =
        await pushNotificationManager.checkAndSendSevereWeatherAlerts(
          weatherData,
          cityName,
        );
      updateStats();
      return alerts;
    },
    [settings.notificationsEnabled, updateStats],
  );

  /**
   * Optimize cache performance
   */
  const optimizeCache = useCallback(async () => {
    if (!settings.advancedCachingEnabled) return null;

    const result = await advancedCachingManager.optimize();
    updateStats();
    return result;
  }, [settings.advancedCachingEnabled, updateStats]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async () => {
    await advancedCachingManager.clear();
    updateStats();
  }, [updateStats]);

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(
    (
      newSettings: Partial<
        typeof pushNotificationManager.getNotificationSettings
      >,
    ) => {
      pushNotificationManager.updateNotificationSettings(newSettings);
      updateStats();
    },
    [updateStats],
  );

  /**
   * Update Feature 4B settings
   */
  const updateSettings = useCallback(
    (newSettings: Partial<Feature4BSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    },
    [],
  );

  /**
   * Auto-optimization based on performance metrics
   */
  const autoOptimize = useCallback(async () => {
    if (!settings.autoOptimization) return;

    const cacheStats = advancedCachingManager.getStats();

    // Auto-optimize if cache hit rate is low
    if (cacheStats.hitRate < 0.6 && cacheStats.entries > 10) {
      await optimizeCache();
    }

    // Process pending sync if queue is getting large
    const syncStats = backgroundSyncManager.getSyncStats();
    if (syncStats.pendingCount > 10 && !syncStats.isProcessing) {
      await processPendingSync();
    }
  }, [settings.autoOptimization, optimizeCache, processPendingSync]);

  /**
   * Get performance recommendations
   */
  const getPerformanceRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (stats.caching.hitRate < 0.6) {
      recommendations.push('Enable predictive caching for better performance');
    }

    if (stats.backgroundSync.pendingCount > 5) {
      recommendations.push('Process pending background sync requests');
    }

    if (
      stats.notifications.permission !== 'granted' &&
      settings.notificationsEnabled
    ) {
      recommendations.push('Grant notification permission for weather alerts');
    }

    if (stats.caching.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('Consider clearing cache to free memory');
    }

    return [...recommendations, ...stats.caching.recommendations];
  }, [stats, settings.notificationsEnabled]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-optimization timer
  useEffect(() => {
    if (!settings.autoOptimization) return;

    const interval = setInterval(autoOptimize, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [settings.autoOptimization, autoOptimize]);

  // Stats update timer
  useEffect(() => {
    const interval = setInterval(updateStats, 30 * 1000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    // State
    stats,
    settings,

    // Actions
    initialize,
    updateStats,
    updateSettings,

    // Caching
    cacheWeatherData,
    getCachedWeatherData,
    optimizeCache,
    clearCache,

    // Background Sync
    queueBackgroundSync,
    processPendingSync,

    // Notifications
    sendWeatherAlert,
    checkSevereWeather,
    updateNotificationSettings,

    // Optimization
    autoOptimize,
    getPerformanceRecommendations,
  };
};
