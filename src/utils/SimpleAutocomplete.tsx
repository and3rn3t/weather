/**
 * Nuclear AutoComplete Fix
 * Simple, bulletproof autocomplete that definitely works
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logError } from './logger';


interface SimpleAutocompleteProps {
  onCitySelected: (cityName: string, lat: number, lon: number) => void;
  theme: any;
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
  theme,
  disabled = false,
  placeholder = 'Search cities...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();
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
        }
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchCities(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
    [onCitySelected]
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
        style={{
          width: '100%',
          padding: '16px',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.1)',
          color: theme?.primaryText || '#333',
          fontSize: '16px',
          outline: 'none',
        }}
      />

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: '2px solid #ccc',
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}

      {isOpen && results.length > 0 && (
        <div
          className="simple-autocomplete-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {results.map(result => (
            <button
              key={result.place_id}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(result);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                color: theme?.primaryText || '#333',
                fontSize: '14px',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background =
                  'rgba(102,126,234,0.1)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              {result.display_name.split(',').slice(0, 3).join(', ')}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
        .simple-autocomplete {
          position: relative;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default SimpleAutocomplete;
