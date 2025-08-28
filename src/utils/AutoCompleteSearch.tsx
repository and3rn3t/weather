/**
 * AutoComplete Search Component
 *
 * Provides real-time city search with autocomplete suggestions.
 * Integrates with OpenStreetMap Nominatim for city lookups.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AutoCompleteSearch.css';
import { useHaptic } from './hapticHooks';
import { logError } from './logger';
import { optimizedFetchJson } from './optimizedFetch';
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
  onCitySelected: (
    cityName: string,
    latitude: number,
    longitude: number
  ) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const AutoCompleteSearch: React.FC<AutoCompleteSearchProps> = ({
  theme: _theme,
  isMobile,
  onCitySelected,
  onError,
  disabled = false,
  placeholder = 'Search for a city...',
  initialValue = '',
  className,
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

  // Debounced search function with caching
  const searchCache = useRef<Map<string, CityResult[]>>(new Map());

  const searchCities = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Check cache first for instant results
      const cacheKey = searchQuery.toLowerCase().trim();
      if (searchCache.current.has(cacheKey)) {
        const cachedResults = searchCache.current.get(cacheKey) ?? [];
        setSuggestions(cachedResults);
        setIsOpen(cachedResults.length > 0);
        setIsLoading(false);
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

        // Optimized query with better parameters for speed
        const searchParams = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          addressdetails: '1',
          limit: '6', // Reduced from 8 for faster response
          countrycodes: '', // Allow all countries
          'accept-language': 'en', // Force English for consistency
          dedupe: '1', // Remove duplicates server-side
          extratags: '0', // Disable extra tags for speed
          namedetails: '0', // Disable name details for speed
        });

        const results = await optimizedFetchJson<CityResult[]>(
          `https://nominatim.openstreetmap.org/search?${searchParams}`,
          { signal: abortControllerRef.current.signal },
          `nominatim:autoComplete:${searchQuery}`
        );

        // Optimized filtering for better performance and relevance
        const filteredResults = results
          .filter(result => {
            // Quick relevance check - prioritize exact matches
            const searchLower = searchQuery.toLowerCase();
            const displayLower = result.display_name.toLowerCase();

            // Boost exact city name matches
            if (
              result.address?.city?.toLowerCase().includes(searchLower) ||
              result.address?.town?.toLowerCase().includes(searchLower) ||
              result.address?.village?.toLowerCase().includes(searchLower)
            ) {
              return true;
            }

            // Include if display name starts with search term (high relevance)
            if (displayLower.startsWith(searchLower)) {
              return true;
            }

            // Include if any part of display name contains search term
            return displayLower.includes(searchLower);
          })
          // Sort by relevance - exact matches first
          .sort((a, b) => {
            const searchLower = searchQuery.toLowerCase();
            const aCity = (
              a.address?.city ||
              a.address?.town ||
              a.address?.village ||
              ''
            ).toLowerCase();
            const bCity = (
              b.address?.city ||
              b.address?.town ||
              b.address?.village ||
              ''
            ).toLowerCase();

            // Exact city name matches first
            if (aCity === searchLower && bCity !== searchLower) return -1;
            if (bCity === searchLower && aCity !== searchLower) return 1;

            // Starts with search term next
            if (aCity.startsWith(searchLower) && !bCity.startsWith(searchLower))
              return -1;
            if (bCity.startsWith(searchLower) && !aCity.startsWith(searchLower))
              return 1;

            return 0;
          })
          .slice(0, 5); // Reduced to 5 for faster rendering

        // Cache results for future use
        searchCache.current.set(cacheKey, filteredResults);

        // Limit cache size to prevent memory issues
        if (searchCache.current.size > 50) {
          const firstKey = searchCache.current.keys().next().value;
          if (firstKey) {
            searchCache.current.delete(firstKey);
          }
        }

        setSuggestions(filteredResults);
        setIsOpen(filteredResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          logError('City search error:', error);
          onError?.('Failed to search for cities. Please try again.');
        }
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  // Faster debounce for better responsiveness
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reduce debounce time for snappier response
    const debounceTime = query.length >= 3 ? 150 : 250; // Faster for longer queries

    timeoutRef.current = setTimeout(() => {
      searchCities(query);
    }, debounceTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchCities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    // Use capture phase to prevent interference with other click handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside, true);
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
  const handleSuggestionSelect = useCallback(
    (result: CityResult) => {
      const cityName = formatCityName(result);
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);

      setQuery(cityName);
      setIsOpen(false);
      setSelectedIndex(-1);
      setSuggestions([]);

      haptic.buttonConfirm();
      onCitySelected(cityName, latitude, longitude);
    },
    [formatCityName, haptic, onCitySelected]
  );

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

  // No inline CSS variables needed; ThemeProvider sets globals on :root

  return (
    <div
      className={`ac-root ${className ?? ''}`.trim()}
      data-mobile={isMobile ? '1' : '0'}
    >
      {/* Search Input */}
      <div className="ac-input-wrap">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`ac-input ${isLoading ? 'has-spinner' : ''}`.trim()}
          autoComplete="off"
          spellCheck="false"
          onFocus={handleFocus}
        />

        {/* Loading Spinner */}
        {isLoading && <div className="ac-spinner" />}
      </div>

      {/* Suggestions Dropdown */}
      <div
        ref={dropdownRef}
        className={`ac-dropdown ${isOpen ? 'is-open' : ''}`.trim()}
      >
        {suggestions.length > 0 && (
          <div className="ac-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionSelect(suggestion);
                }}
                className={`ac-suggestion ${
                  index === selectedIndex ? 'is-selected' : ''
                }`.trim()}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(-1)}
              >
                <div>
                  <div className="ac-suggestion-title">
                    {formatCityName(suggestion)}
                  </div>
                  <div className="ac-suggestion-sub">
                    {suggestion.address.country}
                  </div>
                </div>
                <div className="ac-suggestion-geo">📍</div>
              </button>
            ))}
          </div>
        )}
        {suggestions.length === 0 &&
          hasSearched &&
          !isLoading &&
          query.length >= 2 && (
            <div className="ac-empty">No cities found for "{query}"</div>
          )}
      </div>
    </div>
  );
};

export default AutoCompleteSearch;
