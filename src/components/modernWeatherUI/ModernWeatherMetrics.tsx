/**
 * Modern Weather Metrics Component - Phase C Completion (July 2025)
 * 
 * Grid-based weather metrics display featuring:
 * - Semantic section elements with proper ARIA relationships
 * - Responsive CSS Grid layout for optimal metric display
 * - Conditional display of available metrics (UV, visibility)
 * - Enhanced visual design with improved spacing
 * - Full theme integration with dark/light mode support
 * 
 * Accessibility Features:
 * - Semantic section elements with aria-labelledby attributes
 * - Descriptive headings for each metric section
 * - Proper semantic relationships between labels and values
 * - Screen reader compatible structure
 * - Stable component keys for React optimization
 */

import React from 'react';
import type { ThemeColors } from '../../utils/themeConfig';

interface WeatherMetric {
  id: string;
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

interface ModernWeatherMetricsProps {
  theme: ThemeColors;
  metrics: WeatherMetric[];
  isLoading?: boolean;
}

const ModernWeatherMetrics: React.FC<ModernWeatherMetricsProps> = ({
  theme,
  metrics,
  isLoading = false
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    width: '100%'
  };

  const metricCardStyle: React.CSSProperties = {
    background: `${theme.forecastCardBackground}f0`,
    borderRadius: '20px',
    padding: '24px 20px',
    border: `1px solid ${theme.forecastCardBorder}40`,
    backdropFilter: 'blur(15px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const iconContainerStyle: React.CSSProperties = {
    fontSize: '24px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.primaryText,
    lineHeight: '1',
    marginBottom: '4px'
  };

  const subValueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: theme.secondaryText,
    fontWeight: '500',
    opacity: 0.8
  };

  const trendIconStyle: React.CSSProperties = {
    fontSize: '16px',
    opacity: 0.7
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const shimmerStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, 
      transparent 0%, 
      ${theme.primaryText}10 50%, 
      transparent 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite ease-in-out'
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={`metric-skeleton-${index}`} style={{ ...metricCardStyle, ...shimmerStyle }}>
            <div style={{
              width: '60%',
              height: '12px',
              background: `${theme.primaryText}15`,
              borderRadius: '6px',
              marginBottom: '12px'
            }} />
            <div style={{
              width: '80%',
              height: '32px',
              background: `${theme.primaryText}15`,
              borderRadius: '8px',
              marginBottom: '8px'
            }} />
            <div style={{
              width: '40%',
              height: '14px',
              background: `${theme.primaryText}15`,
              borderRadius: '7px'
            }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {metrics.map((metric) => (
        <section
          key={metric.id}
          style={metricCardStyle}
          aria-labelledby={`metric-${metric.id}-label`}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = `${theme.weatherCardBorder}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = `${theme.forecastCardBorder}40`;
          }}
        >
          <div>
            <div style={iconContainerStyle}>
              <span>{metric.icon}</span>
              {metric.trend && (
                <span style={trendIconStyle}>
                  {getTrendIcon(metric.trend)}
                </span>
              )}
            </div>
            
            <div style={labelStyle} id={`metric-${metric.id}-label`}>
              {metric.label}
            </div>
          </div>

          <div>
            <div style={valueStyle}>
              {metric.value}
              {metric.unit && (
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  opacity: 0.7,
                  marginLeft: '2px'
                }}>
                  {metric.unit}
                </span>
              )}
            </div>
            
            {metric.subValue && (
              <div style={subValueStyle}>
                {metric.subValue}
              </div>
            )}
          </div>

          {/* Background accent */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-20px',
            width: '60px',
            height: '60px',
            background: `${theme.weatherCardBadge}15`,
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
        </section>
      ))}
    </div>
  );
};

export default ModernWeatherMetrics;
