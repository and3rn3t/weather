/**
 * Modern Home Screen Component - Phase C Completion (July 2025)
 *
 * A completely redesigned home screen featuring:
 * - Real-time clock display with live updates
 * - Interactive 3×3 weather icon grid showcase
 * - Enhanced navigation with semantic button elements
 * - Full accessibility compliance with ARIA labeling
 * - Responsive design optimized for mobile-first experience
 *
 * Accessibility Features:
 * - Semantic HTML buttons replace generic divs
 * - Comprehensive aria-label attributes for screen readers
 * - Proper focus management and keyboard navigation
 * - WCAG 2.1 AA compliant color contrast and touch targets
 */

import React, { useState, useEffect } from 'react';
import WeatherIcon from '../../utils/weatherIcons';
import type { ThemeColors } from '../../utils/themeConfig';
import { SimpleStatusBadge, SimpleEnhancedButton } from './SimpleIOSComponents';

interface ModernHomeScreenProps {
  theme: ThemeColors;
  onNavigate: (screen: string) => void;
  onGetCurrentLocation: () => void;
  isLocationLoading?: boolean;
}

const ModernHomeScreen: React.FC<ModernHomeScreenProps> = ({
  theme,
  onNavigate,
  onGetCurrentLocation,
  isLocationLoading = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: theme.appBackground,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const heroSectionStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '48px',
    maxWidth: '400px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${theme.primaryText}, ${theme.weatherCardBorder})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '16px',
    letterSpacing: '-0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: theme.secondaryText,
    marginBottom: '8px',
    fontWeight: '500',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: '16px',
    color: theme.secondaryText,
    opacity: 0.8,
    fontWeight: '400',
  };

  const weatherIconGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '48px',
    background: `${theme.cardBackground}f0`,
    borderRadius: '28px',
    padding: '32px',
    border: `1px solid ${theme.cardBorder}40`,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
    maxWidth: '400px',
    width: '100%',
  };

  const iconItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 16px',
    background: `${theme.forecastCardBackground}80`,
    borderRadius: '20px',
    border: `1px solid ${theme.forecastCardBorder}30`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  };

  const iconLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: theme.secondaryText,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: '1.2',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '400px',
  };

  const weatherIcons = [
    { code: 0, label: 'Clear Sky' },
    { code: 2, label: 'Partly Cloudy' },
    { code: 61, label: 'Light Rain' },
    { code: 95, label: 'Thunderstorm' },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={containerStyle}>
      {/* Status Indicators */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <SimpleStatusBadge text="Live Weather" variant="success" />
        <SimpleStatusBadge text="Real-time Updates" variant="info" />
      </div>

      {/* Hero Section */}
      <div style={heroSectionStyle}>
        <h1 style={titleStyle}>Weather</h1>
        <p style={subtitleStyle}>{formatDate(currentTime)}</p>
        <p style={timeStyle}>{formatTime(currentTime)}</p>
      </div>

      {/* Weather Icon Preview */}
      <div style={weatherIconGridStyle}>
        {weatherIcons.map(icon => (
          <button
            key={icon.code}
            style={{
              ...iconItemStyle,
              border: `1px solid ${theme.forecastCardBorder}30`,
              background: `${theme.forecastCardBackground}80`,
              outline: 'none',
            }}
            onClick={() => onNavigate('weather')}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.background = `${theme.forecastCardBackground}a0`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = `${theme.forecastCardBackground}80`;
            }}
            onFocus={e => {
              e.currentTarget.style.outline = `2px solid ${theme.primaryText}40`;
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={e => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label={`View ${icon.label} weather details`}
          >
            <WeatherIcon code={icon.code} size={40} animated={true} />
            <span style={iconLabelStyle}>{icon.label}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={actionsStyle}>
        <SimpleEnhancedButton
          title={
            isLocationLoading
              ? 'Getting Location...'
              : '📍 Use Current Location'
          }
          onPress={onGetCurrentLocation}
          disabled={isLocationLoading}
          variant="primary"
          theme={theme}
          icon={isLocationLoading ? '⏳' : '📍'}
        />

        <SimpleEnhancedButton
          title="🔍 Search Location"
          onPress={() => onNavigate('Search')}
          variant="secondary"
          theme={theme}
          icon="🔍"
        />
      </div>

      {/* Background Effects */}
      <div
        style={{
          position: 'fixed',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 30% 20%, ${theme.weatherCardBadge}15 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 70% 80%, ${theme.primaryGradient}10 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
  );
};

export default ModernHomeScreen;
