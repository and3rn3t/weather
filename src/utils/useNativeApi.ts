/**
 * useNativeApi - React Hook for Native API Integration
 *
 * Provides easy-to-use React hooks for native device capabilities:
 * - Enhanced geolocation with GPS
 * - Native haptic feedback
 * - Weather notifications and alerts
 * - Device information and optimization
 * - Network status monitoring
 * - App state management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logError, logInfo, logWarn } from './logger';
import type {
  DeviceCapabilities,
  LocationResult,
  WeatherAlert,
} from './nativeApiService';
import {
  appState,
  deviceInfo,
  initializeNativeServices,
  isNativePlatform,
  nativeGeolocation,
  nativeHaptics,
  networkStatus,
  weatherNotifications,
} from './nativeApiService';

/**
 * Hook for native geolocation with enhanced GPS capabilities
 */
/**
 * useNativeGeolocation - Custom React hook for useNativeApi functionality
 */
/**
 * useNativeGeolocation - Custom React hook for useNativeApi functionality
 */
export const useNativeGeolocation = () => {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await nativeGeolocation.getCurrentPosition();
      setLocation(position);
      return position;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startWatching = useCallback(async () => {
    if (isWatching) return;

    try {
      setIsWatching(true);
      await nativeGeolocation.startWatching(newLocation => {
        setLocation(newLocation);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start location watching',
      );
      setIsWatching(false);
    }
  }, [isWatching]);

  const stopWatching = useCallback(async () => {
    if (!isWatching) return;

    try {
      await nativeGeolocation.stopWatching();
      setIsWatching(false);
    } catch (err) {
      logError('Failed to stop location watching:', err);
    }
  }, [isWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [isWatching, stopWatching]);

  return {
    location,
    loading,
    error,
    isWatching,
    isNative: isNativePlatform(),
    getCurrentLocation,
    startWatching,
    stopWatching,
  };
};

/**
 * Hook for native haptic feedback with rich patterns
 */
/**
 * useNativeHaptics - Custom React hook for useNativeApi functionality
 */
/**
 * useNativeHaptics - Custom React hook for useNativeApi functionality
 */
export const useNativeHaptics = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    setIsAvailable(isNativePlatform());
  }, []);

  const light = useCallback(async () => {
    await nativeHaptics.light();
  }, []);

  const medium = useCallback(async () => {
    await nativeHaptics.medium();
  }, []);

  const heavy = useCallback(async () => {
    await nativeHaptics.heavy();
  }, []);

  const success = useCallback(async () => {
    await nativeHaptics.success();
  }, []);

  const warning = useCallback(async () => {
    await nativeHaptics.warning();
  }, []);

  const error = useCallback(async () => {
    await nativeHaptics.error();
  }, []);

  const progressiveFeedback = useCallback(async (progress: number) => {
    await nativeHaptics.progressiveFeedback(progress);
  }, []);

  return {
    isAvailable,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    progressiveFeedback,
  };
};

/**
 * Hook for weather notifications and alerts
 */
/**
 * useWeatherNotifications - Custom React hook for useNativeApi functionality
 */
/**
 * useWeatherNotifications - Custom React hook for useNativeApi functionality
 */
export const useWeatherNotifications = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const requestPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await weatherNotifications.requestPermissions();
      setHasPermission(granted);
      return granted;
    } catch (err) {
      logError('Failed to request notification permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleAlert = useCallback(
    async (alert: WeatherAlert) => {
      if (!hasPermission) {
        logWarn('Cannot schedule alert: No notification permission');
        return;
      }
      await weatherNotifications.scheduleWeatherAlert(alert);
    },
    [hasPermission],
  );

  const sendWeatherUpdate = useCallback(
    async (temperature: number, condition: string, city: string) => {
      await weatherNotifications.sendWeatherUpdate(
        temperature,
        condition,
        city,
      );
    },
    [],
  );

  const sendSevereAlert = useCallback(
    async (alertType: string, description: string, city: string) => {
      await weatherNotifications.sendSevereWeatherAlert(
        alertType,
        description,
        city,
      );
    },
    [],
  );

  const clearAllNotifications = useCallback(async () => {
    await weatherNotifications.clearAllNotifications();
  }, []);

  // Request permissions on mount if native platform
  useEffect(() => {
    if (isNativePlatform()) {
      requestPermissions();
    }
  }, [requestPermissions]);

  return {
    hasPermission,
    loading,
    isNative: isNativePlatform(),
    requestPermissions,
    scheduleAlert,
    sendWeatherUpdate,
    sendSevereAlert,
    clearAllNotifications,
  };
};

/**
 * Hook for device information and capabilities
 */
/**
 * useDeviceInfo - Custom React hook for useNativeApi functionality
 */
/**
 * useDeviceInfo - Custom React hook for useNativeApi functionality
 */
export const useDeviceInfo = () => {
  const [device, setDevice] = useState<DeviceCapabilities | null>(null);
  const [canHandleAdvanced, setCanHandleAdvanced] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const info = await deviceInfo.getDeviceInfo();
        const advanced = await deviceInfo.canHandleAdvancedFeatures();

        setDevice(info);
        setCanHandleAdvanced(advanced);
      } catch (err) {
        logError('Failed to load device info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDeviceInfo();
  }, []);

  return {
    device,
    canHandleAdvanced,
    loading,
    isNative: isNativePlatform(),
  };
};

/**
 * Hook for network status monitoring
 */
/**
 * useNetworkStatus - Custom React hook for useNativeApi functionality
 */
/**
 * useNetworkStatus - Custom React hook for useNativeApi functionality
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const callbackRef = useRef<((online: boolean) => void) | null>(null);

  useEffect(() => {
    // Get initial status
    setIsOnline(networkStatus.getNetworkStatus());

    // Create callback function
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
    };

    callbackRef.current = handleNetworkChange;

    // Add listener
    networkStatus.addNetworkListener(handleNetworkChange);

    // Cleanup
    return () => {
      if (callbackRef.current) {
        networkStatus.removeNetworkListener(callbackRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    isNative: isNativePlatform(),
  };
};

/**
 * Hook for app state monitoring (active/background)
 */
/**
 * useAppState - Custom React hook for useNativeApi functionality
 */
/**
 * useAppState - Custom React hook for useNativeApi functionality
 */
export const useAppState = () => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const callbackRef = useRef<((active: boolean) => void) | null>(null);

  useEffect(() => {
    // Create callback function
    const handleAppStateChange = (active: boolean) => {
      setIsActive(active);
    };

    callbackRef.current = handleAppStateChange;

    // Add listener
    appState.addAppStateListener(handleAppStateChange);

    // Cleanup
    return () => {
      if (callbackRef.current) {
        appState.removeAppStateListener(callbackRef.current);
      }
    };
  }, []);

  return {
    isActive,
    isNative: isNativePlatform(),
  };
};

/**
 * Comprehensive hook that initializes and provides all native APIs
 */
/**
 * useNativeServices - Custom React hook for useNativeApi functionality
 */
/**
 * useNativeServices - Custom React hook for useNativeApi functionality
 */
export const useNativeServices = () => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const geolocation = useNativeGeolocation();
  const haptics = useNativeHaptics();
  const notifications = useWeatherNotifications();
  const device = useDeviceInfo();
  const network = useNetworkStatus();
  const appStateInfo = useAppState();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeNativeServices();
        setInitialized(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize native services',
        );
      }
    };

    init();
  }, []);

  return {
    initialized,
    error,
    isNative: isNativePlatform(),
    geolocation,
    haptics,
    notifications,
    device,
    network,
    appState: appStateInfo,
  };
};

/**
 * Hook for smart weather data refresh based on app state and network
 * Enhanced with background refresh capabilities and intelligent scheduling
 */
/**
 * useSmartWeatherRefresh - Custom React hook for useNativeApi functionality
 */
/**
 * useSmartWeatherRefresh - Custom React hook for useNativeApi functionality
 */
export const useSmartWeatherRefresh = (
  refreshCallback: () => Promise<void>,
) => {
  const { isOnline } = useNetworkStatus();
  const { isActive } = useAppState();
  const lastRefreshRef = useRef<number>(0);
  const lastBackgroundRefreshRef = useRef<number>(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasInactiveRef = useRef<boolean>(false);

  const smartRefresh = useCallback(
    async (force: boolean = false) => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;
      const minRefreshInterval = force ? 0 : 5 * 60 * 1000; // 5 minutes or immediate if forced

      // Only refresh if enough time has passed and we're online
      if (timeSinceLastRefresh >= minRefreshInterval && isOnline) {
        try {
          await refreshCallback();
          lastRefreshRef.current = now;
          logInfo('Weather data refreshed successfully');
        } catch (err) {
          logError('Smart refresh failed:', err);
        }
      }
    },
    [refreshCallback, isOnline],
  );

  const backgroundRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastBackgroundRefresh =
      now - lastBackgroundRefreshRef.current;
    const minBackgroundInterval = 15 * 60 * 1000; // 15 minutes for background refresh

    // Background refresh with longer intervals to preserve battery
    if (timeSinceLastBackgroundRefresh >= minBackgroundInterval && isOnline) {
      try {
        await refreshCallback();
        lastBackgroundRefreshRef.current = now;
        logInfo('Background weather refresh completed');

        // Send a subtle notification about fresh data
        if (weatherNotifications) {
          // Note: This is a light notification that doesn't interrupt user
          logInfo('Weather data updated in background');
        }
      } catch (err) {
        logError('Background refresh failed:', err);
      }
    }
  }, [refreshCallback, isOnline]);

  const scheduleBackgroundRefresh = useCallback(() => {
    // Clear any existing background refresh
    if (backgroundTimeoutRef.current) {
      clearTimeout(backgroundTimeoutRef.current);
    }

    // Schedule background refresh for when app is inactive
    backgroundTimeoutRef.current = setTimeout(
      () => {
        if (!isActive && isOnline) {
          backgroundRefresh();
          // Schedule next background refresh
          scheduleBackgroundRefresh();
        }
      },
      15 * 60 * 1000,
    ); // 15 minutes
  }, [isActive, isOnline, backgroundRefresh]);

  useEffect(() => {
    // Enhanced app state change handling
    if (isActive) {
      // App came to foreground
      if (wasInactiveRef.current) {
        logInfo('App returned to foreground, checking for refresh');
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        // If app was inactive for more than 10 minutes, force refresh
        if (timeSinceLastRefresh > 10 * 60 * 1000) {
          smartRefresh(true); // Force refresh when returning from background
        }
        wasInactiveRef.current = false;
      }

      // Set up active refresh interval
      if (isOnline) {
        refreshIntervalRef.current = setInterval(
          () => smartRefresh(),
          10 * 60 * 1000,
        ); // 10 minutes
      }
    } else {
      // App went to background
      wasInactiveRef.current = true;
      logInfo('App moved to background, scheduling background refresh');

      // Clear active refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // Schedule background refresh
      if (isOnline) {
        scheduleBackgroundRefresh();
      }
    }

    // Handle network changes
    if (!isOnline) {
      // Clear all refresh timers when offline
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (backgroundTimeoutRef.current) {
        clearTimeout(backgroundTimeoutRef.current);
        backgroundTimeoutRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (backgroundTimeoutRef.current) {
        clearTimeout(backgroundTimeoutRef.current);
      }
    };
  }, [isActive, isOnline, smartRefresh, scheduleBackgroundRefresh]);

  // Initial refresh when hook is first used
  useEffect(() => {
    if (isOnline && isActive) {
      // Only refresh if this is truly the first mount (no previous refresh)
      if (lastRefreshRef.current === 0) {
        smartRefresh();
      }
    }
  }, [isOnline, isActive, smartRefresh]); // Include dependencies

  return {
    smartRefresh: () => smartRefresh(false),
    forceRefresh: () => smartRefresh(true),
    backgroundRefresh,
    canRefresh: isOnline,
    isActiveRefresh: isOnline && isActive,
    lastRefreshTime: lastRefreshRef.current,
    isBackgroundCapable: !isActive && isOnline,
  };
};

/**
 * Hook for advanced background app refresh with native scheduling
 * Provides comprehensive background task management
 */
/**
 * useBackgroundRefresh - Custom React hook for useNativeApi functionality
 */
/**
 * useBackgroundRefresh - Custom React hook for useNativeApi functionality
 */
export const useBackgroundRefresh = (
  refreshCallback: () => Promise<void>,
  options: {
    foregroundInterval?: number; // Minutes between foreground refreshes
    backgroundInterval?: number; // Minutes between background refreshes
    forceRefreshThreshold?: number; // Minutes to force refresh on app return
    enableNotifications?: boolean; // Show notifications for background updates
  } = {},
) => {
  const {
    foregroundInterval = 10,
    backgroundInterval = 15,
    forceRefreshThreshold = 10,
    enableNotifications = false,
  } = options;

  const { isOnline } = useNetworkStatus();
  const { isActive } = useAppState();
  const haptics = useNativeHaptics();

  const refreshTimestamps = useRef({
    lastForeground: 0,
    lastBackground: 0,
    appBackgroundTime: 0,
  });

  const intervals = useRef({
    foreground: null as NodeJS.Timeout | null,
    background: null as NodeJS.Timeout | null,
  });

  const performRefresh = useCallback(
    async (type: 'foreground' | 'background' | 'force') => {
      const now = Date.now();
      const timestamps = refreshTimestamps.current;

      let shouldRefresh = false;
      let minInterval = 0;

      switch (type) {
        case 'force':
          shouldRefresh = true;
          break;
        case 'foreground':
          minInterval = foregroundInterval * 60 * 1000;
          shouldRefresh = now - timestamps.lastForeground >= minInterval;
          break;
        case 'background':
          minInterval = backgroundInterval * 60 * 1000;
          shouldRefresh = now - timestamps.lastBackground >= minInterval;
          break;
      }

      if (shouldRefresh && isOnline) {
        try {
          logInfo(`Performing ${type} refresh...`);
          await refreshCallback();

          if (type === 'foreground' || type === 'force') {
            timestamps.lastForeground = now;
            // Haptic feedback for successful foreground refresh
            if (isActive) {
              await haptics.light();
            }
          } else {
            timestamps.lastBackground = now;
          }

          // Optional notification for background updates
          if (type === 'background' && enableNotifications) {
            logInfo('Weather updated in background');
            // Could schedule a notification here if needed
          }

          logInfo(`${type} refresh completed successfully`);
        } catch (error) {
          logError(`${type} refresh failed:`, error);
        }
      }
    },
    [
      refreshCallback,
      isOnline,
      foregroundInterval,
      backgroundInterval,
      isActive,
      haptics,
      enableNotifications,
    ],
  );

  const startForegroundRefresh = useCallback(() => {
    if (intervals.current.foreground) {
      clearInterval(intervals.current.foreground);
    }

    intervals.current.foreground = setInterval(
      () => {
        performRefresh('foreground');
      },
      foregroundInterval * 60 * 1000,
    );
  }, [performRefresh, foregroundInterval]);

  const startBackgroundRefresh = useCallback(() => {
    if (intervals.current.background) {
      clearInterval(intervals.current.background);
    }

    // Longer intervals for background to preserve battery
    intervals.current.background = setInterval(
      () => {
        if (!isActive && isOnline) {
          performRefresh('background');
        }
      },
      backgroundInterval * 60 * 1000,
    );
  }, [performRefresh, backgroundInterval, isActive, isOnline]);

  const stopAllRefresh = useCallback(() => {
    if (intervals.current.foreground) {
      clearInterval(intervals.current.foreground);
      intervals.current.foreground = null;
    }
    if (intervals.current.background) {
      clearInterval(intervals.current.background);
      intervals.current.background = null;
    }
  }, []);

  useEffect(() => {
    const timestamps = refreshTimestamps.current;

    if (isActive) {
      // App is in foreground
      const timeInBackground =
        timestamps.appBackgroundTime > 0
          ? Date.now() - timestamps.appBackgroundTime
          : 0;

      // Force refresh if app was in background for too long
      if (timeInBackground > forceRefreshThreshold * 60 * 1000) {
        logInfo('App returned from background, forcing refresh');
        performRefresh('force');
      }

      // Start foreground refresh schedule
      if (isOnline) {
        startForegroundRefresh();
      }

      // Stop background refresh
      if (intervals.current.background) {
        clearInterval(intervals.current.background);
        intervals.current.background = null;
      }

      timestamps.appBackgroundTime = 0;
    } else {
      // App is in background
      timestamps.appBackgroundTime = Date.now();

      // Stop foreground refresh
      if (intervals.current.foreground) {
        clearInterval(intervals.current.foreground);
        intervals.current.foreground = null;
      }

      // Start background refresh if online
      if (isOnline) {
        startBackgroundRefresh();
      }
    }

    // Stop all refreshing when offline
    if (!isOnline) {
      stopAllRefresh();
    }

    return stopAllRefresh;
  }, [
    isActive,
    isOnline,
    performRefresh,
    startForegroundRefresh,
    startBackgroundRefresh,
    stopAllRefresh,
    forceRefreshThreshold,
  ]);

  // Initial refresh on mount
  useEffect(() => {
    let mounted = true;

    if (isOnline && isActive && mounted) {
      performRefresh('force');
    }

    return () => {
      mounted = false;
    };
  }, [isOnline, isActive, performRefresh]); // Include all dependencies

  return {
    refreshNow: () => performRefresh('force'),
    refreshInForeground: () => performRefresh('foreground'),
    refreshInBackground: () => performRefresh('background'),
    stopRefresh: stopAllRefresh,
    isRefreshing: isOnline,
    canRefresh: isOnline,
    refreshStats: {
      lastForegroundRefresh: refreshTimestamps.current.lastForeground,
      lastBackgroundRefresh: refreshTimestamps.current.lastBackground,
      timeInBackground:
        refreshTimestamps.current.appBackgroundTime > 0
          ? Date.now() - refreshTimestamps.current.appBackgroundTime
          : 0,
    },
  };
};
