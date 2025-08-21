import { useCallback, useEffect, useRef, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import '../utils/locationDiagnostic'; // Load diagnostic tools in development
import { locationService } from '../utils/locationService';
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
  name?: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
  relevanceScore?: number;
  cleanDisplayName?: string;
}

/**
 * Create a clean, readable display name from Nominatim result
 */
const createCleanDisplayName = (item: NominatimResult): string => {
  if (item.name) {
    // Use the name if available, with country
    const country = item.address?.country || '';
    const state = item.address?.state || '';

    if (state && country) {
      return `${item.name}, ${state}, ${country}`;
    } else if (country) {
      return `${item.name}, ${country}`;
    }
    return item.name;
  }

  // Fallback to parsing display_name
  const parts = item.display_name.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    // Return first part (city) + last part (country)
    return `${parts[0]}, ${parts[parts.length - 1]}`;
  }

  return item.display_name;
};

/**
 * Enhanced SearchScreen with improved error handling and fallback mechanisms
 */
function EnhancedSearchScreen({
  theme,
  onBack,
  onLocationSelect,
}: Readonly<SearchScreenProps>) {
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [locationPermission, setLocationPermission] = useState<
    PermissionState | 'not-supported' | 'unknown'
  >('unknown');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
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

  // Check location permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await locationService.checkPermissions();
        setLocationPermission(permission);
      } catch (error) {
        console.warn('Failed to check location permissions:', error);
        setLocationPermission('unknown');
      }
    };

    checkPermissions();
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
        query,
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
          `Search API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data: NominatimResult[] = await response.json();

      // Filter and prioritize results with improved logic
      const filteredResults = data
        .filter((item: NominatimResult) => {
          // Include a broader range of location types
          const isValidLocationType =
            item.type === 'city' ||
            item.type === 'town' ||
            item.type === 'village' ||
            item.type === 'municipality' ||
            item.type === 'administrative' ||
            item.type === 'suburb' ||
            item.type === 'neighbourhood' ||
            item.class === 'place' ||
            item.class === 'boundary' ||
            (item.class === 'amenity' && item.type === 'university') ||
            (item.address &&
              (item.address.city || item.address.town || item.address.village));

          // Exclude very specific locations like individual buildings
          const isNotTooSpecific =
            item.type !== 'house' &&
            item.type !== 'building' &&
            item.type !== 'shop' &&
            item.type !== 'restaurant';

          return isValidLocationType && isNotTooSpecific;
        })
        .map(item => {
          // Calculate relevance score for better sorting
          const queryLower = query.toLowerCase();
          const displayName = item.display_name.toLowerCase();
          const name = (item.name || '').toLowerCase();

          let relevanceScore = 0;

          // Exact name match gets highest score
          if (name === queryLower) {
            relevanceScore += 1000;
          } else if (name.startsWith(queryLower)) {
            relevanceScore += 500;
          } else if (name.includes(queryLower)) {
            relevanceScore += 100;
          }

          // Display name partial matches
          if (displayName.includes(queryLower)) {
            relevanceScore += 50;
          }

          // Boost major cities and administrative areas
          if (item.type === 'city' || item.type === 'administrative') {
            relevanceScore += 200;
          }

          // Boost based on importance (if available)
          if (item.importance) {
            relevanceScore += Math.round(item.importance * 100);
          }

          return {
            ...item,
            relevanceScore,
            // Create clean, readable display name
            cleanDisplayName: createCleanDisplayName(item),
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
        .slice(0, 10); // Limit to top 10 results

      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        setError('No cities found. Try a different search term.');
      }
    } catch (error: any) {
      logError('Search error:', error);

      if (error.name === 'AbortError') {
        setError(
          'Search timed out. Please check your internet connection and try again.',
        );
      } else if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
      ) {
        setError(
          'Network error. Please check your internet connection and try again.',
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
          r => r.lat !== searchResult.lat || r.lon !== searchResult.lon,
        ),
      ].slice(0, 5);

      setRecentSearches(newRecent);

      try {
        localStorage.setItem(
          'weather-recent-searches',
          JSON.stringify(newRecent),
        );
      } catch (error) {
        logError('Error saving recent searches:', error);
      }

      onLocationSelect(cityName, latitude, longitude);
    },
    [haptic, onLocationSelect, recentSearches],
  );

  // Handle recent search selection
  const handleRecentSelect = useCallback(
    (result: SearchResult) => {
      haptic.selection();
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      onLocationSelect(result.name, latitude, longitude);
    },
    [haptic, onLocationSelect],
  );

  // Get current location with enhanced error handling
  const getCurrentLocation = useCallback(async () => {
    haptic.dataLoad();
    setError(null);
    setIsGettingLocation(true);

    try {
      // Check if we're in a secure context
      if (!locationService.isSecureContext()) {
        haptic.error();
        setError(
          'Location services require a secure connection (HTTPS). This feature may not work on non-secure websites.',
        );
        return;
      }

      // Check if location is supported
      if (!locationService.isSupported()) {
        haptic.error();
        setError(
          'Geolocation is not supported by this browser. Please search for your city manually.',
        );
        return;
      }

      // Check permissions first
      const permissionState = await locationService.checkPermissions();
      setLocationPermission(permissionState);

      if (permissionState === 'denied') {
        haptic.error();
        setError(
          'Location access is blocked. Please enable location permissions in your browser settings and refresh the page.',
        );
        return;
      }

      // Get location
      const locationResult = await locationService.getCurrentLocation();

      haptic.dataLoad();

      // Use the city name if available, otherwise use "Current Location"
      const cityName = locationResult.cityName || 'Current Location';

      onLocationSelect(
        cityName,
        locationResult.latitude,
        locationResult.longitude,
      );
    } catch (locationError: any) {
      haptic.error();
      logError('Enhanced geolocation error:', locationError);

      // Use the user-friendly message from the location service
      if (locationError.userMessage) {
        setError(locationError.userMessage);
      } else {
        setError(
          'Failed to get your location. Please try again or search for your city manually.',
        );
      }

      // Log additional troubleshooting tips
      const tips = locationService.getLocationTips();
      console.log('Location troubleshooting tips:', tips);
    } finally {
      setIsGettingLocation(false);
    }
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
          disabled={isGettingLocation || locationPermission === 'denied'}
        >
          <span className="enhanced-current-location-icon">
            {(() => {
              if (isGettingLocation) return '⏳';
              if (locationPermission === 'denied') return '🚫';
              return '�';
            })()}
          </span>
          <div className="enhanced-current-location-text">
            <div className="enhanced-current-location-title">
              {(() => {
                if (isGettingLocation) return 'Getting Location...';
                if (locationPermission === 'denied') return 'Location Blocked';
                return 'Use Current Location';
              })()}
            </div>
            <div className="enhanced-current-location-subtitle">
              {(() => {
                if (isGettingLocation)
                  return 'Please wait while we get your location';
                if (locationPermission === 'denied')
                  return 'Enable location permissions to use this feature';
                if (locationPermission === 'granted')
                  return 'Location access granted - tap to get weather';
                return 'Get weather for your current location';
              })()}
            </div>
          </div>
        </button>

        {/* Location Troubleshooting Tips */}
        {(locationPermission === 'denied' ||
          error?.includes('Location') ||
          error?.includes('permission')) && (
          <div className="enhanced-location-tips">
            <h4 className="enhanced-location-tips-title">
              📍 Location Troubleshooting
            </h4>
            <div className="enhanced-location-tips-content">
              {!locationService.isSecureContext() && (
                <div className="enhanced-tip">
                  🔒 Location requires a secure connection (HTTPS)
                </div>
              )}
              <div className="enhanced-tip">
                🌐 Make sure location services are enabled in your browser
              </div>
              <div className="enhanced-tip">
                📱 Check that your device has location services turned on
              </div>
              <div className="enhanced-tip">
                🔄 Try refreshing the page and allowing location access
              </div>
              <div className="enhanced-tip">
                🔍 You can also search for your city manually above
              </div>
            </div>
          </div>
        )}

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
