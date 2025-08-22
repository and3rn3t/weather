/**
 * Favorite Cities Manager - Multi-Location Support
 *
 * Provides comprehensive multi-city weather management with:
 * - Save and manage unlimited favorite cities
 * - Quick switching between locations
 * - Local storage optimization for mobile devices
 * - Search history and suggestions
 * - Location-based prioritization
 * - Offline city data caching
 */

import { logError, logInfo, logWarn } from '../../utils/logger';

export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  addedAt: number;
  lastAccessed: number;
  accessCount: number;
  isCurrentLocation?: boolean;
  weatherData?: {
    temperature: number;
    condition: string;
    icon: string;
    lastUpdated: number;
  };
}

export interface FavoriteCitiesConfig {
  maxCities?: number;
  enableWeatherPreload?: boolean;
  syncAcrossDevices?: boolean;
  enableSearchHistory?: boolean;
  autoCleanupOldCities?: boolean;
}

export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  relevanceScore: number;
  distance?: number; // Distance from current location if available
}

class FavoriteCitiesManager {
  private static instance: FavoriteCitiesManager;
  private favoriteCities: Map<string, FavoriteCity> = new Map();
  private searchHistory: string[] = [];
  private currentLocationId: string | null = null;

  // Configuration with sensible defaults
  private readonly DEFAULT_CONFIG: Required<FavoriteCitiesConfig> = {
    maxCities: 20,
    enableWeatherPreload: true,
    syncAcrossDevices: false,
    enableSearchHistory: true,
    autoCleanupOldCities: true,
  };

  private config: Required<FavoriteCitiesConfig>;

  // Storage keys
  private readonly STORAGE_KEYS = {
    favorites: 'weather_favorite_cities',
    searchHistory: 'weather_search_history',
    currentLocation: 'weather_current_location_id',
    config: 'weather_cities_config',
  };

  constructor(config: FavoriteCitiesConfig = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  static getInstance(config?: FavoriteCitiesConfig): FavoriteCitiesManager {
    if (!FavoriteCitiesManager.instance) {
      FavoriteCitiesManager.instance = new FavoriteCitiesManager(config);
    }
    return FavoriteCitiesManager.instance;
  }

  /**
   * Add a city to favorites
   */
  async addFavoriteCity(
    city: Omit<FavoriteCity, 'id' | 'addedAt' | 'lastAccessed' | 'accessCount'>,
  ): Promise<FavoriteCity> {
    logInfo('⭐ FavoriteCities: Adding city to favorites', { city: city.name });

    // Check if city already exists
    const existingCity = this.findCityByCoordinates(
      city.latitude,
      city.longitude,
    );
    if (existingCity) {
      logInfo(
        '📍 FavoriteCities: City already in favorites, updating access time',
      );
      return this.updateCityAccess(existingCity.id);
    }

    // Check city limit
    if (this.favoriteCities.size >= this.config.maxCities) {
      if (this.config.autoCleanupOldCities) {
        await this.cleanupOldCities();
      } else {
        throw new Error(
          `Maximum ${this.config.maxCities} cities allowed. Please remove some cities first.`,
        );
      }
    }

    // Create new favorite city
    const favoriteCity: FavoriteCity = {
      ...city,
      id: this.generateCityId(
        city.name,
        city.country,
        city.latitude,
        city.longitude,
      ),
      addedAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
    };

    // Add to map and save
    this.favoriteCities.set(favoriteCity.id, favoriteCity);
    await this.saveToStorage();

    logInfo('✅ FavoriteCities: City added successfully', {
      id: favoriteCity.id,
      totalCities: this.favoriteCities.size,
    });

    return favoriteCity;
  }

  /**
   * Remove a city from favorites
   */
  async removeFavoriteCity(cityId: string): Promise<boolean> {
    logInfo('🗑️ FavoriteCities: Removing city from favorites', { cityId });

    if (!this.favoriteCities.has(cityId)) {
      logWarn('⚠️ FavoriteCities: City not found in favorites', { cityId });
      return false;
    }

    // Clear current location if it's the one being removed
    if (this.currentLocationId === cityId) {
      this.currentLocationId = null;
    }

    this.favoriteCities.delete(cityId);
    await this.saveToStorage();

    logInfo('✅ FavoriteCities: City removed successfully', {
      cityId,
      totalCities: this.favoriteCities.size,
    });

    return true;
  }

  /**
   * Get all favorite cities sorted by relevance
   */
  getFavoriteCities(
    sortBy: 'recent' | 'frequent' | 'alphabetical' | 'distance' = 'recent',
  ): FavoriteCity[] {
    const cities = Array.from(this.favoriteCities.values());

    switch (sortBy) {
      case 'recent':
        return cities.sort((a, b) => b.lastAccessed - a.lastAccessed);
      case 'frequent':
        return cities.sort((a, b) => b.accessCount - a.accessCount);
      case 'alphabetical':
        return cities.sort((a, b) => a.name.localeCompare(b.name));
      case 'distance':
        // Would need current location to calculate distance
        return cities.sort((a, b) => b.lastAccessed - a.lastAccessed);
      default:
        return cities;
    }
  }

  /**
   * Get a specific favorite city
   */
  getFavoriteCity(cityId: string): FavoriteCity | null {
    return this.favoriteCities.get(cityId) || null;
  }

  /**
   * Update city access (for usage tracking)
   */
  updateCityAccess(cityId: string): FavoriteCity {
    const city = this.favoriteCities.get(cityId);
    if (!city) {
      throw new Error(`City ${cityId} not found in favorites`);
    }

    city.lastAccessed = Date.now();
    city.accessCount += 1;

    this.favoriteCities.set(cityId, city);
    this.saveToStorage(); // Save asynchronously

    return city;
  }

  /**
   * Set current location city
   */
  async setCurrentLocationCity(cityId: string): Promise<void> {
    logInfo('🎯 FavoriteCities: Setting current location city', { cityId });

    if (!this.favoriteCities.has(cityId)) {
      throw new Error(`City ${cityId} not found in favorites`);
    }

    // Update previous current location
    if (this.currentLocationId) {
      const previousCity = this.favoriteCities.get(this.currentLocationId);
      if (previousCity) {
        previousCity.isCurrentLocation = false;
        this.favoriteCities.set(this.currentLocationId, previousCity);
      }
    }

    // Set new current location
    const city = this.favoriteCities.get(cityId);
    if (!city) {
      throw new Error(`City ${cityId} not found in favorites`);
    }

    city.isCurrentLocation = true;
    city.lastAccessed = Date.now();
    city.accessCount += 1;

    this.favoriteCities.set(cityId, city);
    this.currentLocationId = cityId;

    await this.saveToStorage();

    logInfo('✅ FavoriteCities: Current location set successfully', { cityId });
  }

  /**
   * Get current location city
   */
  getCurrentLocationCity(): FavoriteCity | null {
    if (!this.currentLocationId) {
      return null;
    }
    return this.favoriteCities.get(this.currentLocationId) || null;
  }

  /**
   * Search cities with smart suggestions
   */
  searchCities(query: string, limit: number = 10): CitySearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    logInfo('🔍 FavoriteCities: Searching cities', { query, limit });

    const results: CitySearchResult[] = [];

    // Search in favorites first (higher relevance)
    for (const city of this.favoriteCities.values()) {
      const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
      const countryMatch = city.country.toLowerCase().includes(normalizedQuery);
      const stateMatch = city.state?.toLowerCase().includes(normalizedQuery);

      if (nameMatch || countryMatch || stateMatch) {
        results.push({
          id: city.id,
          name: city.name,
          country: city.country,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          relevanceScore: this.calculateRelevanceScore(city, normalizedQuery),
        });
      }
    }

    // Sort by relevance and limit results
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, limit);
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query: string): void {
    if (!this.config.enableSearchHistory || query.length < 2) {
      return;
    }

    // Remove if already exists to move to front
    this.searchHistory = this.searchHistory.filter(item => item !== query);

    // Add to front
    this.searchHistory.unshift(query);

    // Limit history size
    this.searchHistory = this.searchHistory.slice(0, 50);

    this.saveToStorage();
  }

  /**
   * Get search history suggestions
   */
  getSearchSuggestions(query: string, limit: number = 5): string[] {
    if (!this.config.enableSearchHistory) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    return this.searchHistory
      .filter(item => item.toLowerCase().includes(normalizedQuery))
      .slice(0, limit);
  }

  /**
   * Update city weather data (for quick preview)
   */
  async updateCityWeather(
    cityId: string,
    weatherData: FavoriteCity['weatherData'],
  ): Promise<void> {
    const city = this.favoriteCities.get(cityId);
    if (!city) {
      return;
    }

    city.weatherData = weatherData;
    this.favoriteCities.set(cityId, city);

    // Save to storage for persistence
    await this.saveToStorage();
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(city: FavoriteCity, query: string): number {
    let score = 0;

    // Exact name match gets highest score
    if (city.name.toLowerCase() === query) {
      score += 100;
    } else if (city.name.toLowerCase().startsWith(query)) {
      score += 80;
    } else if (city.name.toLowerCase().includes(query)) {
      score += 60;
    }

    // Country match
    if (city.country.toLowerCase().includes(query)) {
      score += 40;
    }

    // State match
    if (city.state?.toLowerCase().includes(query)) {
      score += 30;
    }

    // Boost score based on usage frequency
    score += Math.min(city.accessCount * 2, 20);

    // Boost recently accessed cities
    const daysSinceAccess =
      (Date.now() - city.lastAccessed) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 1) {
      score += 15;
    } else if (daysSinceAccess < 7) {
      score += 10;
    }

    // Boost current location
    if (city.isCurrentLocation) {
      score += 25;
    }

    return score;
  }

  /**
   * Find city by coordinates (to avoid duplicates)
   */
  private findCityByCoordinates(
    latitude: number,
    longitude: number,
    tolerance: number = 0.01,
  ): FavoriteCity | null {
    for (const city of this.favoriteCities.values()) {
      const latDiff = Math.abs(city.latitude - latitude);
      const lonDiff = Math.abs(city.longitude - longitude);

      if (latDiff < tolerance && lonDiff < tolerance) {
        return city;
      }
    }
    return null;
  }

  /**
   * Generate unique city ID
   */
  private generateCityId(
    name: string,
    country: string,
    latitude: number,
    longitude: number,
  ): string {
    const baseId = `${name}_${country}_${latitude.toFixed(
      2,
    )}_${longitude.toFixed(2)}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    return `city_${baseId}_${Date.now()}`;
  }

  /**
   * Cleanup old cities when limit reached
   */
  private async cleanupOldCities(): Promise<void> {
    logInfo('🧹 FavoriteCities: Cleaning up old cities');

    const cities = this.getFavoriteCities('frequent');
    const citiesToRemove = cities.slice(this.config.maxCities - 1);

    for (const city of citiesToRemove) {
      if (!city.isCurrentLocation) {
        // Never remove current location
        await this.removeFavoriteCity(city.id);
      }
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load favorite cities
      const favoritesData = localStorage.getItem(this.STORAGE_KEYS.favorites);
      if (favoritesData) {
        const cities: FavoriteCity[] = JSON.parse(favoritesData);
        this.favoriteCities = new Map(cities.map(city => [city.id, city]));
      }

      // Load search history
      const historyData = localStorage.getItem(this.STORAGE_KEYS.searchHistory);
      if (historyData) {
        this.searchHistory = JSON.parse(historyData);
      }

      // Load current location
      const currentLocationData = localStorage.getItem(
        this.STORAGE_KEYS.currentLocation,
      );
      if (currentLocationData) {
        this.currentLocationId = currentLocationData;
      }

      logInfo('✅ FavoriteCities: Data loaded from storage', {
        citiesCount: this.favoriteCities.size,
        historyCount: this.searchHistory.length,
      });
    } catch (error) {
      logError('❌ FavoriteCities: Error loading from storage', error);
    }
  }

  /**
   * Save data to localStorage
   */
  private async saveToStorage(): Promise<void> {
    try {
      // Save favorite cities
      const cities = Array.from(this.favoriteCities.values());
      localStorage.setItem(this.STORAGE_KEYS.favorites, JSON.stringify(cities));

      // Save search history
      if (this.config.enableSearchHistory) {
        localStorage.setItem(
          this.STORAGE_KEYS.searchHistory,
          JSON.stringify(this.searchHistory),
        );
      }

      // Save current location
      if (this.currentLocationId) {
        localStorage.setItem(
          this.STORAGE_KEYS.currentLocation,
          this.currentLocationId,
        );
      }

      logInfo('💾 FavoriteCities: Data saved to storage');
    } catch (error) {
      logError('❌ FavoriteCities: Error saving to storage', error);
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    logWarn('🧹 FavoriteCities: Clearing all data');

    this.favoriteCities.clear();
    this.searchHistory = [];
    this.currentLocationId = null;

    // Clear from storage
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    logInfo('✅ FavoriteCities: All data cleared');
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    citiesCount: number;
    storageSize: number;
    historyCount: number;
  } {
    const citiesData = localStorage.getItem(this.STORAGE_KEYS.favorites) || '';
    const historyData =
      localStorage.getItem(this.STORAGE_KEYS.searchHistory) || '';

    return {
      citiesCount: this.favoriteCities.size,
      storageSize: (citiesData.length + historyData.length) * 2, // Rough estimate in bytes
      historyCount: this.searchHistory.length,
    };
  }
}

// Export singleton instance
export const favoriteCitiesManager = FavoriteCitiesManager.getInstance();

// Export hook for React components
export function useFavoriteCities() {
  const manager = FavoriteCitiesManager.getInstance();

  return {
    addCity: (
      city: Omit<
        FavoriteCity,
        'id' | 'addedAt' | 'lastAccessed' | 'accessCount'
      >,
    ) => manager.addFavoriteCity(city),
    removeCity: (cityId: string) => manager.removeFavoriteCity(cityId),
    getCities: (sortBy?: 'recent' | 'frequent' | 'alphabetical' | 'distance') =>
      manager.getFavoriteCities(sortBy),
    getCity: (cityId: string) => manager.getFavoriteCity(cityId),
    setCurrentLocation: (cityId: string) =>
      manager.setCurrentLocationCity(cityId),
    getCurrentLocation: () => manager.getCurrentLocationCity(),
    searchCities: (query: string, limit?: number) =>
      manager.searchCities(query, limit),
    addToHistory: (query: string) => manager.addToSearchHistory(query),
    getSuggestions: (query: string, limit?: number) =>
      manager.getSearchSuggestions(query, limit),
    updateWeather: (cityId: string, weather: FavoriteCity['weatherData']) =>
      manager.updateCityWeather(cityId, weather),
    clearAll: () => manager.clearAllData(),
    getStats: () => manager.getStorageStats(),
  };
}

export default FavoriteCitiesManager;
