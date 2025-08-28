/**
 * Enhanced Location Service
 * Provides robust location detection with permission handling and fallbacks
 */

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  cityName?: string;
}

export interface LocationError {
  code:
    | 'PERMISSION_DENIED'
    | 'POSITION_UNAVAILABLE'
    | 'TIMEOUT'
    | 'NOT_SUPPORTED'
    | 'NETWORK_ERROR';
  message: string;
  userMessage: string;
}

/**
 * Enhanced location service with permission checking and error handling
 */
export class EnhancedLocationService {
  private static instance: EnhancedLocationService;

  public static getInstance(): EnhancedLocationService {
    if (!EnhancedLocationService.instance) {
      EnhancedLocationService.instance = new EnhancedLocationService();
    }
    return EnhancedLocationService.instance;
  }

  /**
   * Check if geolocation is supported
   */
  public isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status
   */
  public async checkPermissions(): Promise<PermissionState | 'not-supported'> {
    if (!this.isSupported()) {
      return 'not-supported';
    }

    try {
      // Check if permission API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({
          name: 'geolocation',
        });
        return permission.state;
      }

      // Fallback: permission API not available
      return 'prompt';
    } catch (error) {
      // Lazy import to avoid circular imports at module init
      const { logWarn } = await import('./logger');
      logWarn('Permission check failed:', error as Error);
      return 'prompt';
    }
  }

  /**
   * Request location with enhanced error handling
   */
  public async getCurrentLocation(): Promise<LocationResult> {
    if (!this.isSupported()) {
      throw this.createError(
        'NOT_SUPPORTED',
        'Geolocation not supported',
        'Your browser does not support location services. Please search for your city manually.'
      );
    }

    const permissionState = await this.checkPermissions();

    if (permissionState === 'denied') {
      throw this.createError(
        'PERMISSION_DENIED',
        'Permission denied',
        'Location access is blocked. Please enable location permissions in your browser settings and refresh the page.'
      );
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // 20 seconds
      maximumAge: 600000, // 10 minutes
    };

    const isGeoError = (e: unknown): e is GeolocationPositionError =>
      typeof e === 'object' && e !== null && 'code' in e;

    try {
      const position = await this.getPositionAsync(options);

      const result: LocationResult = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Try to get city name
      try {
        const cityName = await this.getCityNameFromCoordinates(
          result.latitude,
          result.longitude
        );
        result.cityName = cityName;
      } catch (cityError) {
        const { logWarn } = await import('./logger');
        logWarn('Failed to get city name:', cityError as Error);
        // Continue without city name
      }

      return result;
    } catch (error) {
      if (isGeoError(error)) {
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            throw this.createError(
              'PERMISSION_DENIED',
              'Permission denied',
              'Location access was denied. Please enable location permissions and try again.'
            );
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            throw this.createError(
              'POSITION_UNAVAILABLE',
              'Position unavailable',
              'Your location could not be determined. Please check your device settings or try searching for your city.'
            );
          case GeolocationPositionError.TIMEOUT:
            throw this.createError(
              'TIMEOUT',
              'Request timeout',
              'Location request timed out. Please try again or search for your city manually.'
            );
          default:
            throw this.createError(
              'POSITION_UNAVAILABLE',
              'Unknown geolocation error',
              'An error occurred while getting your location. Please try again.'
            );
        }
      }
      throw this.createError(
        'POSITION_UNAVAILABLE',
        'Location failed',
        'Failed to get your location. Please try again or search for your city manually.'
      );
    }
  }

  /**
   * Get position using Promise wrapper
   */
  private getPositionAsync(
    options: PositionOptions
  ): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Get city name from coordinates using reverse geocoding
   */
  private async getCityNameFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    const { reverseGeocodeCached } = await import('./reverseGeocodingCache');
    const data = await reverseGeocodeCached(latitude, longitude);
    return data.city || 'Current Location';
  }

  /**
   * Create standardized error object
   */
  private createError(
    code: LocationError['code'],
    message: string,
    userMessage: string
  ): LocationError {
    return {
      code,
      message,
      userMessage,
    };
  }

  /**
   * Check if the current context is secure (HTTPS or localhost)
   */
  public isSecureContext(): boolean {
    return (
      window.isSecureContext ||
      location.protocol === 'https:' ||
      location.hostname === 'localhost'
    );
  }

  /**
   * Get user-friendly error message for location issues
   */
  public getLocationTips(): string[] {
    const tips = [];

    if (!this.isSecureContext()) {
      tips.push('Location services require a secure connection (HTTPS)');
    }

    tips.push('Make sure location services are enabled in your browser');
    tips.push('Check that your device has location services turned on');
    tips.push('Try refreshing the page and allowing location access');

    return tips;
  }
}

// Export singleton instance
export const locationService = EnhancedLocationService.getInstance();
