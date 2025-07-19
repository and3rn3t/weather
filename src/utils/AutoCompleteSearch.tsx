/**
 * AutoComplete Search Component
 * 
 * Provides real-time city search with autocomplete suggestions.
 * Integrates with OpenStreetMap Nominatim for city lookups.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useHaptic } from './hapticHooks';
import type { ThemeColors } from './themeConfig';

interface CityResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  type: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface AutoCompleteSearchProps {
  theme: ThemeColors;
  isMobile: boolean;
  onCitySelected: (cityName: string, latitude: number, longitude: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const AutoCompleteSearch: React.FC<AutoCompleteSearchProps> = ({
  theme,
  isMobile,
  onCitySelected,
  onError,
  disabled = false,
  placeholder = "Search for a city...",
  initialValue = "",
  className
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const haptic = useHaptic();

  // Debounced search function
  const searchCities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=8&` +
        `countrycodes=&` + // Allow all countries
        `featuretype=city,town,village`, // Focus on populated places
        {
          headers: {
            'User-Agent': 'Weather-App/1.0 (https://github.com/user/weather-app)'
          },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const results: CityResult[] = await response.json();
      
      // Filter and sort results for better relevance
      const filteredResults = results
        .filter(result => {
          // Only include populated places (cities, towns, villages)
          const validTypes = ['city', 'town', 'village', 'administrative'];
          return validTypes.some(type => 
            result.type?.includes(type) || 
            result.display_name?.toLowerCase().includes(type)
          );
        })
        .slice(0, 6); // Limit to 6 suggestions for better UX

      setSuggestions(filteredResults);
      setIsOpen(filteredResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('City search error:', error);
        onError?.('Failed to search for cities. Please try again.');
      }
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Debounce search requests
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchCities(query);
    }, 300); // 300ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchCities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) {
        event.preventDefault();
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (suggestions.length === 1) {
          // Auto-select first suggestion if only one available
          handleSuggestionSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        // Allow tab to close suggestions
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Format city display name
  const formatCityName = useCallback((result: CityResult): string => {
    const { address } = result;
    const cityName = address.city || address.town || address.village || '';
    const state = address.state || '';
    const country = address.country || '';

    if (cityName && state && country) {
      return `${cityName}, ${state}, ${country}`;
    } else if (cityName && country) {
      return `${cityName}, ${country}`;
    } else if (cityName) {
      return cityName;
    }
    
    // Fallback to display_name, but clean it up
    return result.display_name.split(',').slice(0, 3).join(', ');
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((result: CityResult) => {
    const cityName = formatCityName(result);
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    setQuery(cityName);
    setIsOpen(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    
    haptic.buttonConfirm();
    onCitySelected(cityName, latitude, longitude);
  }, [formatCityName, haptic, onCitySelected]);

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    if (value.trim() === '') {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  // Memoized styles for performance
  const inputStyle: React.CSSProperties = useMemo(() => ({
    width: '100%',
    padding: isMobile ? '14px 16px' : '16px 18px',
    border: `2px solid ${theme.cardBorder}`,
    borderRadius: '16px',
    background: theme.cardBackground,
    color: theme.primaryText,
    fontSize: isMobile ? '16px' : '17px', // 16px prevents zoom on iOS
    fontWeight: '500',
    outline: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    paddingRight: isLoading ? '50px' : '16px'
  }), [theme, isMobile, disabled, isLoading]);

  const dropdownStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    background: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    zIndex: 1000,
    maxHeight: isMobile ? '60vh' : '300px',
    overflow: 'hidden',
    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  }), [theme, isMobile, isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
          spellCheck="false"
          onMouseEnter={(e) => {
            if (!disabled) {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = theme.weatherCardBorder;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && document.activeElement !== e.target) {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = theme.cardBorder;
              target.style.backgroundColor = theme.cardBackground;
            }
          }}
          onFocus={(e) => {
            handleFocus();
            const target = e.target as HTMLInputElement;
            target.style.borderColor = theme.weatherCardBorder;
            target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.borderColor = theme.cardBorder;
            target.style.backgroundColor = theme.cardBackground;
            target.style.boxShadow = 'none';
          }}
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: '2px solid rgba(102, 126, 234, 0.3)',
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>

      {/* Suggestions Dropdown */}
      <div ref={dropdownRef} style={dropdownStyle}>
        {suggestions.length > 0 ? (
          <div style={{ padding: '8px' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSuggestionSelect(suggestion)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: index === selectedIndex ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  color: theme.primaryText,
                  fontSize: '14px',
                  textAlign: 'left',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(-1)}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {formatCityName(suggestion)}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: theme.secondaryText,
                    marginTop: '2px'
                  }}>
                    {suggestion.address.country}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: theme.secondaryText,
                  opacity: 0.7
                }}>
                  📍
                </div>
              </button>
            ))}
          </div>
        ) : hasSearched && !isLoading && query.length >= 2 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: theme.secondaryText,
            fontSize: '14px'
          }}>
            No cities found for "{query}"
          </div>
        ) : null}
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AutoCompleteSearch;
