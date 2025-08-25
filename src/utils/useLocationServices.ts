/**
 * Location Services Hook
 *
 * Provides GPS-based location detection for automatic weather fetching.
 * Includes comprehensive permission handling, error states, and mobile optimization.
 */

import { useCallback, useRef, useState } from 'react';
import { useHaptic } from './hapticHooks';
import { logError, logInfo, logWarn } from './logger';

// ============================================================================
// LOCATION SERVICE TYPES
// ============================================================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string; // Reverse geocoded city name
  country?: string; // Reverse geocoded country
}

export interface LocationError {
  code: number;
  message: string;
  userFriendlyMessage: string;
}

export interface LocationState {
  isLoading: boolean;
  isPermissionGranted: boolean | null;
  location: LocationData | null;
  error: LocationError | null;
  lastUpdate: number | null;
}

// ============================================================================
// LOCATION ERROR MAPPING
// ============================================================================

const getLocationError = (error: GeolocationPositionError): LocationError => {
  const errorMap: Record<
    number,
    { message: string; userFriendlyMessage: string }
  > = {
    [GeolocationPositionError.PERMISSION_DENIED]: {
      message: 'Location access denied by user',
      userFriendlyMessage:
        'Location access was denied. Please enable location services in your browser settings.',
    },
    [GeolocationPositionError.POSITION_UNAVAILABLE]: {
      message: 'Location information unavailable',
      userFriendlyMessage:
        'Unable to determine your location. Please check your GPS or network connection.',
    },
    [GeolocationPositionError.TIMEOUT]: {
      message: 'Location request timed out',
      userFriendlyMessage:
        'Location request timed out. Please try again or enter your city manually.',
    },
  };

  const errorInfo = errorMap[error.code] || {
    message: 'Unknown location error',
    userFriendlyMessage:
      'An unexpected error occurred while getting your location. Please try again.',
  };

  return {
    code: error.code,
    message: errorInfo.message,
    userFriendlyMessage: errorInfo.userFriendlyMessage,
  };
};

// ============================================================================
// REVERSE GEOCODING SERVICE
// ============================================================================

const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{ city?: string; country?: string }> => {
  try {
    logInfo(
      `🔍 Starting reverse geocoding for coordinates: ${latitude}, ${longitude}`
    );

    const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';
    const url = `${REVERSE_GEOCODING_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;

    logInfo(`📡 Making API request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherApp/1.0 (location-services@weatherapp.com)',
      },
    });

    logInfo(`📡 API Response - Status: ${response.status}, OK: ${response.ok}`);

    if (!response.ok) {
      logError(
        '❌ Reverse geocoding failed:',
        response.status,
        response.statusText
      );
      return {};
    }

    const data = await response.json();
    logInfo(
      '🗺️ Reverse geocoding response data:',
      JSON.stringify(data, null, 2)
    );

    const address = data?.address || {};
    logInfo('🏠 Address object:', JSON.stringify(address, null, 2));

    // Extract city name from various possible fields
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county ||
      address.state ||
      'Unknown Location';

    const country = address.country || '';

    logInfo(
      `🏙️ Final extracted location: City="${city}", Country="${country}"`
    );

    return { city, country };
  } catch (error) {
    logError('❌ Reverse geocoding error:', error);
    return {};
  }
};

// ============================================================================
// LOCATION SERVICES HOOK
// ============================================================================

/**
 * useLocationServices - Custom React hook for useLocationServices functionality
 */
/**
 * useLocationServices - Custom React hook for useLocationServices functionality
 */
export const useLocationServices = () => {
  const haptic = useHaptic();
  const [state, setState] = useState<LocationState>({
    isLoading: false,
    isPermissionGranted: null,
    location: null,
    error: null,
    lastUpdate: null,
  });

  // Debounce reference to prevent rapid consecutive calls
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if geolocation is supported
  const isSupported = useCallback(() => {
    try {
      if (
        !navigator ||
        !('geolocation' in navigator) ||
        !navigator.geolocation
      ) {
        return false;
      }
      return 'getCurrentPosition' in navigator.geolocation;
    } catch (error) {
      logError('Error checking geolocation support:', error);
      return false;
    }
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!isSupported()) return 'unsupported';

    try {
      // Modern browsers support permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        return permission.state; // 'granted', 'denied', 'prompt'
      }

      // Fallback for older browsers
      return 'unknown';
    } catch (error) {
      logWarn('Permission check failed:', error);
      return 'unknown';
    }
  }, [isSupported]);

  // Request location with comprehensive error handling
  const getCurrentLocation = useCallback(
    async (options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
      includeAddress?: boolean;
    }) => {
      logInfo('🚀 Starting getCurrentLocation with options:', options);

      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (!isSupported()) {
        logError('❌ Geolocation not supported in this browser');
        const error: LocationError = {
          code: -1,
          message: 'Geolocation not supported',
          userFriendlyMessage:
            'Your browser does not support location services. Please enter your city manually.',
        };
        setState(prev => ({ ...prev, error, isLoading: false }));
        haptic.error();
        return null;
      }

      logInfo('✅ Geolocation is supported, setting loading state...');
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      haptic.light(); // Light feedback when starting location request

      const locationOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? false, // Changed: prioritize speed
        timeout: options?.timeout ?? 8000, // Reduced from 15000ms
        maximumAge: options?.maximumAge ?? 180000, // Reduced from 5 minutes to 3 minutes
      };

      logInfo('⚙️ Using location options:', locationOptions);

      return new Promise<LocationData | null>(resolve => {
        const successCallback = async (position: GeolocationPosition) => {
          try {
            logInfo('🎯 GPS location acquired successfully:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });

            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };

            logInfo('📍 Created location data object:', locationData);

            // Optionally include reverse geocoded address
            if (options?.includeAddress !== false) {
              logInfo('🔍 Starting reverse geocoding process...');
              const addressInfo = await reverseGeocode(
                position.coords.latitude,
                position.coords.longitude
              );
              logInfo('🏙️ Reverse geocoding completed:', addressInfo);

              locationData.city = addressInfo.city;
              locationData.country = addressInfo.country;

              logInfo('📍 Final location data with address:', locationData);
            }

            setState(prev => ({
              ...prev,
              isLoading: false,
              isPermissionGranted: true,
              location: locationData,
              error: null,
              lastUpdate: Date.now(),
            }));

            logInfo('✅ Location state updated successfully');
            haptic.success(); // Success feedback
            resolve(locationData);
          } catch (error) {
            logError('❌ Location processing error:', error);
            const locationError: LocationError = {
              code: -2,
              message: 'Location processing failed',
              userFriendlyMessage:
                'Failed to process location data. Please try again.',
            };

            setState(prev => ({
              ...prev,
              isLoading: false,
              error: locationError,
            }));

            haptic.error();
            resolve(null);
          }
        };

        const errorCallback = (error: GeolocationPositionError) => {
          logError('❌ GPS location acquisition failed:', {
            code: error.code,
            message: error.message,
            timestamp: Date.now(),
          });

          const locationError = getLocationError(error);
          logError('❌ Processed location error:', locationError);

          setState(prev => ({
            ...prev,
            isLoading: false,
            isPermissionGranted:
              error.code === GeolocationPositionError.PERMISSION_DENIED
                ? false
                : prev.isPermissionGranted,
            error: locationError,
          }));

          haptic.error(); // Error feedback
          resolve(null);
        };

        // Add debounce to prevent rapid calls
        debounceTimeoutRef.current = setTimeout(() => {
          logInfo('📡 Calling navigator.geolocation.getCurrentPosition...');
          navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            locationOptions
          );
        }, 100);
      });
    },
    [isSupported, haptic]
  );

  // Watch location for continuous updates
  const watchLocation = useCallback(
    (options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
      includeAddress?: boolean;
    }) => {
      if (!isSupported()) {
        logWarn('Geolocation not supported for watching');
        return null;
      }

      const locationOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? false, // Lower accuracy for watching
        timeout: options?.timeout ?? 30000, // 30 seconds
        maximumAge: options?.maximumAge ?? 600000, // 10 minutes
      };

      const successCallback = async (position: GeolocationPosition) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        if (options?.includeAddress !== false) {
          const addressInfo = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          locationData.city = addressInfo.city;
          locationData.country = addressInfo.country;
        }

        setState(prev => ({
          ...prev,
          location: locationData,
          lastUpdate: Date.now(),
          error: null,
        }));
      };

      const errorCallback = (error: GeolocationPositionError) => {
        const locationError = getLocationError(error);
        setState(prev => ({ ...prev, error: locationError }));
      };

      const watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        locationOptions
      );

      return watchId;
    },
    [isSupported]
  );

  // Stop watching location
  const stopWatching = useCallback(
    (watchId: number) => {
      if (isSupported() && watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    },
    [isSupported]
  );

  // Clear location data and errors
  const clearLocation = useCallback(() => {
    setState({
      isLoading: false,
      isPermissionGranted: null,
      location: null,
      error: null,
      lastUpdate: null,
    });
    haptic.light();
  }, [haptic]);

  // Refresh current location
  const refreshLocation = useCallback(async () => {
    if (state.location) {
      haptic.refresh();
      return await getCurrentLocation({ includeAddress: true });
    }
    return null;
  }, [state.location, getCurrentLocation, haptic]);

  // Helper to format location for display
  const formatLocationDisplay = useCallback((location: LocationData | null) => {
    if (!location) return null;

    if (location.city) {
      return location.country
        ? `${location.city}, ${location.country}`
        : location.city;
    }

    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }, []);

  // Helper to check if location is stale
  const isLocationStale = useCallback(
    (maxAgeMs: number = 600000) => {
      // 10 minutes default
      if (!state.lastUpdate) return true;
      return Date.now() - state.lastUpdate > maxAgeMs;
    },
    [state.lastUpdate]
  );

  return {
    // State
    ...state,

    // Capabilities
    isSupported: isSupported(),

    // Core functions
    getCurrentLocation,
    watchLocation,
    stopWatching,
    clearLocation,
    refreshLocation,
    checkPermissionStatus,

    // Utilities
    formatLocationDisplay,
    isLocationStale,
  };
};

export default useLocationServices;
