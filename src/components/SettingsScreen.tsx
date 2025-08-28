import React, { useCallback, useEffect, useState } from 'react';
import {
  favoriteCitiesManager,
  type FavoriteCity,
} from '../services/mobile/FavoriteCitiesManager';
import { smartCacheManager } from '../services/mobile/SmartCacheManager';
import { weatherAlertManager } from '../services/mobile/WeatherAlertManager';
import { advancedCachingManager } from '../utils/advancedCachingManager';
import { useHaptic } from '../utils/hapticHooks';
import { logInfo, logWarn } from '../utils/logger';
import type { ScreenInfo } from '../utils/mobileScreenOptimization';
import type { ThemeColors } from '../utils/themeConfig';
import { useTheme } from '../utils/useTheme';

interface SettingsScreenProps {
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  onBack: () => void;
}

/**
 * SettingsScreen - Modern settings interface for mobile devices
 *
 * Features:
 * - Clean, mobile-first design
 * - Grouped settings sections
 * - Touch-friendly controls
 * - Theme integration
 * - Haptic feedback
 */
const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  screenInfo,
  onBack,
}) => {
  const { themeName, toggleTheme } = useTheme();
  const haptic = useHaptic();

  // Basic settings state
  const [notifications, setNotifications] = useState(true);
  const [units, setUnits] = useState('imperial');
  const [refreshInterval, setRefreshInterval] = useState('5min');

  // Location & GPS settings state
  const [highAccuracyGPS, setHighAccuracyGPS] = useState(false);
  const [locationTimeout, setLocationTimeout] = useState('8sec');
  const [backgroundLocation, setBackgroundLocation] = useState(false);

  // Offline & Storage settings state
  const [offlineMode, setOfflineMode] = useState(true);
  const [cacheDuration, setCacheDuration] = useState('7days');
  const [autoSync, setAutoSync] = useState('30sec');

  // Performance settings state
  const [batteryOptimization, setBatteryOptimization] = useState(true);
  const [backgroundRefresh, setBackgroundRefresh] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // UI settings state
  const [reduceMotion, setReduceMotion] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load location settings
        const locationSettings = localStorage.getItem('location-settings');
        if (locationSettings) {
          const parsed = JSON.parse(locationSettings);
          setHighAccuracyGPS(parsed.highAccuracy ?? false);
          setLocationTimeout(parsed.timeout ?? '8sec');
          setBackgroundLocation(parsed.backgroundLocation ?? false);
        }

        // Load cache settings
        const cacheSettings = localStorage.getItem('cache-settings');
        if (cacheSettings) {
          const parsed = JSON.parse(cacheSettings);
          setOfflineMode(parsed.offlineMode ?? true);
          setCacheDuration(parsed.duration ?? '7days');
          setAutoSync(parsed.autoSync ?? '30sec');
        }

        // Load performance settings
        const performanceSettings = localStorage.getItem(
          'performance-settings'
        );
        if (performanceSettings) {
          const parsed = JSON.parse(performanceSettings);
          setBatteryOptimization(parsed.batteryOptimization ?? true);
          setBackgroundRefresh(parsed.backgroundRefresh ?? false);
          setHapticFeedback(parsed.hapticFeedback ?? true);
        }

        // Load UI settings (horror removed Aug 2025)
        const uiSettings = localStorage.getItem('ui-settings');
        if (uiSettings) {
          const parsed = JSON.parse(uiSettings);
          setReduceMotion(parsed.reduceMotion ?? false);
        }
      } catch (error) {
        logWarn('Failed to load settings from localStorage:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((category: string, settings: object) => {
    try {
      localStorage.setItem(`${category}-settings`, JSON.stringify(settings));
      logInfo(`Saved ${category} settings:`, settings);
    } catch (error) {
      logWarn(`Failed to save ${category} settings:`, error);
    }
  }, []);

  const handleSelectionChange = (id: string, value: string) => {
    haptic.buttonPress();
    switch (id) {
      case 'units':
        setUnits(value);
        break;
      case 'refresh':
        setRefreshInterval(value);
        break;
      case 'location-timeout':
        setLocationTimeout(value);
        saveSettings('location', {
          highAccuracy: highAccuracyGPS,
          timeout: value,
          backgroundLocation,
        });
        break;
      case 'cache-duration':
        setCacheDuration(value);
        saveSettings('cache', {
          offlineMode,
          duration: value,
          autoSync,
        });
        break;
      case 'auto-sync':
        setAutoSync(value);
        saveSettings('cache', {
          offlineMode,
          duration: cacheDuration,
          autoSync: value,
        });
        break;
    }
  };

  const handleToggleChange = async (id: string, value: boolean) => {
    haptic.buttonPress();

    switch (id) {
      case 'theme':
        toggleTheme();
        break;
      case 'notifications':
        setNotifications(value);
        break;
      case 'high-accuracy-gps':
        setHighAccuracyGPS(value);
        saveSettings('location', {
          highAccuracy: value,
          timeout: locationTimeout,
          backgroundLocation,
        });
        break;
      case 'background-location':
        setBackgroundLocation(value);
        saveSettings('location', {
          highAccuracy: highAccuracyGPS,
          timeout: locationTimeout,
          backgroundLocation: value,
        });
        break;
      case 'offline-mode':
        setOfflineMode(value);
        saveSettings('cache', {
          offlineMode: value,
          duration: cacheDuration,
          autoSync,
        });
        if (value) {
          // For now, just enable offline mode in localStorage since offlineStorage doesn't have initialize
          logInfo('Offline mode enabled');
        }
        break;
      case 'battery-optimization':
        setBatteryOptimization(value);
        saveSettings('performance', {
          batteryOptimization: value,
          backgroundRefresh,
          hapticFeedback,
        });
        break;
      case 'background-refresh':
        setBackgroundRefresh(value);
        saveSettings('performance', {
          batteryOptimization,
          backgroundRefresh: value,
          hapticFeedback,
        });
        break;
      case 'haptic-feedback':
        setHapticFeedback(value);
        saveSettings('performance', {
          batteryOptimization,
          backgroundRefresh,
          hapticFeedback: value,
        });
        break;
      case 'reduce-motion':
        setReduceMotion(value);
        saveSettings('ui', {
          reduceMotion: value,
        });
        break;
    }
  };

  const handleActionPress = async (id: string) => {
    haptic.buttonPress();

    switch (id) {
      case 'gps-permission':
        // Request GPS permission
        try {
          if ('permissions' in navigator) {
            const permission = await navigator.permissions.query({
              name: 'geolocation' as PermissionName,
            });
            if (permission.state === 'denied') {
              alert(
                'Location access is blocked. Please enable location permissions in your browser settings.'
              );
            } else {
              navigator.geolocation.getCurrentPosition(
                () => alert('Location permission granted successfully!'),
                () =>
                  alert(
                    'Failed to get location. Please check your browser settings.'
                  ),
                { enableHighAccuracy: highAccuracyGPS, timeout: 8000 }
              );
            }
          }
        } catch (error) {
          logWarn('GPS permission request failed:', error);
          alert('Please enable location access in your browser settings.');
        }
        break;
      case 'manage-favorites':
        // Show favorite cities management
        try {
          const cities = favoriteCitiesManager.getFavoriteCities('frequent');
          const cityNames = cities
            .map((city: FavoriteCity) => `${city.name}, ${city.country}`)
            .join('\n');
          alert(
            `Favorite Cities (${cities.length}):\n\n${
              cityNames || 'No favorite cities saved yet.'
            }`
          );
        } catch (error) {
          logWarn('Failed to load favorite cities:', error);
          alert('Failed to load favorite cities.');
        }
        break;
      case 'weather-alerts':
        // This would typically navigate to WeatherAlertPanel, but for now show status
        try {
          const preferences = weatherAlertManager.getPreferences();
          alert(
            `Weather Alerts Status:\n\nPush Notifications: ${
              preferences.enableNotifications ? 'Enabled' : 'Disabled'
            }\nSound Alerts: ${
              preferences.enableSounds ? 'Enabled' : 'Disabled'
            }\nVibration: ${
              preferences.enableVibration ? 'Enabled' : 'Disabled'
            }`
          );
        } catch (error) {
          logWarn('Failed to load alert preferences:', error);
          alert('Failed to load weather alert settings.');
        }
        break;
      case 'clear-cache':
        // Clear all caches
        try {
          await advancedCachingManager.clear();
          // Note: offlineStorage.clearData() and smartCacheManager.clearCache() methods need to be checked
          logInfo('Main cache cleared successfully');
          await smartCacheManager.clear();
          alert('All caches cleared successfully!');
        } catch (error) {
          logWarn('Failed to clear cache:', error);
          alert('Failed to clear cache.');
        }
        break;
      case 'version':
        haptic.buttonPress();
        // Show version details
        alert(
          'Weather App v1.0.0\n\nPhase 5C Complete:\n✅ Location Services\n✅ Offline Support\n✅ Weather Alerts\n✅ Enhanced Settings'
        );
        break;
      case 'feedback':
        haptic.buttonPress();
        // Open feedback form
        alert(
          'Feedback feature coming soon!\n\nFor now, please use GitHub issues or contact support.'
        );
        break;
    }
  };

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Toggle between light and dark themes',
          icon: themeName === 'dark' ? '🌙' : '☀️',
          type: 'toggle' as const,
          value: themeName === 'dark',
        },
        // Horror Theme removed (Aug 2025)
        {
          id: 'reduce-motion',
          title: 'Reduce Motion',
          subtitle: 'Minimize animations for accessibility',
          icon: '♿',
          type: 'toggle' as const,
          value: reduceMotion,
        },
      ],
    },
    {
      title: 'Location & GPS',
      items: [
        {
          id: 'gps-permission',
          title: 'GPS Permission',
          subtitle: 'Manage location access for weather detection',
          icon: '📍',
          type: 'action' as const,
          action: () => handleActionPress('gps-permission'),
        },
        {
          id: 'high-accuracy-gps',
          title: 'High Accuracy GPS',
          subtitle: 'More precise location at cost of battery',
          icon: '🎯',
          type: 'toggle' as const,
          value: highAccuracyGPS,
        },
        {
          id: 'location-timeout',
          title: 'Location Timeout',
          subtitle: 'How long to wait for GPS fix',
          icon: '⏱️',
          type: 'selection' as const,
          value: locationTimeout,
          options: ['3sec', '5sec', '8sec', '12sec', '15sec'],
        },
        {
          id: 'background-location',
          title: 'Background Location',
          subtitle: 'Update location when app is backgrounded',
          icon: '🔄',
          type: 'toggle' as const,
          value: backgroundLocation,
        },
        {
          id: 'manage-favorites',
          title: 'Manage Favorite Cities',
          subtitle: 'View and organize saved locations',
          icon: '⭐',
          type: 'action' as const,
          action: () => handleActionPress('manage-favorites'),
        },
      ],
    },
    {
      title: 'Offline & Storage',
      items: [
        {
          id: 'offline-mode',
          title: 'Offline Mode',
          subtitle: 'Cache weather data for offline access',
          icon: '📱',
          type: 'toggle' as const,
          value: offlineMode,
        },
        {
          id: 'cache-duration',
          title: 'Cache Duration',
          subtitle: 'How long to store weather data',
          icon: '💾',
          type: 'selection' as const,
          value: cacheDuration,
          options: ['1day', '3days', '7days', '14days', '30days'],
        },
        {
          id: 'auto-sync',
          title: 'Auto-sync Frequency',
          subtitle: 'Background sync when connection restored',
          icon: '🔄',
          type: 'selection' as const,
          value: autoSync,
          options: ['15sec', '30sec', '1min', '5min', '15min'],
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Remove all stored offline data',
          icon: '🗑️',
          type: 'action' as const,
          action: () => handleActionPress('clear-cache'),
        },
      ],
    },
    {
      title: 'Weather',
      items: [
        {
          id: 'units',
          title: 'Temperature Units',
          subtitle: 'Choose between Celsius and Fahrenheit',
          icon: '🌡️',
          type: 'selection' as const,
          value: units,
          options: ['imperial', 'metric'],
        },
        {
          id: 'refresh',
          title: 'Auto Refresh',
          subtitle: 'How often to update weather data',
          icon: '🔄',
          type: 'selection' as const,
          value: refreshInterval,
          options: ['1min', '5min', '15min', '30min', 'manual'],
        },
        {
          id: 'weather-alerts',
          title: 'Weather Alerts',
          subtitle: 'Configure severe weather notifications',
          icon: '🚨',
          type: 'action' as const,
          action: () => handleActionPress('weather-alerts'),
        },
      ],
    },
    {
      title: 'Performance',
      items: [
        {
          id: 'battery-optimization',
          title: 'Battery Optimization',
          subtitle: 'Reduce features to save battery life',
          icon: '🔋',
          type: 'toggle' as const,
          value: batteryOptimization,
        },
        {
          id: 'background-refresh',
          title: 'Background Refresh',
          subtitle: 'Update weather data when app is hidden',
          icon: '📱',
          type: 'toggle' as const,
          value: backgroundRefresh,
        },
        {
          id: 'haptic-feedback',
          title: 'Haptic Feedback',
          subtitle: 'Vibration feedback for touch interactions',
          icon: '📳',
          type: 'toggle' as const,
          value: hapticFeedback,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Weather Alerts',
          subtitle: 'Get notified about severe weather',
          icon: '🔔',
          type: 'toggle' as const,
          value: notifications,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'Version',
          subtitle: '1.0.0 - Phase 5C Enhanced',
          icon: 'ℹ️',
          type: 'action' as const,
          action: () => handleActionPress('version'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: '💬',
          type: 'action' as const,
          action: () => handleActionPress('feedback'),
        },
      ],
    },
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.appBackground,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: `linear-gradient(180deg, ${theme.appBackground}95, ${theme.appBackground}85)`,
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${theme.weatherCardBorder}30`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '60px',
  };

  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    color: theme.primaryText,
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: screenInfo.isVerySmallScreen ? '20px' : '24px',
    fontWeight: '700',
    color: theme.primaryText,
    margin: 0,
    letterSpacing: '-0.5px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '0 16px 100px 16px', // Bottom padding for navigation
    paddingTop: '8px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    marginLeft: '4px',
  };

  const itemContainerStyle: React.CSSProperties = {
    background: theme.cardBackground,
    borderRadius: '16px',
    border: `1px solid ${theme.weatherCardBorder}30`,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: `1px solid ${theme.weatherCardBorder}20`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '64px',
  };

  const toggleStyle: React.CSSProperties = {
    position: 'relative',
    width: '50px',
    height: '30px',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const renderToggle = (isOn: boolean, onChange: (value: boolean) => void) => (
    <button
      style={{
        ...toggleStyle,
        background: isOn ? theme.primaryGradient : theme.toggleBackground,
        border: `2px solid ${isOn ? 'transparent' : theme.toggleBorder}`,
      }}
      onClick={() => onChange(!isOn)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!isOn);
        }
      }}
      aria-checked={isOn}
      role="switch"
      aria-label={`Toggle ${isOn ? 'off' : 'on'}`}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: isOn ? '22px' : '2px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          pointerEvents: 'none',
        }}
      />
    </button>
  );

  const formatOptionText = (option: string): string => {
    // Temperature units
    if (option === 'imperial') return 'Fahrenheit';
    if (option === 'metric') return 'Celsius';

    // Location timeout
    if (option.endsWith('sec')) return option.replace('sec', ' seconds');

    // Cache duration
    if (option === '1day') return '1 Day';
    if (option === '3days') return '3 Days';
    if (option === '7days') return '1 Week';
    if (option === '14days') return '2 Weeks';
    if (option === '30days') return '1 Month';

    // Auto-sync frequency
    if (option === '15sec') return '15 Seconds';
    if (option === '30sec') return '30 Seconds';
    if (option === '1min') return '1 Minute';
    if (option === '5min') return '5 Minutes';
    if (option === '15min') return '15 Minutes';
    if (option === '30min') return '30 Minutes';

    // Default: capitalize first letter
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  const renderSelection = (
    value: string,
    options: string[],
    onChange: (value: string) => void,
    label: string = 'Selection'
  ) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      style={{
        background: theme.cardBackground,
        border: `1px solid ${theme.weatherCardBorder}`,
        borderRadius: '8px',
        padding: '8px 12px',
        color: theme.primaryText,
        fontSize: '14px',
        minWidth: '100px',
        cursor: 'pointer',
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {formatOptionText(option)}
        </option>
      ))}
    </select>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <button
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${theme.primaryGradient}15`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 style={titleStyle}>Settings</h1>
      </header>

      {/* Content */}
      <div style={contentStyle}>
        {settingsSections.map(section => (
          <div key={section.title} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{section.title}</h2>
            <div style={itemContainerStyle}>
              {section.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    ...itemStyle,
                    borderBottom:
                      index === section.items.length - 1
                        ? 'none'
                        : itemStyle.borderBottom,
                  }}
                >
                  <div style={{ fontSize: '24px', marginRight: '16px' }}>
                    {item.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: theme.primaryText,
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        style={{
                          fontSize: '14px',
                          color: theme.secondaryText,
                          lineHeight: '1.3',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '16px' }}>
                    {item.type === 'toggle' &&
                      renderToggle(item.value as boolean, value =>
                        handleToggleChange(item.id, value)
                      )}
                    {item.type === 'selection' &&
                      item.options &&
                      renderSelection(
                        item.value as string,
                        item.options,
                        value => handleSelectionChange(item.id, value),
                        item.title
                      )}
                    {item.type === 'action' && (
                      <div
                        style={{
                          fontSize: '18px',
                          color: theme.secondaryText,
                        }}
                      >
                        →
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsScreen;
