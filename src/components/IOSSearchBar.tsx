/**
 * IOSSearchBar - iOS-style integrated search component
 *
 * Features:
 * - Native iOS search bar styling
 * - Fuzzy search algorithm
 * - Real-time weather data integration
 * - Glassmorphism design with theme support
 * - Accessibility compliant
 * - Touch-optimized for mobile
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useTheme } from '../utils/useTheme';
import { useHaptic } from '../utils/hapticHooks';
import '../styles/IOSSearchBar.css';

interface City {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface WeatherData {
  current_weather: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
  hourly: {
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
  };
}

interface IOSSearchBarProps {
  onCitySelected?: (city: City, weatherData?: WeatherData) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const IOSSearchBar: React.FC<IOSSearchBarProps> = ({
  onCitySelected,
  placeholder = 'Search cities',
  autoFocus = false,
}) => {
  const { isDark } = useTheme();
  const { triggerHaptic } = useHaptic();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced city database - memoized to prevent recreation
  const cities: City[] = useMemo(
    () => [
      {
        display_name: 'New York, New York, United States',
        lat: '40.7128',
        lon: '-74.0060',
        place_id: 1,
      },
      {
        display_name: 'New Orleans, Louisiana, United States',
        lat: '29.9511',
        lon: '-90.0715',
        place_id: 11,
      },
      {
        display_name: 'New Delhi, India',
        lat: '28.6139',
        lon: '77.2090',
        place_id: 12,
      },
      {
        display_name: 'Newcastle, England, United Kingdom',
        lat: '54.9783',
        lon: '-1.6178',
        place_id: 13,
      },
      {
        display_name: 'Los Angeles, California, United States',
        lat: '34.0522',
        lon: '-118.2437',
        place_id: 2,
      },
      {
        display_name: 'Chicago, Illinois, United States',
        lat: '41.8781',
        lon: '-87.6298',
        place_id: 3,
      },
      {
        display_name: 'London, England, United Kingdom',
        lat: '51.5074',
        lon: '-0.1278',
        place_id: 4,
      },
      {
        display_name: 'Paris, France',
        lat: '48.8566',
        lon: '2.3522',
        place_id: 5,
      },
      {
        display_name: 'Berlin, Germany',
        lat: '52.5200',
        lon: '13.4050',
        place_id: 6,
      },
      {
        display_name: 'Tokyo, Japan',
        lat: '35.6762',
        lon: '139.6503',
        place_id: 7,
      },
      {
        display_name: 'Sydney, Australia',
        lat: '-33.8688',
        lon: '151.2093',
        place_id: 8,
      },
      {
        display_name: 'Miami, Florida, United States',
        lat: '25.7617',
        lon: '-80.1918',
        place_id: 9,
      },
      {
        display_name: 'Seattle, Washington, United States',
        lat: '47.6062',
        lon: '-122.3321',
        place_id: 10,
      },
      {
        display_name: 'San Francisco, California, United States',
        lat: '37.7749',
        lon: '-122.4194',
        place_id: 14,
      },
      {
        display_name: 'Boston, Massachusetts, United States',
        lat: '42.3601',
        lon: '-71.0589',
        place_id: 15,
      },
      {
        display_name: 'Toronto, Ontario, Canada',
        lat: '43.6532',
        lon: '-79.3832',
        place_id: 16,
      },
      {
        display_name: 'Vancouver, British Columbia, Canada',
        lat: '49.2827',
        lon: '-123.1207',
        place_id: 17,
      },
      {
        display_name: 'Mexico City, Mexico',
        lat: '19.4326',
        lon: '-99.1332',
        place_id: 18,
      },
      {
        display_name: 'Madrid, Spain',
        lat: '40.4168',
        lon: '-3.7038',
        place_id: 19,
      },
      {
        display_name: 'Rome, Italy',
        lat: '41.9028',
        lon: '12.4964',
        place_id: 20,
      },
      {
        display_name: 'Barcelona, Spain',
        lat: '41.3851',
        lon: '2.1734',
        place_id: 21,
      },
      {
        display_name: 'Amsterdam, Netherlands',
        lat: '52.3676',
        lon: '4.9041',
        place_id: 22,
      },
      {
        display_name: 'Vienna, Austria',
        lat: '48.2082',
        lon: '16.3738',
        place_id: 23,
      },
      {
        display_name: 'Prague, Czech Republic',
        lat: '50.0755',
        lon: '14.4378',
        place_id: 24,
      },
      {
        display_name: 'Stockholm, Sweden',
        lat: '59.3293',
        lon: '18.0686',
        place_id: 25,
      },
    ],
    []
  );

  // Fuzzy search algorithm
  const fuzzyMatch = useCallback((query: string, text: string): number => {
    const queryLower = query.toLowerCase().trim();
    const textLower = text.toLowerCase();

    // Exact match gets highest score
    if (textLower.includes(queryLower)) {
      return 100;
    }

    // Calculate similarity for words
    const words = textLower.split(/[\s,]+/);
    let bestScore = 0;

    for (const word of words) {
      if (word.length === 0) continue;

      // Starts with query
      if (word.startsWith(queryLower)) {
        bestScore = Math.max(bestScore, 90);
        continue;
      }

      // Character-by-character similarity
      let matches = 0;
      for (let i = 0; i < Math.min(queryLower.length, word.length); i++) {
        if (queryLower[i] === word[i]) {
          matches++;
        }
      }

      if (matches > 0) {
        const score = (matches / Math.max(queryLower.length, word.length)) * 70;
        bestScore = Math.max(bestScore, score);
      }

      // Partial substring matches
      for (let i = 0; i < queryLower.length - 1; i++) {
        if (word.includes(queryLower.substring(i, i + 2))) {
          bestScore = Math.max(bestScore, 50);
        }
      }
    }

    return bestScore;
  }, []);

  // Search with debouncing
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);

      // Apply fuzzy search with scoring
      const scoredResults = cities.map(city => ({
        ...city,
        score: fuzzyMatch(searchQuery, city.display_name),
      }));

      // Filter and sort by relevance
      const filteredResults = scoredResults
        .filter(city => city.score > 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ score, ...city }) => city); // Remove score property

      setResults(filteredResults);
      setShowResults(filteredResults.length > 0);
      setIsLoading(false);
    },
    [cities, fuzzyMatch]
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Fetch weather data
  const fetchWeatherData = useCallback(
    async (city: City): Promise<WeatherData | undefined> => {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;

        const response = await fetch(weatherUrl);
        return await response.json();
      } catch (error) {
        console.error('Weather fetch error:', error);
        return undefined;
      }
    },
    []
  );

  // Handle city selection
  const handleCitySelect = useCallback(
    async (city: City) => {
      triggerHaptic('light');
      setQuery(city.display_name.split(',')[0]);
      setShowResults(false);
      setIsActive(false);

      if (onCitySelected) {
        const weatherData = await fetchWeatherData(city);
        onCitySelected(city, weatherData);
      }
    },
    [triggerHaptic, onCitySelected, fetchWeatherData]
  );

  // Handle focus/blur
  const handleFocus = useCallback(() => {
    setIsActive(true);
    if (query.length >= 2) {
      setShowResults(results.length > 0);
    }
  }, [query.length, results.length]);

  const handleBlur = useCallback(() => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setIsActive(false);
      setShowResults(false);
    }, 150);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    triggerHaptic('light');
    inputRef.current?.focus();
  }, [triggerHaptic]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const themeClass = isDark ? 'dark' : 'light';

  return (
    <div className="ios-search-container">
      {/* iOS-style search bar */}
      <div
        className={`ios-search-bar ${themeClass} ${isActive ? 'active' : ''}`}
      >
        {/* Search icon */}
        <div className="ios-search-icon">🔍</div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`ios-search-input ${themeClass}`}
          autoComplete="off"
          spellCheck="false"
          aria-label="Search cities"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className={`ios-clear-button ${themeClass}`}
            aria-label="Clear search"
          >
            ×
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && <div className={`ios-loading-spinner ${themeClass}`} />}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className={`ios-results-dropdown ${themeClass}`}>
          {results.map((city, index) => {
            const cityName = city.display_name.split(',')[0];
            const location = city.display_name
              .split(',')
              .slice(1)
              .join(',')
              .trim();

            return (
              <button
                key={city.place_id}
                onClick={() => handleCitySelect(city)}
                className={`ios-result-item ${themeClass}`}
                aria-label={`Select ${cityName}`}
              >
                <div className={`ios-result-city-name ${themeClass}`}>
                  {cityName}
                </div>
                <div className="ios-result-location">{location}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IOSSearchBar;
