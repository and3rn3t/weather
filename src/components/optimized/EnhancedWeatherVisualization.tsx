/**
 * Enhanced Weather Visualization Components
 *
 * Provides advanced visual representations of weather data including:
 * - Temperature trends with mini charts
 * - Precipitation probability graphs
 * - Wind direction compass
 * - UV index progress bars
 * - Air quality indicators
 */

import React from 'react';
import './EnhancedWeatherVisualization.css';

interface TemperatureTrendProps {
  hourlyData: Array<{ time: string; temperature: number }>;
  className?: string;
}

export const TemperatureTrend: React.FC<TemperatureTrendProps> = ({
  hourlyData,
  className = '',
}) => {
  if (!hourlyData || hourlyData.length === 0) return null;

  const maxTemp = Math.max(...hourlyData.map(h => h.temperature));
  const minTemp = Math.min(...hourlyData.map(h => h.temperature));
  const tempRange = maxTemp - minTemp || 1;

  // Generate SVG path for temperature curve
  const generatePath = () => {
    const width = 300;
    const height = 60;
    const padding = 10;

    const points = hourlyData.slice(0, 12).map((hour, index) => {
      const x =
        padding + (index * (width - 2 * padding)) / (hourlyData.length - 1);
      const y =
        padding +
        ((maxTemp - hour.temperature) / tempRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className={`temperature-trend-container ${className}`}>
      <div className="temperature-trend-header">
        <h4>12-Hour Temperature Trend</h4>
        <div className="temperature-range">
          <span className="temp-high">{maxTemp}°</span>
          <span className="temp-separator">—</span>
          <span className="temp-low">{minTemp}°</span>
        </div>
      </div>

      <div className="temperature-chart">
        <svg width="100%" height="60" viewBox="0 0 300 60">
          {/* Background grid */}
          <defs>
            <pattern
              id="grid"
              width="25"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 25 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Temperature line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="url(#tempGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {hourlyData.slice(0, 12).map((hour, index) => {
            const x =
              10 + (index * 280) / (Math.min(hourlyData.length, 12) - 1);
            const y = 10 + ((maxTemp - hour.temperature) / tempRange) * 40;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#ffffff"
                stroke="url(#tempGradient)"
                strokeWidth="2"
              >
                <title>
                  {hour.temperature}° at{' '}
                  {new Date(hour.time).toLocaleTimeString([], {
                    hour: 'numeric',
                  })}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>

      {/* Time labels */}
      <div className="time-labels">
        {hourlyData.slice(0, 12).map((hour, index) => (
          <span key={index} className="time-label">
            {new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  );
};

interface WindCompassProps {
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  className?: string;
}

export const WindCompass: React.FC<WindCompassProps> = ({
  windSpeed,
  windDirection,
  windGust,
  className = '',
}) => {
  const getDirectionName = (degrees: number): string => {
    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getWindIntensity = (speed: number): string => {
    if (speed < 5) return 'light';
    if (speed < 15) return 'moderate';
    if (speed < 25) return 'strong';
    return 'severe';
  };

  return (
    <div className={`wind-compass-container ${className}`}>
      <div className="wind-compass-header">
        <h4>Wind</h4>
        <div className="wind-speed">
          {Math.round(windSpeed)} mph {getDirectionName(windDirection)}
          {windGust && windGust > windSpeed && (
            <span className="wind-gust">
              gusts to {Math.round(windGust)} mph
            </span>
          )}
        </div>
      </div>

      <div className="wind-compass">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Compass circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Cardinal directions */}
          <text
            x="60"
            y="15"
            textAnchor="middle"
            className="compass-direction"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            N
          </text>
          <text
            x="105"
            y="65"
            textAnchor="middle"
            className="compass-direction"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            E
          </text>
          <text
            x="60"
            y="110"
            textAnchor="middle"
            className="compass-direction"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            S
          </text>
          <text
            x="15"
            y="65"
            textAnchor="middle"
            className="compass-direction"
            fontSize="12"
            fill="rgba(255,255,255,0.7)"
          >
            W
          </text>

          {/* Wind direction arrow */}
          <g transform={`rotate(${windDirection} 60 60)`}>
            <path
              d="M 60 20 L 65 35 L 60 30 L 55 35 Z"
              fill="#60A5FA"
              className={`wind-arrow ${getWindIntensity(windSpeed)}`}
            />
            <line
              x1="60"
              y1="30"
              x2="60"
              y2="50"
              stroke="#60A5FA"
              strokeWidth="2"
              className={`wind-line ${getWindIntensity(windSpeed)}`}
            />
          </g>

          {/* Center dot */}
          <circle cx="60" cy="60" r="3" fill="rgba(255,255,255,0.8)" />
        </svg>
      </div>
    </div>
  );
};

interface UVIndexBarProps {
  uvIndex: number;
  className?: string;
}

export const UVIndexBar: React.FC<UVIndexBarProps> = ({
  uvIndex,
  className = '',
}) => {
  const getUVLevel = (
    index: number,
  ): { level: string; color: string; advice: string } => {
    if (index <= 2)
      return { level: 'Low', color: '#22C55E', advice: 'No protection needed' };
    if (index <= 5)
      return {
        level: 'Moderate',
        color: '#EAB308',
        advice: 'Some protection required',
      };
    if (index <= 7)
      return {
        level: 'High',
        color: '#F97316',
        advice: 'Protection essential',
      };
    if (index <= 10)
      return {
        level: 'Very High',
        color: '#EF4444',
        advice: 'Extra protection needed',
      };
    return { level: 'Extreme', color: '#A855F7', advice: 'Avoid sun exposure' };
  };

  const uvInfo = getUVLevel(uvIndex);
  const percentage = Math.min((uvIndex / 11) * 100, 100);

  return (
    <div className={`uv-index-container ${className}`}>
      <div className="uv-index-header">
        <h4>UV Index</h4>
        <div className="uv-level">
          <span className="uv-value">{Math.round(uvIndex)}</span>
          <span className="uv-level-text" style={{ color: uvInfo.color }}>
            {uvInfo.level}
          </span>
        </div>
      </div>

      <div className="uv-progress-bar">
        <div className="uv-progress-track">
          <div
            className="uv-progress-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: uvInfo.color,
            }}
          />
        </div>
        <div className="uv-scale">
          {[0, 2, 5, 7, 10, 11].map((mark, index) => (
            <div
              key={index}
              className="uv-scale-mark"
              style={{ left: `${(mark / 11) * 100}%` }}
            >
              <span className="uv-scale-number">{mark}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="uv-advice">{uvInfo.advice}</p>
    </div>
  );
};

interface PrecipitationChartProps {
  hourlyData: Array<{ time: string; precipitation: number }>;
  className?: string;
}

export const PrecipitationChart: React.FC<PrecipitationChartProps> = ({
  hourlyData,
  className = '',
}) => {
  if (!hourlyData || hourlyData.length === 0) return null;

  const maxPrecip = Math.max(...hourlyData.map(h => h.precipitation), 1);

  return (
    <div className={`precipitation-chart-container ${className}`}>
      <div className="precipitation-header">
        <h4>Precipitation Forecast</h4>
        <span className="precipitation-total">
          Next 12 hours:{' '}
          {hourlyData
            .slice(0, 12)
            .reduce((sum, h) => sum + h.precipitation, 0)
            .toFixed(1)}
          mm
        </span>
      </div>

      <div className="precipitation-chart">
        <div className="precipitation-bars">
          {hourlyData.slice(0, 12).map((hour, index) => {
            const height = (hour.precipitation / maxPrecip) * 100;
            const hasRain = hour.precipitation > 0;

            return (
              <div key={index} className="precipitation-bar-container">
                <div
                  className={`precipitation-bar ${hasRain ? 'has-rain' : ''}`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${hour.precipitation}mm at ${new Date(
                    hour.time,
                  ).toLocaleTimeString([], { hour: 'numeric' })}`}
                />
                <span className="precipitation-time">
                  {new Date(hour.time).toLocaleTimeString([], {
                    hour: 'numeric',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Air Quality Index component (future enhancement)
interface AirQualityProps {
  aqi?: number;
  className?: string;
}

export const AirQualityIndex: React.FC<AirQualityProps> = ({
  aqi = 50,
  className = '',
}) => {
  const getAQIInfo = (
    index: number,
  ): { level: string; color: string; advice: string } => {
    if (index <= 50)
      return {
        level: 'Good',
        color: '#22C55E',
        advice: 'Air quality is satisfactory',
      };
    if (index <= 100)
      return {
        level: 'Moderate',
        color: '#EAB308',
        advice: 'Acceptable for most people',
      };
    if (index <= 150)
      return {
        level: 'Unhealthy for Sensitive Groups',
        color: '#F97316',
        advice: 'Sensitive individuals should limit outdoor activity',
      };
    if (index <= 200)
      return {
        level: 'Unhealthy',
        color: '#EF4444',
        advice: 'Everyone should limit outdoor activity',
      };
    if (index <= 300)
      return {
        level: 'Very Unhealthy',
        color: '#A855F7',
        advice: 'Health alert: everyone may experience serious effects',
      };
    return {
      level: 'Hazardous',
      color: '#991B1B',
      advice: 'Emergency conditions: entire population affected',
    };
  };

  const aqiInfo = getAQIInfo(aqi);

  return (
    <div className={`air-quality-container ${className}`}>
      <div className="air-quality-header">
        <h4>Air Quality</h4>
        <div className="aqi-value">
          <span className="aqi-number">{aqi}</span>
          <span className="aqi-level" style={{ color: aqiInfo.color }}>
            {aqiInfo.level}
          </span>
        </div>
      </div>

      <div className="aqi-progress">
        <div className="aqi-progress-track">
          <div
            className="aqi-progress-fill"
            style={{
              width: `${Math.min((aqi / 300) * 100, 100)}%`,
              backgroundColor: aqiInfo.color,
            }}
          />
        </div>
      </div>

      <p className="aqi-advice">{aqiInfo.advice}</p>
    </div>
  );
};

export default {
  TemperatureTrend,
  WindCompass,
  UVIndexBar,
  PrecipitationChart,
  AirQualityIndex,
};
