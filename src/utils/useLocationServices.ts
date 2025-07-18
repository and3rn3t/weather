/**
 * Location Services Hook
 * 
 * Provides GPS-based location detection for automatic weather fetching.
 * Includes comprehensive permission handling, error states, and mobile optimization.
 */

import { useState, useCallback, useRef } from 'react';
import { useHaptic } from './hapticHooks';

// ============================================================================
// LOCATION SERVICE TYPES
// ============================================================================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;        // Reverse geocoded city name
  country?: string;     // Reverse geocoded country
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
  const errorMap: Record<number, { message: string; userFriendlyMessage: string }> = {
    [GeolocationPositionError.PERMISSION_DENIED]: {
      message: 'Location access denied by user',
      userFriendlyMessage: 'Location access was denied. Please enable location services in your browser settings.'
    },
    [GeolocationPositionError.POSITION_UNAVAILABLE]: {
      message: 'Location information unavailable',
      userFriendlyMessage: 'Unable to determine your location. Please check your GPS or network connection.'
    },
    [GeolocationPositionError.TIMEOUT]: {
      message: 'Location request timed out',
      userFriendlyMessage: 'Location request timed out. Please try again or enter your city manually.'
    }
  };

  const errorInfo = errorMap[error.code] || {
    message: 'Unknown location error',
    userFriendlyMessage: 'An unexpected error occurred while getting your location. Please try again.'
  };

  return {
    code: error.code,
    message: errorInfo.message,
    userFriendlyMessage: errorInfo.userFriendlyMessage
  };
};

// ============================================================================
// REVERSE GEOCODING SERVICE
// ============================================================================

const reverseGeocode = async (latitude: number, longitude: number): Promise<{ city?: string; country?: string }> => {
  try {
    const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';
    const url = `${REVERSE_GEOCODING_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'WeatherApp/1.0 (location-services@weatherapp.com)' 
      }
    });

    if (!response.ok) {
      console.warn('Reverse geocoding failed:', response.status);
      return {};
    }

    const data = await response.json();
    const address = data?.address || {};
    
    // Extract city name from various possible fields
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.hamlet || 
                 address.county ||
                 address.state ||
                 'Unknown Location';
    
    const country = address.country || '';

    return { city, country };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return {};
  }
};

// ============================================================================
// LOCATION SERVICES HOOK
// ============================================================================

export const useLocationServices = () => {
  const haptic = useHaptic();
  const [state, setState] = useState<LocationState>({
    isLoading: false,
    isPermissionGranted: null,
    location: null,
    error: null,
    lastUpdate: null
  });

  // Debounce reference to prevent rapid consecutive calls
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if geolocation is supported
  const isSupported = useCallback(() => {
    return 'geolocation' in navigator && 'getCurrentPosition' in navigator.geolocation;
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!isSupported()) return 'unsupported';
    
    try {
      // Modern browsers support permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state; // 'granted', 'denied', 'prompt'
      }
      
      // Fallback for older browsers
      return 'unknown';
    } catch (error) {
      console.warn('Permission check failed:', error);
      return 'unknown';
    }
  }, [isSupported]);

  // Request location with comprehensive error handling
  const getCurrentLocation = useCallback(async (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    includeAddress?: boolean;
  }) => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!isSupported()) {
      const error: LocationError = {
        code: -1,
        message: 'Geolocation not supported',
        userFriendlyMessage: 'Your browser does not support location services. Please enter your city manually.'
      };
      setState(prev => ({ ...prev, error, isLoading: false }));
      haptic.triggerHaptic('error');
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    haptic.triggerHaptic('light'); // Light feedback when starting location request

    const locationOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 15000, // 15 seconds
      maximumAge: options?.maximumAge ?? 300000 // 5 minutes
    };

    return new Promise<LocationData | null>((resolve) => {
      const successCallback = async (position: GeolocationPosition) => {
        try {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          // Optionally include reverse geocoded address
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
            isLoading: false,
            isPermissionGranted: true,
            location: locationData,
            error: null,
            lastUpdate: Date.now()
          }));

          haptic.triggerHaptic('success'); // Success feedback
          resolve(locationData);
        } catch (error) {
          console.error('Location processing error:', error);
          const locationError: LocationError = {
            code: -2,
            message: 'Location processing failed',
            userFriendlyMessage: 'Failed to process location data. Please try again.'
          };
          
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: locationError 
          }));
          
          haptic.triggerHaptic('error');
          resolve(null);
        }
      };

      const errorCallback = (error: GeolocationPositionError) => {
        const locationError = getLocationError(error);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          isPermissionGranted: error.code === GeolocationPositionError.PERMISSION_DENIED ? false : prev.isPermissionGranted,
          error: locationError
        }));

        haptic.triggerHaptic('error'); // Error feedback
        resolve(null);
      };

      // Add debounce to prevent rapid calls
      debounceTimeoutRef.current = setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          successCallback,
          errorCallback,
          locationOptions
        );
      }, 100);
    });
  }, [isSupported, haptic]);

  // Watch location for continuous updates
  const watchLocation = useCallback((options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    includeAddress?: boolean;
  }) => {
    if (!isSupported()) {
      console.warn('Geolocation not supported for watching');
      return null;
    }

    const locationOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? false, // Lower accuracy for watching
      timeout: options?.timeout ?? 30000, // 30 seconds
      maximumAge: options?.maximumAge ?? 600000 // 10 minutes
    };

    const successCallback = async (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
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
        error: null
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
  }, [isSupported]);

  // Stop watching location
  const stopWatching = useCallback((watchId: number) => {
    if (isSupported() && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, [isSupported]);

  // Clear location data and errors
  const clearLocation = useCallback(() => {
    setState({
      isLoading: false,
      isPermissionGranted: null,
      location: null,
      error: null,
      lastUpdate: null
    });
    haptic.triggerHaptic('light');
  }, [haptic]);

  // Refresh current location
  const refreshLocation = useCallback(async () => {
    if (state.location) {
      haptic.triggerHaptic('refresh');
      return await getCurrentLocation({ includeAddress: true });
    }
    return null;
  }, [state.location, getCurrentLocation, haptic]);

  // Helper to format location for display
  const formatLocationDisplay = useCallback((location: LocationData | null) => {
    if (!location) return null;
    
    if (location.city) {
      return location.country ? `${location.city}, ${location.country}` : location.city;
    }
    
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }, []);

  // Helper to check if location is stale
  const isLocationStale = useCallback((maxAgeMs: number = 600000) => { // 10 minutes default
    if (!state.lastUpdate) return true;
    return Date.now() - state.lastUpdate > maxAgeMs;
  }, [state.lastUpdate]);

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
    isLocationStale
  };
};

export default useLocationServices;
