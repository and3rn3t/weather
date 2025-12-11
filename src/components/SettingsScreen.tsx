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
import {
  getStoredUnits,
  setStoredUnits,
  type TemperatureUnits,
} from '../utils/units';
import { useTheme } from '../utils/useTheme';
import './SettingsScreen.css';
import { NavigationBar } from './modernWeatherUI/NavigationBar';
import { NavigationIcons } from './modernWeatherUI/NavigationIcons';
import ToggleSwitch from './modernWeatherUI/ToggleSwitch';

interface SettingsScreenProps {
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  onBack: () => void;
}

// Default temperature thresholds for each profile (both imperial and metric)
// Mirrors the logic used in App.tsx so Settings can reset consistently.
function getProfileDefaults(profile: 'standard' | 'hot' | 'cold') {
  if (profile === 'hot') {
    return {
      imperial: { warm: 85, cold: 45 },
      metric: { warm: 29, cold: 7 },
    } as const;
  }
  if (profile === 'cold') {
    return {
      imperial: { warm: 70, cold: 35 },
      metric: { warm: 21, cold: 2 },
    } as const;
  }
  // standard
  return {
    imperial: { warm: 75, cold: 40 },
    metric: { warm: 24, cold: 5 },
  } as const;
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
  screenInfo: _screenInfo,
  onBack,
}) => {
  const {
    themeName,
    toggleTheme,
    accessibilityMode,
    setAccessibilityMode,
    compactMode,
    setCompactMode,
    compactDesktopOnly,
    setCompactDesktopOnly,
    colorizeTemps,
    setColorizeTemps,
    tempColorProfile,
    setTempColorProfile,
    tempThresholdsEnabled,
    setTempThresholdsEnabled,
    tempThresholds,
    setTempThresholds,
  } = useTheme();
  const haptic = useHaptic();

  // Local UI state
  const [notifications, setNotifications] = useState<boolean>(false);
  const [units, setUnits] = useState<TemperatureUnits>('imperial');
  const [refreshInterval, setRefreshInterval] = useState<string>('15min');

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Appearance', 'Weather']) // Default expanded sections
  );

  // Location & GPS
  const [highAccuracyGPS, setHighAccuracyGPS] = useState<boolean>(false);
  const [locationTimeout, setLocationTimeout] = useState<string>('8sec');
  const [backgroundLocation, setBackgroundLocation] = useState<boolean>(false);

  // Offline & Storage
  const [offlineMode, setOfflineMode] = useState<boolean>(true);
  const [cacheDuration, setCacheDuration] = useState<string>('7days');
  const [autoSync, setAutoSync] = useState<string>('30sec');

  // Performance
  const [batteryOptimization, setBatteryOptimization] = useState<boolean>(true);
  const [backgroundRefresh, setBackgroundRefresh] = useState<boolean>(false);
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(true);

  // UI / Accessibility
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

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

        // Load notification settings
        const notificationSettings = localStorage.getItem(
          'notification-settings'
        );
        if (notificationSettings) {
          const parsed = JSON.parse(notificationSettings);
          setNotifications(parsed.notifications ?? false);
        }

        // Load weather settings (refresh interval)
        const weatherSettings = localStorage.getItem('weather-settings');
        if (weatherSettings) {
          const parsed = JSON.parse(weatherSettings);
          if (typeof parsed.refreshInterval === 'string') {
            setRefreshInterval(parsed.refreshInterval);
          }
        }

        // Temperature units persisted separately
        setUnits(getStoredUnits());
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
        setUnits((value as TemperatureUnits) || 'imperial');
        setStoredUnits((value as TemperatureUnits) || 'imperial');
        break;
      case 'refresh':
        setRefreshInterval(value);
        saveSettings('weather', { refreshInterval: value });
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
      case 'accessibility-mode':
        setAccessibilityMode(
          (value as 'default' | 'high-contrast' | 'reduced-transparency') ||
            'default'
        );
        break;
      case 'temp-color-profile': {
        const next = (value as 'standard' | 'hot' | 'cold') || 'standard';
        setTempColorProfile(next);
        break;
      }
    }
  };

  const handleToggleChange = async (id: string, value: boolean) => {
    haptic.buttonPress();
    switch (id) {
      case 'units': {
        const nextUnits: TemperatureUnits = value ? 'metric' : 'imperial';
        setUnits(nextUnits);
        setStoredUnits(nextUnits);
        break;
      }
      case 'theme':
        toggleTheme();
        break;
      case 'notifications':
        setNotifications(value);
        saveSettings('notification', { notifications: value });
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
      case 'compact-mode':
        setCompactMode(value);
        break;
      case 'compact-desktop-only':
        setCompactDesktopOnly(value);
        break;
      case 'colorize-temps':
        setColorizeTemps(value);
        break;
      case 'custom-thresholds':
        setTempThresholdsEnabled(value);
        break;
    }
  };

  const gpsPermission = async () => {
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
  };

  const manageFavorites = () => {
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
  };

  const showWeatherAlerts = () => {
    try {
      const preferences = weatherAlertManager.getPreferences();
      alert(
        `Weather Alerts Status:\n\nPush Notifications: ${
          preferences.enableNotifications ? 'Enabled' : 'Disabled'
        }\nSound Alerts: ${
          preferences.enableSounds ? 'Enabled' : 'Disabled'
        }\nVibration: ${preferences.enableVibration ? 'Enabled' : 'Disabled'}`
      );
    } catch (error) {
      logWarn('Failed to load alert preferences:', error);
      alert('Failed to load weather alert settings.');
    }
  };

  const clearCache = async () => {
    try {
      await advancedCachingManager.clear();
      logInfo('Main cache cleared successfully');
      await smartCacheManager.clear();
      alert('All caches cleared successfully!');
    } catch (error) {
      logWarn('Failed to clear cache:', error);
      alert('Failed to clear cache.');
    }
  };

  const showVersion = () => {
    alert(
      'Weather App v1.0.0\n\nPhase 5C Complete:\n✅ Location Services\n✅ Offline Support\n✅ Weather Alerts\n✅ Enhanced Settings'
    );
  };

  const showFeedback = () => {
    alert(
      'Feedback feature coming soon!\n\nFor now, please use GitHub issues or contact support.'
    );
  };

  const handleActionPress = async (id: string) => {
    haptic.buttonPress();
    const handlers: Record<string, () => void | Promise<void>> = {
      'gps-permission': gpsPermission,
      'manage-favorites': manageFavorites,
      'weather-alerts': showWeatherAlerts,
      'clear-cache': clearCache,
      version: showVersion,
      feedback: showFeedback,
    };
    const fn = handlers[id];
    if (fn) await fn();
  };

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Toggle between light and dark themes',
          icon: <NavigationIcons.Sun />,
          type: 'toggle' as const,
          value: themeName === 'dark',
        },
        // Horror Theme removed (Aug 2025)
        {
          id: 'reduce-motion',
          title: 'Reduce Motion',
          subtitle: 'Minimize animations for accessibility',
          icon: <NavigationIcons.Warning />,
          type: 'toggle' as const,
          value: reduceMotion,
        },
        {
          id: 'compact-mode',
          title: 'Compact Mode',
          subtitle: 'Denser spacing for information-dense layout',
          icon: <NavigationIcons.Menu />,
          type: 'toggle' as const,
          value: compactMode,
        },
        {
          id: 'colorize-temps',
          title: 'Colorize Temperatures',
          subtitle: 'Use warm/cool colors for temps and blue for precipitation',
          icon: <NavigationIcons.Sun />,
          type: 'toggle' as const,
          value: colorizeTemps,
        },
        ...(colorizeTemps
          ? [
              {
                id: 'temp-color-profile',
                title: 'Temperature Color Profile',
                subtitle: 'Tune thresholds for warm/cool ranges',
                icon: <NavigationIcons.Info />,
                type: 'selection' as const,
                value: tempColorProfile,
                options: ['standard', 'hot', 'cold'],
              },
              {
                id: 'custom-thresholds',
                title: 'Custom Temperature Thresholds',
                subtitle: 'Override warm/cold thresholds for °F/°C',
                icon: <NavigationIcons.Info />,
                type: 'toggle' as const,
                value: tempThresholdsEnabled,
              },
            ]
          : []),
        // Only meaningful when compact mode is on
        ...(compactMode
          ? [
              {
                id: 'compact-desktop-only',
                title: 'Compact on Desktop Only',
                subtitle: 'Keep comfortable spacing on phones/tablets',
                icon: <NavigationIcons.Menu />,
                type: 'toggle' as const,
                value: compactDesktopOnly,
              },
            ]
          : []),
        {
          id: 'accessibility-mode',
          title: 'Accessibility Mode',
          subtitle:
            'Visual presets: default, high-contrast, reduced transparency',
          icon: <NavigationIcons.Warning />,
          type: 'selection' as const,
          value: accessibilityMode,
          options: ['default', 'high-contrast', 'reduced-transparency'],
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
          icon: <NavigationIcons.Location />,
          type: 'action' as const,
          action: () => handleActionPress('gps-permission'),
        },
        {
          id: 'high-accuracy-gps',
          title: 'High Accuracy GPS',
          subtitle: 'More precise location at cost of battery',
          icon: <NavigationIcons.Location />,
          type: 'toggle' as const,
          value: highAccuracyGPS,
        },
        {
          id: 'location-timeout',
          title: 'Location Timeout',
          subtitle: 'How long to wait for GPS fix',
          icon: <NavigationIcons.Clock />,
          type: 'selection' as const,
          value: locationTimeout,
          options: ['3sec', '5sec', '8sec', '12sec', '15sec'],
        },
        {
          id: 'background-location',
          title: 'Background Location',
          subtitle: 'Update location when app is backgrounded',
          icon: <NavigationIcons.Refresh />,
          type: 'toggle' as const,
          value: backgroundLocation,
        },
        {
          id: 'manage-favorites',
          title: 'Manage Favorite Cities',
          subtitle: 'View and organize saved locations',
          icon: <NavigationIcons.Favorites />,
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
          icon: <NavigationIcons.Menu />,
          type: 'toggle' as const,
          value: offlineMode,
        },
        {
          id: 'cache-duration',
          title: 'Cache Duration',
          subtitle: 'How long to store weather data',
          icon: <NavigationIcons.Add />,
          type: 'selection' as const,
          value: cacheDuration,
          options: ['1day', '3days', '7days', '14days', '30days'],
        },
        {
          id: 'auto-sync',
          title: 'Auto-sync Frequency',
          subtitle: 'Background sync when connection restored',
          icon: <NavigationIcons.Refresh />,
          type: 'selection' as const,
          value: autoSync,
          options: ['15sec', '30sec', '1min', '5min', '15min'],
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Remove all stored offline data',
          icon: <NavigationIcons.Trash />,
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
          title: 'Measurement System',
          subtitle: 'Toggle Metric or Imperial for all measurements',
          icon: <NavigationIcons.Sun />,
          type: 'toggle' as const,
          value: units === 'metric',
        },
        {
          id: 'refresh',
          title: 'Auto Refresh',
          subtitle: 'How often to update weather data',
          icon: <NavigationIcons.Refresh />,
          type: 'selection' as const,
          value: refreshInterval,
          options: ['1min', '5min', '15min', '30min', 'manual'],
        },
        {
          id: 'weather-alerts',
          title: 'Weather Alerts',
          subtitle: 'Configure severe weather notifications',
          icon: <NavigationIcons.Warning />,
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
          icon: <NavigationIcons.HeartOutline />,
          type: 'toggle' as const,
          value: batteryOptimization,
        },
        {
          id: 'background-refresh',
          title: 'Background Refresh',
          subtitle: 'Update weather data when app is hidden',
          icon: <NavigationIcons.Menu />,
          type: 'toggle' as const,
          value: backgroundRefresh,
        },
        {
          id: 'haptic-feedback',
          title: 'Haptic Feedback',
          subtitle: 'Vibration feedback for touch interactions',
          icon: <NavigationIcons.Heart />,
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
          icon: <NavigationIcons.Warning />,
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
          icon: <NavigationIcons.Info />,
          type: 'action' as const,
          action: () => handleActionPress('version'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: <NavigationIcons.Share />,
          type: 'action' as const,
          action: () => handleActionPress('feedback'),
        },
      ],
    },
  ];

  // NavigationBar handles header visuals per HIG

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
      className="settings-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {formatOptionText(option)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="ios26-container settings-root">
      {/* Header */}
      <NavigationBar
        title="Settings"
        theme={theme}
        isDark={themeName === 'dark'}
        leadingButton={{
          icon: <NavigationIcons.Back />,
          title: 'Back',
          onPress: onBack,
        }}
      />

      {/* Content */}
      <div className="ios26-container settings-content">
        {settingsSections.map(section => {
          const isExpanded = expandedSections.has(section.title);
          const toggleSection = () => {
            const newExpanded = new Set(expandedSections);
            if (isExpanded) {
              newExpanded.delete(section.title);
            } else {
              newExpanded.add(section.title);
            }
            setExpandedSections(newExpanded);
            haptic.buttonPress();
          };

          return (
            <section
              key={section.title}
              className="ios26-section settings-section"
              aria-labelledby={`section-${section.title}`}
            >
              <button
                className="settings-section-header"
                onClick={toggleSection}
                aria-expanded={isExpanded}
                aria-controls={`section-content-${section.title}`}
                id={`section-${section.title}`}
              >
                <h2 className="settings-section-title">{section.title}</h2>
                <div className="settings-section-toggle">
                  {isExpanded ? (
                    <NavigationIcons.ChevronDown />
                  ) : (
                    <NavigationIcons.ChevronRight />
                  )}
                </div>
              </button>
              {isExpanded && (
                <ul
                  id={`section-content-${section.title}`}
                  className="ios26-card ios26-liquid-glass settings-list"
                  aria-label={section.title}
                >
              {section.items.map((item, index) => (
                <li
                  key={item.id}
                  className={`ios26-list-item settings-list-item${index === section.items.length - 1 ? ' is-last' : ''}`}
                >
                  <div className="settings-icon">{item.icon}</div>

                  <div className="settings-item-main">
                    <div className="settings-item-title">{item.title}</div>
                    {item.subtitle && (
                      <div className="settings-item-subtitle">
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  <div className="settings-item-trailing">
                    {item.type === 'toggle' && (
                      <ToggleSwitch
                        checked={Boolean(item.value)}
                        ariaLabel={item.title}
                        onChange={checked =>
                          handleToggleChange(item.id, checked)
                        }
                        size="medium"
                      />
                    )}
                    {item.type === 'selection' &&
                      item.options &&
                      renderSelection(
                        item.value,
                        item.options,
                        value => handleSelectionChange(item.id, value),
                        item.title
                      )}
                    {item.type === 'action' && (
                      <div className="settings-action-arrow" aria-hidden>
                        <NavigationIcons.ChevronRight />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

              {/* Advanced custom thresholds editor */}
              {section.title === 'Appearance' &&
                colorizeTemps &&
                tempThresholdsEnabled && (
                  <div
                    className="ios26-card ios26-liquid-glass settings-list"
                    role="group"
                    aria-label="Custom temperature thresholds"
                  >
                  <div className="ios26-list-item settings-list-item">
                    <div className="settings-item-main">
                      <div className="settings-item-title">Imperial (°F)</div>
                      <div className="settings-item-subtitle">
                        Warm ≥ and Cool ≤ values
                      </div>
                    </div>
                    <div className="settings-item-trailing settings-inline-group">
                      <label aria-label="Warm threshold Fahrenheit">
                        <input
                          type="number"
                          className="settings-select settings-number"
                          value={tempThresholds.imperial.warm}
                          onChange={e => {
                            const v = Math.round(Number(e.target.value));
                            const warm = Math.max(-100, Math.min(200, v));
                            const cold = Math.min(
                              tempThresholds.imperial.cold,
                              warm
                            );
                            setTempThresholds({
                              ...tempThresholds,
                              imperial: { warm, cold },
                            });
                          }}
                          min={-100}
                          max={200}
                          step={1}
                        />
                      </label>
                      <label aria-label="Cold threshold Fahrenheit">
                        <input
                          type="number"
                          className="settings-select settings-number"
                          value={tempThresholds.imperial.cold}
                          onChange={e => {
                            const v = Math.round(Number(e.target.value));
                            const cold = Math.max(-100, Math.min(200, v));
                            const warm = Math.max(
                              tempThresholds.imperial.warm,
                              cold
                            );
                            setTempThresholds({
                              ...tempThresholds,
                              imperial: { warm, cold },
                            });
                          }}
                          min={-100}
                          max={200}
                          step={1}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="ios26-list-item settings-list-item">
                    <div className="settings-item-main">
                      <div className="settings-item-title">Metric (°C)</div>
                      <div className="settings-item-subtitle">
                        Warm ≥ and Cool ≤ values
                      </div>
                    </div>
                    <div className="settings-item-trailing settings-inline-group">
                      <label aria-label="Warm threshold Celsius">
                        <input
                          type="number"
                          className="settings-select settings-number"
                          value={tempThresholds.metric.warm}
                          onChange={e => {
                            const v = Math.round(Number(e.target.value));
                            const warm = Math.max(-50, Math.min(100, v));
                            const cold = Math.min(
                              tempThresholds.metric.cold,
                              warm
                            );
                            setTempThresholds({
                              ...tempThresholds,
                              metric: { warm, cold },
                            });
                          }}
                          min={-50}
                          max={100}
                          step={1}
                        />
                      </label>
                      <label aria-label="Cold threshold Celsius">
                        <input
                          type="number"
                          className="settings-select settings-number"
                          value={tempThresholds.metric.cold}
                          onChange={e => {
                            const v = Math.round(Number(e.target.value));
                            const cold = Math.max(-50, Math.min(100, v));
                            const warm = Math.max(
                              tempThresholds.metric.warm,
                              cold
                            );
                            setTempThresholds({
                              ...tempThresholds,
                              metric: { warm, cold },
                            });
                          }}
                          min={-50}
                          max={100}
                          step={1}
                        />
                      </label>
                    </div>
                  </div>
                  <div
                    className="ios26-list-item settings-list-item is-last"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setTempThresholds(getProfileDefaults(tempColorProfile))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTempThresholds(getProfileDefaults(tempColorProfile));
                      }
                    }}
                    aria-label="Reset thresholds to profile defaults"
                  >
                    <div className="settings-item-main">
                      <div className="settings-item-title">
                        Reset to Profile Defaults
                      </div>
                      <div className="settings-item-subtitle">
                        Restores warm/cool values for {tempColorProfile} profile
                      </div>
                    </div>
                    <div className="settings-action-arrow" aria-hidden>
                      <NavigationIcons.ChevronRight />
                    </div>
                  </div>
                  <div className="settings-hint" aria-live="polite">
                    These values control when temperatures are shown as warm (≥)
                    or cool (≤). Overrides apply across the app when enabled.
                  </div>
                </div>
              )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsScreen;
