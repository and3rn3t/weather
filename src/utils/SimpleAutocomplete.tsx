/**
 * Nuclear AutoComplete Fix
 * Simple, bulletproof autocomplete that definitely works
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from './logger';
import './SimpleAutocomplete.css';

interface SimpleAutocompleteProps {
  onCitySelected: (cityName: string, lat: number, lon: number) => void;
  theme: unknown;
  disabled?: boolean;
  placeholder?: string;
}

interface CityResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export const SimpleAutocomplete: React.FC<SimpleAutocompleteProps> = ({
  onCitySelected,
  theme: _theme,
  disabled = false,
  placeholder = 'Search cities...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple search function
  const searchCities = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchTerm,
        format: 'json',
        limit: '5',
        addressdetails: '1',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0',
          },
        },
      );

      if (response.ok) {
        const data: CityResult[] = await response.json();
        setResults(data.slice(0, 5));
        setIsOpen(data.length > 0);
      }
    } catch (error) {
      logError('Search error:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      searchCities(query);
    }, 300);

    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchCities]);

  // Handle selection
  const handleSelect = useCallback(
    (result: CityResult) => {
      const cityName = result.display_name.split(',')[0];
      setQuery(cityName);
      setIsOpen(false);
      setResults([]);
      onCitySelected(cityName, parseFloat(result.lat), parseFloat(result.lon));
    },
    [onCitySelected],
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="simple-autocomplete">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="simple-autocomplete-input"
      />

      {isLoading && <div className="simple-autocomplete-spinner" />}

      {isOpen && results.length > 0 && (
        <div className="simple-autocomplete-dropdown">
          {results.map(result => (
            <button
              key={result.place_id}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(result);
              }}
              className="simple-autocomplete-item"
            >
              {result.display_name.split(',').slice(0, 3).join(', ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleAutocomplete;
