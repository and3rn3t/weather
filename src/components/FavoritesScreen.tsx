/**
 * Enhanced Favorites Screen - Phase F-3
 *
 * Advanced favorites and multiple cities management with modern UI,
 * quick weather previews, and seamless city switching functionality.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';
import ThemeToggle from '../utils/ThemeToggle';
import {
  getPrecipitationUnitParam,
  getStoredUnits,
  getTemperatureSymbol,
  getTemperatureUnitParam,
  getWindSpeedUnitParam,
} from '../utils/units';
import { useCityManagement, type SavedCity } from '../utils/useCityManagement';
import { useTheme } from '../utils/useTheme';
import WeatherIcon from '../utils/weatherIcons';
import './FavoritesScreen.css';
import { SwipeActions } from './modernWeatherUI/iOS26Components';
import { NavigationBar } from './modernWeatherUI/NavigationBar';
import { NavigationIcons } from './modernWeatherUI/NavigationIcons';

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
  icon: React.ReactNode;
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
        className={`city-card ios26-list-item ${isCurrentCity ? 'is-current' : ''}`.trim()}
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

          {/* Favorite toggle (accessible control) */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFavoriteClick(e as unknown as React.MouseEvent);
              }
            }}
            aria-label={
              city.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            className="fav-btn"
          >
            {city.isFavorite ? (
              <NavigationIcons.Heart />
            ) : (
              <NavigationIcons.HeartOutline />
            )}
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
import { getWeatherDescription } from '../utils/weatherCodes';

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  theme,
  onBack,
  onCitySelect,
  onAddFavorite,
  currentCity,
}) => {
  const haptic = useHaptic();
  const { themeName } = useTheme();
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
        const units = getStoredUnits();
        const tempUnit = getTemperatureUnitParam(units);
        const windUnit = getWindSpeedUnitParam(units);
        const precipUnit = getPrecipitationUnitParam(units);
        const data = await optimizedFetchJson<{
          current?: { temperature_2m?: number; weather_code?: number };
        }>(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto`,
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
            condition: getWeatherDescription(wcode),
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

  // Weather icon helper

  const getWeatherIcon = (code: number): React.ReactNode => {
    return <WeatherIcon code={code} size={20} animated={true} />;
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
          <span className="wp-temp">
            {preview.temperature}
            {getTemperatureSymbol(getStoredUnits())}
          </span>
          <span className="wp-cond">{preview.condition}</span>
        </>
      );
    }

    return null;
  };

  // Render favorites content
  const renderFavoritesContent = () => {
    if (favorites.length > 0) {
      return (
        <ul
          className="fav-list ios26-card ios26-liquid-glass"
          aria-label="Favorite cities"
        >
          {favorites.map(city => (
            <li key={city.id}>
              <SwipeActions
                leftActions={[
                  {
                    id: 'open',
                    title: 'Open',
                    icon: <NavigationIcons.ChevronRight />,
                    color: '#007AFF',
                    onAction: () => handleCitySelect(city),
                  },
                ]}
                rightActions={[
                  {
                    id: 'remove',
                    title: 'Remove',
                    icon: <NavigationIcons.Trash />,
                    color: '#FF3B30',
                    onAction: () => removeFromFavorites(city.id),
                  },
                ]}
              >
                <CityCard
                  city={city}
                  theme={theme}
                  currentCity={currentCity}
                  weatherPreviews={weatherPreviews}
                  loadingPreviews={loadingPreviews}
                  onCitySelect={handleCitySelect}
                  onToggleFavorite={handleToggleFavorite}
                  renderWeatherPreview={renderWeatherPreview}
                />
              </SwipeActions>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="fav-empty ios26-card ios26-liquid-glass">
        <div className="fav-emoji-xl">🌟</div>
        <h3 className="fav-empty-title">No Favorites Yet</h3>
        <p className="fav-empty-desc">
          Add cities to your favorites for quick weather access
        </p>
      </div>
    );
  };

  return (
    <div className="fav-root ios26-container">
      <NavigationBar
        title="My Cities"
        theme={theme}
        isDark={themeName === 'dark'}
        leadingButton={{
          icon: <NavigationIcons.Back />,
          title: 'Back',
          onPress: onBack,
        }}
        trailingButtons={[
          {
            icon: <ThemeToggle className="ios26-nav-theme-toggle" />,
            title: 'Theme',
            onPress: () => {
              // Theme toggle handles its own click
            },
          },
          ...(onAddFavorite
            ? [
                {
                  icon: <NavigationIcons.Add />,
                  title: 'Add',
                  onPress: onAddFavorite,
                },
              ]
            : []),
        ]}
      />

      {/* Tabs */}
      <div className="fav-tabs">
        <button
          onClick={() => setSelectedTab('favorites')}
          className={`fav-tab ${selectedTab === 'favorites' ? 'is-active' : ''}`.trim()}
        >
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setSelectedTab('recent')}
          className={`fav-tab ${selectedTab === 'recent' ? 'is-active' : ''}`.trim()}
        >
          Recent ({recentCities.length})
        </button>
      </div>

      {/* Content */}
      <div className="fav-content ios26-container">
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
                <ul
                  className="fav-list ios26-card ios26-liquid-glass"
                  aria-label="Recent cities"
                >
                  {recentCities.map(city => (
                    <li key={city.id}>
                      <SwipeActions
                        leftActions={[
                          {
                            id: 'open',
                            title: 'Open',
                            icon: <NavigationIcons.ChevronRight />,
                            color: '#007AFF',
                            onAction: () => handleCitySelect(city),
                          },
                        ]}
                        rightActions={[
                          {
                            id: city.isFavorite ? 'unfavorite' : 'favorite',
                            title: city.isFavorite ? 'Unfavorite' : 'Favorite',
                            icon: city.isFavorite ? (
                              <NavigationIcons.Heart />
                            ) : (
                              <NavigationIcons.HeartOutline />
                            ),
                            color: '#FFCC00',
                            onAction: () =>
                              city.isFavorite
                                ? removeFromFavorites(city.id)
                                : addToFavorites(
                                    city.name,
                                    city.latitude,
                                    city.longitude,
                                    city.displayName,
                                    city.country,
                                    city.state
                                  ),
                          },
                        ]}
                      >
                        <CityCard
                          city={city}
                          theme={theme}
                          currentCity={currentCity}
                          weatherPreviews={weatherPreviews}
                          loadingPreviews={loadingPreviews}
                          onCitySelect={handleCitySelect}
                          onToggleFavorite={handleToggleFavorite}
                          renderWeatherPreview={renderWeatherPreview}
                        />
                      </SwipeActions>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="fav-empty ios26-card ios26-liquid-glass">
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
