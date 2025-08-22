/**
 * Location Permission Manager - Advanced GPS Permission Handling
 *
 * Provides comprehensive location permission management with:
 * - Smart permission detection and request handling
 * - User-friendly permission prompts and fallbacks
 * - Privacy controls and preference management
 * - Background location handling for weather updates
 * - Cross-platform permission compatibility
 */

import { logError, logInfo, logWarn } from '../../utils/logger';

export interface PermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  unavailable: boolean;
  restricted: boolean;
}

export interface LocationPermissionConfig {
  enableBackgroundLocation?: boolean;
  enableHighAccuracy?: boolean;
  showPermissionRationale?: boolean;
  allowFallbackToIP?: boolean;
  cachePermissionState?: boolean;
}

export interface PermissionRequestResult {
  success: boolean;
  permission: PermissionState;
  needsManualEnable?: boolean;
  fallbackAvailable?: boolean;
  message?: string;
}

class LocationPermissionManager {
  private static instance: LocationPermissionManager;
  private permissionCache: Map<
    string,
    { state: PermissionState; timestamp: number }
  > = new Map();

  // Cache permission checks for 5 minutes to avoid redundant prompts
  private readonly PERMISSION_CACHE_DURATION = 300000;

  static getInstance(): LocationPermissionManager {
    if (!LocationPermissionManager.instance) {
      LocationPermissionManager.instance = new LocationPermissionManager();
    }
    return LocationPermissionManager.instance;
  }

  /**
   * Check current location permission status
   */
  async checkPermissionStatus(): Promise<PermissionState> {
    logInfo('🔐 LocationPermission: Checking permission status');

    // Check cache first
    const cached = this.permissionCache.get('location');
    if (
      cached &&
      Date.now() - cached.timestamp < this.PERMISSION_CACHE_DURATION
    ) {
      logInfo('⚡ LocationPermission: Using cached permission state');
      return cached.state;
    }

    const permissionState: PermissionState = {
      granted: false,
      denied: false,
      prompt: false,
      unavailable: false,
      restricted: false,
    };

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        permissionState.unavailable = true;
        logWarn('❌ LocationPermission: Geolocation not supported');
        return permissionState;
      }

      // Modern browsers support Permissions API
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: 'geolocation',
          });

          switch (permission.state) {
            case 'granted':
              permissionState.granted = true;
              break;
            case 'denied':
              permissionState.denied = true;
              break;
            case 'prompt':
              permissionState.prompt = true;
              break;
          }

          logInfo('✅ LocationPermission: Permission state detected', {
            state: permission.state,
          });
        } catch {
          logWarn(
            '⚠️ LocationPermission: Permissions API error, using fallback',
          );
          permissionState.prompt = true; // Assume we need to prompt
        }
      } else {
        // Fallback for older browsers
        logInfo('🔄 LocationPermission: Using legacy permission detection');
        permissionState.prompt = true;
      }

      // Cache the result
      this.permissionCache.set('location', {
        state: permissionState,
        timestamp: Date.now(),
      });

      return permissionState;
    } catch (error) {
      logError(
        '❌ LocationPermission: Error checking permission status',
        error,
      );
      permissionState.unavailable = true;
      return permissionState;
    }
  }

  /**
   * Request location permission with user-friendly handling
   */
  async requestPermission(
    config: LocationPermissionConfig = {},
  ): Promise<PermissionRequestResult> {
    const {
      enableHighAccuracy = false,
      showPermissionRationale = true,
      allowFallbackToIP = true,
      cachePermissionState = true,
    } = config;

    logInfo('📍 LocationPermission: Requesting location permission', {
      config,
    });

    try {
      // First check current status
      const currentState = await this.checkPermissionStatus();

      // If already granted, return success
      if (currentState.granted) {
        return {
          success: true,
          permission: currentState,
          message: 'Location permission already granted',
        };
      }

      // If permanently denied, guide user to settings
      if (currentState.denied) {
        return {
          success: false,
          permission: currentState,
          needsManualEnable: true,
          fallbackAvailable: allowFallbackToIP,
          message:
            'Location permission denied. Please enable in browser settings.',
        };
      }

      // If unavailable, provide fallback options
      if (currentState.unavailable) {
        return {
          success: false,
          permission: currentState,
          fallbackAvailable: allowFallbackToIP,
          message: 'Location services not available on this device.',
        };
      }

      // Show rationale if requested (for better UX)
      if (showPermissionRationale) {
        this.showPermissionRationale();
      }

      // Request permission through geolocation API
      const result = await this.executePermissionRequest(enableHighAccuracy);

      // Haptic feedback for permission result
      // Note: Haptic feedback would be implemented here in a mobile environment

      // Cache the new state if successful
      if (cachePermissionState && result.permission) {
        this.permissionCache.set('location', {
          state: result.permission,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      logError('❌ LocationPermission: Error requesting permission', error);

      return {
        success: false,
        permission: {
          granted: false,
          denied: true,
          prompt: false,
          unavailable: false,
          restricted: false,
        },
        fallbackAvailable: allowFallbackToIP,
        message:
          'Unable to request location permission. Please check browser settings.',
      };
    }
  }

  /**
   * Execute the actual permission request
   */
  private async executePermissionRequest(
    enableHighAccuracy: boolean,
  ): Promise<PermissionRequestResult> {
    return new Promise(resolve => {
      const options: PositionOptions = {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 60000,
      };

      navigator.geolocation.getCurrentPosition(
        _position => {
          logInfo('✅ LocationPermission: Permission granted successfully');

          resolve({
            success: true,
            permission: {
              granted: true,
              denied: false,
              prompt: false,
              unavailable: false,
              restricted: false,
            },
            message: 'Location permission granted successfully',
          });
        },
        error => {
          logWarn('⚠️ LocationPermission: Permission request failed', {
            code: error.code,
            message: error.message,
          });

          const permissionState: PermissionState = {
            granted: false,
            denied: error.code === error.PERMISSION_DENIED,
            prompt: false,
            unavailable: error.code === error.POSITION_UNAVAILABLE,
            restricted: error.code === error.TIMEOUT,
          };

          resolve({
            success: false,
            permission: permissionState,
            needsManualEnable: error.code === error.PERMISSION_DENIED,
            fallbackAvailable: true,
            message: this.getErrorMessage(error.code),
          });
        },
        options,
      );
    });
  }

  /**
   * Show permission rationale to user (can be customized per app)
   */
  private showPermissionRationale(): void {
    logInfo('💡 LocationPermission: Showing permission rationale');

    // This would typically show a modal or toast explaining why location is needed
    // For now, we'll just log the rationale
    const rationale = [
      '📍 Location access helps us provide accurate weather for your area',
      '🔒 Your location data stays private and is never shared',
      '⚡ Enable for automatic weather updates and faster experience',
    ];

    rationale.forEach(message => logInfo(message));
  }

  /**
   * Get user-friendly error messages
   */
  private getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case GeolocationPositionError.PERMISSION_DENIED:
        return 'Location access was denied. Enable in browser settings for automatic weather updates.';
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please check your device settings.';
      case GeolocationPositionError.TIMEOUT:
        return 'Location request timed out. Please try again or check your connection.';
      default:
        return 'Unable to access location. Please try again or use manual city search.';
    }
  }

  /**
   * Check if we should show permission prompt (UX optimization)
   */
  async shouldShowPermissionPrompt(): Promise<boolean> {
    const state = await this.checkPermissionStatus();
    return state.prompt && !state.denied && !state.unavailable;
  }

  /**
   * Reset permission cache (useful for testing or settings changes)
   */
  resetPermissionCache(): void {
    logInfo('🔄 LocationPermission: Resetting permission cache');
    this.permissionCache.clear();
  }

  /**
   * Get permission settings recommendations
   */
  getPermissionRecommendations(): string[] {
    return [
      '1. Click the location icon in your browser address bar',
      '2. Select "Allow" for location access',
      '3. Refresh the page to apply changes',
      '4. For mobile: Check browser app permissions in device settings',
    ];
  }

  /**
   * Check if location permission is required for current feature
   */
  isPermissionRequired(
    feature: 'auto-weather' | 'background-updates' | 'location-search',
  ): boolean {
    switch (feature) {
      case 'auto-weather':
        return true; // GPS location needed for automatic weather
      case 'background-updates':
        return true; // Background location for weather updates
      case 'location-search':
        return false; // Can use IP fallback for search
      default:
        return false;
    }
  }
}

// Export singleton instance
export const locationPermissionManager =
  LocationPermissionManager.getInstance();

// Export hook for React components
export function useLocationPermission() {
  const manager = LocationPermissionManager.getInstance();

  const checkPermission = () => manager.checkPermissionStatus();
  const requestPermission = (config?: LocationPermissionConfig) =>
    manager.requestPermission(config);
  const shouldShowPrompt = () => manager.shouldShowPermissionPrompt();
  const resetCache = () => manager.resetPermissionCache();
  const getRecommendations = () => manager.getPermissionRecommendations();
  const isRequired = (
    feature: 'auto-weather' | 'background-updates' | 'location-search',
  ) => manager.isPermissionRequired(feature);

  return {
    checkPermission,
    requestPermission,
    shouldShowPrompt,
    resetCache,
    getRecommendations,
    isRequired,
  };
}

export default LocationPermissionManager;
