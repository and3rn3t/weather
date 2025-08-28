import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import { logError, logInfo } from '../utils/logger';
import { optimizedFetchJson } from '../utils/optimizedFetch';
import type { ThemeColors } from '../utils/themeConfig';
import {
  useInteractionFeedback,
  useWeatherAnnouncements,
} from '../utils/useMultiSensoryWeather';
import './SearchScreen.css';
import { NavigationBar } from './modernWeatherUI/NavigationBar';

interface SearchScreenProps {
  theme: ThemeColors;
  onBack: () => void;
  onLocationSelect: (
    cityName: string,
    latitude: number,
    longitude: number
  ) => void;
}

interface SearchResult {
  id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  country: string;
  state?: string;
  type: string;
  importance: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  type: string;
  class: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Enhanced SearchScreen - Clean, responsive, and user-friendly
 *
 * Features:
 * - Real-time search with debouncing
 * - Enhanced result formatting and readability
 * - Responsive design for all screen sizes
 * - Better error handling and loading states
 * - Improved accessibility
 * - Clean visual hierarchy
 */
function SearchScreen({
  theme: _theme,
  onBack,
  onLocationSelect,
}: Readonly<SearchScreenProps>) {
  const haptic = useHaptic();

  // iOS26 Phase 3C: Multi-sensory search experience
  const interactionFeedback = useInteractionFeedback();
  const weatherAnnouncements = useWeatherAnnouncements();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weather-recent-searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 6) : []);
      }
    } catch (error) {
      logError('Error loading recent searches:', error);
    }
  }, []);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Enhanced city name formatting
  const formatCityDisplay = useCallback((displayName: string) => {
    const parts = displayName.split(',').map(part => part.trim());
    const cityName = parts[0];
    const region = parts.length > 1 ? parts[1] : '';
    const country = parts.length > 2 ? parts[parts.length - 1] : parts[1] || '';

    return {
      name: cityName,
      region: region && region !== country ? region : '',
      country: country || '',
    };
  }, []);

  // Enhanced search with US location optimization
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setShowResults(false);
        setError('');
        return;
      }

      setIsLoading(true);
      setError('');
      setShowResults(true);

      try {
        // Enhanced search parameters with US prioritization
        const searchParams = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '15', // Increased limit for better US coverage
          'accept-language': 'en-US,en', // US English preference
          dedupe: '1',
          extratags: '1',
          namedetails: '1',
          // US-focused parameters
          countrycodes: 'us,ca,mx', // North America focus
          viewbox: '-125,49,-66,24', // US bounding box
          bounded: '1',
        });

        const data = await optimizedFetchJson<NominatimResult[]>(
          `https://nominatim.openstreetmap.org/search?${searchParams}`,
          {},
          `search:us:${searchQuery}`
        );

        // Enhanced filtering with better US location support
        const cityResults = data
          .filter((item: NominatimResult) => {
            const isValidLocation =
              item.type === 'city' ||
              item.type === 'town' ||
              item.type === 'village' ||
              item.type === 'hamlet' ||
              item.type === 'administrative' ||
              item.class === 'place';

            // Improved importance threshold for US locations
            const hasGoodImportance =
              !item.importance || item.importance > 0.15;

            // Prioritize US locations
            const isUSLocation =
              item.display_name?.includes('United States') ||
              item.address?.country === 'United States';

            return isValidLocation && (hasGoodImportance || isUSLocation);
          })
          .map((item, index) => ({
            id: `${item.place_id}-${index}`,
            name: formatCityDisplay(item.display_name).name,
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            country: formatCityDisplay(item.display_name).country,
            state: formatCityDisplay(item.display_name).region,
            type: item.type,
            importance: item.importance || 0,
          }))
          .sort((a, b) => {
            // Enhanced sorting for US locations
            const aIsUS = a.display_name.includes('United States');
            const bIsUS = b.display_name.includes('United States');

            // US locations first
            if (aIsUS && !bIsUS) return -1;
            if (bIsUS && !aIsUS) return 1;

            // Exact name matches
            const searchLower = searchQuery.toLowerCase();
            const aExact = a.name.toLowerCase().startsWith(searchLower) ? 1 : 0;
            const bExact = b.name.toLowerCase().startsWith(searchLower) ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;

            // Then by importance
            return (b.importance || 0) - (a.importance || 0);
          })
          .slice(0, 8); // Limit to 8 results for better UX

        setResults(cityResults);

        if (cityResults.length === 0) {
          // If no results with US focus, try global search
          try {
            const globalData = await optimizedFetchJson<NominatimResult[]>(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                searchQuery
              )}&format=json&limit=10&addressdetails=1`,
              {},
              `search:global:${searchQuery}`
            );
            const globalResults = globalData
              .filter((item: NominatimResult) => {
                const isCity =
                  item.type === 'city' ||
                  item.type === 'town' ||
                  item.type === 'village' ||
                  item.class === 'place';
                return isCity && (!item.importance || item.importance > 0.1);
              })
              .map((item, index) => ({
                id: `global-${item.place_id}-${index}`,
                name: formatCityDisplay(item.display_name).name,
                display_name: item.display_name,
                lat: item.lat,
                lon: item.lon,
                country: formatCityDisplay(item.display_name).country,
                state: formatCityDisplay(item.display_name).region,
                type: item.type,
                importance: item.importance || 0,
              }))
              .slice(0, 5);

            setResults(globalResults);
          } catch {
            // ignore global fallback errors
          }

          if (cityResults.length === 0) {
            setError(
              'No cities found. Try a different search term or check spelling.'
            );
          }
        }
      } catch (error) {
        logError('Enhanced search error:', error);
        setError('Search failed. Please check your connection and try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [formatCityDisplay]
  );

  // Debounced search
  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Handle city selection
  const handleCitySelection = useCallback(
    async (city: SearchResult) => {
      haptic.selection();

      // iOS26 Phase 3C: Enhanced location selection with multi-sensory feedback
      await interactionFeedback.onSuccess();
      await weatherAnnouncements.announceStateChange(
        'location-changed',
        `Selected location: ${city.name}`
      );

      const latitude = parseFloat(city.lat);
      const longitude = parseFloat(city.lon);

      // Add to recent searches
      const newRecent = [
        city,
        ...recentSearches.filter(r => r.id !== city.id),
      ].slice(0, 6);

      setRecentSearches(newRecent);
      localStorage.setItem(
        'weather-recent-searches',
        JSON.stringify(newRecent)
      );

      logInfo(`Selected city: ${city.name} (${latitude}, ${longitude})`);
      onLocationSelect(city.name, latitude, longitude);
    },
    [
      haptic,
      onLocationSelect,
      recentSearches,
      interactionFeedback,
      weatherAnnouncements,
    ]
  );

  // Handle recent search selection
  const handleRecentSelect = useCallback(
    async (result: SearchResult) => {
      haptic.selection();

      // iOS26 Phase 3C: Enhanced recent selection with multi-sensory feedback
      await interactionFeedback.onSuccess();
      await weatherAnnouncements.announceStateChange(
        'location-changed',
        `Selected recent location: ${result.name}`
      );

      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      onLocationSelect(result.name, latitude, longitude);
    },
    [haptic, onLocationSelect, interactionFeedback, weatherAnnouncements]
  );

  // Get current location
  const getCurrentLocation = useCallback(() => {
    haptic.buttonPress();

    if (!navigator.geolocation) {
      haptic.error();
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      position => {
        haptic.searchSuccess();
        setIsLoading(false);
        onLocationSelect(
          'Current Location',
          position.coords.latitude,
          position.coords.longitude
        );
      },
      error => {
        haptic.error();
        setIsLoading(false);
        setError('Unable to get your location. Please check your permissions.');
        logError('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [haptic, onLocationSelect]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Derived UI fragments for clarity
  const hasTypedQuery = query.length >= 2;

  return (
    <div className="enhanced-search-screen ios26-container">
      <NavigationBar
        title="Search"
        theme={
          {
            primaryText: 'var(--ios26-text-primary)',
            secondaryText: 'var(--ios26-text-secondary)',
            appBackground: 'var(--ios26-background-primary)',
            weatherCardBorder: 'var(--ios26-border-tertiary)',
          } as unknown as ThemeColors
        }
        isDark={false}
        leadingButton={{ icon: '←', title: 'Back', onPress: onBack }}
      />

      {/* Search Input */}
      <div className="search-input-section ios26-container">
        <div className="search-input-container">
          <div className="search-icon">🔍</div>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for cities, towns..."
            value={query}
            onChange={handleSearchInput}
          />
          {query && (
            <button
              className="clear-search-button"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="search-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="search-results-section ios26-card ios26-liquid-glass">
          {isLoading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>Searching...</span>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <div className="results-header">
                <span className="results-count ios26-text-footnote ios26-text-secondary">
                  {results.length} results found
                </span>
              </div>
              <ul className="search-results" aria-label="Search results">
                {results.map(result => (
                  <li key={result.id}>
                    <button
                      className="search-result-item ios26-list-item"
                      onClick={() => handleCitySelection(result)}
                    >
                      <div className="result-icon">🏙️</div>
                      <div className="result-content">
                        <div className="result-name ios26-text-headline ios26-text-primary">
                          {result.name}
                        </div>
                        <div className="result-location ios26-text-subheadline ios26-text-secondary">
                          {result.state && result.state !== result.country && (
                            <span className="result-state">
                              {result.state},{' '}
                            </span>
                          )}
                          <span className="result-country">
                            {result.country}
                          </span>
                        </div>
                      </div>
                      <div className="result-arrow">→</div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!isLoading && hasTypedQuery && results.length === 0 && (
            <div className="search-empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-message ios26-text-body ios26-text-primary">
                No cities found
              </div>
              <div className="empty-suggestion ios26-text-footnote ios26-text-secondary">
                Try a different search term
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="search-content ios26-container">
        {/* Current Location Button */}
        <div className="quick-actions">
          <button
            className="current-location-button ios26-list-item"
            onClick={getCurrentLocation}
            disabled={isLoading}
          >
            <div className="location-icon">📍</div>
            <div className="location-content">
              <div className="location-title ios26-text-headline ios26-text-primary">
                Use Current Location
              </div>
              <div className="location-subtitle ios26-text-footnote ios26-text-secondary">
                Get weather for where you are
              </div>
            </div>
            <div className="location-arrow">→</div>
          </button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !showResults && (
          <div className="recent-searches">
            <div className="section-header">
              <h2 className="section-title ios26-text-title3 ios26-text-primary">
                Recent Searches
              </h2>
              <span className="section-count">{recentSearches.length}</span>
            </div>
            <ul className="recent-list" aria-label="Recent searches">
              {recentSearches.map(result => (
                <li key={result.id}>
                  <button
                    className="recent-item"
                    onClick={() => handleRecentSelect(result)}
                  >
                    <div className="recent-icon">🕒</div>
                    <div className="recent-content">
                      <div className="recent-name ios26-text-body ios26-text-primary">
                        {result.name}
                      </div>
                      <div className="recent-location ios26-text-footnote ios26-text-secondary">
                        {result.state && result.state !== result.country && (
                          <span>{result.state}, </span>
                        )}
                        {result.country}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchScreen;
