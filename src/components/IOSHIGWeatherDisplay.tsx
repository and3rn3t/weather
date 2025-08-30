import {
  formatWindSpeed,
  getStoredUnits,
  getTemperatureSymbol,
} from '../utils/units';
/**
 * iOS HIG Enhanced Weather Display Component
 *
 * This component demonstrates iOS Human Interface Guidelines best practices
 * for weather data presentation while maintaining the fun theme.
 *
 * HIG Principles Applied:
 * - Clarity: Clear typography hierarchy and readable information
 * - Deference: Content-first design with subtle UI elements
 * - Depth: Layered design with appropriate shadows and blur effects
 */

import React from 'react';
import '../styles/ios-hig-enhancements.css';
import { NavigationIcons } from './modernWeatherUI/NavigationIcons';

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    description: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  uv_index?: number;
  visibility?: number;
}

interface IOSHIGWeatherDisplayProps {
  weather: WeatherData;
  city: string;
  loading?: boolean;
  onRefresh?: () => void;
}

/**
 * iOS HIG Compliant Weather Display
 *
 * Features HIG-compliant:
 * - Typography using SF Pro system fonts
 * - Proper information hierarchy
 * - Accessible color contrast
 * - Touch-friendly interactive elements
 * - Semantic HTML structure
 */
const IOSHIGWeatherDisplay: React.FC<IOSHIGWeatherDisplayProps> = ({
  weather,
  city,
  loading = false,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="ios-hig-weather-card">
        <div className="ios-hig-loading-state">
          <div
            className="ios-hig-activity-indicator"
            aria-label="Loading weather data"
          />
          <span className="ios-hig-body ios-hig-text-secondary">
            Loading weather for {city}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <article
      className="ios-hig-weather-card"
      aria-label={`Weather for ${city}`}
    >
      {/* Header with location */}
      <header className="ios-hig-weather-header">
        <h1
          className="ios-hig-title2 ios-hig-text-primary"
          aria-label={`Location ${city}`}
        >
          <NavigationIcons.Location /> {city}
        </h1>
        {onRefresh && (
          <button
            type="button"
            className="ios-hig-button-plain"
            onClick={onRefresh}
            aria-label="Refresh weather data"
          >
            <NavigationIcons.Refresh />
          </button>
        )}
      </header>

      {/* Main temperature display */}
      <section className="ios-hig-weather-main" aria-labelledby="current-temp">
        <div className="ios-hig-temperature-container">
          <span
            className="ios-hig-temperature"
            id="current-temp"
            aria-label={`Current temperature ${Math.round(
              weather.main.temp
            )} degrees Fahrenheit`}
          >
            {Math.round(weather.main.temp)}
          </span>
          <span className="ios-hig-temperature-unit" aria-hidden="true">
            {getTemperatureSymbol(getStoredUnits())}
          </span>
        </div>

        <p className="ios-hig-callout ios-hig-text-secondary">
          Feels like {Math.round(weather.main.feels_like)}
          {getTemperatureSymbol(getStoredUnits())}
        </p>

        <p className="ios-hig-headline ios-hig-text-primary">
          {weather.weather[0].description}
        </p>
      </section>

      {/* Weather details grid */}
      <section className="ios-hig-weather-details" aria-label="Weather details">
        <div className="ios-hig-weather-detail-item">
          <div
            className="ios-hig-weather-detail-value"
            aria-label={`Humidity ${weather.main.humidity} percent`}
          >
            {weather.main.humidity}%
          </div>
          <div className="ios-hig-weather-detail-label">
            <NavigationIcons.Drop /> Humidity
          </div>
        </div>

        <div className="ios-hig-weather-detail-item">
          <div
            className="ios-hig-weather-detail-value"
            aria-label={`Wind speed ${formatWindSpeed(weather.wind.speed, getStoredUnits())}`}
          >
            {formatWindSpeed(weather.wind.speed, getStoredUnits())}
          </div>
          <div className="ios-hig-weather-detail-label">
            <NavigationIcons.Refresh /> Wind
          </div>
        </div>

        <div className="ios-hig-weather-detail-item">
          <div
            className="ios-hig-weather-detail-value"
            aria-label={`Pressure ${Math.round(
              weather.main.pressure
            )} hectopascals`}
          >
            {Math.round(weather.main.pressure)} hPa
          </div>
          <div className="ios-hig-weather-detail-label">
            <NavigationIcons.Info /> Pressure
          </div>
        </div>

        {weather.uv_index !== undefined && weather.uv_index > 0 && (
          <div className="ios-hig-weather-detail-item">
            <div
              className="ios-hig-weather-detail-value"
              aria-label={`UV index ${Math.round(weather.uv_index)}`}
            >
              {Math.round(weather.uv_index)}
            </div>
            <div className="ios-hig-weather-detail-label">
              <NavigationIcons.Sun /> UV Index
            </div>
          </div>
        )}

        {weather.visibility !== undefined && weather.visibility > 0 && (
          <div className="ios-hig-weather-detail-item">
            <div
              className="ios-hig-weather-detail-value"
              aria-label={`Visibility ${Math.round(
                weather.visibility / 1000
              )} kilometers`}
            >
              {Math.round(weather.visibility / 1000)} km
            </div>
            <div className="ios-hig-weather-detail-label">
              <NavigationIcons.Eye /> Visibility
            </div>
          </div>
        )}
      </section>

      {/* Accessibility: Hidden but available to screen readers */}
      <div className="ios-hig-sr-only">
        Complete weather summary for {city}: {Math.round(weather.main.temp)}{' '}
        degrees{' '}
        {getTemperatureSymbol(getStoredUnits()) === '°F'
          ? 'Fahrenheit'
          : 'Celsius'}
        ,{weather.weather[0].description}, feels like{' '}
        {Math.round(weather.main.feels_like)} degrees{' '}
        {getTemperatureSymbol(getStoredUnits()) === '°F'
          ? 'Fahrenheit'
          : 'Celsius'}
        ,{weather.main.humidity} percent humidity, wind speed{' '}
        {Math.round(weather.wind.speed)} miles per hour
      </div>
    </article>
  );
};

export default IOSHIGWeatherDisplay;
