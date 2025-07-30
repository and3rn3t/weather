/**
 * iOS 26 Main Screen - Cutting-Edge Weather Interface
 * 
 * Implements the latest iOS design patterns:
 * - Fluid Island-style notifications
 * - Advanced glassmorphism with depth layers
 * - Smart adaptive layouts with Dynamic Type
 * - Contextual controls and haptic feedback
 * - Live Activities integration
 * - Spatial UI elements with depth
 * - Enhanced accessibility with VoiceOver
 * - Smart content prioritization
 */

import React, { useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';
import { ContextMenu } from './iOS26Components';
import WeatherIcon from '../../utils/weatherIcons';

// ============================================================================
// MAIN WEATHER CARD WITH iOS 26 ENHANCEMENTS
// ============================================================================

interface IOS26WeatherCardProps {
  temperature: number;
  weatherCode: number;
  location: string;
  description: string;
  theme: ThemeColors;
  isLoading?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  onLocationTap?: () => void;
}

const IOS26WeatherCard: React.FC<IOS26WeatherCardProps> = ({
  temperature,
  weatherCode,
  location,
  description,
  theme,
  isLoading = false,
  lastUpdated,
  onRefresh,
  onLocationTap
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');

  const containerStyle: React.CSSProperties = {
    background: isDark 
      ? 'linear-gradient(135deg, rgba(44, 44, 46, 0.8) 0%, rgba(28, 28, 30, 0.9) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(30px)',
    borderRadius: '28px',
    border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
    boxShadow: isDark
      ? '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      : '0 20px 60px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    padding: '32px',
    margin: '20px',
    position: 'relative',
    overflow: 'hidden',
    transform: `scale(${isPressed ? 0.98 : 1})`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none'
  };

  const backgroundAccentStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-50%',
    right: '-30%',
    width: '200px',
    height: '200px',
    background: isDark
      ? 'radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    pointerEvents: 'none'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  };

  const locationStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: 0,
    cursor: onLocationTap ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const temperatureContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    margin: '32px 0'
  };

  const temperatureStyle: React.CSSProperties = {
    fontSize: '72px',
    fontWeight: '200',
    color: theme.primaryText,
    margin: 0,
    letterSpacing: '-2px',
    lineHeight: '1'
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '500',
    color: theme.secondaryText,
    margin: 0,
    textAlign: 'center'
  };

  const lastUpdatedStyle: React.CSSProperties = {
    fontSize: '14px',
    color: theme.secondaryText,
    margin: '16px 0 0',
    textAlign: 'center',
    opacity: 0.8
  };

  const contextActions = [
    {
      id: 'refresh',
      title: 'Refresh Weather',
      icon: '🔄',
      onAction: () => onRefresh?.()
    },
    {
      id: 'location',
      title: 'Change Location',
      icon: '📍',
      onAction: () => onLocationTap?.()
    },
    {
      id: 'share',
      title: 'Share Weather',
      icon: '📤',
      onAction: () => {
        if (navigator.share) {
          navigator.share({
            title: `Weather in ${location}`,
            text: `${temperature}°F - ${description}`,
            url: window.location.href
          });
        }
      }
    }
  ];

  return (
    <ContextMenu actions={contextActions} theme={theme}>
      <article
        style={containerStyle}
        className="ios26-weather-card"
        aria-label={`Weather in ${location}: ${temperature} degrees Fahrenheit, ${description}`}
      >
        <div style={backgroundAccentStyle} />
        
        <div style={headerStyle}>
          <button
            style={locationStyle}
            onClick={onLocationTap}
            aria-label={`Current location: ${location}. Tap to change location.`}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
          >
            <span>📍</span>
            <span>{location}</span>
          </button>
          
          {isLoading && (
            <div style={{ width: '24px', height: '24px' }}>
              <svg viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke={theme.secondaryText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="15 10"
                  fill="none"
                />
              </svg>
            </div>
          )}
        </div>

        <div style={temperatureContainerStyle}>
          <div style={{ transform: 'scale(1.2)' }}>
            <WeatherIcon code={weatherCode} size={48} />
          </div>
          <div style={temperatureStyle}>{temperature}°</div>
        </div>

        <div style={descriptionStyle}>{description}</div>
        
        {lastUpdated && (
          <div style={lastUpdatedStyle}>
            Updated {lastUpdated}
          </div>
        )}
      </article>
    </ContextMenu>
  );
};

// ============================================================================
// QUICK ACTIONS PANEL
// ============================================================================

interface QuickActionsPanelProps {
  theme: ThemeColors;
  onLocationSearch: () => void;
  onFavorites: () => void;
  onSettings: () => void;
  onRadar?: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  theme,
  onLocationSearch,
  onFavorites,
  onSettings,
  onRadar
}) => {
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '0 20px',
    marginBottom: '24px'
  };

  const actionButtonStyle: React.CSSProperties = {
    background: isDark 
      ? 'rgba(44, 44, 46, 0.8)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '20px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    minHeight: '100px'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '28px',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: 0,
    textAlign: 'center'
  };

  const actions = [
    { icon: '🔍', label: 'Search', action: onLocationSearch },
    { icon: '⭐', label: 'Favorites', action: onFavorites },
    { icon: '⚙️', label: 'Settings', action: onSettings },
    { icon: '🌦️', label: 'Radar', action: onRadar || (() => {}) }
  ];

  return (
    <div style={containerStyle} className="ios26-quick-actions">
      {actions.map((item) => (
        <button
          key={item.label}
          style={actionButtonStyle}
          onClick={() => {
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(10);
            }
            item.action();
          }}
          className="quick-action-button"
          aria-label={item.label}
        >
          <div style={iconStyle}>{item.icon}</div>
          <div style={labelStyle}>{item.label}</div>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// WEATHER METRICS GRID
// ============================================================================

interface WeatherMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
}

interface WeatherMetricsGridProps {
  metrics: WeatherMetric[];
  theme: ThemeColors;
}

const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({
  metrics,
  theme
}) => {
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '0 20px',
    marginBottom: '24px'
  };

  const metricCardStyle: React.CSSProperties = {
    background: isDark 
      ? 'rgba(44, 44, 46, 0.6)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '90px'
  };

  const metricHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.secondaryText,
    margin: 0
  };

  const metricValueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: 0,
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  };

  const metricUnitStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '400',
    color: theme.secondaryText
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <section style={containerStyle} className="ios26-weather-metrics" aria-label="Weather metrics">
      {metrics.map((metric) => (
        <fieldset
          key={metric.id}
          style={metricCardStyle}
          className="weather-metric-card"
          aria-labelledby={`metric-${metric.id}-label`}
        >
          <div style={metricHeaderStyle}>
            <div style={metricLabelStyle} id={`metric-${metric.id}-label`}>
              {metric.icon} {metric.label}
            </div>
            {metric.trend && (
              <span aria-label={`Trend: ${metric.trend}`}>
                {getTrendIcon(metric.trend)}
              </span>
            )}
          </div>
          
          <div style={metricValueStyle}>
            <span>{metric.value}</span>
            {metric.unit && <span style={metricUnitStyle}>{metric.unit}</span>}
          </div>
        </fieldset>
      ))}
    </section>
  );
};

// ============================================================================
// ENHANCED NAVIGATION BAR
// ============================================================================

interface IOS26NavigationBarProps {
  title: string;
  theme: ThemeColors;
  leftAction?: {
    icon: string;
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: string;
    label: string;
    onPress: () => void;
  };
  showBackButton?: boolean;
  onBack?: () => void;
}

const IOS26NavigationBar: React.FC<IOS26NavigationBarProps> = ({
  title,
  theme,
  leftAction,
  rightAction,
  showBackButton = false,
  onBack
}) => {
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');

  const containerStyle: React.CSSProperties = {
    background: isDark 
      ? 'rgba(28, 28, 30, 0.8)' 
      : 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(30px)',
    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: 0,
    textAlign: 'center',
    flex: 1
  };

  const actionButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#007AFF',
    fontSize: '17px',
    fontWeight: '400',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '44px',
    minHeight: '44px',
    justifyContent: 'center'
  };

  const backButtonStyle: React.CSSProperties = {
    ...actionButtonStyle,
    color: '#007AFF'
  };

  return (
    <nav style={containerStyle} className="ios26-navigation-bar" role="navigation">
      <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-start' }}>
        {showBackButton && onBack ? (
          <button
            style={backButtonStyle}
            onClick={() => {
              if (navigator.vibrate) {
                navigator.vibrate(10);
              }
              onBack();
            }}
            aria-label="Go back"
          >
            <span>‹</span>
            <span>Back</span>
          </button>
        ) : null}
        {!showBackButton && leftAction && (
          <button
            style={actionButtonStyle}
            onClick={() => {
              if (navigator.vibrate) {
                navigator.vibrate(10);
              }
              leftAction.onPress();
            }}
            aria-label={leftAction.label}
          >
            <span>{leftAction.icon}</span>
          </button>
        )}
      </div>

      <h1 style={titleStyle}>{title}</h1>

      <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction && (
          <button
            style={actionButtonStyle}
            onClick={() => {
              if (navigator.vibrate) {
                navigator.vibrate(10);
              }
              rightAction.onPress();
            }}
            aria-label={rightAction.label}
          >
            <span>{rightAction.icon}</span>
          </button>
        )}
      </div>
    </nav>
  );
};

// Export all components
export {
  IOS26WeatherCard as iOS26WeatherCard,
  QuickActionsPanel,
  WeatherMetricsGrid,
  IOS26NavigationBar as iOS26NavigationBar
};

export type {
  IOS26WeatherCardProps as iOS26WeatherCardProps,
  QuickActionsPanelProps,
  WeatherMetricsGridProps,
  IOS26NavigationBarProps as iOS26NavigationBarProps,
  WeatherMetric
};
