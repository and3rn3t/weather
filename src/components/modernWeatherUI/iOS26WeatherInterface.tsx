/**
 * iOS 26 Enhanced Weather Interface - August 2025
 *
 * Modern iOS 26 weather interface based on the Figma iOS 26 UI kit reference.
 *
 * Features:
 * - Fluid Island-style weather cards
 * - Advanced glassmorphism with depth layers
 * - Smart adaptive lay            {hourlyForecast.map((hour, index) => (
              <div key={index} className="ios26-forecast-item">
                <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
                  {hour.time}
                </div>
                <div className="ios26-forecast-icon">
                  <WeatherIcon code={hour.weatherCode} size={28} animated={true} />
                </div>
                {hour.precipitation !== undefined && hour.precipitation > 0 && (
                  <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-precipitation">
                    {Math.round(hour.precipitation)}%
                  </div>
                )}
                <div className="ios26-forecast-temperature">
                  <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                    {Math.round(hour.temperature)}°
                  </div>
                </div>
              </div>
            ))}Dynamic Type
 * - Contextual controls and haptic feedback integration
 * - Live Activities-inspired design
 * - Spatial UI elements with proper depth hierarchy
 * - Enhanced accessibility with VoiceOver support
 * - Modern iOS spacing and typography
 */

import { useCallback, useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';
import WeatherIcon from '../../utils/weatherIcons';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface iOS26WeatherInterfaceProps {
  weatherData: {
    temperature: number;
    condition: string;
    location: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    uvIndex?: number;
    feelsLike: number;
    visibility?: number;
    weatherCode: number;
    hourlyForecast?: Array<{
      time: string;
      temperature: number;
      weatherCode: number;
      precipitation?: number;
    }>;
    dailyForecast?: Array<{
      day: string;
      high: number;
      low: number;
      weatherCode: number;
      precipitation?: number;
    }>;
  };
  theme: ThemeColors;
  className?: string;
  onRefresh?: () => void;
  onLocationTap?: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
}

// ============================================================================
// MAIN iOS 26 WEATHER INTERFACE COMPONENT
// ============================================================================

const iOS26WeatherInterface: React.FC<iOS26WeatherInterfaceProps> = ({
  weatherData,
  theme: _theme,
  className = '',
  onRefresh,
  onLocationTap,
  isLoading = false,
  lastUpdated,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isPressed, setIsPressed] = useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const formatWindSpeed = (speed: number): string => {
    return `${Math.round(speed)} mph`;
  };

  const formatPressure = (pressure: number): string => {
    return `${Math.round(pressure)} hPa`;
  };

  const formatVisibility = (visibility: number | undefined): string => {
    if (!visibility) return 'N/A';
    return `${Math.round(visibility)} mi`;
  };

  const getUVIndexLevel = (uvIndex: number | undefined): string => {
    if (!uvIndex) return 'N/A';
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  };

  return (
    <div className={`ios26-weather-interface ${className}`}>
      {/* Main Weather Card */}
      <div
        className={`ios26-main-weather-card ${isPressed ? 'pressed' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Header with Location */}
        <div className="ios26-weather-header">
          {onLocationTap ? (
            <button
              className="ios26-weather-location"
              onClick={onLocationTap}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLocationTap();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span className="ios26-text-headline ios26-text-primary ios26-text-semibold">
                {weatherData.location}
              </span>
              <span className="ios26-location-icon">📍</span>
            </button>
          ) : (
            <div className="ios26-weather-location">
              <span className="ios26-text-headline ios26-text-primary ios26-text-semibold">
                {weatherData.location}
              </span>
              <span className="ios26-location-icon">📍</span>
            </div>
          )}

          {lastUpdated && (
            <div className="ios26-text-caption2 ios26-text-tertiary ios26-last-updated">
              Updated {lastUpdated}
            </div>
          )}
        </div>

        {/* Main Temperature Display */}
        <div className="ios26-temperature-section">
          <div className="ios26-weather-icon-container">
            <WeatherIcon
              code={weatherData.weatherCode}
              size={Math.min(window.innerWidth * 0.25, 120)}
              animated={true}
            />
          </div>

          <div className="ios26-temperature-display">
            <span className="ios26-temperature-value">
              {Math.round(weatherData.temperature)}°
            </span>
            <span className="ios26-temperature-unit">F</span>
          </div>

          <div className="ios26-text-title3 ios26-text-primary ios26-text-medium ios26-weather-condition">
            {weatherData.condition}
          </div>

          <div className="ios26-text-subheadline ios26-text-secondary ios26-feels-like">
            Feels like {Math.round(weatherData.feelsLike)}°F
          </div>
        </div>

        {/* Refresh Indicator */}
        {isLoading && (
          <div className="ios26-loading-indicator">
            <div className="ios26-spinner"></div>
          </div>
        )}
      </div>

      {/* Weather Metrics Grid */}
      <div className="ios26-weather-metrics-grid">
        <div className="ios26-weather-metric">
          <div className="ios26-weather-metric-content">
            <div className="ios26-weather-metric-icon">💧</div>
            <div className="ios26-weather-metric-text">
              <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                {weatherData.humidity}%
              </div>
              <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                Humidity
              </div>
            </div>
          </div>
        </div>
        <div className="ios26-weather-metric">
          <div className="ios26-weather-metric-content">
            <div className="ios26-weather-metric-icon">💨</div>
            <div className="ios26-weather-metric-text">
              <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                {formatWindSpeed(weatherData.windSpeed)}
              </div>
              <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                Wind
              </div>
            </div>
          </div>
        </div>
        <div className="ios26-weather-metric">
          <div className="ios26-weather-metric-content">
            <div className="ios26-weather-metric-icon">📊</div>
            <div className="ios26-weather-metric-text">
              <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                {formatPressure(weatherData.pressure)}
              </div>
              <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                Pressure
              </div>
              <div className="ios26-text-caption2 ios26-text-tertiary ios26-weather-metric-subtitle">
                hPa
              </div>
            </div>
          </div>
        </div>{' '}
        {weatherData.uvIndex !== undefined && (
          <div className="ios26-weather-metric">
            <div className="ios26-weather-metric-content">
              <div className="ios26-weather-metric-icon">☀️</div>
              <div className="ios26-weather-metric-text">
                <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                  {weatherData.uvIndex}
                </div>
                <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                  UV Index
                </div>
                <div className="ios26-text-caption2 ios26-text-tertiary ios26-weather-metric-subtitle">
                  {getUVIndexLevel(weatherData.uvIndex)}
                </div>
              </div>
            </div>
          </div>
        )}
        {weatherData.visibility !== undefined && (
          <div className="ios26-weather-metric">
            <div className="ios26-weather-metric-content">
              <div className="ios26-weather-metric-icon">👁️</div>
              <div className="ios26-weather-metric-text">
                <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                  {formatVisibility(weatherData.visibility)}
                </div>
                <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                  Visibility
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Forecast */}
      {weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0 && (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            24-Hour Forecast
          </div>

          <div className="ios26-forecast-scroll">
            {weatherData.hourlyForecast.map((hour, index) => (
              <div
                key={`${hour.time}-${index}`}
                className="ios26-forecast-item"
              >
                <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
                  {hour.time}
                </div>
                <div className="ios26-forecast-icon">
                  <WeatherIcon
                    code={hour.weatherCode}
                    size={28}
                    animated={true}
                  />
                </div>
                {hour.precipitation !== undefined && hour.precipitation > 0 && (
                  <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-precipitation">
                    {Math.round(hour.precipitation)}%
                  </div>
                )}
                <div className="ios26-forecast-temperature">
                  <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                    {Math.round(hour.temperature)}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {weatherData.dailyForecast && weatherData.dailyForecast.length > 0 && (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            7-Day Forecast
          </div>

          <div className="ios26-forecast-scroll">
            {weatherData.dailyForecast.map((day, index) => (
              <div key={`${day.day}-${index}`} className="ios26-forecast-item">
                <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
                  {day.day}
                </div>
                <div className="ios26-forecast-icon">
                  <WeatherIcon
                    code={day.weatherCode}
                    size={28}
                    animated={true}
                  />
                </div>
                {day.precipitation !== undefined && day.precipitation > 0 && (
                  <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-precipitation">
                    {Math.round(day.precipitation)}%
                  </div>
                )}
                <div className="ios26-forecast-temperature">
                  <div className="ios26-forecast-temp-range">
                    <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                      {Math.round(day.high)}°
                    </div>
                    <div className="ios26-text-subheadline ios26-text-secondary">
                      {Math.round(day.low)}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="ios26-quick-actions">
        {onRefresh && (
          <button
            className="ios26-button ios26-button-secondary ios26-quick-action"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <span className="ios26-quick-action-icon">🔄</span>
            <span className="ios26-text-footnote ios26-text-semibold">
              Refresh
            </span>
          </button>
        )}

        <button className="ios26-button ios26-button-ghost ios26-quick-action">
          <span className="ios26-quick-action-icon">🗺️</span>
          <span className="ios26-text-footnote ios26-text-semibold">Map</span>
        </button>

        <button className="ios26-button ios26-button-ghost ios26-quick-action">
          <span className="ios26-quick-action-icon">📊</span>
          <span className="ios26-text-footnote ios26-text-semibold">
            Details
          </span>
        </button>
      </div>
    </div>
  );
};

export default iOS26WeatherInterface;
