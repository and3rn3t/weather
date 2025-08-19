/**
 * Enhanced Weather Display Component - August 2025
 *
 * Improved weather display component with:
 * - Better mobile typography and readability
 * - Enhanced contrast and visibility
 * - Improved spacing and layout for small screens
 * - Better accessibility and touch interaction
 * - Adaptive sizing based on screen dimensions
 */

import React from 'react';
import WeatherIcon from '../../utils/weatherIcons';
import type { ThemeColors } from '../../utils/themeConfig';

interface EnhancedWeatherDisplayProps {
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
  };
  theme: ThemeColors;
  className?: string;
}

const EnhancedWeatherDisplay: React.FC<EnhancedWeatherDisplayProps> = ({
  weatherData,
  theme,
  className = '',
}) => {
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

  const formatUVIndex = (uvIndex: number | undefined): string => {
    if (!uvIndex) return 'N/A';
    return uvIndex.toString();
  };

  const getUVIndexLabel = (uvIndex: number | undefined): string => {
    if (!uvIndex) return 'UV Index';
    if (uvIndex <= 2) return 'Low UV';
    if (uvIndex <= 5) return 'Moderate UV';
    if (uvIndex <= 7) return 'High UV';
    if (uvIndex <= 10) return 'Very High UV';
    return 'Extreme UV';
  };

  return (
    <div className={`enhanced-weather-display ${className}`}>
      {/* Main Weather Display */}
      <div className="enhanced-weather-main">
        <p className="enhanced-weather-location">{weatherData.location}</p>

        <div className="enhanced-weather-icon">
          <WeatherIcon
            code={weatherData.weatherCode}
            size={Math.min(window.innerWidth * 0.2, 120)}
            animate={true}
          />
        </div>

        <div className="enhanced-weather-temp-section">
          <h1 className="enhanced-weather-temperature">
            {Math.round(weatherData.temperature)}°F
          </h1>
          <p className="enhanced-weather-condition">{weatherData.condition}</p>
          <p className="enhanced-weather-feels-like">
            Feels like {Math.round(weatherData.feelsLike)}°F
          </p>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <div className="enhanced-weather-metrics">
        <div className="enhanced-weather-metric">
          <div className="enhanced-weather-metric-value">
            {weatherData.humidity}%
          </div>
          <div className="enhanced-weather-metric-label">Humidity</div>
        </div>

        <div className="enhanced-weather-metric">
          <div className="enhanced-weather-metric-value">
            {formatWindSpeed(weatherData.windSpeed)}
          </div>
          <div className="enhanced-weather-metric-label">Wind Speed</div>
        </div>

        <div className="enhanced-weather-metric">
          <div className="enhanced-weather-metric-value">
            {formatPressure(weatherData.pressure)}
          </div>
          <div className="enhanced-weather-metric-label">Pressure</div>
        </div>

        {weatherData.visibility !== undefined && (
          <div className="enhanced-weather-metric">
            <div className="enhanced-weather-metric-value">
              {formatVisibility(weatherData.visibility)}
            </div>
            <div className="enhanced-weather-metric-label">Visibility</div>
          </div>
        )}

        {weatherData.uvIndex !== undefined && (
          <div className="enhanced-weather-metric">
            <div className="enhanced-weather-metric-value">
              {formatUVIndex(weatherData.uvIndex)}
            </div>
            <div className="enhanced-weather-metric-label">
              {getUVIndexLabel(weatherData.uvIndex)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedWeatherDisplay;
