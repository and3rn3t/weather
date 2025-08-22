/**
 * Enhanced Search Bar with US Location Optimization
 *
 * This component significantly improves location search for US-based users by:
 * 1. Prioritizing US cities and towns in search results
 * 2. Supporting state abbreviations (e.g., "LA" for Louisiana cities)
 * 3. Enhanced local database of popular US locations
 * 4. Improved search algorithms for better matching
 * 5. Fallback to global search when needed
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  searchUSLocations,
  type EnhancedUSSearchResult,
  type USSearchOptions,
} from '../utils/enhancedUSSearch';
import { logError, logInfo } from '../utils/logger';
import './EnhancedSearchBar.css';
interface EnhancedSearchBarProps {
  onLocationSelect: (name: string, lat: number, lon: number) => void;
  placeholder?: string;
  prioritizeUS?: boolean;
  className?: string;
  theme?: {
    primaryText: string;
    primaryGradient: string;
    appBackground: string;
  };
}

interface SearchState {
  query: string;
  results: EnhancedUSSearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
  selectedIndex: number;
}

export function EnhancedSearchBar({
  onLocationSelect,
  placeholder = 'Search US cities and towns...',
  prioritizeUS = true,
  className = '',
  theme,
}: EnhancedSearchBarProps) {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    isOpen: false,
    error: null,
    selectedIndex: -1,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Enhanced search function with US optimization
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setState(prev => ({
          ...prev,
          results: [],
          isOpen: false,
          error: null,
          selectedIndex: -1,
        }));
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const searchOptions: USSearchOptions = {
          prioritizeUS,
          includeStates: true,
          includeZipCodes: false, // Can be enabled if needed
          maxResults: 8,
        };

        const results = await searchUSLocations(searchQuery, searchOptions);

        setState(prev => ({
          ...prev,
          results,
          isLoading: false,
          isOpen: results.length > 0,
          selectedIndex: -1,
        }));

        logInfo(
          `Enhanced search for "${searchQuery}" returned ${results.length} results`
        );
      } catch (error) {
        logError('Enhanced search error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Search failed. Please try again.',
          results: [],
          isOpen: false,
          selectedIndex: -1,
        }));
      }
    },
    [prioritizeUS]
  );

  // Debounced search
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setState(prev => ({ ...prev, query: value }));

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 200); // Faster response time for better UX
    },
    [performSearch]
  );

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: EnhancedUSSearchResult) => {
      logInfo(
        `Selected location: ${result.name}, ${result.state} (${result.lat}, ${result.lon})`
      );
      onLocationSelect(result.name, result.lat, result.lon);

      setState(prev => ({
        ...prev,
        query: result.display_name,
        isOpen: false,
        selectedIndex: -1,
      }));
    },
    [onLocationSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!state.isOpen || state.results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setState(prev => ({
            ...prev,
            selectedIndex: Math.min(
              prev.selectedIndex + 1,
              prev.results.length - 1
            ),
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setState(prev => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, -1),
          }));
          break;
        case 'Enter':
          e.preventDefault();
          if (state.selectedIndex >= 0 && state.results[state.selectedIndex]) {
            handleResultSelect(state.results[state.selectedIndex]);
          }
          break;
        case 'Escape':
          setState(prev => ({
            ...prev,
            isOpen: false,
            selectedIndex: -1,
          }));
          break;
      }
    },
    [state.isOpen, state.results, state.selectedIndex, handleResultSelect]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setState({
      query: '',
      results: [],
      isLoading: false,
      isOpen: false,
      error: null,
      selectedIndex: -1,
    });
    searchInputRef.current?.focus();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setState(prev => ({ ...prev, isOpen: false, selectedIndex: -1 }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Format result display with enhanced US formatting
  const formatResultDisplay = useCallback((result: EnhancedUSSearchResult) => {
    if (result.isUSCity && result.state) {
      // For US cities, show: "City, State"
      return `${result.name}, ${result.stateAbbr || result.state}`;
    }
    // For international or non-standard results, use original display name
    return result.display_name;
  }, []);

  return (
    <div className={`enhanced-search-container ${className}`}>
      {/* Search Input */}
      <div
        className="enhanced-search-input-wrapper"
        style={{
          backgroundColor: theme?.appBackground || '#ffffff',
          borderColor: `${theme?.primaryGradient || '#007AFF'}30`,
        }}
      >
        <div className="enhanced-search-icon">🔍</div>
        <input
          ref={searchInputRef}
          type="text"
          value={state.query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="enhanced-search-input"
          style={{
            color: theme?.primaryText || '#000000',
          }}
        />
        {state.isLoading && (
          <div className="enhanced-search-loading enhanced-search-loading-animation">
            ⏳
          </div>
        )}
        {state.query && !state.isLoading && (
          <button
            onClick={clearSearch}
            className="enhanced-search-clear"
            style={{
              color: theme?.primaryText || '#000000',
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="enhanced-search-error">⚠️ {state.error}</div>
      )}

      {/* Search Results */}
      {state.isOpen && state.results.length > 0 && (
        <div
          ref={resultsRef}
          className="enhanced-search-results"
          style={{
            backgroundColor: theme?.appBackground || '#ffffff',
            borderColor: `${theme?.primaryGradient || '#007AFF'}30`,
          }}
        >
          {state.results.map((result, index) => (
            <button
              key={`${result.lat}-${result.lon}-${index}`}
              onClick={() => handleResultSelect(result)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleResultSelect(result);
                }
              }}
              className={`enhanced-search-result-item ${
                state.selectedIndex === index ? 'selected' : ''
              }`}
              style={{
                borderBottomColor: `${theme?.primaryGradient || '#007AFF'}10`,
                backgroundColor:
                  state.selectedIndex === index
                    ? `${theme?.primaryGradient || '#007AFF'}10`
                    : 'transparent',
              }}
              onMouseEnter={() =>
                setState(prev => ({ ...prev, selectedIndex: index }))
              }
            >
              <div className="enhanced-search-result-content">
                <div className="enhanced-search-result-main">
                  <div
                    className="enhanced-search-result-title"
                    style={{
                      color: theme?.primaryText || '#000000',
                    }}
                  >
                    {formatResultDisplay(result)}
                  </div>
                  {result.isUSCity && result.population && (
                    <div
                      className="enhanced-search-result-subtitle"
                      style={{
                        color: theme?.primaryText || '#000000',
                      }}
                    >
                      Population: {result.population.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="enhanced-search-result-badges">
                  {result.isUSCity && (
                    <span
                      className="enhanced-search-badge enhanced-search-badge-us"
                      style={{
                        backgroundColor: `${
                          theme?.primaryGradient || '#007AFF'
                        }20`,
                        color: theme?.primaryGradient || '#007AFF',
                      }}
                    >
                      US
                    </span>
                  )}
                  {result.source === 'local_database' && (
                    <span className="enhanced-search-badge enhanced-search-badge-popular">
                      ⭐
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {state.isOpen &&
        !state.isLoading &&
        state.results.length === 0 &&
        state.query.length >= 2 && (
          <div
            className="enhanced-search-no-results"
            style={{
              backgroundColor: theme?.appBackground || '#ffffff',
              borderColor: `${theme?.primaryGradient || '#007AFF'}30`,
              color: theme?.primaryText || '#000000',
            }}
          >
            No locations found for "{state.query}"
          </div>
        )}
    </div>
  );
}

export default EnhancedSearchBar;
