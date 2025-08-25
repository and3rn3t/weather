/**
 * PWA Offline Storage Enhancement
 * Provides comprehensive offline weather data management
 */

interface WeatherCacheData {
  city: string;
  weather: unknown;
  timestamp: number;
  expires: number;
}

interface CachedCity {
  name: string;
  lat: number;
  lon: number;
  lastUpdated: number;
}

export class OfflineWeatherStorage {
  private readonly CACHE_KEY = 'weather-app-offline-data';
  private readonly CITIES_KEY = 'weather-app-cities';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Cache weather data for offline access
   */
  async cacheWeatherData(city: string, weatherData: unknown): Promise<void> {
    // Accept unknown weatherData to avoid explicit any; stored verbatim
    try {
      const cacheData: WeatherCacheData = {
        city,
        weather: weatherData,
        timestamp: Date.now(),
        expires: Date.now() + this.CACHE_DURATION,
      };

      const existingData = this.getOfflineData();
      existingData[city] = cacheData;

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(existingData));
      // Dev-friendly log
      // eslint-disable-next-line no-console
      console.log(`🗄️ Cached weather data for ${city}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('❌ Failed to cache weather data:', error);
    }
  }

  /**
   * Retrieve cached weather data
   */
  getCachedWeatherData<T = unknown>(city: string): T | null {
    try {
      const data = this.getOfflineData();
      const cityData = data[city];

      if (!cityData) return null;

      // Check if data is still valid
      if (Date.now() > cityData.expires) {
        delete data[city];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        return null;
      }

      // eslint-disable-next-line no-console
      console.log(`📱 Retrieved cached weather data for ${city}`);
      return cityData.weather as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('❌ Failed to retrieve cached weather data:', error);
      return null;
    }
  }

  /**
   * Get all cached offline data
   */
  private getOfflineData(): Record<string, WeatherCacheData> {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Cache recent city searches
   */
  async cacheRecentCity(name: string, lat: number, lon: number): Promise<void> {
    try {
      const cities = this.getRecentCities();
      const newCity: CachedCity = { name, lat, lon, lastUpdated: Date.now() };

      // Remove existing entry and add to beginning
      const filteredCities = cities.filter(c => c.name !== name);
      const updatedCities = [newCity, ...filteredCities].slice(0, 10); // Keep last 10

      localStorage.setItem(this.CITIES_KEY, JSON.stringify(updatedCities));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('❌ Failed to cache recent city:', error);
    }
  }

  /**
   * Get recent cities for offline access
   */
  getRecentCities(): CachedCity[] {
    try {
      const data = localStorage.getItem(this.CITIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear expired cache entries
   */
  cleanupExpiredCache(): void {
    try {
      const data = this.getOfflineData();
      const now = Date.now();
      let cleaned = false;

      Object.keys(data).forEach(city => {
        if (now > data[city].expires) {
          delete data[city];
          cleaned = true;
        }
      });

      if (cleaned) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        // eslint-disable-next-line no-console
        console.log('🧹 Cleaned up expired weather cache');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('❌ Failed to cleanup cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedCities: number;
    recentCities: number;
    totalSize: string;
    oldestCache: string | null;
  } {
    try {
      const weatherData = this.getOfflineData();
      const cities = this.getRecentCities();

      const weatherDataSize = JSON.stringify(weatherData).length;
      const citiesSize = JSON.stringify(cities).length;
      const totalBytes = weatherDataSize + citiesSize;

      const oldestEntry = Object.values(weatherData).sort(
        (a, b) => a.timestamp - b.timestamp
      )[0];

      return {
        cachedCities: Object.keys(weatherData).length,
        recentCities: cities.length,
        totalSize: `${(totalBytes / 1024).toFixed(1)} KB`,
        oldestCache: oldestEntry
          ? new Date(oldestEntry.timestamp).toLocaleString()
          : null,
      };
    } catch {
      return {
        cachedCities: 0,
        recentCities: 0,
        totalSize: '0 KB',
        oldestCache: null,
      };
    }
  }

  /**
   * Clear all offline data
   */
  clearAllCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.CITIES_KEY);
      // eslint-disable-next-line no-console
      console.log('🗑️ Cleared all offline weather data');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('❌ Failed to clear cache:', error);
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineWeatherStorage();
