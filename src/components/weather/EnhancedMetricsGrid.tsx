/**
 * EnhancedMetricsGrid - Organized grid for all weather metrics
 * Displays comprehensive weather data in an organized grid layout
 */

import React from 'react';
import { CloudCoverDisplay } from './CloudCoverDisplay';
import { PrecipitationProbability } from './PrecipitationProbability';
import { WindGustDisplay } from './WindGustDisplay';
import './weather-components.css';

interface EnhancedMetricsGridProps {
  cloudcover?: number;
  precipitation?: number;
  precipitationProbability?: number;
  windSpeed: number;
  windGusts?: number;
  pressure?: number;
  uvIndex?: number;
  visibility?: number;
  units?: 'imperial' | 'metric';
  className?: string;
}

export const EnhancedMetricsGrid: React.FC<EnhancedMetricsGridProps> = ({
  cloudcover,
  precipitation,
  precipitationProbability,
  windSpeed,
  windGusts,
  pressure,
  uvIndex,
  visibility,
  units = 'imperial',
  className = '',
}) => {
  const formatVisibility = (vis: number): string => {
    if (units === 'imperial') {
      const miles = vis / 1609.34;
      return `${miles.toFixed(1)} mi`;
    }
    const km = vis / 1000;
    return `${km.toFixed(1)} km`;
  };

  const getUVIndexCategory = (uv: number): { label: string; color: string } => {
    if (uv < 3) return { label: 'Low', color: '#4CAF50' };
    if (uv < 6) return { label: 'Moderate', color: '#FFC107' };
    if (uv < 8) return { label: 'High', color: '#FF9800' };
    if (uv < 11) return { label: 'Very High', color: '#F44336' };
    return { label: 'Extreme', color: '#9C27B0' };
  };

  return (
    <div className={`enhanced-metrics-grid ${className}`}>
      {cloudcover !== undefined && (
        <div className="metric-item">
          <CloudCoverDisplay cloudcover={cloudcover} />
        </div>
      )}

      {(precipitationProbability !== undefined ||
        precipitation !== undefined) && (
        <div className="metric-item">
          <PrecipitationProbability
            probability={precipitationProbability || 0}
            precipitation={precipitation}
          />
        </div>
      )}

      <div className="metric-item">
        <WindGustDisplay
          windSpeed={windSpeed}
          windGusts={windGusts}
          units={units}
        />
      </div>

      {pressure !== undefined && (
        <div className="metric-item metric-card">
          <div className="metric-header">
            <span className="metric-label">Pressure</span>
            <span className="metric-value">{Math.round(pressure)} hPa</span>
          </div>
        </div>
      )}

      {uvIndex !== undefined && (
        <div className="metric-item metric-card">
          <div className="metric-header">
            <span className="metric-label">UV Index</span>
            <span className="metric-value">{uvIndex.toFixed(1)}</span>
          </div>
          <div
            className="metric-indicator"
            style={{
              color: getUVIndexCategory(uvIndex).color,
            }}
          >
            {getUVIndexCategory(uvIndex).label}
          </div>
        </div>
      )}

      {visibility !== undefined && (
        <div className="metric-item metric-card">
          <div className="metric-header">
            <span className="metric-label">Visibility</span>
            <span className="metric-value">{formatVisibility(visibility)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMetricsGrid;
