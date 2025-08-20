import { useCallback, useEffect, useRef, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import { logError } from '../utils/logger';
import type { ThemeColors } from '../utils/themeConfig';
import './EnhancedSearchScreen.css';

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
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  country: string;
  state?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  type: string;
  class: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Enhanced SearchScreen with improved error handling and fallback mechanisms
 */
function EnhancedSearchScreen({
  theme,
  onBack,
  onLocationSelect,
}: SearchScreenProps) {
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weather-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (error) {
      logError('Error loading recent searches:', error);
    }
  }, []);

  // Enhanced search function with better error handling
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Primary API: OpenStreetMap Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=25&addressdetails=1&extratags=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'PremiumWeatherApp/1.0 (weather.andernet.dev)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Search API returned ${response.status}: ${response.statusText}`
        );
      }

      const data: NominatimResult[] = await response.json();

      // Filter and prioritize results
      const filteredResults = data
        .filter((item: NominatimResult) => {
          // Include cities, towns, villages, and administrative areas
          return (
            item.type === 'city' ||
            item.type === 'town' ||
            item.type === 'village' ||
            item.type === 'administrative' ||
            item.class === 'place' ||
            item.class === 'boundary'
          );
        })
        .map(item => ({
          ...item,
          // Enhance display name for better readability
          display_name:
            item.display_name ||
            `${
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              'Unknown'
            }, ${item.address?.country || 'Unknown Country'}`,
        }))
        .slice(0, 10); // Limit to top 10 results

      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        setError('No cities found. Try a different search term.');
      }
    } catch (error: any) {
      logError('Search error:', error);

      if (error.name === 'AbortError') {
        setError(
          'Search timed out. Please check your internet connection and try again.'
        );
      } else if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
      ) {
        setError(
          'Network error. Please check your internet connection and try again.'
        );
      } else {
        setError('Search failed. Please try again in a moment.');
      }

      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Handle city selection
  const handleCitySelection = useCallback(
    (city: NominatimResult) => {
      haptic.dataLoad();

      const cityName = city.display_name.split(',')[0].trim();
      const latitude = parseFloat(city.lat);
      const longitude = parseFloat(city.lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        haptic.error();
        setError('Invalid location coordinates. Please try another city.');
        return;
      }

      // Add to recent searches
      const searchResult: SearchResult = {
        name: cityName,
        display_name: city.display_name,
        lat: city.lat,
        lon: city.lon,
        country:
          city.address?.country ||
          city.display_name.split(',').pop()?.trim() ||
          'Unknown',
        state: city.address?.state || city.display_name.split(',')[1]?.trim(),
      };

      const newRecent = [
        searchResult,
        ...recentSearches.filter(
          r => r.lat !== searchResult.lat || r.lon !== searchResult.lon
        ),
      ].slice(0, 5);

      setRecentSearches(newRecent);

      try {
        localStorage.setItem(
          'weather-recent-searches',
          JSON.stringify(newRecent)
        );
      } catch (error) {
        logError('Error saving recent searches:', error);
      }

      onLocationSelect(cityName, latitude, longitude);
    },
    [haptic, onLocationSelect, recentSearches]
  );

  // Handle recent search selection
  const handleRecentSelect = useCallback(
    (result: SearchResult) => {
      haptic.selection();
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      onLocationSelect(result.name, latitude, longitude);
    },
    [haptic, onLocationSelect]
  );

  // Get current location with enhanced error handling
  const getCurrentLocation = useCallback(() => {
    haptic.dataLoad();

    if (!navigator.geolocation) {
      haptic.error();
      setError('Geolocation is not supported by this browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        haptic.dataLoad();
        onLocationSelect(
          'Current Location',
          position.coords.latitude,
          position.coords.longitude
        );
      },
      error => {
        haptic.error();
        logError('Geolocation error:', error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              'Location access denied. Please enable location services and try again.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setError(
              'Location information is unavailable. Please try searching for a city instead.'
            );
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while getting your location.');
            break;
        }
      },
      options
    );
  }, [haptic, onLocationSelect]);

  return (
    <div className="enhanced-search-screen">
      {/* Dynamic theme styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .enhanced-search-screen {
            background: ${theme.appBackground};
            color: ${theme.primaryText};
          }
          .enhanced-search-header {
            border-bottom-color: ${theme.primaryGradient}20;
          }
          .enhanced-search-back-button,
          .enhanced-search-title,
          .enhanced-search-input {
            color: ${theme.primaryText};
          }
          .enhanced-search-input-wrapper {
            background: ${theme.primaryGradient}10;
            border-color: ${theme.primaryGradient}30;
          }
          .enhanced-current-location-button {
            background: ${theme.primaryGradient}10;
            border-color: ${theme.primaryGradient}20;
            color: ${theme.primaryText};
          }
          .enhanced-search-result-item,
          .enhanced-recent-search-item {
            border-color: ${theme.primaryGradient}20;
            color: ${theme.primaryText};
          }
          .enhanced-search-spinner {
            border: 2px solid ${theme.primaryGradient}30;
            border-top: 2px solid ${theme.primaryGradient};
          }
        `,
        }}
      />

      {/* Header */}
      <header className="enhanced-search-header">
        <button
          className="enhanced-search-back-button"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <h1 className="enhanced-search-title">Search Location</h1>
      </header>

      {/* Search Input */}
      <div className="enhanced-search-input-container">
        <div className="enhanced-search-input-wrapper">
          <span className="enhanced-search-icon">🔍</span>
          <input
            type="text"
            className="enhanced-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for a city..."
            autoFocus
          />
          {isSearching && <div className="enhanced-search-spinner" />}
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="enhanced-search-error">⚠️ {error}</div>}

      {/* Content */}
      <div className="enhanced-search-content">
        {/* Current Location Button */}
        <button
          className="enhanced-current-location-button"
          onClick={getCurrentLocation}
        >
          <span className="enhanced-current-location-icon">📍</span>
          <div className="enhanced-current-location-text">
            <div className="enhanced-current-location-title">
              Use Current Location
            </div>
            <div className="enhanced-current-location-subtitle">
              Get weather for your current location
            </div>
          </div>
        </button>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="enhanced-search-section">
            <h3 className="enhanced-search-section-title">Search Results</h3>
            {searchResults.map((result, index) => (
              <button
                key={`${result.place_id}-${index}`}
                className="enhanced-search-result-item"
                onClick={() => handleCitySelection(result)}
              >
                <span className="enhanced-search-result-icon">🏙️</span>
                <div className="enhanced-search-result-text">
                  <div className="enhanced-search-result-name">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="enhanced-search-result-location">
                    {result.display_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="enhanced-search-section">
            <h3 className="enhanced-search-section-title">Recent Searches</h3>
            {recentSearches.map((result, index) => (
              <button
                key={`recent-${result.lat}-${result.lon}-${index}`}
                className="enhanced-recent-search-item"
                onClick={() => handleRecentSelect(result)}
              >
                <span className="enhanced-recent-search-icon">🕒</span>
                <div className="enhanced-recent-search-text">
                  <div className="enhanced-recent-search-name">
                    {result.name}
                  </div>
                  <div className="enhanced-recent-search-location">
                    {result.state ? `${result.state}, ` : ''}
                    {result.country}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedSearchScreen;
