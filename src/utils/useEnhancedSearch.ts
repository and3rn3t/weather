/**
 * Enhanced Search Hook with Popular Cities Integration
 *
 * Combines real-time API search with popular cities prefetching
 * for instant results and improved user experience.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from './logger';
import { popularCitiesCache, type PopularCity } from './popularCitiesCache';

interface EnhancedCityResult {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  country: string;
  isPopular: boolean;
  searchPriority?: number;
  category?: PopularCity['category'];
}

interface UseEnhancedSearchOptions {
  maxResults?: number;
  debounceMs?: number;
  enableGeolocation?: boolean;
  includePopularCities?: boolean;
  popularCitiesFirst?: boolean;
}

interface UseEnhancedSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: EnhancedCityResult[];
  popularSuggestions: PopularCity[];
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  clearResults: () => void;
  getUserLocation: () => Promise<GeolocationPosition | null>;
}

interface APIResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    country?: string;
  };
}

/**
 * Enhanced search hook with popular cities integration
 */
export function useEnhancedSearch(
  options: UseEnhancedSearchOptions = {},
): UseEnhancedSearchReturn {
  const {
    maxResults = 8,
    debounceMs = 200,
    enableGeolocation = true,
    includePopularCities = true,
    popularCitiesFirst = true,
  } = options;

  // State management
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EnhancedCityResult[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<PopularCity[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // Refs for cleanup and caching
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const searchCacheRef = useRef<Map<string, EnhancedCityResult[]>>(new Map());

  /**
   * Get user's geolocation
   */
  const getUserLocation =
    useCallback(async (): Promise<GeolocationPosition | null> => {
      if (!enableGeolocation || !navigator.geolocation) return null;

      return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          position => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
            resolve(position);
          },
          () => resolve(null), // Silent fail on geolocation error
          { timeout: 5000, enableHighAccuracy: false },
        );
      });
    }, [enableGeolocation]);

  /**
   * Helper function to filter API results
   */
  const filterValidLocations = useCallback(
    (result: {
      type: string;
      class: string;
      importance?: number;
      display_name?: string;
    }) => {
      const isValidType =
        result.type === 'city' ||
        result.type === 'town' ||
        result.type === 'village' ||
        result.type === 'hamlet' ||
        result.type === 'administrative' ||
        result.class === 'place';

      const hasGoodImportance = !result.importance || result.importance > 0.1;
      const isUSLocation =
        result.display_name?.includes('United States') ||
        result.display_name?.includes(', US') ||
        result.display_name?.includes('USA');

      return isValidType && hasGoodImportance && isUSLocation;
    },
    [],
  );

  /**
   * Helper function to transform API result to enhanced format
   */
  const transformToEnhancedResult = useCallback(
    (result: APIResult): EnhancedCityResult => {
      const cityName =
        result.address?.city ||
        result.address?.town ||
        result.address?.village ||
        result.address?.hamlet ||
        result.display_name.split(',')[0];

      const isPopular = popularCitiesCache
        .getPopularCities()
        .some(
          popular =>
            popular.name.toLowerCase() === cityName.toLowerCase() &&
            popular.country
              .toLowerCase()
              .includes((result.address?.country || '').toLowerCase()),
        );

      return {
        name: cityName,
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        country: result.address?.country || '',
        isPopular,
        searchPriority: isPopular ? 8 : 5,
      };
    },
    [],
  );

  /**
   * Helper function for global search fallback
   */
  const performGlobalSearch = useCallback(
    async (
      searchQuery: string,
      existingResults: EnhancedCityResult[],
    ): Promise<EnhancedCityResult[]> => {
      const globalSearchParams = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        'accept-language': 'en-US,en',
        dedupe: '1',
      });

      const globalResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?${globalSearchParams}`,
        {
          headers: {
            'User-Agent': 'PremiumWeatherApp/2.0 (Global Search)',
          },
          signal: abortControllerRef.current?.signal,
          cache: 'default',
        },
      );

      if (!globalResponse.ok) return existingResults;

      const globalResults = await globalResponse.json();
      const additionalResults = globalResults
        .filter(
          (result: { type: string; class: string; importance?: number }) => {
            const isValidType =
              result.type === 'city' ||
              result.type === 'town' ||
              result.type === 'village' ||
              result.type === 'hamlet' ||
              result.type === 'administrative' ||
              result.class === 'place';
            const hasGoodImportance =
              !result.importance || result.importance > 0.1;
            return isValidType && hasGoodImportance;
          },
        )
        .map((result: APIResult) => ({
          name:
            result.address?.city ||
            result.address?.town ||
            result.address?.village ||
            result.address?.hamlet ||
            result.display_name.split(',')[0],
          display_name: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          country: result.address?.country || '',
          isPopular: false,
          searchPriority: 3,
        }));

      // Merge results, avoiding duplicates
      const allResults = [...existingResults];
      for (const newResult of additionalResults) {
        const isDuplicate = allResults.some(
          existing =>
            Math.abs(existing.lat - newResult.lat) < 0.01 &&
            Math.abs(existing.lon - newResult.lon) < 0.01,
        );
        if (!isDuplicate && allResults.length < maxResults) {
          allResults.push(newResult);
        }
      }
      return allResults;
    },
    [maxResults],
  );

  /**
   * Search popular cities instantly
   */
  const searchPopularCities = useCallback(
    (searchQuery: string): PopularCity[] => {
      if (!includePopularCities) return [];

      return popularCitiesCache.getPopularCities(
        searchQuery,
        userLocation || undefined,
      );
    },
    [includePopularCities, userLocation],
  );

  /**
   * Search API with enhanced caching
   */
  const searchAPI = useCallback(
    async (searchQuery: string): Promise<EnhancedCityResult[]> => {
      if (searchQuery.length < 2) return [];

      // Check cache first
      const cacheKey = searchQuery.toLowerCase();
      if (searchCacheRef.current.has(cacheKey)) {
        const cached = searchCacheRef.current.get(cacheKey);
        return cached || [];
      }

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const searchParams = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '15', // Increased for better coverage
          'accept-language': 'en-US,en', // US preference
          dedupe: '1',
          extratags: '1',
          namedetails: '1',
          // US-focused parameters
          countrycodes: 'us', // Prioritize US results
          viewbox: '-125,49,-66,24', // US bounding box
          bounded: '1',
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${searchParams}`,
          {
            headers: {
              'User-Agent': 'PremiumWeatherApp/2.0 (Enhanced Search)',
            },
            signal: abortControllerRef.current.signal,
            cache: 'default',
          },
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const apiResults = await response.json();

        // Transform API results to enhanced format with improved filtering
        const enhancedResults: EnhancedCityResult[] = apiResults
          .filter(filterValidLocations)
          .map(transformToEnhancedResult)
          .sort((a: EnhancedCityResult, b: EnhancedCityResult) => {
            // Sort popular cities first if enabled
            if (popularCitiesFirst) {
              if (a.isPopular && !b.isPopular) return -1;
              if (b.isPopular && !a.isPopular) return 1;
            }

            // Then sort by search priority
            return (b.searchPriority || 0) - (a.searchPriority || 0);
          })
          .slice(0, maxResults);

        // If we don't have enough results, try a broader search without US restriction
        const finalResults =
          enhancedResults.length < 3
            ? await performGlobalSearch(searchQuery, enhancedResults)
            : enhancedResults;

        // Cache results
        searchCacheRef.current.set(cacheKey, finalResults);

        // Limit cache size
        if (searchCacheRef.current.size > 50) {
          const firstKey = searchCacheRef.current.keys().next().value;
          if (firstKey) {
            searchCacheRef.current.delete(firstKey);
          }
        }

        return finalResults;
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          throw err;
        }
        return [];
      }
    },
    [
      maxResults,
      popularCitiesFirst,
      filterValidLocations,
      transformToEnhancedResult,
      performGlobalSearch,
    ],
  );

  /**
   * Combined search function
   */
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      setError(null);

      try {
        // Get popular cities first for instant results
        const popularResults = searchPopularCities(searchQuery);

        // Show popular cities immediately if found
        if (popularResults.length > 0) {
          const instantResults: EnhancedCityResult[] = popularResults
            .slice(0, maxResults)
            .map(city => ({
              name: city.name,
              display_name: `${city.name}, ${city.country}`,
              lat: city.lat,
              lon: city.lon,
              country: city.country,
              isPopular: true,
              searchPriority: city.searchPriority,
              category: city.category,
            }));

          setResults(instantResults);
          setPopularSuggestions(popularResults.slice(0, 6));
        }

        // Then fetch API results for comprehensive search
        if (searchQuery.length >= 2) {
          const apiResults = await searchAPI(searchQuery);

          if (includePopularCities && popularResults.length > 0) {
            // Merge popular and API results, removing duplicates
            const combinedResults = [
              ...popularResults.map(city => ({
                name: city.name,
                display_name: `${city.name}, ${city.country}`,
                lat: city.lat,
                lon: city.lon,
                country: city.country,
                isPopular: true,
                searchPriority: city.searchPriority,
                category: city.category,
              })),
              ...apiResults,
            ];

            // Remove duplicates based on city name and country
            const uniqueResults = combinedResults.filter(
              (result, index, arr) =>
                arr.findIndex(
                  r =>
                    r.name.toLowerCase() === result.name.toLowerCase() &&
                    r.country.toLowerCase() === result.country.toLowerCase(),
                ) === index,
            );

            setResults(uniqueResults.slice(0, maxResults));
          } else {
            setResults(apiResults);
          }
        }
      } catch (err) {
        logError('Enhanced search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchPopularCities, searchAPI, includePopularCities, maxResults],
  );

  /**
   * Debounced search effect
   */
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch, debounceMs]);

  /**
   * Initialize popular suggestions and geolocation
   */
  useEffect(() => {
    // Pre-load popular cities
    popularCitiesCache.preloadToStorage();

    // Get initial popular suggestions
    const initialSuggestions = popularCitiesCache.getInstantSuggestions(8);
    setPopularSuggestions(initialSuggestions);

    // Get user location if enabled
    if (enableGeolocation) {
      getUserLocation();
    }
  }, [enableGeolocation, getUserLocation]);

  /**
   * Clear all results and state
   */
  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    setIsLoading(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    popularSuggestions,
    isLoading,
    hasSearched,
    error,
    clearResults,
    getUserLocation,
  };
}

/**
 * Hook for getting popular cities by category
 */
export function usePopularCitiesByCategory(category: PopularCity['category']) {
  const [cities, setCities] = useState<PopularCity[]>([]);

  useEffect(() => {
    const categoryCities = popularCitiesCache.getCitiesByCategory(category, 10);
    setCities(categoryCities);
  }, [category]);

  return cities;
}

/**
 * Hook for getting nearby popular cities
 */
export function useNearbyPopularCities(
  userLocation: { lat: number; lon: number } | null,
) {
  const [nearbyCities, setNearbyCities] = useState<PopularCity[]>([]);

  useEffect(() => {
    if (userLocation) {
      const nearby = popularCitiesCache
        .getPopularCities('', userLocation)
        .slice(0, 8);
      setNearbyCities(nearby);
    }
  }, [userLocation]);

  return nearbyCities;
}
