/**
 * Enhanced Favorites Screen - Phase F-3
 *
 * Advanced favorites and multiple cities management with modern UI,
 * quick weather previews, and seamless city switching functionality.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';
import { useCityManagement, type SavedCity } from '../utils/useCityManagement';
import './FavoritesScreen.css';

interface FavoritesScreenProps {
  theme: ThemeColors;
  onBack: () => void;
  onCitySelect: (cityName: string, latitude: number, longitude: number) => void;
  onAddFavorite?: () => void;
  currentCity?: string;
}

interface WeatherPreview {
  temperature: number;
  condition: string;
  icon: string;
}

interface CityCardProps {
  city: SavedCity;
  showWeather?: boolean;
  theme: ThemeColors;
  currentCity?: string;
  weatherPreviews: Record<string, WeatherPreview>;
  loadingPreviews: Set<string>;
  onCitySelect: (city: SavedCity) => void;
  onToggleFavorite: (city: SavedCity, event: React.MouseEvent) => void;
  renderWeatherPreview: (
    preview: WeatherPreview | undefined,
    isLoading: boolean
  ) => React.ReactNode;
}

// City card component - moved outside for better performance
const CityCard: React.FC<CityCardProps> = React.memo(
  ({
    city,
    showWeather = true,
    theme: _theme,
    currentCity,
    weatherPreviews,
    loadingPreviews,
    onCitySelect,
    onToggleFavorite,
    renderWeatherPreview,
  }) => {
    const preview = weatherPreviews[city.id];
    const isLoading = loadingPreviews.has(city.id);
    const isCurrentCity = currentCity === city.name;

    const handleCityClick = useCallback(() => {
      onCitySelect(city);
    }, [onCitySelect, city]);

    const handleFavoriteClick = useCallback(
      (event: React.MouseEvent) => {
        onToggleFavorite(city, event);
      },
      [onToggleFavorite, city]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCitySelect(city);
        }
      },
      [onCitySelect, city]
    );

    return (
      <button
        onClick={handleCityClick}
        onKeyDown={handleKeyDown}
        aria-label={`Select ${city.displayName || city.name} weather`}
        className={`city-card ${isCurrentCity ? 'is-current' : ''}`.trim()}
      >
        {/* Current city indicator */}
        {isCurrentCity && <div className="city-card-current">CURRENT</div>}

        {/* City info */}
        <div className="city-row">
          <div className="city-main">
            <h3 className="city-name">{city.displayName || city.name}</h3>

            <p className="city-meta">
              {city.country && city.state
                ? `${city.state}, ${city.country}`
                : city.country}
            </p>

            {/* Weather preview */}
            {showWeather && (
              <div className="city-preview">
                {renderWeatherPreview(preview, isLoading)}
              </div>
            )}
          </div>

          {/* Favorite toggle */}
          <button
            onClick={handleFavoriteClick}
            aria-label={
              city.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            className="fav-btn"
          >
            {city.isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Last accessed info */}
        <div className="city-last">
          Last accessed: {new Date(city.lastAccessed).toLocaleDateString()}
        </div>
      </button>
    );
  }
);

import logger from '../utils/logger';
import { optimizedFetchJson } from '../utils/optimizedFetch';

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  theme,
  onBack,
  onCitySelect,
  onAddFavorite,
  currentCity,
}) => {
  const haptic = useHaptic();
  const [selectedTab, setSelectedTab] = useState<'favorites' | 'recent'>(
    'favorites'
  );
  const [weatherPreviews, setWeatherPreviews] = useState<
    Record<string, WeatherPreview>
  >({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(
    new Set()
  );

  const {
    favorites,
    recentCities,
    removeFromFavorites,
    addToFavorites,
    clearRecentCities,
    getQuickAccessCities,
  } = useCityManagement();

  // Quick access cities (combination of favorites and recent)
  const quickAccessCities = getQuickAccessCities();

  // Load weather previews for cities
  const loadWeatherPreview = useCallback(
    async (city: SavedCity) => {
      if (loadingPreviews.has(city.id) || weatherPreviews[city.id]) return;

      setLoadingPreviews(prev => new Set([...prev, city.id]));

      try {
        // Simplified weather API call for preview
        const data = await optimizedFetchJson<{
          current?: { temperature_2m?: number; weather_code?: number };
        }>(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`,
          {},
          `preview:${city.id}`
        );
        if (data?.current) {
          const temp = Number.isFinite(data.current.temperature_2m as number)
            ? Math.round((data.current.temperature_2m as number) ?? 0)
            : 0;
          const wcode = (data.current.weather_code as number) ?? 0;
          const preview: WeatherPreview = {
            temperature: temp,
            condition: getWeatherCondition(wcode),
            icon: getWeatherIcon(wcode),
          };

          setWeatherPreviews(prev => ({
            ...prev,
            [city.id]: preview,
          }));
        }
      } catch (error) {
        logger.error(`Failed to load weather preview for ${city.name}`, error);
      } finally {
        setLoadingPreviews(prev => {
          const updated = new Set(prev);
          updated.delete(city.id);
          return updated;
        });
      }
    },
    [loadingPreviews, weatherPreviews]
  );

  // Load previews for visible cities
  useEffect(() => {
    const citiesToLoad = selectedTab === 'favorites' ? favorites : recentCities;
    citiesToLoad.slice(0, 5).forEach(city => {
      loadWeatherPreview(city);
    });
  }, [selectedTab, favorites, recentCities, loadWeatherPreview]);

  // Handle city selection
  const handleCitySelect = useCallback(
    (city: SavedCity) => {
      haptic.light();
      onCitySelect(city.name, city.latitude, city.longitude);
    },
    [haptic, onCitySelect]
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    (city: SavedCity, event: React.MouseEvent) => {
      event.stopPropagation();
      haptic.light();

      if (city.isFavorite) {
        removeFromFavorites(city.id);
      } else {
        addToFavorites(
          city.name,
          city.latitude,
          city.longitude,
          city.displayName,
          city.country,
          city.state
        );
      }
    },
    [haptic, removeFromFavorites, addToFavorites]
  );

  // Handle clear recent cities
  const handleClearRecent = useCallback(() => {
    haptic.medium();
    clearRecentCities();
  }, [haptic, clearRecentCities]);

  // Weather condition helpers
  const getWeatherCondition = (code: number): string => {
    const conditions: Record<number, string> = {
      0: 'Clear',
      1: 'Mostly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Light Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Light Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      95: 'Thunderstorm',
    };
    return conditions[code] || 'Unknown';
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 55) return '🌦️';
    if (code <= 65) return '🌧️';
    if (code <= 75) return '❄️';
    if (code === 95) return '⛈️';
    return '🌤️';
  };

  // Render weather preview content
  const renderWeatherPreview = (
    preview: WeatherPreview | undefined,
    isLoading: boolean
  ) => {
    if (isLoading) {
      return <div className="wp-spinner" />;
    }

    if (preview) {
      return (
        <>
          <span className="wp-emoji-md">{preview.icon}</span>
          <span className="wp-temp">{preview.temperature}°C</span>
          <span className="wp-cond">{preview.condition}</span>
        </>
      );
    }

    return null;
  };

  // Render favorites content
  const renderFavoritesContent = () => {
    if (favorites.length > 0) {
      return favorites.map(city => (
        <CityCard
          key={city.id}
          city={city}
          theme={theme}
          currentCity={currentCity}
          weatherPreviews={weatherPreviews}
          loadingPreviews={loadingPreviews}
          onCitySelect={handleCitySelect}
          onToggleFavorite={handleToggleFavorite}
          renderWeatherPreview={renderWeatherPreview}
        />
      ));
    }

    return (
      <div className="fav-empty">
        <div className="fav-emoji-xl">🌟</div>
        <h3 className="fav-empty-title">No Favorites Yet</h3>
        <p className="fav-empty-desc">
          Add cities to your favorites for quick weather access
        </p>
      </div>
    );
  };

  return (
    <div className="fav-root">
      {/* Header */}
      <div className="fav-header">
        <div className="fav-header-row">
          <button onClick={onBack} className="fav-back-btn">
            ←
          </button>

          <h1 className="fav-title">My Cities</h1>

          {onAddFavorite && (
            <button onClick={onAddFavorite} className="fav-add-btn">
              +
            </button>
          )}
        </div>

        {/* Tab selector */}
        <div className="fav-tabs">
          <button
            onClick={() => setSelectedTab('favorites')}
            className={`fav-tab ${
              selectedTab === 'favorites' ? 'is-active' : ''
            }`.trim()}
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setSelectedTab('recent')}
            className={`fav-tab ${
              selectedTab === 'recent' ? 'is-active' : ''
            }`.trim()}
          >
            Recent ({recentCities.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="fav-content">
        {selectedTab === 'favorites' ? (
          renderFavoritesContent()
        ) : (
          <>
            {recentCities.length > 0 ? (
              <>
                <div className="fav-section-head">
                  <h3 className="fav-section-title">Recent Locations</h3>
                  <button onClick={handleClearRecent} className="fav-clear-btn">
                    Clear All
                  </button>
                </div>
                {recentCities.map(city => (
                  <CityCard
                    key={city.id}
                    city={city}
                    theme={theme}
                    currentCity={currentCity}
                    weatherPreviews={weatherPreviews}
                    loadingPreviews={loadingPreviews}
                    onCitySelect={handleCitySelect}
                    onToggleFavorite={handleToggleFavorite}
                    renderWeatherPreview={renderWeatherPreview}
                  />
                ))}
              </>
            ) : (
              <div className="fav-empty">
                <div className="fav-emoji-xl">🕒</div>
                <h3 className="fav-empty-title">No Recent Cities</h3>
                <p className="fav-empty-desc">
                  Cities you search for will appear here
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick access summary */}
      {quickAccessCities.length > 0 && (
        <div className="fav-footer">
          <div className="fav-footer-text">
            {quickAccessCities.length} cities available for quick access
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
