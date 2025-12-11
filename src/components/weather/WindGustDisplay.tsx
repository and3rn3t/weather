/**
 * WindGustDisplay - Wind gust visualization
 * Displays wind gusts with visual indicators
 */

import React from 'react';
import './weather-components.css';

interface WindGustDisplayProps {
  windSpeed: number; // Regular wind speed
  windGusts?: number; // Wind gusts
  units?: 'imperial' | 'metric';
  className?: string;
}

export const WindGustDisplay: React.FC<WindGustDisplayProps> = ({
  windSpeed,
  windGusts,
  units = 'imperial',
  className = '',
}) => {
  const formatWindSpeed = (speed: number): string => {
    if (units === 'imperial') {
      return `${Math.round(speed)} mph`;
    }
    return `${Math.round(speed)} km/h`;
  };

  const getGustIntensity = (gusts: number, speed: number): string => {
    const ratio = gusts / speed;
    if (ratio < 1.2) return 'Light';
    if (ratio < 1.5) return 'Moderate';
    if (ratio < 2.0) return 'Strong';
    return 'Very Strong';
  };

  if (!windGusts || windGusts <= windSpeed) {
    return (
      <div className={`wind-gust-display ${className}`}>
        <div className="wind-gust-header">
          <span className="wind-gust-label">Wind Speed</span>
          <span className="wind-gust-value">{formatWindSpeed(windSpeed)}</span>
        </div>
      </div>
    );
  }

  const gustIntensity = getGustIntensity(windGusts, windSpeed);
  const gustPercentage = Math.min(100, (windGusts / windSpeed) * 50);

  return (
    <div className={`wind-gust-display ${className}`}>
      <div className="wind-gust-header">
        <span className="wind-gust-label">Wind Gusts</span>
        <span className="wind-gust-value">{formatWindSpeed(windGusts)}</span>
      </div>
      <div className="wind-gust-comparison">
        <div className="wind-speed-bar">
          <div className="wind-speed-label">
            Base: {formatWindSpeed(windSpeed)}
          </div>
        </div>
        <div className="wind-gust-bar-container">
          <div
            className="wind-gust-bar"
            style={{
              width: `${gustPercentage}%`,
            }}
          />
        </div>
        <div className="wind-gust-intensity">{gustIntensity} gusts</div>
      </div>
    </div>
  );
};

export default WindGustDisplay;
