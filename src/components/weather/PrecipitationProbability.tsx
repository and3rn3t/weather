/**
 * PrecipitationProbability - Probability bars/charts for precipitation
 * Displays precipitation probability with visual bars
 */

import React from 'react';
import './weather-components.css';

interface PrecipitationProbabilityProps {
  probability: number; // 0-100 percentage
  precipitation?: number; // Amount in mm
  className?: string;
}

export const PrecipitationProbability: React.FC<
  PrecipitationProbabilityProps
> = ({ probability, precipitation, className = '' }) => {
  const getProbabilityColor = (prob: number): string => {
    if (prob < 20) return '#4CAF50'; // Green - low
    if (prob < 50) return '#FFC107'; // Amber - moderate
    if (prob < 80) return '#FF9800'; // Orange - high
    return '#F44336'; // Red - very high
  };

  const getProbabilityLabel = (prob: number): string => {
    if (prob < 20) return 'Low';
    if (prob < 50) return 'Moderate';
    if (prob < 80) return 'High';
    return 'Very High';
  };

  return (
    <div className={`precipitation-probability ${className}`}>
      <div className="precipitation-header">
        <span className="precipitation-label">Precipitation</span>
        <span className="precipitation-prob-value">
          {Math.round(probability)}%
        </span>
      </div>
      <div className="precipitation-bar-container">
        <div
          className="precipitation-bar"
          style={{
            width: `${probability}%`,
            backgroundColor: getProbabilityColor(probability),
          }}
        />
      </div>
      <div className="precipitation-details">
        <span className="precipitation-label-text">
          {getProbabilityLabel(probability)} chance
        </span>
        {precipitation !== undefined && precipitation > 0 && (
          <span className="precipitation-amount">
            {precipitation.toFixed(1)} mm
          </span>
        )}
      </div>
    </div>
  );
};

export default PrecipitationProbability;
