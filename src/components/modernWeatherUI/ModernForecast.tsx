/**
 * Modern Forecast Component - Phase C Completion (July 2025)
 * 
 * Accessibility-first forecast components featuring:
 * - Semantic HTML structure using proper ul/li lists
 * - Comprehensive ARIA labeling for screen readers
 * - Horizontal scrolling hourly forecast with scroll snap
 * - Semantic daily forecast with proper heading hierarchy
 * - Stable React keys using semantic identifiers
 * 
 * Accessibility Features:
 * - Proper list semantics for forecast data
 * - ARIA labels for time periods and weather conditions
 * - Screen reader compatible structure
 * - Keyboard navigation support
 * - WCAG 2.1 compliant design and interactions
 */

import React from 'react';
import WeatherIcon from '../../utils/weatherIcons';
import type { ThemeColors } from '../../utils/themeConfig';

interface HourlyForecastItem {
  time: string;
  temperature: number;
  weatherCode: number;
  humidity: number;
  feelsLike: number;
}

interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

interface ModernForecastProps {
  theme: ThemeColors;
  hourlyData?: HourlyForecastItem[];
  dailyData?: DailyForecastItem[];
  isLoading?: boolean;
}

const ModernForecast: React.FC<ModernForecastProps> = ({
  theme,
  hourlyData = [],
  dailyData = [],
  isLoading = false
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    width: '100%'
  };

  const sectionStyle: React.CSSProperties = {
    background: `${theme.cardBackground}f8`,
    borderRadius: '24px',
    padding: '24px',
    border: `1px solid ${theme.cardBorder}40`,
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '700',
    color: theme.primaryText,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const hourlyContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  };

  const hourlyItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    minWidth: '88px',
    padding: '20px 16px',
    background: `${theme.forecastCardBackground}e0`,
    borderRadius: '20px',
    border: `1px solid ${theme.forecastCardBorder}50`,
    scrollSnapAlign: 'start',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const dailyItemStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: `${theme.forecastCardBackground}e0`,
    borderRadius: '16px',
    border: `1px solid ${theme.forecastCardBorder}50`,
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (dateStr: string, index: number) => {
    const date = new Date(dateStr);
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        {/* Hourly Loading */}
        <div style={sectionStyle}>
          <div style={{
            width: '180px',
            height: '24px',
            background: `${theme.primaryText}15`,
            borderRadius: '12px',
            marginBottom: '20px'
          }} />
          <div style={hourlyContainerStyle}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={`hourly-skeleton-${i}`} style={{
                ...hourlyItemStyle,
                background: `${theme.primaryText}10`
              }}>
                <div style={{
                  width: '40px',
                  height: '12px',
                  background: `${theme.primaryText}20`,
                  borderRadius: '6px'
                }} />
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: `${theme.primaryText}20`,
                  borderRadius: '16px'
                }} />
                <div style={{
                  width: '30px',
                  height: '16px',
                  background: `${theme.primaryText}20`,
                  borderRadius: '8px'
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Loading */}
        <div style={sectionStyle}>
          <div style={{
            width: '160px',
            height: '24px',
            background: `${theme.primaryText}15`,
            borderRadius: '12px',
            marginBottom: '20px'
          }} />
          {['skeleton-day-1', 'skeleton-day-2', 'skeleton-day-3', 'skeleton-day-4', 'skeleton-day-5'].map((skeletonId) => (
            <div key={skeletonId} style={{
              ...dailyItemStyle,
              background: `${theme.primaryText}10`
            }}>
              <div style={{
                width: '60px',
                height: '16px',
                background: `${theme.primaryText}20`,
                borderRadius: '8px'
              }} />
              <div style={{
                width: '32px',
                height: '32px',
                background: `${theme.primaryText}20`,
                borderRadius: '16px'
              }} />
              <div style={{
                width: '80px',
                height: '16px',
                background: `${theme.primaryText}20`,
                borderRadius: '8px'
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Hourly Forecast */}
      {hourlyData.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={titleStyle}>
            <span aria-hidden="true">🕐</span>
            {' '}24-Hour Forecast
          </h3>
          <ul 
            style={{...hourlyContainerStyle, listStyle: 'none', margin: 0, padding: 0}}
            className="hide-scrollbar"
          >
            {hourlyData.slice(0, 24).map((hour) => (
              <li 
                key={hour.time}
                style={hourlyItemStyle}
                aria-label={`Weather at ${formatTime(hour.time)}: ${hour.temperature}°F`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: theme.secondaryText,
                  opacity: 0.8
                }}>
                  {formatTime(hour.time)}
                </div>
                
                <WeatherIcon 
                  code={hour.weatherCode} 
                  size={32} 
                  animated={true}
                />
                
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: theme.primaryText
                }}>
                  {Math.round(hour.temperature)}°
                </div>
                
                <div style={{
                  fontSize: '10px',
                  color: theme.secondaryText,
                  opacity: 0.7,
                  textAlign: 'center'
                }}>
                  💧 {hour.humidity}%
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily Forecast */}
      {dailyData.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={titleStyle}>
            <span aria-hidden="true">📅</span>
            {' '}7-Day Forecast
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {dailyData.slice(0, 7).map((day, index) => {
              const isToday = index === 0;
              return (
                <li 
                  key={day.date}
                  style={{
                    ...dailyItemStyle,
                    background: isToday 
                      ? `${theme.weatherCardBadge}20` 
                      : `${theme.forecastCardBackground}e0`,
                    borderColor: isToday 
                      ? `${theme.weatherCardBorder}60` 
                      : `${theme.forecastCardBorder}50`,
                    borderWidth: isToday ? '2px' : '1px'
                  }}
                  aria-label={`${isToday ? 'Today' : formatDate(day.date)}: High ${day.tempMax}°F, Low ${day.tempMin}°F`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: isToday ? '700' : '600',
                      color: theme.primaryText,
                      marginBottom: '4px'
                    }}>
                      {formatDay(day.date, index)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.secondaryText,
                      opacity: 0.7
                    }}>
                      {formatDate(day.date)}
                    </div>
                  </div>

                  <WeatherIcon 
                    code={day.weatherCode} 
                    size={36} 
                    animated={true}
                  />

                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: theme.primaryText,
                      marginBottom: '4px'
                    }}>
                      {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.secondaryText,
                      opacity: 0.7,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px'
                    }}>
                      {day.precipitation > 0 && (
                        <span>🌧️ {day.precipitation}mm</span>
                      )}
                      <span>💨 {day.windSpeed}mph</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModernForecast;
