/**
 * Smart Weather Skeleton - Optimized Loading States
 *
 * Provides intelligent skeleton screens that match the actual content structure
 * with progressive loading and reduced layout shift
 */

import React from 'react';
import './SmartWeatherSkeleton.css';

interface SmartWeatherSkeletonProps {
  variant: 'current' | 'hourly' | 'daily' | 'metrics';
  count?: number;
  showPulse?: boolean;
  className?: string;
}

export const SmartWeatherSkeleton: React.FC<SmartWeatherSkeletonProps> = ({
  variant,
  count = 1,
  showPulse = true,
  className = '',
}) => {
  const skeletonClass = `smart-skeleton ${
    showPulse ? 'pulse' : 'shimmer'
  } ${className}`;

  const renderCurrentWeather = () => (
    <div className={`${skeletonClass} current-weather-skeleton`}>
      <div className="skeleton-location" />
      <div className="skeleton-icon-large" />
      <div className="skeleton-temperature" />
      <div className="skeleton-condition" />
      <div className="skeleton-feels-like" />
    </div>
  );

  const renderHourlyForecast = () => (
    <div className={`${skeletonClass} hourly-forecast-skeleton`}>
      <div className="skeleton-title" />
      <div className="skeleton-scroll-container">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-hourly-item">
            <div className="skeleton-time" />
            <div className="skeleton-icon-small" />
            <div className="skeleton-temp-value" />
            <div className="skeleton-humidity" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderDailyForecast = () => (
    <div className={`${skeletonClass} daily-forecast-skeleton`}>
      <div className="skeleton-title" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-daily-item">
          <div className="skeleton-day-info">
            <div className="skeleton-day-name" />
            <div className="skeleton-date" />
          </div>
          <div className="skeleton-icon-medium" />
          <div className="skeleton-temp-range">
            <div className="skeleton-temp-high" />
            <div className="skeleton-temp-low" />
          </div>
          <div className="skeleton-precipitation" />
        </div>
      ))}
    </div>
  );

  const renderMetrics = () => (
    <div className={`${skeletonClass} metrics-skeleton`}>
      <div className="skeleton-metrics-grid">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-metric-item">
            <div className="skeleton-metric-icon" />
            <div className="skeleton-metric-value" />
            <div className="skeleton-metric-label" />
          </div>
        ))}
      </div>
    </div>
  );

  switch (variant) {
    case 'current':
      return renderCurrentWeather();
    case 'hourly':
      return renderHourlyForecast();
    case 'daily':
      return renderDailyForecast();
    case 'metrics':
      return renderMetrics();
    default:
      return null;
  }
};

export default SmartWeatherSkeleton;
