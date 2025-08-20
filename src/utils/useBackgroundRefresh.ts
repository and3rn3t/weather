/**
 * Background Refresh Hook
 *
 * React hook wrapper for the BackgroundRefreshService
 * Provides easy integration with React components and proper cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import { logInfo } from './logger';

  BackgroundRefreshService,
  createBackgroundRefreshService,
  type BackgroundRefreshConfig,
  type RefreshStats,
} from './backgroundRefreshService';

/**
 * Hook options for background refresh
 */
export interface UseBackgroundRefreshOptions
  extends Partial<BackgroundRefreshConfig> {
  enabled?: boolean; // Enable/disable the service
  onRefreshStart?: () => void; // Callback when refresh starts
  onRefreshComplete?: (success: boolean) => void; // Callback when refresh completes
  onRefreshError?: (error: Error) => void; // Callback on refresh error
}

/**
 * Hook return value
 */
export interface BackgroundRefreshHook {
  // Actions
  manualRefresh: () => Promise<void>;
  updateConfig: (config: Partial<BackgroundRefreshConfig>) => void;

  // Status
  isInitialized: boolean;
  isAppActive: boolean;
  isOnline: boolean;
  hasActiveRefresh: boolean;

  // Statistics
  stats: RefreshStats;

  // Time information
  timeInBackground: number;
  lastRefreshAge: number;
  backgroundRefreshCount: number;

  // Configuration
  currentConfig: BackgroundRefreshConfig;
}

/**
 * Main background refresh hook
 */
/**
 * useBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
/**
 * useBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
export const useBackgroundRefresh = (
  refreshCallback: () => Promise<void>,
  options: UseBackgroundRefreshOptions = {}
): BackgroundRefreshHook => {
  const {
    enabled = true,
    onRefreshStart,
    onRefreshComplete,
    onRefreshError,
    ...configOptions
  } = options;

  const serviceRef = useRef<BackgroundRefreshService | null>(null);
  const callbackRef = useRef(refreshCallback);
  const statusRef = useRef({
    isInitialized: false,
    stats: {} as RefreshStats,
    status: {} as ReturnType<BackgroundRefreshService['getStatus']>,
  });

  // Update callback ref when it changes
  callbackRef.current = refreshCallback;

  // Wrapped refresh callback with lifecycle hooks
  const wrappedRefreshCallback = useCallback(async () => {
    try {
      onRefreshStart?.();
      await callbackRef.current();
      onRefreshComplete?.(true);
    } catch (error) {
      onRefreshComplete?.(false);
      onRefreshError?.(error as Error);
      throw error; // Re-throw to let service handle it
    }
  }, [onRefreshStart, onRefreshComplete, onRefreshError]);

  // Initialize service
  useEffect(() => {
    if (!enabled) return;

    let isInitialized = false;

    const initializeService = async () => {
      try {
        if (!serviceRef.current) {
          serviceRef.current = createBackgroundRefreshService(configOptions);
        }

        await serviceRef.current.initialize(wrappedRefreshCallback);
        isInitialized = true;
        statusRef.current.isInitialized = true;

        logInfo('Background refresh service initialized via hook');
      } catch (error) {
        logError(
          'Failed to initialize background refresh service:',
          error
        );
        onRefreshError?.(error as Error);
      }
    };

    initializeService();

    return () => {
      const currentService = serviceRef.current;
      if (currentService && isInitialized) {
        currentService.destroy();
        serviceRef.current = null;
        // Note: We avoid updating statusRef.current in cleanup to prevent React warnings
      }
    };
  }, [enabled, wrappedRefreshCallback, configOptions, onRefreshError]); // Include all dependencies

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (serviceRef.current && statusRef.current.isInitialized) {
      await serviceRef.current.manualRefresh();
    }
  }, []);

  // Update configuration function
  const updateConfig = useCallback(
    (newConfig: Partial<BackgroundRefreshConfig>) => {
      if (serviceRef.current) {
        serviceRef.current.updateConfig(newConfig);
      }
    },
    []
  );

  // Get current status and stats
  const getCurrentStatus = useCallback(() => {
    if (serviceRef.current) {
      statusRef.current.status = serviceRef.current.getStatus();
      statusRef.current.stats = serviceRef.current.getStats();
    }
    return statusRef.current;
  }, []);

  // Periodic status update (every 30 seconds)
  useEffect(() => {
    if (!enabled || !statusRef.current.isInitialized) return;

    const interval = setInterval(() => {
      getCurrentStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [enabled, getCurrentStatus]);

  // Get current status
  const currentStatus = getCurrentStatus();

  return {
    // Actions
    manualRefresh,
    updateConfig,

    // Status
    isInitialized: currentStatus.isInitialized,
    isAppActive: currentStatus.status.isAppActive || false,
    isOnline: currentStatus.status.isOnline || false,
    hasActiveRefresh: currentStatus.status.hasActiveRefresh || false,

    // Statistics
    stats: currentStatus.stats,

    // Time information
    timeInBackground: currentStatus.status.timeInBackground || 0,
    lastRefreshAge: currentStatus.status.lastRefreshAge || 0,
    backgroundRefreshCount: currentStatus.status.backgroundRefreshCount || 0,

    // Configuration
    currentConfig:
      currentStatus.status.config || ({} as BackgroundRefreshConfig),
  };
};

/**
 * Simple background refresh hook with minimal configuration
 */
/**
 * useSimpleBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
/**
 * useSimpleBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
export const useSimpleBackgroundRefresh = (
  refreshCallback: () => Promise<void>,
  enabled: boolean = true
) => {
  return useBackgroundRefresh(refreshCallback, {
    enabled,
    debugMode: false,
    foregroundInterval: 10, // 10 minutes
    backgroundInterval: 15, // 15 minutes
    forceRefreshThreshold: 10, // 10 minutes
    enableBatteryOptimization: true,
    enableNetworkOptimization: true,
  });
};

/**
 * Status change event for advanced refresh hook
 */
interface RefreshStatusEvent {
  lastRefresh?: number;
  success?: boolean;
  error?: string;
}

/**
 * Advanced background refresh hook with full configuration
 */
/**
 * useAdvancedBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
/**
 * useAdvancedBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
export const useAdvancedBackgroundRefresh = (
  refreshCallback: () => Promise<void>,
  options: {
    enabled?: boolean;
    debugMode?: boolean;
    onStatusChange?: (status: RefreshStatusEvent) => void;
    customConfig?: Partial<BackgroundRefreshConfig>;
  } = {}
) => {
  const {
    enabled = true,
    debugMode = false,
    onStatusChange,
    customConfig = {},
  } = options;

  const refreshHook = useBackgroundRefresh(refreshCallback, {
    enabled,
    debugMode,
    enableBatteryOptimization: true,
    enableNetworkOptimization: true,
    maxBackgroundRefreshes: 4,
    ...customConfig,
    onRefreshComplete: success => {
      logInfo(`Background refresh ${success ? 'succeeded' : 'failed'}`);
      onStatusChange?.({ lastRefresh: Date.now(), success });
    },
    onRefreshError: error => {
      logError('Background refresh error:', error);
      onStatusChange?.({ error: error.message });
    },
  });

  // Enhanced return with additional utilities
  return {
    ...refreshHook,

    // Additional utilities
    isRefreshNeeded: refreshHook.lastRefreshAge > 5 * 60 * 1000, // 5 minutes
    isBackgroundActive: !refreshHook.isAppActive && refreshHook.isOnline,
    refreshRate:
      refreshHook.stats.totalRefreshes > 0
        ? refreshHook.stats.averageRefreshDuration
        : 0,

    // Quick status check
    getQuickStatus: () => ({
      online: refreshHook.isOnline,
      active: refreshHook.isAppActive,
      refreshing: refreshHook.hasActiveRefresh,
      lastRefresh: new Date(
        Date.now() - refreshHook.lastRefreshAge
      ).toLocaleTimeString(),
      totalRefreshes: refreshHook.stats.totalRefreshes,
    }),
  };
};

/**
 * Weather-specific background refresh hook
 */
/**
 * useWeatherBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
/**
 * useWeatherBackgroundRefresh - Custom React hook for useBackgroundRefresh functionality
 */
export const useWeatherBackgroundRefresh = (
  fetchWeatherData: () => Promise<void>,
  enabled: boolean = true
) => {
  return useAdvancedBackgroundRefresh(fetchWeatherData, {
    enabled,
    debugMode: false, // Set to true for weather app debugging
    customConfig: {
      foregroundInterval: 15, // Weather updates every 15 minutes in foreground
      backgroundInterval: 30, // Every 30 minutes in background
      forceRefreshThreshold: 20, // Force refresh after 20 minutes
      maxBackgroundRefreshes: 3, // Limit background refreshes for weather
      enableBatteryOptimization: true,
      enableNetworkOptimization: true,
    },
    onStatusChange: status => {
      if (status.success) {
        logInfo('Weather data refreshed in background');
      } else if (status.error) {
        logError('Weather refresh failed:', status.error);
      }
    },
  });
};

export default useBackgroundRefresh;
