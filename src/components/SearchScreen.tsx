import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';
import './SearchScreen.css';

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

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  type: string;
  class: string;
}

/**
 * SearchScreen - Enhanced search with nuclear implementation integration
 * Uses proven nuclear HTML/JS search functionality within React wrapper
 */
function SearchScreen({ theme, onBack, onLocationSelect }: SearchScreenProps) {
  const haptic = useHaptic();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weather-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Handle city selection
  const handleCitySelection = useCallback((city: NominatimResult) => {
    haptic.dataLoad();
    
    const cityName = city.display_name.split(',')[0];
    const latitude = parseFloat(city.lat);
    const longitude = parseFloat(city.lon);
    
    // Add to recent searches
    const searchResult: SearchResult = {
      name: cityName,
      display_name: city.display_name,
      lat: city.lat,
      lon: city.lon,
      country: city.display_name.split(',').pop()?.trim() || '',
      state: city.display_name.split(',')[1]?.trim()
    };
    
    const newRecent = [searchResult, ...recentSearches.filter(r => r.lat !== searchResult.lat || r.lon !== searchResult.lon)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('weather-recent-searches', JSON.stringify(newRecent));
    
    onLocationSelect(cityName, latitude, longitude);
  }, [haptic, onLocationSelect, recentSearches]);

  // Initialize nuclear search when component mounts
  useEffect(() => {
    if (searchContainerRef.current) {
      const container = searchContainerRef.current;
      
      // Create the nuclear search HTML
      container.innerHTML = `
        <div class="nuclear-ios-search">
          <div class="search-input-container">
            <div class="search-icon">🔍</div>
            <input 
              type="text" 
              id="nuclear-search-input"
              class="search-input" 
              placeholder="Search cities..."
              autocomplete="off"
            />
          </div>
          <div id="nuclear-search-results" class="search-results" style="display: none;"></div>
        </div>
      `;

      // Add nuclear search functionality
      const searchInput = container.querySelector('#nuclear-search-input') as HTMLInputElement;
      const searchResults = container.querySelector('#nuclear-search-results') as HTMLElement;
      
      if (searchInput && searchResults) {
        // Nuclear fuzzy search implementation
        const fuzzySearch = (query: string, cities: NominatimResult[]) => {
          if (!query.trim()) return [];
          
          const queryLower = query.toLowerCase();
          return cities
            .map(city => {
              const name = city.display_name.toLowerCase();
              let score = 0;
              
              // Exact match gets highest score
              if (name.includes(queryLower)) {
                score += 100;
              }
              
              // Character by character fuzzy matching
              let queryIndex = 0;
              for (let i = 0; i < name.length && queryIndex < queryLower.length; i++) {
                if (name[i] === queryLower[queryIndex]) {
                  score += 10;
                  queryIndex++;
                }
              }
              
              // Boost score if all characters found
              if (queryIndex === queryLower.length) {
                score += 50;
              }
              
              return { ...city, score };
            })
            .filter(city => city.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
        };

        // Search function
        const performSearch = async (query: string) => {
          if (!query.trim() || query.length < 2) {
            searchResults.style.display = 'none';
            return;
          }

          searchResults.innerHTML = '<div class="search-loading">🔍 Searching...</div>';
          searchResults.style.display = 'block';

          try {
            const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=25&addressdetails=1';
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'WeatherApp/1.0'
              }
            });
            
            if (response.ok) {
              const data: NominatimResult[] = await response.json();
              const cities = data.filter((item: NominatimResult) => 
                item.type === 'city' || 
                item.type === 'town' || 
                item.type === 'village' ||
                item.class === 'place'
              );
              
              const fuzzyResults = fuzzySearch(query, cities);
              
              if (fuzzyResults.length === 0) {
                searchResults.innerHTML = '<div class="search-empty">No cities found</div>';
                return;
              }

              searchResults.innerHTML = fuzzyResults.map(city => `
                <button class="search-result-item" data-city='${JSON.stringify(city)}'>
                  <div class="result-icon">🏙️</div>
                  <div class="result-text">
                    <div class="result-name">${city.display_name.split(',')[0]}</div>
                    <div class="result-location">${city.display_name}</div>
                  </div>
                </button>
              `).join('');

              // Add click handlers to results
              searchResults.querySelectorAll('.search-result-item').forEach(button => {
                button.addEventListener('click', () => {
                  const cityData = JSON.parse(button.getAttribute('data-city') || '{}');
                  handleCitySelection(cityData);
                });
              });
            }
          } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-empty">Search failed</div>';
          }
        };

        // Input event handler
        let searchTimeout: NodeJS.Timeout;
        searchInput.addEventListener('input', (e) => {
          const query = (e.target as HTMLInputElement).value;
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => performSearch(query), 300);
        });

        // Focus the input
        searchInput.focus();
      }

      // Add nuclear styles
      const style = document.createElement('style');
      style.textContent = `
        .nuclear-ios-search {
          position: relative;
          width: 100%;
        }

        .search-input-container {
          display: flex;
          align-items: center;
          background: ${theme.primaryGradient}10;
          border: 1px solid ${theme.primaryGradient}30;
          border-radius: 12px;
          padding: 12px 16px;
          gap: 12px;
        }

        .search-icon {
          font-size: 18px;
          opacity: 0.6;
          color: ${theme.primaryText};
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: ${theme.primaryText};
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .search-input::placeholder {
          color: ${theme.primaryText};
          opacity: 0.6;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: ${theme.appBackground};
          border: 1px solid ${theme.primaryGradient}30;
          border-top: none;
          border-radius: 0 0 12px 12px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          backdrop-filter: blur(20px);
        }

        .search-loading,
        .search-empty {
          padding: 16px;
          text-align: center;
          color: ${theme.primaryText};
          opacity: 0.7;
          font-size: 14px;
        }

        .search-result-item {
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: ${theme.primaryText};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid ${theme.primaryGradient}20;
          transition: background 0.2s ease;
          font-family: inherit;
        }

        .search-result-item:hover {
          background: ${theme.primaryGradient}10;
        }

        .result-icon {
          font-size: 16px;
        }

        .result-text {
          flex: 1;
          text-align: left;
        }

        .result-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .result-location {
          font-size: 12px;
          opacity: 0.7;
        }
      `;
      
      document.head.appendChild(style);
      
      // Cleanup function
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, [theme, handleCitySelection]);

  // Handle recent search selection
  const handleRecentSelect = useCallback((result: SearchResult) => {
    haptic.selection();
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    onLocationSelect(result.name, latitude, longitude);
  }, [haptic, onLocationSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    haptic.dataLoad();
    
    if (!navigator.geolocation) {
      haptic.error();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        haptic.dataLoad();
        onLocationSelect(
          'Current Location',
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (error) => {
        haptic.error();
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [haptic, onLocationSelect]);

  // Dynamic styles with theme integration
  const dynamicStyles = `
    .search-screen {
      background: ${theme.appBackground};
      color: ${theme.primaryText};
    }
    .search-header {
      border-bottom: 1px solid ${theme.primaryGradient}20;
    }
    .search-back-button {
      color: ${theme.primaryText};
    }
    .search-back-button:hover {
      background: ${theme.primaryGradient}15;
    }
    .current-location-button {
      background: ${theme.primaryGradient}10;
      border-color: ${theme.primaryGradient}20;
      color: ${theme.primaryText};
    }
    .current-location-button:hover {
      background: ${theme.primaryGradient}20;
    }
    .recent-item {
      border-color: ${theme.primaryGradient}40;
      color: ${theme.primaryText};
    }
    .recent-item:hover {
      background: ${theme.primaryGradient}05;
      border-color: ${theme.primaryGradient}60;
    }
    .search-input-container {
      background: ${theme.primaryGradient}10;
      border-color: ${theme.primaryGradient}30;
    }
    .search-icon {
      color: ${theme.primaryText};
    }
    .search-input {
      color: ${theme.primaryText};
    }
    .search-input::placeholder {
      color: ${theme.primaryText};
    }
    .search-results {
      background: ${theme.appBackground};
      border-color: ${theme.primaryGradient}30;
    }
    .search-loading, .search-empty {
      color: ${theme.primaryText};
    }
    .search-result-item {
      color: ${theme.primaryText};
      border-bottom-color: ${theme.primaryGradient}20;
    }
    .search-result-item:hover {
      background: ${theme.primaryGradient}10;
    }
  `;

  return React.createElement('div', { className: 'search-screen' },
    // Add dynamic styles
    React.createElement('style', { dangerouslySetInnerHTML: { __html: dynamicStyles } }),
    
    // Header
    React.createElement('header', { className: 'search-header' },
      React.createElement('button', {
        className: 'search-back-button',
        onClick: onBack,
        'aria-label': 'Go back'
      }, '←'),
      
      React.createElement('div', { 
        ref: searchContainerRef, 
        className: 'search-container'
      })
    ),

    // Content
    React.createElement('div', { className: 'search-content' },
      // Current Location Button
      React.createElement('button', {
        className: 'current-location-button',
        onClick: getCurrentLocation
      },
        React.createElement('div', { className: 'location-icon' }, '📍'),
        React.createElement('div', { className: 'location-text' },
          React.createElement('div', { className: 'location-title' }, 'Use Current Location'),
          React.createElement('div', { className: 'location-subtitle' }, 'Get weather for your current location')
        )
      ),

      // Recent Searches
      recentSearches.length > 0 && React.createElement('div', null,
        React.createElement('div', { className: 'section-title' }, 'Recent Searches'),
        ...recentSearches.map((result, index) =>
          React.createElement('button', {
            key: `${result.lat}-${result.lon}-${index}`,
            className: 'recent-item',
            onClick: () => handleRecentSelect(result)
          },
            React.createElement('div', { className: 'recent-icon' }, '🕒'),
            React.createElement('div', { className: 'recent-text' },
              React.createElement('div', { className: 'recent-name' }, result.name),
              React.createElement('div', { className: 'recent-location' }, 
                `${result.state ? result.state + ', ' : ''}${result.country}`
              )
            )
          )
        )
      )
    )
  );
}

export default SearchScreen;
