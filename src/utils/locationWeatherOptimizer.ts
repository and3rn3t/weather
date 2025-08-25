/**
 * Location Weather Optimizer
 *
 * Optimizes the complete flow from location detection to weather display
 * by running location acquisition and initial weather data prep in parallel
 */

import { logError, logInfo } from './logger';

export interface LocationWeatherResult {
  city: string;
  latitude: number;
  longitude: number;
  weatherData?: unknown;
  processingTime: number;
  fromCache: boolean;
}

export class LocationWeatherOptimizer {
  private static instance: LocationWeatherOptimizer;

  // Weather data cache for quick responses
  private readonly weatherCache = new Map<
    string,
    { data: unknown; expiry: number }
  >();
  private readonly WEATHER_CACHE_DURATION = 300000; // 5 minutes

  static getInstance(): LocationWeatherOptimizer {
    if (!LocationWeatherOptimizer.instance) {
      LocationWeatherOptimizer.instance = new LocationWeatherOptimizer();
    }
    return LocationWeatherOptimizer.instance;
  }

  /**
   * Get location and weather data in optimized parallel flow
   */
  async getLocationWithWeather(): Promise<LocationWeatherResult> {
    const startTime = Date.now();
    logInfo(
      '🚀 LocationWeatherOptimizer: Starting parallel location + weather request',
    );

    try {
      // Step 1: Fast location acquisition
      const location = await this.getFastLocation();
      const midTime = Date.now();

      logInfo(`📍 Location acquired in ${midTime - startTime}ms`, {
        city: location.city,
        accuracy: location.accuracy,
      });

      // Step 2: Check weather cache while location was being acquired
      const cacheKey = `${Math.round(location.latitude * 100)}_${Math.round(
        location.longitude * 100,
      )}`;
      const cachedWeather = this.getWeatherFromCache(cacheKey);

      const result: LocationWeatherResult = {
        city:
          location.city ||
          `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        latitude: location.latitude,
        longitude: location.longitude,
        processingTime: Date.now() - startTime,
        fromCache: !!cachedWeather,
      };

      if (cachedWeather) {
        logInfo('⚡ Using cached weather data');
        result.weatherData = cachedWeather;
      } else {
        // Step 3: Start weather fetch (caller will handle this separately for progressive loading)
        logInfo(
          '🌤️ Weather data will be fetched by caller for progressive loading',
        );
      }

      logInfo(
        `✅ Location+Weather optimization completed in ${result.processingTime}ms`,
      );
      return result;
    } catch (error) {
      logError('❌ LocationWeatherOptimizer failed:', error);
      throw error;
    }
  }

  /**
   * Fast location using optimized settings
   */
  private async getFastLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Optimized for speed over precision
      const options: PositionOptions = {
        enableHighAccuracy: false, // Faster GPS fix
        timeout: 7000, // 7 seconds max
        maximumAge: 120000, // 2 minutes cache
      };

      let resolved = false;

      const successCallback = async (position: GeolocationPosition) => {
        if (resolved) return;
        resolved = true;

        try {
          const result = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            city: undefined as string | undefined,
          };

          // Start reverse geocoding in parallel (don't wait for it)
          this.getReverseGeocodingAsync(result.latitude, result.longitude)
            .then(cityData => {
              result.city = cityData.city;
            })
            .catch(() => {
              // Silent fail for geocoding
            });

          resolve(result);
        } catch (error) {
          reject(
            new Error(
              error instanceof Error
                ? error.message
                : 'Location processing failed',
            ),
          );
        }
      };

      const errorCallback = (error: GeolocationPositionError) => {
        if (resolved) return;
        resolved = true;
        reject(new Error(error.message || 'Geolocation failed'));
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options,
      );

      // Additional timeout as safety net
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Location request timed out'));
        }
      }, options.timeout || 7000);
    });
  }

  /**
   * Fast reverse geocoding with timeout
   */
  private async getReverseGeocodingAsync(
    lat: number,
    lon: number,
  ): Promise<{ city?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0 (optimized-location@weatherapp.com)',
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const address = data?.address || {};

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.municipality ||
        'Unknown Location';

      return { city };
    } catch (error) {
      logError('Reverse geocoding failed (non-fatal):', error);
      return { city: 'Unknown Location' };
    }
  }

  /**
   * Cache weather data for quick subsequent requests
   */
  cacheWeatherData(lat: number, lon: number, weatherData: unknown): void {
    const cacheKey = `${Math.round(lat * 100)}_${Math.round(lon * 100)}`;
    const expiry = Date.now() + this.WEATHER_CACHE_DURATION;

    this.weatherCache.set(cacheKey, {
      data: weatherData,
      expiry,
    });

    // Clean up old entries
    this.cleanupWeatherCache();
  }

  /**
   * Get cached weather data if available
   */
  private getWeatherFromCache(cacheKey: string): unknown {
    const cached = this.weatherCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clean up expired weather cache entries
   */
  private cleanupWeatherCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.weatherCache.entries()) {
      if (cache.expiry <= now) {
        this.weatherCache.delete(key);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.weatherCache.clear();
    logInfo('LocationWeatherOptimizer: All caches cleared');
  }
}

/**
 * React hook for optimized location + weather flow
 */
export function useLocationWeatherOptimizer() {
  const optimizer = LocationWeatherOptimizer.getInstance();

  return {
    getLocationWithWeather: () => optimizer.getLocationWithWeather(),
    cacheWeatherData: (lat: number, lon: number, data: unknown) =>
      optimizer.cacheWeatherData(lat, lon, data),
    clearCaches: () => optimizer.clearCaches(),
  };
}
