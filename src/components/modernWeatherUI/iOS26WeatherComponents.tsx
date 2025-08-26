/**
 * iOS 26 Weather Components - Subcomponents for Weather Interface
 */
import * as React from 'react';
import WeatherIcon from '../../utils/weatherIcons';

interface WeatherMetricProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export const iOS26WeatherMetric: React.FC<WeatherMetricProps> = ({
  label,
  value,
  icon,
  color,
  subtitle,
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

export const iOS26ForecastItem: React.FC<{
  time: string;
  temperature: number | { high: number; low: number };
  weatherCode: number;
  precipitation?: number;
  isDaily?: boolean;
}> = ({
  time,
  temperature,
  weatherCode,
  precipitation,
  isDaily: _isDaily = false,
}) => {
  return (
    <div className="ios26-forecast-item">
      <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
        {time}
      </div>

      <div className="ios26-forecast-icon">
        <WeatherIcon code={weatherCode} size={28} animated={true} />
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
