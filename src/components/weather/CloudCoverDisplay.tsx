/**
 * CloudCoverDisplay - Visual cloud coverage indicator
 * Displays cloud cover percentage with visual representation
 */

import React from 'react';
import './weather-components.css';

interface CloudCoverDisplayProps {
  cloudcover: number; // 0-100 percentage
  className?: string;
}

export const CloudCoverDisplay: React.FC<CloudCoverDisplayProps> = ({
  cloudcover,
  className = '',
}) => {
  const getCloudCoverLabel = (cover: number): string => {
    if (cover < 10) return 'Clear';
    if (cover < 25) return 'Mostly Clear';
    if (cover < 50) return 'Partly Cloudy';
    if (cover < 75) return 'Mostly Cloudy';
    return 'Overcast';
  };

  const getCloudCoverColor = (cover: number): string => {
    if (cover < 10) return '#87CEEB'; // Sky blue
    if (cover < 25) return '#B0C4DE'; // Light steel blue
    if (cover < 50) return '#D3D3D3'; // Light gray
    if (cover < 75) return '#A9A9A9'; // Dark gray
    return '#696969'; // Dim gray
  };

  return (
    <div className={`cloud-cover-display ${className}`}>
      <div className="cloud-cover-header">
        <span className="cloud-cover-label">Cloud Cover</span>
        <span className="cloud-cover-value">{Math.round(cloudcover)}%</span>
      </div>
      <div className="cloud-cover-bar-container">
        <div
          className="cloud-cover-bar"
          style={{
            width: `${cloudcover}%`,
            backgroundColor: getCloudCoverColor(cloudcover),
          }}
        />
      </div>
      <div className="cloud-cover-description">
        {getCloudCoverLabel(cloudcover)}
      </div>
    </div>
  );
};

export default CloudCoverDisplay;

