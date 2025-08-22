/**
 * Optimized Mobile Weather Display
 *
 * A highly optimized weather display component that implements:
 * - Progressive loading with smart priorities
 * - Enhanced visualizations
 * - Smart content adaptation
 * - Performance optimizations
 */

import React, { Suspense, useMemo } from 'react';
import {
  SmartContentWrapper,
  useSmartContentPriority,
} from '../../hooks/useSmartContentPriority';
import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../../types/weather';
import {
  PrecipitationChart,
  TemperatureTrend,
  UVIndexBar,
  WindCompass,
} from './EnhancedWeatherVisualization';
import './OptimizedMobileWeatherDisplay.css';
import SmartWeatherSkeleton from './SmartWeatherSkeleton';

interface OptimizedMobileWeatherDisplayProps {
  weather: WeatherData | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  locationName: string;
  isLoading: boolean;
  onRefresh: () => void;
  className?: string;
}

const OptimizedMobileWeatherDisplay: React.FC<
  OptimizedMobileWeatherDisplayProps
> = ({
  weather,
  hourlyForecast,
  dailyForecast,
  locationName,
  isLoading,
  onRefresh,
  className = '',
}) => {
  // Determine current context for smart prioritization
  const weatherContext = useMemo(() => {
    const currentHour = new Date().getHours();
    const timeOfDay: 'night' | 'morning' | 'afternoon' | 'evening' =
      currentHour < 6
        ? 'night'
        : currentHour < 12
        ? 'morning'
        : currentHour < 18
        ? 'afternoon'
        : 'evening';

    return {
      temperature: weather?.main.temp,
      weatherCode: 0, // Would be derived from weather data
      isExtreme: weather
        ? weather.main.temp > 100 || weather.main.temp < 0
        : false,
      hasAlerts: false, // Would come from weather alerts API
      timeOfDay,
    };
  }, [weather]);

  const { aboveFoldContent, belowFoldContent, layoutConfig } =
    useSmartContentPriority(weatherContext);

  // Prepare data for visualizations
  const temperatureTrendData = useMemo(
    () =>
      hourlyForecast.slice(0, 12).map(h => ({
        time: h.time,
        temperature: h.temperature,
      })),
    [hourlyForecast],
  );

  const precipitationData = useMemo(
    () =>
      hourlyForecast.slice(0, 12).map(h => ({
        time: h.time,
        precipitation: Math.random() * 5, // Mock data - would come from API
      })),
    [hourlyForecast],
  );

  if (isLoading && !weather) {
    return (
      <div className={`optimized-weather-display loading ${className}`}>
        <SmartWeatherSkeleton variant="current" />
        <SmartWeatherSkeleton variant="metrics" count={4} />
        <SmartWeatherSkeleton variant="hourly" count={6} />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={`optimized-weather-display error ${className}`}>
        <div className="error-state">
          <h3>Weather data unavailable</h3>
          <p>Please check your connection and try again.</p>
          <button onClick={onRefresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`optimized-weather-display ${
        layoutConfig.isCompact ? 'compact' : 'normal'
      } ${className}`}
    >
      {/* Above-the-fold content (immediate render) */}
      <div className="above-fold-content">
        {aboveFoldContent.map(priority => (
          <SmartContentWrapper
            key={priority.id}
            priority={priority}
            fallback={
              <SmartWeatherSkeleton variant={priority.component as any} />
            }
          >
            {renderContentByType(priority.component, {
              weather,
              hourlyForecast,
              dailyForecast,
              locationName,
              temperatureTrendData,
              precipitationData,
              layoutConfig,
            })}
          </SmartContentWrapper>
        ))}
      </div>

      {/* Below-the-fold content (lazy loaded) */}
      <div className="below-fold-content">
        {belowFoldContent.map(priority => (
          <SmartContentWrapper
            key={priority.id}
            priority={priority}
            fallback={
              <SmartWeatherSkeleton variant={priority.component as any} />
            }
          >
            <Suspense
              fallback={
                <SmartWeatherSkeleton variant={priority.component as any} />
              }
            >
              {renderContentByType(priority.component, {
                weather,
                hourlyForecast,
                dailyForecast,
                locationName,
                temperatureTrendData,
                precipitationData,
                layoutConfig,
              })}
            </Suspense>
          </SmartContentWrapper>
        ))}
      </div>

      {/* Pull-to-refresh indicator */}
      <div className="refresh-indicator" onClick={onRefresh}>
        <span className="refresh-icon">🔄</span>
        <span className="refresh-text">Pull to refresh</span>
      </div>
    </div>
  );
};

// Content renderer based on priority type
const renderContentByType = (
  type: string,
  data: {
    weather: WeatherData;
    hourlyForecast: any[];
    dailyForecast: any[];
    locationName: string;
    temperatureTrendData: any[];
    precipitationData: any[];
    layoutConfig: any;
  },
) => {
  const {
    weather,
    hourlyForecast,
    dailyForecast,
    locationName,
    temperatureTrendData,
    precipitationData,
    layoutConfig,
  } = data;

  switch (type) {
    case 'current':
      return (
        <div className="current-weather-section">
          <div className="location-header">
            <h1 className="location-name">{locationName}</h1>
            <span className="last-updated">
              Updated{' '}
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="current-weather-main">
            <div className="temperature-display">
              <span className="temperature-value">
                {Math.round(weather.main.temp)}°
              </span>
              <span className="temperature-unit">F</span>
            </div>
            <div className="weather-description">
              <p className="condition">{weather.weather[0].description}</p>
              <p className="feels-like">
                Feels like {Math.round(weather.main.feels_like)}°
              </p>
            </div>
          </div>
        </div>
      );

    case 'metrics':
      return (
        <div className="weather-metrics-section">
          <div
            className={`metrics-grid ${
              layoutConfig.isCompact ? 'compact' : 'normal'
            }`}
          >
            <div className="metric-card">
              <span className="metric-icon">💧</span>
              <span className="metric-value">{weather.main.humidity}%</span>
              <span className="metric-label">Humidity</span>
            </div>

            <div className="metric-card">
              <span className="metric-icon">💨</span>
              <span className="metric-value">
                {Math.round(weather.wind.speed)} mph
              </span>
              <span className="metric-label">Wind</span>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🌡️</span>
              <span className="metric-value">{weather.main.pressure} hPa</span>
              <span className="metric-label">Pressure</span>
            </div>

            {weather.visibility && (
              <div className="metric-card">
                <span className="metric-icon">👁️</span>
                <span className="metric-value">
                  {Math.round(weather.visibility / 1000)} km
                </span>
                <span className="metric-label">Visibility</span>
              </div>
            )}
          </div>
        </div>
      );

    case 'hourly':
      return (
        <div className="hourly-forecast-section">
          <h3 className="section-title">Today's Forecast</h3>
          <div className="hourly-scroll-container">
            {hourlyForecast.slice(0, 12).map((hour, index) => (
              <div key={index} className="hourly-item">
                <span className="hourly-time">
                  {new Date(hour.time).toLocaleTimeString([], {
                    hour: 'numeric',
                  })}
                </span>
                <span className="hourly-icon">🌤️</span>
                <span className="hourly-temp">{hour.temperature}°</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'daily':
      return (
        <div className="daily-forecast-section">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="daily-forecast-list">
            {dailyForecast.slice(0, 7).map((day, index) => (
              <div key={index} className="daily-item">
                <span className="daily-day">
                  {index === 0
                    ? 'Today'
                    : new Date(day.date).toLocaleDateString([], {
                        weekday: 'short',
                      })}
                </span>
                <span className="daily-icon">🌤️</span>
                <span className="daily-temps">
                  <span className="temp-high">{day.tempMax}°</span>
                  <span className="temp-low">{day.tempMin}°</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'visualizations':
      return (
        <div className="visualizations-section">
          <TemperatureTrend hourlyData={temperatureTrendData} />
          <div className="visualization-grid">
            <WindCompass
              windSpeed={weather.wind.speed}
              windDirection={weather.wind.deg}
            />
            {weather.uv_index && <UVIndexBar uvIndex={weather.uv_index} />}
          </div>
          <PrecipitationChart hourlyData={precipitationData} />
        </div>
      );

    case 'alerts':
      return (
        <div className="weather-alerts-section">
          <div className="alert-banner warning">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <h4>Weather Advisory</h4>
              <p>
                Extreme temperature conditions detected. Please take appropriate
                precautions.
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default OptimizedMobileWeatherDisplay;
