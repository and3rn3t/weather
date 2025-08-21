/**
 * iOS 26 Premium Components Demo
 *
 * Showcase of all the latest iOS 26 design components with real weather integration:
 * - Context Menus with haptic feedback
 * - Dynamic Island-style live activities
 * - Interactive Widgets with real-time updates
 * - Modal Sheets with detents
 * - Swipe Actions for enhanced interactions
 * - Enhanced Search with advanced filtering
 */

import React, { useEffect, useState } from 'react';
import '../../styles/iOS26Components.css';
import { logInfo } from '../../utils/logger';
import type { ThemeColors } from '../../utils/themeConfig';
import {
  ContextMenu,
  InteractiveWidget,
  LiveActivity,
  ModalSheet,
  SwipeActions,
} from './iOS26Components';
import {
  ActivityIndicator,
  ListItem,
  ProgressIndicator,
  SegmentedControl,
  StatusBadge,
} from './IOSComponents';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  airQuality: string;
}

interface IOS26DemoProps {
  theme: ThemeColors;
  weatherData?: WeatherData;
}

export const IOS26WeatherDemo: React.FC<IOS26DemoProps> = ({
  theme,
  weatherData = {
    temperature: 72,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8,
    uvIndex: 5,
    airQuality: 'Good',
  },
}) => {
  const [selectedView, setSelectedView] = useState(0);
  const [showLiveActivity, setShowLiveActivity] = useState(false);
  const [showModalSheet, setShowModalSheet] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // Security: Use cryptographically secure random number generation
  const getSecureRandom = (): number => {
    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.getRandomValues
    ) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1); // Convert to 0-1 range
    } else {
      // Fallback for environments without crypto
      return Math.random();
    }
  };

  const [syncProgress, setSyncProgress] = useState(0);

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (getSecureRandom() > 0.8) {
        setShowLiveActivity(true);
        setTimeout(() => setShowLiveActivity(false), 5000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate sync progress
  useEffect(() => {
    if (isUpdating) {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          const next = prev + getSecureRandom() * 15;
          if (next >= 100) {
            setIsUpdating(false);
            return 100;
          }
          return next;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setSyncProgress(0);
    }
  }, [isUpdating]);

  const contextMenuActions = [
    {
      id: 'refresh',
      title: 'Refresh Weather',
      icon: '🔄',
      onAction: () => {
        setIsUpdating(true);
        // Simulate refresh
      },
    },
    {
      id: 'share',
      title: 'Share Location',
      icon: '📍',
      onAction: () => logInfo('Share location'),
    },
    {
      id: 'settings',
      title: 'Weather Settings',
      icon: '⚙️',
      onAction: () => setShowModalSheet(true),
    },
    {
      id: 'delete',
      title: 'Remove Location',
      icon: '🗑️',
      destructive: true,
      onAction: () => logInfo('Delete location'),
    },
  ];

  const swipeLeftActions = [
    {
      id: 'favorite',
      title: 'Favorite',
      icon: '⭐',
      color: '#FF9500',
      onAction: () => logInfo('Added to favorites'),
    },
  ];

  const swipeRightActions = [
    {
      id: 'share',
      title: 'Share',
      icon: '📤',
      color: '#007AFF',
      onAction: () => logInfo('Share weather'),
    },
    {
      id: 'delete',
      title: 'Delete',
      icon: '🗑️',
      color: '#FF3B30',
      onAction: () => logInfo('Delete weather data'),
    },
  ];

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    minHeight: '100vh',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: theme.cardBackground,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${theme.secondaryText}40`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '16px',
  };

  return (
    <div style={containerStyle}>
      {/* Header with Segmented Control */}
      <div style={sectionStyle}>
        <h1 style={titleStyle}>🌤️ Weather Dashboard</h1>
        <SegmentedControl
          segments={['Today', 'Weekly', 'Radar', 'Settings']}
          selectedIndex={selectedView}
          onChange={setSelectedView}
          theme={theme}
        />
      </div>

      {/* Live Activity Demo */}
      <LiveActivity
        title="Weather Update"
        subtitle={`${weatherData.temperature}°F - ${weatherData.condition}`}
        icon={<span style={{ fontSize: '18px' }}>🌤️</span>}
        progress={isUpdating ? syncProgress : undefined}
        theme={theme}
        isVisible={showLiveActivity || isUpdating}
        onTap={() => {
          setShowLiveActivity(false);
          setShowModalSheet(true);
        }}
      />

      {/* Interactive Widgets Grid */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>🌡️ Weather Details</h2>
        <div style={gridStyle}>
          {/* Current Weather Widget */}
          <InteractiveWidget
            title="Current Weather"
            size="medium"
            theme={theme}
            isLoading={isUpdating}
            onTap={() => setShowModalSheet(true)}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌤️</div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weatherData.temperature}°F
              </div>
              <div style={{ fontSize: '16px', color: theme.secondaryText }}>
                {weatherData.condition}
              </div>
            </div>
          </InteractiveWidget>

          {/* Air Quality Widget */}
          <InteractiveWidget
            title="Air Quality"
            size="medium"
            theme={theme}
            onTap={() => logInfo('View air quality details')}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: theme.primaryText,
                  }}
                >
                  {weatherData.airQuality}
                </div>
                <div style={{ fontSize: '14px', color: theme.secondaryText }}>
                  AQI: 42
                </div>
              </div>
              <StatusBadge text="Healthy" variant="success" theme={theme} />
            </div>
          </InteractiveWidget>

          {/* UV Index Widget */}
          <InteractiveWidget title="UV Index" size="small" theme={theme}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#FF9500',
                }}
              >
                {weatherData.uvIndex}
              </div>
              <div style={{ fontSize: '12px', color: theme.secondaryText }}>
                Moderate
              </div>
            </div>
          </InteractiveWidget>

          {/* Sync Progress Widget */}
          <InteractiveWidget
            title="Data Sync"
            size="small"
            theme={theme}
            isLoading={isUpdating}
          >
            {isUpdating ? (
              <ProgressIndicator
                progress={syncProgress}
                theme={theme}
                showPercentage
                color="#007AFF"
              />
            ) : (
              <div style={{ textAlign: 'center', color: theme.secondaryText }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>✅</div>
                <div style={{ fontSize: '12px' }}>Up to date</div>
              </div>
            )}
          </InteractiveWidget>
        </div>
      </div>

      {/* Context Menu Demo */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>� My Locations</h2>
        <p style={{ color: theme.secondaryText, marginBottom: '16px' }}>
          Right-click or tap and hold for options. Swipe left/right for quick
          actions.
        </p>

        <SwipeActions
          leftActions={swipeLeftActions}
          rightActions={swipeRightActions}
        >
          <ContextMenu actions={contextMenuActions} theme={theme}>
            <ListItem
              title="San Francisco, CA"
              subtitle="Partly cloudy, 72°F"
              icon={<span style={{ fontSize: '20px' }}>🌤️</span>}
              badge="Now"
              disclosure
              theme={theme}
              onPress={() => logInfo('View San Francisco weather')}
            />
          </ContextMenu>
        </SwipeActions>

        <div style={{ marginTop: '12px' }}>
          <SwipeActions
            leftActions={swipeLeftActions}
            rightActions={swipeRightActions}
          >
            <ContextMenu actions={contextMenuActions} theme={theme}>
              <ListItem
                title="New York, NY"
                subtitle="Sunny, 68°F"
                icon={<span style={{ fontSize: '20px' }}>☀️</span>}
                badge="5 min ago"
                disclosure
                theme={theme}
                onPress={() => logInfo('View New York weather')}
              />
            </ContextMenu>
          </SwipeActions>
        </div>
      </div>

      {/* Loading States Demo */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>⏳ Loading Status</h2>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <ActivityIndicator size="small" theme={theme} />
          <ActivityIndicator size="medium" theme={theme} text="Updating..." />
          <ActivityIndicator size="large" theme={theme} color="#FF9500" />

          <div style={{ flex: 1, minWidth: '200px' }}>
            <ProgressIndicator
              progress={75}
              theme={theme}
              showPercentage
              size="large"
            />
          </div>
        </div>
      </div>

      {/* Status Badges Demo */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>⚠️ Weather Alerts</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatusBadge
            text="Good Air Quality"
            variant="success"
            theme={theme}
          />
          <StatusBadge text="UV Warning" variant="warning" theme={theme} />
          <StatusBadge text="Severe Weather" variant="error" theme={theme} />
          <StatusBadge text="Weather Alert" variant="info" theme={theme} />
        </div>
      </div>

      {/* Action Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setShowModalSheet(true)}
          style={{
            padding: '16px 32px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Open Weather Settings
        </button>
      </div>

      {/* Modal Sheet Demo */}
      <ModalSheet
        isVisible={showModalSheet}
        onClose={() => setShowModalSheet(false)}
        title="Weather Settings"
        detents={['medium', 'large']}
        theme={theme}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ListItem
            title="Temperature Unit"
            subtitle="Fahrenheit"
            disclosure
            theme={theme}
            onPress={() => logInfo('Change temperature unit')}
          />
          <ListItem
            title="Weather Alerts"
            subtitle="Enabled"
            badge="On"
            disclosure
            theme={theme}
            onPress={() => logInfo('Configure alerts')}
          />
          <ListItem
            title="Location Services"
            subtitle="Always"
            disclosure
            theme={theme}
            onPress={() => logInfo('Location settings')}
          />
          <ListItem
            title="Data Refresh"
            subtitle="Every 15 minutes"
            disclosure
            theme={theme}
            onPress={() => logInfo('Refresh settings')}
          />

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setIsUpdating(true);
                setShowModalSheet(false);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: theme.cardBackground,
                color: theme.primaryText,
                border: `1px solid ${theme.secondaryText}40`,
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Refresh All Data
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
};

export default IOS26WeatherDemo;
