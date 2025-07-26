import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';

interface SearchScreenProps {
  theme: ThemeColors;
  onBack: () => void;
  onLocationSelect: (cityName: string, latitude: number, longitude: number) => void;
}

interface SearchResult {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  country: string;
  state?: string;
}

/**
 * SearchScreen - Advanced location search interface
 * 
 * Features:
 * - Real-time search with debouncing
 * - Recent searches with local storage
 * - Current location detection
 * - Clean mobile-first design
 * - Haptic feedback for interactions
 */
const SearchScreen: React.FC<SearchScreenProps> = ({
  theme,
  onBack,
  onLocationSelect
}) => {
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weather-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5)); // Keep only 5 recent
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const saveToRecentSearches = useCallback((result: SearchResult) => {
    try {
      const updated = [
        result,
        ...recentSearches.filter(r => r.name !== result.name)
      ].slice(0, 5);
      
      setRecentSearches(updated);
      localStorage.setItem('weather-recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, [recentSearches]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=8&countrycodes=us,ca,gb,au,de,fr,es,it,jp`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0 (React Weather Application)'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleLocationSelect = useCallback((result: SearchResult) => {
    haptic.buttonPress();
    
    const cityName = result.name;
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    saveToRecentSearches(result);
    onLocationSelect(cityName, latitude, longitude);
  }, [haptic, saveToRecentSearches, onLocationSelect]);

  const handleCurrentLocation = useCallback(() => {
    haptic.buttonPress();
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect('Current Location', latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Could show error message
        }
      );
    }
  }, [haptic, onLocationSelect]);

  const clearSearch = useCallback(() => {
    haptic.buttonPress();
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [haptic]);

  const formatLocationName = (result: SearchResult) => {
    const parts = result.display_name.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return result.name;
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.appBackground,
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: theme.appBackground,
    borderBottom: `1px solid ${theme.weatherCardBorder}30`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '60px'
  };

  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    color: theme.primaryText,
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent'
  };

  const searchContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: searchQuery ? '50px' : '16px',
    border: `2px solid ${theme.weatherCardBorder}40`,
    borderRadius: '16px',
    background: theme.cardBackground,
    color: theme.primaryText,
    fontSize: '16px',
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.2s ease',
    WebkitAppearance: 'none'
  };

  const clearButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: theme.secondaryText,
    display: searchQuery ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '0 16px 100px 16px' // Bottom padding for navigation
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    marginLeft: '4px'
  };

  const listStyle: React.CSSProperties = {
    background: theme.cardBackground,
    borderRadius: '16px',
    border: `1px solid ${theme.weatherCardBorder}30`,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: `1px solid ${theme.weatherCardBorder}20`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '64px'
  };

  const currentLocationStyle: React.CSSProperties = {
    ...itemStyle,
    background: `linear-gradient(135deg, ${theme.primaryGradient}10, transparent)`,
    border: `1px solid ${theme.primaryGradient}20`,
    borderRadius: '16px',
    marginBottom: '24px',
    borderBottom: 'none'
  };

  const renderSearchResults = () => {
    if (searchResults.length > 0) {
      return (
        <div style={listStyle}>
          {searchResults.map((result, index) => (
            <button
              key={`${result.lat}-${result.lon}`}
              style={{
                ...itemStyle,
                borderBottom: index === searchResults.length - 1 ? 'none' : itemStyle.borderBottom,
                border: 'none',
                textAlign: 'left',
                width: '100%'
              }}
              onClick={() => handleLocationSelect(result)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${theme.primaryGradient}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label={`Select ${result.name} as location`}
            >
              <div style={{ fontSize: '20px', marginRight: '16px' }}>📍</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: theme.primaryText,
                  marginBottom: '2px'
                }}>
                  {result.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.secondaryText
                }}>
                  {result.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    } else if (searchQuery.length >= 2 && !isSearching) {
      return (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: theme.secondaryText
        }}>
          No locations found for "{searchQuery}"
        </div>
      );
    }
    return null;
  };

  return (
    <div style={containerStyle}>
      {/* Header with search */}
      <header style={headerStyle}>
        <button
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${theme.primaryGradient}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
          aria-label="Go back"
        >
          ←
        </button>
        
        <div style={searchContainerStyle}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={searchInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = theme.primaryGradient;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${theme.weatherCardBorder}40`;
            }}
          />
          
          {searchQuery && (
            <button
              style={clearButtonStyle}
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={contentStyle}>
        {/* Current Location */}
        <button
          style={{
            ...currentLocationStyle,
            border: 'none',
            textAlign: 'left',
            width: '100%'
          }}
          onClick={handleCurrentLocation}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${theme.primaryGradient}15, transparent)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${theme.primaryGradient}10, transparent)`;
          }}
          aria-label="Use current location to get weather"
        >
          <div style={{ fontSize: '24px', marginRight: '16px' }}>📍</div>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: theme.primaryText,
              marginBottom: '2px'
            }}>
              Use Current Location
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.secondaryText
            }}>
              Get weather for your current position
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            fontSize: '18px',
            color: theme.primaryText
          }}>
            →
          </div>
        </button>

        {/* Search Results */}
        {showResults && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              {isSearching ? 'Searching...' : 'Search Results'}
            </h2>
            {renderSearchResults()}
          </div>
        )}

        {/* Recent Searches */}
        {!showResults && recentSearches.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Recent Searches</h2>
            <div style={listStyle}>
              {recentSearches.map((result, index) => (
                <button
                  key={`recent-${result.lat}-${result.lon}`}
                  style={{
                    ...itemStyle,
                    borderBottom: index === recentSearches.length - 1 ? 'none' : itemStyle.borderBottom,
                    border: 'none',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onClick={() => handleLocationSelect(result)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${theme.primaryGradient}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label={`Select recent search ${result.name}`}
                >
                  <div style={{ fontSize: '20px', marginRight: '16px' }}>🕒</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: theme.primaryText,
                      marginBottom: '2px'
                    }}>
                      {formatLocationName(result)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.secondaryText
                    }}>
                      {result.country}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!showResults && recentSearches.length === 0 && (
          <div style={{
            padding: '64px 32px',
            textAlign: 'center',
            color: theme.secondaryText
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>
              Search for any city
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Find weather information for locations around the world
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
