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
    theme,
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
      [onToggleFavorite, city],
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCitySelect(city);
        }
      },
      [onCitySelect, city],
    );

    return (
      <button
        onClick={handleCityClick}
        onKeyDown={handleKeyDown}
        aria-label={`Select ${city.displayName || city.name} weather`}
        style={{
          background: isCurrentCity
            ? 'rgba(103, 126, 234, 0.2)' // Semi-transparent blue
            : theme.cardBackground,
          border: `1px solid ${isCurrentCity ? '#667eea' : theme.cardBorder}`,
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          textAlign: 'left',
        }}
        className="city-card"
      >
        {/* Current city indicator */}
        {isCurrentCity && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#667eea',
              color: 'white',
              fontSize: '10px',
              padding: '4px 8px',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            CURRENT
          </div>
        )}

        {/* City info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 4px 0',
                color: theme.primaryText,
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              {city.displayName || city.name}
            </h3>

            <p
              style={{
                margin: '0 0 8px 0',
                color: theme.secondaryText,
                fontSize: '14px',
              }}
            >
              {city.country && city.state
                ? `${city.state}, ${city.country}`
                : city.country}
            </p>

            {/* Weather preview */}
            {showWeather && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
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
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = theme.cardBorder;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {city.isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Last accessed info */}
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: theme.secondaryText,
            opacity: 0.7,
          }}
        >
          Last accessed: {new Date(city.lastAccessed).toLocaleDateString()}
        </div>
      </button>
    );
  },
);

import logger from '../utils/logger';

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  theme,
  onBack,
  onCitySelect,
  onAddFavorite,
  currentCity,
}) => {
  const haptic = useHaptic();
  const [selectedTab, setSelectedTab] = useState<'favorites' | 'recent'>(
    'favorites',
  );
  const [weatherPreviews, setWeatherPreviews] = useState<
    Record<string, WeatherPreview>
  >({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(
    new Set(),
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
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`,
        );

        if (response.ok) {
          const data = await response.json();
          const preview: WeatherPreview = {
            temperature: Math.round(data.current.temperature_2m),
            condition: getWeatherCondition(data.current.weather_code),
            icon: getWeatherIcon(data.current.weather_code),
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
    [loadingPreviews, weatherPreviews],
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
    [haptic, onCitySelect],
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
          city.state,
        );
      }
    },
    [haptic, removeFromFavorites, addToFavorites],
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
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${theme.cardBorder}`,
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      );
    }

    if (preview) {
      return (
        <>
          <span style={{ fontSize: '16px' }}>{preview.icon}</span>
          <span
            style={{
              color: theme.primaryText,
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {preview.temperature}°C
          </span>
          <span
            style={{
              color: theme.secondaryText,
              fontSize: '14px',
            }}
          >
            {preview.condition}
          </span>
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
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: theme.secondaryText,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌟</div>
        <h3 style={{ margin: '0 0 8px 0' }}>No Favorites Yet</h3>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Add cities to your favorites for quick weather access
        </p>
      </div>
    );
  };

  return (
    <div
      style={{
        height: '100vh',
        background: theme.appBackground,
        color: theme.primaryText,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.cardBorder}`,
          background: theme.cardBackground,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.primaryText,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            ←
          </button>

          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            My Cities
          </h1>

          {onAddFavorite && (
            <button
              onClick={onAddFavorite}
              style={{
                background: '#667eea',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              +
            </button>
          )}
        </div>

        {/* Tab selector */}
        <div
          style={{
            display: 'flex',
            marginTop: '16px',
            background: theme.cardBorder,
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          <button
            onClick={() => setSelectedTab('favorites')}
            style={{
              flex: 1,
              background:
                selectedTab === 'favorites' ? '#667eea' : 'transparent',
              color: selectedTab === 'favorites' ? 'white' : theme.primaryText,
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setSelectedTab('recent')}
            style={{
              flex: 1,
              background: selectedTab === 'recent' ? '#667eea' : 'transparent',
              color: selectedTab === 'recent' ? 'white' : theme.primaryText,
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Recent ({recentCities.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {selectedTab === 'favorites' ? (
          renderFavoritesContent()
        ) : (
          <>
            {recentCities.length > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: theme.primaryText,
                      fontSize: '16px',
                    }}
                  >
                    Recent Locations
                  </h3>
                  <button
                    onClick={handleClearRecent}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme.cardBorder}`,
                      color: theme.secondaryText,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
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
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.secondaryText,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕒</div>
                <h3 style={{ margin: '0 0 8px 0' }}>No Recent Cities</h3>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  Cities you search for will appear here
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick access summary */}
      {quickAccessCities.length > 0 && (
        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${theme.cardBorder}`,
            background: theme.cardBackground,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: theme.secondaryText,
              textAlign: 'center',
            }}
          >
            {quickAccessCities.length} cities available for quick access
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .city-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default FavoritesScreen;
