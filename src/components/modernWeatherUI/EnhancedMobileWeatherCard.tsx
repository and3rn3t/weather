/**
 * Enhanced Mobile Weather Card Component
 *
 * A mobile-optimized weather display card with:
 * - Large touch-friendly layout
 * - Improved typography for mobile screens
 * - Better spacing and visual hierarchy
 * - Smooth animations
 * - Accessibility enhancements
 */

import React from 'react';
import {
  formatPressure,
  formatVisibility,
  formatWindSpeed,
  getStoredUnits,
  getTemperatureSymbol,
} from '../../utils/units';
import { useTheme } from '../../utils/useTheme';
import WeatherIcon from '../../utils/weatherIcons';

interface EnhancedMobileWeatherCardProps {
  weatherData: {
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
    };
    weather: {
      description: string;
    }[];
    wind: {
      speed: number;
      deg: number;
    };
    uv_index?: number;
    visibility?: number;
  };
  locationName: string;
  className?: string;
}

const EnhancedMobileWeatherCard: React.FC<EnhancedMobileWeatherCardProps> = ({
  weatherData,
  locationName,
  className = '',
}) => {
  const { theme } = useTheme();

  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${theme.weatherCardBackground}f0, ${theme.weatherCardBackground}e0)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.weatherCardBorder}40`,
    borderRadius: '20px',
    padding: '24px',
    margin: '16px 0',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const locationStyle: React.CSSProperties = {
    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
    fontWeight: '700',
    color: theme.primaryText,
    margin: 0,
    lineHeight: 1.2,
    flex: 1,
    minWidth: '0', // Allow text truncation
  };

  const weatherIconStyle: React.CSSProperties = {
    fontSize: 'clamp(2rem, 8vw, 3rem)',
    flexShrink: 0,
  };

  const temperatureStyle: React.CSSProperties = {
    fontSize: 'clamp(3rem, 12vw, 4rem)',
    fontWeight: '800',
    color: theme.primaryText,
    margin: '16px 0',
    lineHeight: 1,
    textAlign: 'center',
  };

  const _descriptionStyle: React.CSSProperties = {
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
    color: theme.secondaryText,
    textAlign: 'center',
    marginBottom: '24px',
    textTransform: 'capitalize',
    fontWeight: '500',
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '20px',
  };

  const metricItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: theme.secondaryText,
    marginBottom: '4px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const metricValueStyle: React.CSSProperties = {
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
    fontWeight: '700',
    color: theme.primaryText,
    lineHeight: 1.2,
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // visibility formatting handled via units utils

  const getUVIndexLabel = (uvIndex: number): string => {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  };

  const units = getStoredUnits();
  const metrics = [
    {
      label: 'Feels Like',
      value: `${Math.round(weatherData.main.feels_like)}${getTemperatureSymbol(units)}`,
      icon: '🌡️',
    },
    {
      label: 'Humidity',
      value: `${weatherData.main.humidity}%`,
      icon: '💧',
    },
    {
      label: 'Wind',
      value: `${formatWindSpeed(weatherData.wind.speed, units)} ${getWindDirection(weatherData.wind.deg)}`,
      icon: '💨',
    },
    {
      label: 'Pressure',
      value: formatPressure(weatherData.main.pressure, units),
      icon: '🌪️',
    },
  ];

  // Add UV Index if available
  if (weatherData.uv_index !== undefined) {
    metrics.push({
      label: 'UV Index',
      value: `${weatherData.uv_index} (${getUVIndexLabel(weatherData.uv_index)})`,
      icon: '☀️',
    });
  }

  // Add Visibility if available
  if (weatherData.visibility !== undefined) {
    metrics.push({
      label: 'Visibility',
      value: formatVisibility(weatherData.visibility, units),
      icon: '👁️',
    });
  }

  return (
    <div className={`mobile-card-enhanced ${className}`} style={cardStyle}>
      {/* Background pattern overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, ${theme.primaryGradient}10, transparent 50%),
            radial-gradient(circle at 80% 80%, ${theme.weatherCardBorder}10, transparent 50%)
          `,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header with location and weather icon */}
        <header style={headerStyle}>
          <h2 style={locationStyle}>{locationName}</h2>
          <div style={weatherIconStyle}>
            <WeatherIcon
              code={0} // Default sunny weather code
              size={48}
            />
          </div>
        </header>

        {/* Main temperature display */}
        <div style={temperatureStyle}>
          {Math.round(weatherData.main.temp)}
          {getTemperatureSymbol(units)}
        </div>
        <section style={metricsGridStyle} aria-label="Weather details">
          {metrics.map((metric, index) => (
            <div key={index} style={metricItemStyle}>
              <span style={{ fontSize: '16px', marginBottom: '4px' }}>
                {metric.icon}
              </span>
              <div style={metricLabelStyle}>{metric.label}</div>
              <div style={metricValueStyle}>{metric.value}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default EnhancedMobileWeatherCard;
