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
import { useSmartContentPriority } from '../../hooks/useSmartContentPriority';
import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../../types/weather';
import WeatherIcon from '../../utils/weatherIcons';
import SmartContentWrapper from '../SmartContentWrapper';
import {
  PrecipitationChart,
  TemperatureTrend,
  UVIndexBar,
  WindCompass,
} from './EnhancedWeatherVisualization';
import './OptimizedMobileWeatherDisplay.css';
import SmartWeatherSkeleton from './SmartWeatherSkeleton';

type ContentVariant =
  | 'current'
  | 'hourly'
  | 'daily'
  | 'metrics'
  | 'visualizations'
  | 'alerts';
type SkeletonVariant = 'current' | 'hourly' | 'daily' | 'metrics';

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
    let timeOfDay: 'night' | 'morning' | 'afternoon' | 'evening';
    if (currentHour < 6) timeOfDay = 'night';
    else if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

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
    [hourlyForecast]
  );

  const precipitationData = useMemo(
    () =>
      hourlyForecast.slice(0, 12).map(h => ({
        time: h.time,
        precipitation: Math.random() * 5, // Mock data - would come from API
      })),
    [hourlyForecast]
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
              <SmartWeatherSkeleton
                variant={
                  ['current', 'hourly', 'daily', 'metrics'].includes(
                    priority.component
                  )
                    ? (priority.component as SkeletonVariant)
                    : 'metrics'
                }
              />
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
              <SmartWeatherSkeleton
                variant={
                  priority.component as
                    | 'current'
                    | 'hourly'
                    | 'daily'
                    | 'metrics'
                }
              />
            }
          >
            <Suspense
              fallback={
                <SmartWeatherSkeleton
                  variant={
                    ['current', 'hourly', 'daily', 'metrics'].includes(
                      priority.component
                    )
                      ? (priority.component as SkeletonVariant)
                      : 'metrics'
                  }
                />
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
      <button
        type="button"
        className="refresh-indicator"
        onClick={onRefresh}
        aria-label="Refresh weather data"
      >
        <span className="refresh-icon">🔄</span>
        <span className="refresh-text">Pull to refresh</span>
      </button>
    </div>
  );
};

// Content renderer based on priority type
type TrendPoint = { time: string; temperature: number };
type PrecipPoint = { time: string; precipitation: number };

const renderContentByType = (
  type: ContentVariant,
  data: {
    weather: WeatherData;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    locationName: string;
    temperatureTrendData: TrendPoint[];
    precipitationData: PrecipPoint[];
    layoutConfig: { isCompact: boolean } & Record<string, unknown>;
  }
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
    case 'current': {
      const currentCode = hourlyForecast?.[0]?.weatherCode ?? 0;
      return (
        <div className="current-weather-section hero-current">
          <div className="location-header">
            <h1 className="location-name">{locationName}</h1>
            <span className="last-updated" aria-live="polite">
              Updated{' '}
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="hero-grid">
            <div className="current-icon" aria-hidden="true">
              <WeatherIcon code={currentCode} size={72} animated={true} />
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

          <ul className="chip-row" aria-label="Current conditions summary">
            <li
              className="chip"
              aria-label={`Humidity ${weather.main.humidity}%`}
            >
              💧 {weather.main.humidity}%
            </li>
            <li
              className="chip"
              aria-label={`Wind ${Math.round(weather.wind.speed)} miles per hour`}
            >
              💨 {Math.round(weather.wind.speed)} mph
            </li>
            {typeof weather.uv_index === 'number' && (
              <li
                className="chip"
                aria-label={`UV Index ${Math.round(weather.uv_index)}`}
              >
                ☀️ UV {Math.round(weather.uv_index)}
              </li>
            )}
          </ul>
        </div>
      );
    }

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

            {!!weather.visibility && (
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
          <div className="hourly-timeline">
            <div className="hourly-scroll-container">
              {hourlyForecast.slice(0, 12).map((hour, index) => (
                <div
                  key={`h-${hour.time}`}
                  className={`hourly-item ${index === 0 ? 'now' : ''}`}
                  aria-label={`At ${new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' })}, ${hour.temperature} degrees`}
                >
                  <span className="hourly-time">
                    {index === 0
                      ? 'Now'
                      : new Date(hour.time).toLocaleTimeString([], {
                          hour: 'numeric',
                        })}
                  </span>
                  <div className="hourly-icon" aria-hidden="true">
                    <WeatherIcon
                      code={hour.weatherCode}
                      size={28}
                      animated={true}
                    />
                  </div>
                  <span className="hourly-temp">{hour.temperature}°</span>
                  <span className="hourly-sub">Feels {hour.feelsLike}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'daily': {
      const days = dailyForecast.slice(0, 7);
      const globalMin = Math.min(...days.map(d => d.tempMin));
      const globalMax = Math.max(...days.map(d => d.tempMax));

      const toStep = (val: number) =>
        Math.max(0, Math.min(10, Math.round(val * 10)));
      const getRangeSteps = (min: number, max: number) => {
        const total = Math.max(1, globalMax - globalMin);
        const startPct = (min - globalMin) / total;
        const widthPct = (max - min) / total;
        return { startStep: toStep(startPct), widthStep: toStep(widthPct) };
      };

      return (
        <div className="daily-forecast-section">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="daily-forecast-list">
            {days.map((day, index) => {
              const isToday = index === 0;
              const { startStep, widthStep } = getRangeSteps(
                day.tempMin,
                day.tempMax
              );
              return (
                <div
                  key={`d-${day.date}`}
                  className={`daily-item ${isToday ? 'today' : ''}`}
                  aria-label={`${
                    isToday
                      ? 'Today'
                      : new Date(day.date).toLocaleDateString([], {
                          weekday: 'long',
                        })
                  }: high ${day.tempMax}°, low ${day.tempMin}°`}
                >
                  <span className="daily-day">
                    {isToday
                      ? 'Today'
                      : new Date(day.date).toLocaleDateString([], {
                          weekday: 'short',
                        })}
                  </span>
                  <div className="daily-icon" aria-hidden="true">
                    <WeatherIcon
                      code={day.weatherCode}
                      size={28}
                      animated={true}
                    />
                  </div>
                  <div className="daily-range">
                    <div className="range-rail" />
                    <div
                      className={`range-fill start-s${startStep} width-w${widthStep}`}
                    />
                  </div>
                  <span className="daily-temps">
                    <span className="temp-high">{day.tempMax}°</span>
                    <span className="temp-low">{day.tempMin}°</span>
                  </span>
                  {day.precipitation > 0 && (
                    <span
                      className="daily-precip"
                      aria-label={`Precipitation ${day.precipitation} millimeters`}
                    >
                      🌧️ {day.precipitation}mm
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'visualizations':
      return (
        <div className="visualizations-section">
          <TemperatureTrend hourlyData={temperatureTrendData} />
          <div className="visualization-grid">
            <WindCompass
              windSpeed={weather.wind.speed}
              windDirection={weather.wind.deg}
            />
            {typeof weather.uv_index === 'number' && (
              <UVIndexBar uvIndex={weather.uv_index} />
            )}
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
