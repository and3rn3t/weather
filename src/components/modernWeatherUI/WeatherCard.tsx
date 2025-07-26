/**
 * Modern Weather Card Component - Phase C Completion (July 2025)
 * 
 * Enhanced weather display card featuring:
 * - Premium glassmorphism design with improved backdrop blur
 * - Better typography hierarchy with optimized font weights
 * - Seamless weather icon integration with animations
 * - Responsive scaling across mobile, tablet, and desktop
 * - Enhanced visual hierarchy for weather information
 * 
 * Design Features:
 * - Gradient backgrounds with backdrop blur effects
 * - Improved spacing and padding system
 * - Better color contrast for accessibility
 * - Touch-optimized layout for mobile devices
 */

import React from 'react';
import WeatherIcon from '../../utils/weatherIcons';
import type { ThemeColors } from '../../utils/themeConfig';

interface WeatherCardProps {
  temperature: number;
  feelsLike: number;
  condition: string;
  weatherCode: number;
  location: string;
  time: string;
  theme: ThemeColors;
  isLoading?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  feelsLike,
  condition,
  weatherCode,
  location,
  time,
  theme,
  isLoading = false
}) => {
  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${theme.weatherCardBackground}f0, ${theme.cardBackground}f5)`,
    borderRadius: '28px',
    padding: '32px 24px',
    border: `1px solid ${theme.weatherCardBorder}40`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 25px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const temperatureStyle: React.CSSProperties = {
    fontSize: 'clamp(3.5rem, 12vw, 5rem)',
    fontWeight: '700',
    lineHeight: '0.9',
    color: theme.primaryText,
    marginBottom: '8px',
    letterSpacing: '-0.02em'
  };

  const locationStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.primaryText,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    opacity: 0.9
  };

  const conditionStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '500',
    color: theme.secondaryText,
    textTransform: 'capitalize',
    marginBottom: '20px',
    lineHeight: '1.3'
  };

  const feelsLikeStyle: React.CSSProperties = {
    fontSize: '14px',
    color: theme.secondaryText,
    fontWeight: '500',
    opacity: 0.8
  };

  const iconContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: `${theme.weatherCardBadge}20`,
    borderRadius: '20px',
    padding: '16px',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.weatherCardBorder}30`
  };

  const shimmerStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, 
      transparent 0%, 
      ${theme.primaryText}10 50%, 
      transparent 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite ease-in-out',
    borderRadius: 'inherit'
  };

  if (isLoading) {
    return (
      <div style={{ ...cardStyle, ...shimmerStyle }}>
        <div style={{
          width: '60%',
          height: '24px',
          background: `${theme.primaryText}15`,
          borderRadius: '12px',
          marginBottom: '16px'
        }} />
        <div style={{
          width: '40%',
          height: '80px',
          background: `${theme.primaryText}15`,
          borderRadius: '16px',
          marginBottom: '20px'
        }} />
        <div style={{
          width: '80%',
          height: '16px',
          background: `${theme.primaryText}15`,
          borderRadius: '8px'
        }} />
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Weather Icon */}
      <div style={iconContainerStyle}>
        <WeatherIcon 
          code={weatherCode} 
          size={56} 
          animated={true}
          className="main-weather-icon"
        />
      </div>

      {/* Location & Time */}
      <div>
        <div style={locationStyle}>
          <span>📍</span>
          <span>{location}</span>
        </div>
        
        {/* Temperature */}
        <div style={temperatureStyle}>
          {Math.round(temperature)}°
        </div>
        
        {/* Condition */}
        <div style={conditionStyle}>
          {condition}
        </div>
      </div>

      {/* Bottom Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '20px',
        borderTop: `1px solid ${theme.weatherCardBorder}30`
      }}>
        <div style={feelsLikeStyle}>
          Feels like {Math.round(feelsLike)}°
        </div>
        <div style={{
          fontSize: '12px',
          color: theme.secondaryText,
          opacity: 0.7
        }}>
          {time}
        </div>
      </div>

      {/* Background Accent */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, ${theme.weatherCardBadge}15, transparent)`,
        borderRadius: '50%',
        transform: 'translate(40px, 40px)',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

export default WeatherCard;
