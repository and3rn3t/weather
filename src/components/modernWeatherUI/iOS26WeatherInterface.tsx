/**
 * iOS 26 Enhanced Weather Interface - August 2025
 * 
 * Modern iOS 26 weather interface based on the Figma iOS 26 UI kit reference.
 * 
 * Features:
 * - Fluid Island-style weather cards
 * - Advanced glassmorphism with depth layers
 * - Smart adaptive layouts with Dynamic Type
 * - Contextual controls and haptic feedback integration
 * - Live Activities-inspired design
 * - Spatial UI elements with proper depth hierarchy
 * - Enhanced accessibility with VoiceOver support
 * - Modern iOS spacing and typography
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { useState, useCallback } from 'react';
import WeatherIcon from '../../utils/weatherIcons';
import type { ThemeColors } from '../../utils/themeConfig';

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

interface WeatherMetricProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  subtitle?: string;
}

// ============================================================================
// iOS 26 WEATHER METRIC COMPONENT
// ============================================================================

const iOS26WeatherMetric: React.FC<WeatherMetricProps> = ({
  label,
  value,
  icon,
  color,
  subtitle
}) => {
  return (
    <div className="ios26-weather-metric">
      <div className="ios26-weather-metric-content">
        {icon && (
          <div className="ios26-weather-metric-icon" style={{ color }}>
            {icon}
          </div>
        )}
        <div className="ios26-weather-metric-text">
          <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
            {value}
          </div>
          <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
            {label}
          </div>
          {subtitle && (
            <div className="ios26-text-caption2 ios26-text-tertiary ios26-weather-metric-subtitle">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// iOS 26 FORECAST ITEM COMPONENT
// ============================================================================

const iOS26ForecastItem: React.FC<{
  time: string;
  temperature: number | { high: number; low: number };
  weatherCode: number;
  precipitation?: number;
  isDaily?: boolean;
}> = ({ time, temperature, weatherCode, precipitation, isDaily = false }) => {
  return (
    <div className="ios26-forecast-item">
      <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
        {time}
      </div>
      
      <div className="ios26-forecast-icon">
        <WeatherIcon 
          code={weatherCode} 
          size={28}
          animate={true}
        />
      </div>
      
      {precipitation !== undefined && precipitation > 0 && (
        <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-precipitation">
          {Math.round(precipitation)}%
        </div>
      )}
      
      <div className="ios26-forecast-temperature">
        {typeof temperature === 'number' ? (
          <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
            {Math.round(temperature)}°
          </div>
        ) : (
          <div className="ios26-forecast-temp-range">
            <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
              {Math.round(temperature.high)}°
            </div>
            <div className="ios26-text-subheadline ios26-text-secondary">
              {Math.round(temperature.low)}°
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN iOS 26 WEATHER INTERFACE COMPONENT
// ============================================================================

const iOS26WeatherInterface: React.FC<iOS26WeatherInterfaceProps> = ({
  weatherData,
  theme,
  className = '',
  onRefresh,
  onLocationTap,
  isLoading = false,
  lastUpdated
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

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
          <div 
            className="ios26-weather-location"
            onClick={onLocationTap}
            role={onLocationTap ? 'button' : undefined}
            tabIndex={onLocationTap ? 0 : undefined}
          >
            <span className="ios26-text-headline ios26-text-primary ios26-text-semibold">
              {weatherData.location}
            </span>
            <span className="ios26-location-icon">📍</span>
          </div>
          
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
              animate={true}
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
        <iOS26WeatherMetric
          label="Humidity"
          value={`${weatherData.humidity}%`}
          icon="💧"
          color="var(--ios26-color-primary)"
        />
        
        <iOS26WeatherMetric
          label="Wind"
          value={formatWindSpeed(weatherData.windSpeed)}
          icon="💨"
          color="var(--ios26-color-secondary)"
        />
        
        <iOS26WeatherMetric
          label="Pressure"
          value={formatPressure(weatherData.pressure)}
          icon="📊"
          color="var(--ios26-color-success)"
          subtitle="hPa"
        />
        
        {weatherData.uvIndex !== undefined && (
          <iOS26WeatherMetric
            label="UV Index"
            value={weatherData.uvIndex.toString()}
            icon="☀️"
            color="var(--ios26-color-warning)"
            subtitle={getUVIndexLevel(weatherData.uvIndex)}
          />
        )}
        
        {weatherData.visibility !== undefined && (
          <iOS26WeatherMetric
            label="Visibility"
            value={formatVisibility(weatherData.visibility)}
            icon="👁️"
            color="var(--ios26-color-primary)"
          />
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
              <iOS26ForecastItem
                key={index}
                time={hour.time}
                temperature={hour.temperature}
                weatherCode={hour.weatherCode}
                precipitation={hour.precipitation}
                isDaily={false}
              />
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
              <iOS26ForecastItem
                key={index}
                time={day.day}
                temperature={{ high: day.high, low: day.low }}
                weatherCode={day.weatherCode}
                precipitation={day.precipitation}
                isDaily={true}
              />
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
            <span className="ios26-text-footnote ios26-text-semibold">Refresh</span>
          </button>
        )}
        
        <button className="ios26-button ios26-button-ghost ios26-quick-action">
          <span className="ios26-quick-action-icon">🗺️</span>
          <span className="ios26-text-footnote ios26-text-semibold">Map</span>
        </button>
        
        <button className="ios26-button ios26-button-ghost ios26-quick-action">
          <span className="ios26-quick-action-icon">📊</span>
          <span className="ios26-text-footnote ios26-text-semibold">Details</span>
        </button>
      </div>
    </div>
  );
};

export default iOS26WeatherInterface;
