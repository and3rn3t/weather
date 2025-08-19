/**
 * Interactive Weather Widget - iOS 18+ Style
 *
 * Features:
 * - Live Activity-style updates
 * - Dynamic Island inspired compact mode
 * - Interactive elements with haptic feedback
 * - Smooth spring animations
 * - Real-time data updates
 */

import React, { useState } from 'react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  feelsLike: number;
}

interface InteractiveWeatherWidgetProps {
  weatherData: WeatherData;
  isDark?: boolean;
  isCompact?: boolean;
  onExpand?: () => void;
  onRefresh?: () => void;
}

export const InteractiveWeatherWidget: React.FC<
  InteractiveWeatherWidgetProps
> = ({
  weatherData,
  isDark = false,
  isCompact = false,
  onExpand,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleExpand = () => {
    if (isCompact && onExpand) {
      onExpand();
    }
    setIsExpanded(!isExpanded);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setLastUpdate(new Date());

    // Simulate minimum refresh time for smooth animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  const widgetStyle: React.CSSProperties = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: isCompact ? '24px' : '20px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
    padding: isCompact ? '12px 16px' : '20px',
    boxShadow: isDark
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
    cursor: isCompact ? 'pointer' : 'default',
    transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
    transform: isExpanded ? 'scale(1)' : 'scale(0.98)',
    overflow: 'hidden',
    position: 'relative',
    minHeight: isCompact ? '60px' : '200px',
    maxWidth: isCompact ? '280px' : '100%',
  };

  return isCompact ? (
    <button
      style={widgetStyle}
      onClick={handleExpand}
      aria-label={`Expand weather widget for ${weatherData.location}`}
    >
      <WidgetContent
        weatherData={weatherData}
        isDark={isDark}
        isCompact={isCompact}
        isExpanded={isExpanded}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdate={lastUpdate}
      />
    </button>
  ) : (
    <div style={widgetStyle}>
      <WidgetContent
        weatherData={weatherData}
        isDark={isDark}
        isCompact={isCompact}
        isExpanded={isExpanded}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdate={lastUpdate}
      />
    </div>
  );
};

// Separate component to reduce complexity
interface WidgetContentProps {
  weatherData: WeatherData;
  isDark: boolean;
  isCompact: boolean;
  isExpanded: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdate: Date;
}

// Helper function to create base styles
const createBaseStyles = (
  isDark: boolean,
  isCompact: boolean,
  isExpanded: boolean
) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isCompact ? '0' : '16px',
    opacity: isExpanded ? 1 : 0.8,
    transition: 'opacity 0.3s ease',
  } as React.CSSProperties,

  title: {
    fontSize: isCompact ? '16px' : '18px',
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#1A1A1A',
    margin: 0,
  } as React.CSSProperties,

  mainContent: {
    display: 'flex',
    alignItems: 'center',
    gap: isCompact ? '12px' : '16px',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
  } as React.CSSProperties,

  temperature: {
    fontSize: isCompact ? '24px' : '48px',
    fontWeight: '300',
    color: isDark ? '#FFFFFF' : '#1A1A1A',
    lineHeight: 1,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  } as React.CSSProperties,
});

// Helper function for detail styles
const createDetailStyles = (
  isDark: boolean,
  isCompact: boolean,
  isExpanded: boolean
) => ({
  grid: {
    display: isCompact ? 'none' : 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '20px',
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? 'translateY(0)' : 'translateY(10px)',
    transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s',
  } as React.CSSProperties,

  item: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  } as React.CSSProperties,
});

const WidgetContent: React.FC<WidgetContentProps> = ({
  weatherData,
  isDark,
  isCompact,
  isExpanded,
  isRefreshing,
  onRefresh,
  lastUpdate,
}) => {
  const baseStyles = createBaseStyles(isDark, isCompact, isExpanded);
  const detailStyles = createDetailStyles(isDark, isCompact, isExpanded);

  const refreshButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderRadius: '20px',
    padding: '8px',
    cursor: 'pointer',
    color: isDark ? '#FFFFFF' : '#007AFF',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
    opacity: isRefreshing ? 0.6 : 1,
  };

  const conditionStyle: React.CSSProperties = {
    fontSize: isCompact ? '14px' : '16px',
    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.8)',
    fontWeight: '500',
  };

  const compactInfoStyle: React.CSSProperties = {
    display: isCompact ? 'flex' : 'none',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.8)',
  };

  return (
    <>
      <div style={baseStyles.header}>
        <h3 style={baseStyles.title}>
          {isCompact
            ? weatherData.location
            : `Weather in ${weatherData.location}`}
        </h3>
        {!isCompact && (
          <button
            style={refreshButtonStyle}
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh weather data"
          >
            🔄
          </button>
        )}
      </div>

      <div style={baseStyles.mainContent}>
        <div style={{ fontSize: isCompact ? '20px' : '32px' }}>
          {weatherData.icon}
        </div>
        <div>
          <div style={baseStyles.temperature}>
            {Math.round(weatherData.temperature)}°
          </div>
          <div style={conditionStyle}>{weatherData.condition}</div>
        </div>
      </div>

      <div style={compactInfoStyle}>
        <span>{Math.round(weatherData.temperature)}°</span>
        <span>•</span>
        <span>{weatherData.condition}</span>
      </div>

      <WeatherDetails
        weatherData={weatherData}
        isDark={isDark}
        detailStyles={detailStyles}
        lastUpdate={lastUpdate}
        isCompact={isCompact}
      />
    </>
  );
};

// Extract weather details to separate component
interface WeatherDetailsProps {
  weatherData: WeatherData;
  isDark: boolean;
  detailStyles: { grid: React.CSSProperties; item: React.CSSProperties };
  lastUpdate: Date;
  isCompact: boolean;
}

const WeatherDetails: React.FC<WeatherDetailsProps> = ({
  weatherData,
  isDark,
  detailStyles,
  lastUpdate,
  isCompact,
}) => {
  const detailLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 26, 26, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  };

  const detailValueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#1A1A1A',
  };

  const lastUpdateStyle: React.CSSProperties = {
    fontSize: '11px',
    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.5)',
    textAlign: 'center',
    marginTop: '12px',
    display: isCompact ? 'none' : 'block',
  };

  return (
    <>
      <div style={detailStyles.grid}>
        <div style={detailStyles.item}>
          <div style={detailLabelStyle}>Feels Like</div>
          <div style={detailValueStyle}>
            {Math.round(weatherData.feelsLike)}°
          </div>
        </div>
        <div style={detailStyles.item}>
          <div style={detailLabelStyle}>Humidity</div>
          <div style={detailValueStyle}>{weatherData.humidity}%</div>
        </div>
        <div style={detailStyles.item}>
          <div style={detailLabelStyle}>Wind</div>
          <div style={detailValueStyle}>
            {Math.round(weatherData.windSpeed)} mph
          </div>
        </div>
      </div>

      <div style={lastUpdateStyle}>
        Last updated:{' '}
        {lastUpdate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </>
  );
};

export default InteractiveWeatherWidget;
