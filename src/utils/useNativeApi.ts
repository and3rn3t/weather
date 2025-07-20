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

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  nativeGeolocation,
  nativeHaptics,
  weatherNotifications,
  deviceInfo,
  networkStatus,
  appState,
  initializeNativeServices,
  isNativePlatform,
  type LocationResult,
  type WeatherAlert,
  type DeviceCapabilities,
} from './nativeApiService';

/**
 * Hook for native geolocation with enhanced GPS capabilities
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
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
      await nativeGeolocation.startWatching((newLocation) => {
        setLocation(newLocation);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start location watching');
      setIsWatching(false);
    }
  }, [isWatching]);

  const stopWatching = useCallback(async () => {
    if (!isWatching) return;
    
    try {
      await nativeGeolocation.stopWatching();
      setIsWatching(false);
    } catch (err) {
      console.error('Failed to stop location watching:', err);
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
      console.error('Failed to request notification permissions:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleAlert = useCallback(async (alert: WeatherAlert) => {
    if (!hasPermission) {
      console.warn('Cannot schedule alert: No notification permission');
      return;
    }
    await weatherNotifications.scheduleWeatherAlert(alert);
  }, [hasPermission]);

  const sendWeatherUpdate = useCallback(async (temperature: number, condition: string, city: string) => {
    await weatherNotifications.sendWeatherUpdate(temperature, condition, city);
  }, []);

  const sendSevereAlert = useCallback(async (alertType: string, description: string, city: string) => {
    await weatherNotifications.sendSevereWeatherAlert(alertType, description, city);
  }, []);

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
        console.error('Failed to load device info:', err);
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
        setError(err instanceof Error ? err.message : 'Failed to initialize native services');
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
 */
export const useSmartWeatherRefresh = (refreshCallback: () => Promise<void>) => {
  const { isOnline } = useNetworkStatus();
  const { isActive } = useAppState();
  const lastRefreshRef = useRef<number>(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const smartRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const minRefreshInterval = 5 * 60 * 1000; // 5 minutes

    // Only refresh if enough time has passed and we're online
    if (timeSinceLastRefresh >= minRefreshInterval && isOnline) {
      try {
        await refreshCallback();
        lastRefreshRef.current = now;
      } catch (err) {
        console.error('Smart refresh failed:', err);
      }
    }
  }, [refreshCallback, isOnline]);

  useEffect(() => {
    // Refresh when app becomes active and we're online
    if (isActive && isOnline) {
      smartRefresh();
    }

    // Set up periodic refresh when app is active
    if (isActive && isOnline) {
      refreshIntervalRef.current = setInterval(smartRefresh, 10 * 60 * 1000); // 10 minutes
    }
    if (!isActive || !isOnline) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isActive, isOnline, smartRefresh]);

  return {
    smartRefresh,
    canRefresh: isOnline && isActive,
  };
};
