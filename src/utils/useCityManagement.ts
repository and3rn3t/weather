/**
 * City Management Hook
 *
 * Manages favorite cities, recent locations, and city switching functionality.
 * Provides localStorage persistence and weather data coordination.
 */

import { useState, useEffect, useCallback } from 'react';
import { logError } from './logger';


export interface SavedCity {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  country?: string;
  state?: string;
  isFavorite: boolean;
  lastAccessed: number;
  addedAt: number;
}

export interface CityManagementState {
  favorites: SavedCity[];
  recentCities: SavedCity[];
  currentCity: SavedCity | null;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEYS = {
  FAVORITES: 'weather-app-favorite-cities',
  RECENT: 'weather-app-recent-cities',
  CURRENT: 'weather-app-current-city',
} as const;

const MAX_RECENT_CITIES = 10;
const MAX_FAVORITE_CITIES = 20;

/**
 * useCityManagement - Custom React hook for useCityManagement functionality
 */
/**
 * useCityManagement - Custom React hook for useCityManagement functionality
 */
export const useCityManagement = () => {
  const [state, setState] = useState<CityManagementState>({
    favorites: [],
    recentCities: [],
    currentCity: null,
    isLoading: false,
    error: null,
  });

  // Load saved data from localStorage on mount
  const loadSavedData = useCallback(() => {
    try {
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENT);
      const savedCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT);

      setState(prev => ({
        ...prev,
        favorites: savedFavorites ? JSON.parse(savedFavorites) : [],
        recentCities: savedRecent ? JSON.parse(savedRecent) : [],
        currentCity: savedCurrent ? JSON.parse(savedCurrent) : null,
        error: null,
      }));
    } catch (error) {
      logError('Failed to load saved city data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load saved cities',
      }));
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Generate unique ID for a city
  const generateCityId = useCallback(
    (name: string, latitude: number, longitude: number): string => {
      return `${name.toLowerCase().replace(/\s+/g, '-')}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    },
    []
  );

  // Create SavedCity object from basic data
  const createCityObject = useCallback(
    (
      name: string,
      latitude: number,
      longitude: number,
      displayName?: string,
      country?: string,
      state?: string,
      isFavorite: boolean = false
    ): SavedCity => {
      const now = Date.now();
      return {
        id: generateCityId(name, latitude, longitude),
        name,
        displayName: displayName || name,
        latitude,
        longitude,
        country,
        state,
        isFavorite,
        lastAccessed: now,
        addedAt: now,
      };
    },
    [generateCityId]
  );

  // Add city to favorites
  const addToFavorites = useCallback(
    (
      name: string,
      latitude: number,
      longitude: number,
      displayName?: string,
      country?: string,
      state?: string
    ) => {
      setState(prev => {
        const cityId = generateCityId(name, latitude, longitude);

        // Check if already in favorites
        const existingIndex = prev.favorites.findIndex(
          city => city.id === cityId
        );
        if (existingIndex !== -1) {
          // Update existing favorite
          const updatedFavorites = [...prev.favorites];
          updatedFavorites[existingIndex] = {
            ...updatedFavorites[existingIndex],
            lastAccessed: Date.now(),
            displayName: displayName || name,
            country,
            state,
          };
          return { ...prev, favorites: updatedFavorites };
        }

        // Add new favorite
        const newCity = createCityObject(
          name,
          latitude,
          longitude,
          displayName,
          country,
          state,
          true
        );
        const updatedFavorites = [newCity, ...prev.favorites].slice(
          0,
          MAX_FAVORITE_CITIES
        );

        return { ...prev, favorites: updatedFavorites };
      });
    },
    [generateCityId, createCityObject]
  );

  // Remove city from favorites
  const removeFromFavorites = useCallback((cityId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.filter(city => city.id !== cityId),
    }));
  }, []);

  // Add city to recent history
  const addToRecent = useCallback(
    (
      name: string,
      latitude: number,
      longitude: number,
      displayName?: string,
      country?: string,
      state?: string
    ) => {
      setState(prev => {
        const cityId = generateCityId(name, latitude, longitude);

        // Remove if already exists
        const filteredRecent = prev.recentCities.filter(
          city => city.id !== cityId
        );

        // Add to front of list
        const newCity = createCityObject(
          name,
          latitude,
          longitude,
          displayName,
          country,
          state,
          false
        );
        const updatedRecent = [newCity, ...filteredRecent].slice(
          0,
          MAX_RECENT_CITIES
        );

        return { ...prev, recentCities: updatedRecent };
      });
    },
    [generateCityId, createCityObject]
  );

  // Set current city
  const setCurrentCity = useCallback(
    (
      name: string,
      latitude: number,
      longitude: number,
      displayName?: string,
      country?: string,
      state?: string
    ) => {
      const city = createCityObject(
        name,
        latitude,
        longitude,
        displayName,
        country,
        state,
        false
      );

      setState(prev => ({
        ...prev,
        currentCity: city,
      }));

      // Also add to recent history
      addToRecent(name, latitude, longitude, displayName, country, state);
    },
    [createCityObject, addToRecent]
  );

  // Check if city is in favorites
  const isFavorite = useCallback(
    (name: string, latitude: number, longitude: number): boolean => {
      const cityId = generateCityId(name, latitude, longitude);
      return state.favorites.some(city => city.id === cityId);
    },
    [state.favorites, generateCityId]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (
      name: string,
      latitude: number,
      longitude: number,
      displayName?: string,
      country?: string,
      state?: string
    ) => {
      if (isFavorite(name, latitude, longitude)) {
        const cityId = generateCityId(name, latitude, longitude);
        removeFromFavorites(cityId);
      } else {
        addToFavorites(name, latitude, longitude, displayName, country, state);
      }
    },
    [isFavorite, generateCityId, removeFromFavorites, addToFavorites]
  );

  // Clear all recent cities
  const clearRecentCities = useCallback(() => {
    setState(prev => ({ ...prev, recentCities: [] }));
    localStorage.removeItem(STORAGE_KEYS.RECENT);
  }, []);

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setState(prev => ({ ...prev, favorites: [] }));
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
  }, []);

  // Get combined city list for quick access (favorites + recent)
  const getQuickAccessCities = useCallback((): SavedCity[] => {
    const allCities = [...state.favorites, ...state.recentCities];
    const uniqueCities = allCities.filter(
      (city, index, self) => index === self.findIndex(c => c.id === city.id)
    );

    // Sort by: favorites first, then by last accessed
    return uniqueCities.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.lastAccessed - a.lastAccessed;
    });
  }, [state.favorites, state.recentCities]);

  // Export city data
  const exportCityData = useCallback(() => {
    return {
      favorites: state.favorites,
      recentCities: state.recentCities,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }, [state.favorites, state.recentCities]);

  // Import city data
  const importCityData = useCallback(
    (data: {
      favorites?: SavedCity[];
      recentCities?: SavedCity[];
      version?: string;
    }) => {
      try {
        if (data.favorites && Array.isArray(data.favorites)) {
          setState(prev => ({
            ...prev,
            favorites: data.favorites!.slice(0, MAX_FAVORITE_CITIES),
            recentCities: data.recentCities
              ? data.recentCities.slice(0, MAX_RECENT_CITIES)
              : prev.recentCities,
            error: null,
          }));
          return true;
        }
        throw new Error('Invalid city data format');
      } catch (err) {
        logError('Failed to import city data:', err);
        setState(prev => ({
          ...prev,
          error: 'Failed to import city data',
        }));
        return false;
      }
    },
    []
  );

  return {
    // State
    favorites: state.favorites,
    recentCities: state.recentCities,
    currentCity: state.currentCity,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    addToFavorites,
    removeFromFavorites,
    addToRecent,
    setCurrentCity,
    toggleFavorite,
    clearRecentCities,
    clearFavorites,

    // Utilities
    isFavorite,
    getQuickAccessCities,
    exportCityData,
    importCityData,
    loadSavedData,

    // Constants
    maxFavorites: MAX_FAVORITE_CITIES,
    maxRecent: MAX_RECENT_CITIES,
  };
};
