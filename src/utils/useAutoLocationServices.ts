/**
 * Enhanced Auto Location Services Hook
 *
 * Advanced location management with automatic detection, background updates,
 * and intelligent caching for seamless weather app experience.
 *
 * Features:
 * - Automatic location detection on app startup
 * - Background location updates with configurable intervals
 * - Location caching with expiration management
 * - Network-aware location requests
 * - Permission state monitoring
 * - Battery optimization for mobile devices
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHaptic } from './hapticHooks';
import { logError, logInfo, logWarn } from './logger';
import type { LocationData } from './useLocationServices';
import { useLocationServices } from './useLocationServices';

// ============================================================================
// AUTO LOCATION TYPES
// ============================================================================

export interface AutoLocationConfig {
  enableAutoDetection?: boolean; // Auto-detect location on app start
  enableBackgroundUpdates?: boolean; // Update location in background
  updateInterval?: number; // Minutes between background updates
  cacheExpiration?: number; // Minutes until location cache expires
  enableHighAccuracy?: boolean; // GPS vs network location
  maxAge?: number; // Maximum age of cached position (ms)
  timeout?: number; // Timeout for location requests (ms)
  enableNetworkFallback?: boolean; // Fallback to network location
  enableBatteryOptimization?: boolean; // Optimize for battery life
}

export interface AutoLocationState {
  isAutoDetectionEnabled: boolean;
  isBackgroundUpdatesEnabled: boolean;
  lastAutoUpdate: number | null;
  nextUpdateTime: number | null;
  cacheExpiredAt: number | null;
  updateCount: number;
  isOnline: boolean;
  batteryLevel?: number;
}

export interface CachedLocation {
  data: LocationData;
  timestamp: number;
  expiresAt: number;
  source: 'auto' | 'manual' | 'background';
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<AutoLocationConfig> = {
  enableAutoDetection: true,
  enableBackgroundUpdates: false,
  updateInterval: 30, // 30 minutes
  cacheExpiration: 60, // 1 hour
  enableHighAccuracy: false, // Prefer battery life
  maxAge: 10 * 60 * 1000, // 10 minutes
  timeout: 15000, // 15 seconds
  enableNetworkFallback: true,
  enableBatteryOptimization: true,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStorageKey = (key: string) => `auto-location-${key}`;

const saveToStorage = (key: string, data: unknown) => {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(data));
  } catch (error) {
    logWarn('Failed to save location data to storage:', error);
  }
};

const loadFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(getStorageKey(key));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logWarn('Failed to load location data from storage:', error);
    return null;
  }
};

const isLocationCacheValid = (cache: CachedLocation | null): boolean => {
  if (!cache) return false;
  return Date.now() < cache.expiresAt;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useAutoLocationServices - Custom React hook for useAutoLocationServices functionality
 */
/**
 * useAutoLocationServices - Custom React hook for useAutoLocationServices functionality
 */
export const useAutoLocationServices = (config: AutoLocationConfig = {}) => {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );
  const haptic = useHaptic();

  const {
    isLoading,
    isSupported,
    error,
    location,
    getCurrentLocation,
    isPermissionGranted,
  } = useLocationServices();

  // Auto location state
  const [autoState, setAutoState] = useState<AutoLocationState>({
    isAutoDetectionEnabled: mergedConfig.enableAutoDetection,
    isBackgroundUpdatesEnabled: mergedConfig.enableBackgroundUpdates,
    lastAutoUpdate: null,
    nextUpdateTime: null,
    cacheExpiredAt: null,
    updateCount: 0,
    isOnline: navigator.onLine,
  });

  // Cached location management
  const [cachedLocation, setCachedLocation] = useState<CachedLocation | null>(
    loadFromStorage('cached-location'),
  );

  // Background update timer
  const backgroundTimer = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);

  // ============================================================================
  // NETWORK STATUS MONITORING
  // ============================================================================

  useEffect(() => {
    const handleOnline = () =>
      setAutoState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setAutoState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================================
  // BATTERY API INTEGRATION
  // ============================================================================

  useEffect(() => {
    if (!mergedConfig.enableBatteryOptimization) return;

    const updateBatteryInfo = async () => {
      try {
        // @ts-expect-error - Battery API is experimental
        const battery = await navigator.getBattery?.();
        if (battery) {
          setAutoState(prev => ({ ...prev, batteryLevel: battery.level }));
        }
      } catch {
        // Battery API not supported, continue without it
      }
    };

    updateBatteryInfo();
  }, [mergedConfig.enableBatteryOptimization]);

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  const updateLocationCache = useCallback(
    (locationData: LocationData, source: CachedLocation['source']) => {
      const now = Date.now();
      const expiresAt = now + mergedConfig.cacheExpiration * 60 * 1000;

      const cache: CachedLocation = {
        data: locationData,
        timestamp: now,
        expiresAt,
        source,
      };

      setCachedLocation(cache);
      saveToStorage('cached-location', cache);

      setAutoState(prev => ({
        ...prev,
        lastAutoUpdate: now,
        nextUpdateTime: mergedConfig.enableBackgroundUpdates
          ? now + mergedConfig.updateInterval * 60 * 1000
          : null,
        cacheExpiredAt: expiresAt,
        updateCount: prev.updateCount + 1,
      }));
    },
    [
      mergedConfig.cacheExpiration,
      mergedConfig.enableBackgroundUpdates,
      mergedConfig.updateInterval,
    ],
  );

  // ============================================================================
  // AUTOMATIC LOCATION DETECTION
  // ============================================================================

  const requestAutoLocation = useCallback(
    async (source: CachedLocation['source'] = 'auto') => {
      // Rate limiting
      const now = Date.now();
      if (now - lastRequestTime.current < 5000) {
        // 5 second rate limit
        logInfo('Auto location request rate limited');
        return;
      }
      lastRequestTime.current = now;

      // Check if offline and no cached location
      if (!autoState.isOnline && !isLocationCacheValid(cachedLocation)) {
        logInfo('Offline and no valid cached location');
        return;
      }

      // Battery optimization
      if (
        mergedConfig.enableBatteryOptimization &&
        autoState.batteryLevel &&
        autoState.batteryLevel < 0.2
      ) {
        logInfo(
          'Battery optimization: skipping location request due to low battery',
        );
        return;
      }

      try {
        logInfo(`🎯 Auto-requesting location (source: ${source})`);

        const locationData = await getCurrentLocation({
          enableHighAccuracy: mergedConfig.enableHighAccuracy,
          timeout: mergedConfig.timeout,
          maximumAge: mergedConfig.maxAge,
        });

        if (locationData) {
          updateLocationCache(locationData, source);
          haptic.light();
          logInfo('✅ Auto location detection successful:', locationData);
        }
      } catch (error) {
        logError('❌ Auto location detection failed:', error);

        // Use cached location if available
        if (isLocationCacheValid(cachedLocation)) {
          logInfo('📍 Using cached location as fallback');
        }
      }
    },
    [
      autoState.isOnline,
      autoState.batteryLevel,
      cachedLocation,
      getCurrentLocation,
      updateLocationCache,
      haptic,
      mergedConfig,
    ],
  );

  // ============================================================================
  // BACKGROUND UPDATES
  // ============================================================================

  const setupBackgroundUpdates = useCallback(() => {
    if (!mergedConfig.enableBackgroundUpdates || !isPermissionGranted) {
      return;
    }

    // Clear existing timer
    if (backgroundTimer.current) {
      clearInterval(backgroundTimer.current);
    }

    // Set up new timer
    const intervalMs = mergedConfig.updateInterval * 60 * 1000;
    backgroundTimer.current = setInterval(() => {
      if (isLocationCacheValid(cachedLocation)) {
        logInfo('⏰ Background location update triggered');
        requestAutoLocation('background');
      }
    }, intervalMs);

    logInfo(
      `🔄 Background location updates enabled (${mergedConfig.updateInterval} min intervals)`,
    );
  }, [
    mergedConfig.enableBackgroundUpdates,
    mergedConfig.updateInterval,
    isPermissionGranted,
    cachedLocation,
    requestAutoLocation,
  ]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isSupported || !mergedConfig.enableAutoDetection) return;

    // Auto-detect location on app startup
    const performAutoDetection = async () => {
      // Check for valid cached location first
      if (isLocationCacheValid(cachedLocation)) {
        logInfo('📍 Using valid cached location');
        return;
      }

      // Request new location
      await requestAutoLocation('auto');
    };

    // Delay auto-detection slightly to allow UI to render
    const timer = setTimeout(performAutoDetection, 1000);

    return () => clearTimeout(timer);
  }, [
    isSupported,
    mergedConfig.enableAutoDetection,
    cachedLocation,
    requestAutoLocation,
  ]);

  // Set up background updates when conditions are met
  useEffect(() => {
    setupBackgroundUpdates();

    return () => {
      if (backgroundTimer.current) {
        clearInterval(backgroundTimer.current);
      }
    };
  }, [setupBackgroundUpdates]);

  // ============================================================================
  // PUBLIC INTERFACE
  // ============================================================================

  const getCurrentLocationData = useCallback((): LocationData | null => {
    // Return current location if available
    if (location) return location;

    // Return cached location if valid
    if (isLocationCacheValid(cachedLocation) && cachedLocation) {
      return cachedLocation.data;
    }

    return null;
  }, [location, cachedLocation]);

  const forceLocationUpdate = useCallback(async () => {
    await requestAutoLocation('manual');
  }, [requestAutoLocation]);

  const clearLocationCache = useCallback(() => {
    setCachedLocation(null);
    localStorage.removeItem(getStorageKey('cached-location'));
    setAutoState(prev => ({
      ...prev,
      lastAutoUpdate: null,
      cacheExpiredAt: null,
      updateCount: 0,
    }));
  }, []);

  const toggleAutoDetection = useCallback(
    (enabled: boolean) => {
      setAutoState(prev => ({ ...prev, isAutoDetectionEnabled: enabled }));
      if (enabled) {
        requestAutoLocation('auto');
      }
    },
    [requestAutoLocation],
  );

  const toggleBackgroundUpdates = useCallback(
    (enabled: boolean) => {
      setAutoState(prev => ({ ...prev, isBackgroundUpdatesEnabled: enabled }));
      if (enabled) {
        setupBackgroundUpdates();
      } else if (backgroundTimer.current) {
        clearInterval(backgroundTimer.current);
        backgroundTimer.current = null;
      }
    },
    [setupBackgroundUpdates],
  );

  return {
    // Location data
    currentLocation: getCurrentLocationData(),
    cachedLocation,
    isLocationCacheValid: isLocationCacheValid(cachedLocation),

    // State
    isLoading,
    isSupported,
    error,
    autoState,

    // Actions
    forceLocationUpdate,
    clearLocationCache,
    toggleAutoDetection,
    toggleBackgroundUpdates,

    // Config
    config: mergedConfig,
  };
};

export default useAutoLocationServices;
