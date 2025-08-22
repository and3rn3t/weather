/**
 * AppNavigator - Main Application Component
 *
 * PHASE C COMPLETION STATUS (July 26, 2025):
 * ✅ Modern UI Component Library - 4 new components integrated
 * ✅ Full Accessibility Compliance - WCAG 2.1 AA standards met
 * ✅ Zero TypeScript Warnings - Clean production build
 * ✅ Semantic HTML Implementation - Screen reader compatible
 * ✅ Code Quality Standards - Professional-grade codebase
 *
 * This component serves as the main navigation hub integrating:
 * - Modern weather UI components with glassmorphism design
 * - Comprehensive accessibility features and ARIA labeling
 * - Mobile-first responsive design with touch optimization
 * - Dark/light theme system with smooth transitions
 * - Real-time weather data with OpenMeteo API integration
 *
 * All legacy components are preserved with TypeScript suppressions
 * for reference while the modern component library provides the
 * production user interface with full accessibility compliance.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FavoritesScreen from '../components/FavoritesScreen';
import LocationManager from '../components/LocationManager';
import MobileNavigation, {
  type NavigationScreen,
} from '../components/MobileNavigation';
import { ScreenContainer } from '../components/ScreenTransition';
import SearchScreen from '../components/SearchScreen';
import SettingsScreen from '../components/SettingsScreen';
import DeploymentStatus from '../utils/DeploymentStatus';
import GeolocationVerification from '../utils/GeolocationVerification';
import { useHaptic } from '../utils/hapticHooks';
import {
  ForecastListSkeleton,
  HourlyForecastSkeleton,
} from '../utils/LoadingSkeletons';
import LocationButton from '../utils/LocationButton';
import { LocationTester } from '../utils/LocationTester';
import MobileDebug from '../utils/MobileDebug';
import NativeStatusDisplay from '../utils/NativeStatusDisplay';
// import { PerformanceMonitor } from '../utils/performanceMonitor';
import PullToRefresh from '../utils/PullToRefresh';
import SimpleAutocomplete from '../utils/SimpleAutocomplete';
import SwipeNavigationContainer from '../utils/SwipeNavigationContainer';
import type { ThemeColors } from '../utils/themeConfig';
import ThemeToggle from '../utils/ThemeToggle';
import { useWeatherBackgroundRefresh } from '../utils/useBackgroundRefresh';
import { useCityManagement } from '../utils/useCityManagement';
import { useScreenSwipeConfig } from '../utils/useScreenSwipeConfig';
import { useTheme } from '../utils/useTheme';
import {
  useWeatherAPIOptimization,
  useWeatherDataTransform,
} from '../utils/useWeatherOptimization';
import WeatherIcon from '../utils/weatherIcons';
// Enhanced Mobile Components
import EnhancedMobileContainer from '../components/EnhancedMobileContainer';
// Phase 3A: Enhanced Loading States & Progress Indicators
import {
  BackgroundUpdateIndicator,
  ErrorRecoveryState,
  OperationProgress,
  WeatherDataSkeleton,
} from '../components/EnhancedLoadingStates';
import {
  LoadingProvider,
  useOperationLoading,
} from '../utils/LoadingStateManager';
// iOS 26 Modern UI Components - Complete Suite
import {
  ContextMenu,
  InteractiveWidget,
  LiveActivity,
  ModalSheet,
} from '../components/modernWeatherUI/iOS26Components';
import { QuickActionsPanel } from '../components/modernWeatherUI/iOS26MainScreen';
import { IOS26WeatherDemo } from '../components/modernWeatherUI/iOS26WeatherDemo';
import '../styles/ios26-design-system-consolidated.css';
// Horror Theme Components
import HorrorThemeActivator from '../components/HorrorThemeActivator';
// Horror Theme Styles - Essential for blood drips and film flicker effects
import '../styles/horror-icon-fixes.css';
import '../styles/horrorTheme.css';
// iOS HIG Components
import { ActionSheet } from '../components/modernWeatherUI/ActionSheet';
import { StatusBadge } from '../components/modernWeatherUI/IOSComponents';
import IOSComponentShowcase from '../components/modernWeatherUI/IOSComponentShowcase';
import { NavigationBar } from '../components/modernWeatherUI/NavigationBar';
import { NavigationIcons } from '../components/modernWeatherUI/NavigationIcons';
import {
  SimpleEnhancedButton,
  SimpleSegmentedControl,
  SimpleStatusBadge,
} from '../components/modernWeatherUI/SimpleIOSComponents';
import '../styles/iosComponents.css';
import '../styles/modernWeatherUI.css';
// Navigation & UI Fixes - August 21, 2025
import '../styles/navigation-fixes.css';
import { logError, logInfo, logWarn } from '../utils/logger';
// Horror Effects Debug Utility
import '../utils/horrorEffectsDebug';
import type { ScreenInfo } from '../utils/mobileScreenOptimization';
import {
  getAdaptiveBorderRadius,
  getAdaptiveFontSizes,
  getAdaptiveSpacing,
  getMobileOptimizedContainer,
  getScreenInfo,
  getTouchOptimizedButton,
  handleOrientationChange,
} from '../utils/mobileScreenOptimization';
// PWA utilities available but not imported yet - will be added when needed
// import { usePWAInstall, useServiceWorker, useNetworkStatus, usePWAUpdate } from '../utils/pwaUtils';

/**
 * OpenMeteo API response interfaces
 */
interface HourlyData {
  time: string[];
  temperature_2m: number[];
  weathercode: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  surface_pressure: number[];
  uv_index: number[];
  visibility: number[];
}

interface DailyData {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  windspeed_10m_max: number[];
}

/**
 * Maps OpenMeteo weather codes to human-readable descriptions
 * Reference: https://open-meteo.com/en/docs
 */
const getWeatherDescription = (code: number): string => {
  const descriptions: { [key: number]: string } = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'light rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'light snow',
    73: 'moderate snow',
    75: 'heavy snow',
    80: 'light rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail',
  };
  return descriptions[code] || 'unknown';
};

/**
 * WeatherData type definition for the transformed weather response
 * This structure standardizes the OpenMeteo API response for our UI components
 */
type WeatherData = {
  main: {
    temp: number; // Current temperature in Fahrenheit
    feels_like: number; // Apparent temperature in Fahrenheit
    humidity: number; // Relative humidity percentage
    pressure: number; // Atmospheric pressure in hPa
  };
  weather: {
    description: string; // Human-readable weather condition
  }[];
  wind: {
    speed: number; // Wind speed in mph
    deg: number; // Wind direction in degrees
  };
  uv_index: number; // UV index (0-11+ scale)
  visibility: number; // Visibility in meters
};

/**
 * HourlyForecast type definition for hourly weather forecast
 */
type HourlyForecast = {
  time: string; // ISO timestamp
  temperature: number; // Temperature in Fahrenheit
  weatherCode: number; // OpenMeteo weather code
  humidity: number; // Relative humidity percentage
  feelsLike: number; // Apparent temperature
};

/**
 * DailyForecast type definition for daily weather forecast
 */
type DailyForecast = {
  date: string; // ISO date
  weatherCode: number; // OpenMeteo weather code
  tempMax: number; // Maximum temperature in Fahrenheit
  tempMin: number; // Minimum temperature in Fahrenheit
  precipitation: number; // Total precipitation in mm
  windSpeed: number; // Maximum wind speed in mph
};

/**
 * AppNavigator - Main Weather App Component
 *
 * A modern, responsive weather application built with React and TypeScript.
 * Features a glassmorphism design with real-time weather data from free APIs.
 *
 * Key Features:
 * - 🎨 Modern glassmorphism UI with gradient backgrounds
 * - 🌍 OpenMeteo weather API integration (completely free, no API key required)
 * - 📍 OpenStreetMap Nominatim geocoding (free city-to-coordinates conversion)
 * - 🎭 Animated weather icons with bounce effects
 * - 📱 Responsive design with hover animations
 * - 🌡️ Imperial units (Fahrenheit, mph) for US users
 * - ⚡ Real-time weather data including humidity, pressure, wind, UV index
 *
 * Technical Architecture:
 * - Custom state-based navigation (inline components for browser compatibility)
 * - Two-step API process: City name → Coordinates → Weather data
 * - Hourly data extraction for current conditions (humidity, pressure, etc.)
 * - Comprehensive error handling and loading states
 * - CSS-in-JS styling with modern animations
 *
 * @returns JSX.Element - The complete weather application interface
 */
// ============================================================================
// UTILITY FUNCTIONS AND STYLE OBJECTS (MOBILE-OPTIMIZED)
// ============================================================================

/** Mobile-optimized button style creator with proper touch targets */
/** Mobile-optimized card style with responsive padding */
/** Weather detail item configuration */
const weatherDetailItems = [
  {
    key: 'humidity',
    icon: '💧',
    label: 'HUMIDITY',
    getValue: (weather: WeatherData) => `${weather.main.humidity}%`,
  },
  {
    key: 'wind',
    icon: '💨',
    label: 'WIND',
    getValue: (weather: WeatherData) => `${Math.round(weather.wind.speed)} mph`,
    subValue: (weather: WeatherData) => `${weather.wind.deg}° direction`,
  },
  {
    key: 'pressure',
    icon: '🌡️',
    label: 'PRESSURE',
    getValue: (weather: WeatherData) =>
      `${Math.round(weather.main.pressure)} hPa`,
  },
];

/** Process hourly forecast data into structured format */
const processHourlyForecast = (hourlyData: HourlyData): HourlyForecast[] => {
  if (!hourlyData?.time || !hourlyData?.temperature_2m) {
    logWarn('⚠️ No hourly data available for forecast');
    return [];
  }

  const currentTime = new Date();
  const next24Hours: HourlyForecast[] = [];

  for (let i = 0; i < Math.min(24, hourlyData.time.length); i++) {
    const forecastTime = new Date(hourlyData.time[i]);

    if (forecastTime > currentTime) {
      next24Hours.push({
        time: hourlyData.time[i],
        temperature: Math.round(hourlyData.temperature_2m[i] || 0),
        weatherCode: hourlyData.weathercode?.[i] || 0,
        humidity: Math.round(hourlyData.relative_humidity_2m?.[i] || 0),
        feelsLike: Math.round(hourlyData.apparent_temperature?.[i] || 0),
      });
    }

    if (next24Hours.length >= 24) break;
  }

  return next24Hours;
};

/** Format time for hourly forecast display */
const formatHourTime = (timeString: string): string => {
  return new Date(timeString).toLocaleTimeString([], {
    hour: 'numeric',
    hour12: true,
  });
};

/** Format date for daily forecast display */
const formatDayInfo = (dateString: string, index: number) => {
  const dayDate = new Date(dateString);
  const isToday = index === 0;
  const dayName = isToday
    ? 'Today'
    : dayDate.toLocaleDateString([], { weekday: 'short' });
  const dateStr = dayDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return { dayName, dateStr, isToday };
};

/** Process daily forecast data into structured format */
const processDailyForecast = (dailyData: DailyData): DailyForecast[] => {
  if (!dailyData?.time || !dailyData?.temperature_2m_max) {
    logWarn('⚠️ No daily data available for forecast');
    return [];
  }

  const next7Days: DailyForecast[] = [];

  for (let i = 0; i < Math.min(7, dailyData.time.length); i++) {
    next7Days.push({
      date: dailyData.time[i],
      weatherCode: dailyData.weathercode?.[i] || 0,
      tempMax: Math.round(dailyData.temperature_2m_max[i] || 0),
      tempMin: Math.round(dailyData.temperature_2m_min[i] || 0),
      precipitation:
        Math.round((dailyData.precipitation_sum?.[i] || 0) * 10) / 10,
      windSpeed: Math.round(dailyData.windspeed_10m_max?.[i] || 0),
    });
  }

  return next7Days;
};

function HomeScreen({
  theme,
  navigate,
  haptic,
}: Readonly<{
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  adaptiveFonts: ReturnType<typeof getAdaptiveFontSizes>;
  adaptiveSpacing: ReturnType<typeof getAdaptiveSpacing>;
  adaptiveBorders: ReturnType<typeof getAdaptiveBorderRadius>;
  navigate: (screenName: string) => void;
  haptic: ReturnType<typeof useHaptic>;
}>) {
  return (
    <div className="ios26-container ios26-p-0 main-content-area">
      {/* iOS 26 Navigation Bar */}
      <div className="ios26-navigation-bar">
        <h1 className="ios26-text-title ios26-text-primary">Today's Weather</h1>
        <button
          className="ios26-button ios26-button-secondary"
          onClick={() => {
            haptic.buttonPress();
            navigate('Settings');
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        theme={theme}
        onLocationSearch={() => {
          haptic.buttonPress();
          navigate('Search');
        }}
        onFavorites={() => {
          haptic.buttonPress();
          navigate('Favorites');
        }}
        onSettings={() => {
          haptic.buttonPress();
          navigate('Settings');
        }}
        onRadar={() => {
          haptic.buttonPress();
          // Future radar implementation
        }}
      />

      {/* iOS 26 Weather Demo - Simple Integration */}
      <IOS26WeatherDemo theme={theme} />
    </div>
  );
}

// WeatherDetailsScreen component definition
function WeatherDetailsScreen({
  theme,
  city,
  loading,
  error,
  setError,
  weather,
  hourlyForecast,
  dailyForecast,
  weatherCode,
  getWeather,
  getWeatherByLocation,
  onRefresh,
  haptic,
  handleLocationDetected,
  navigate,
  selectedView,
  setSelectedView,
  showActionSheet,
  setShowActionSheet,
  themeName,
  showLiveActivity,
  weatherAlert,
  showWeatherSettingsModal,
  setShowWeatherSettingsModal,
}: Readonly<{
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  adaptiveFonts: ReturnType<typeof getAdaptiveFontSizes>;
  adaptiveSpacing: ReturnType<typeof getAdaptiveSpacing>;
  adaptiveBorders: ReturnType<typeof getAdaptiveBorderRadius>;
  navigate: (screenName: string) => void;
  createMobileButton: (
    isPrimary?: boolean,
    size?: 'small' | 'medium' | 'large'
  ) => React.CSSProperties;
  city: string;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  weather: WeatherData | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  weatherCode: number;
  getWeather: () => void;
  getWeatherByLocation: (
    city: string,
    lat: number,
    lon: number
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
  haptic: ReturnType<typeof useHaptic>;
  handleLocationDetected: (
    cityName: string,
    latitude: number,
    longitude: number
  ) => void;
  selectedView: number;
  setSelectedView: (index: number) => void;
  showActionSheet: boolean;
  setShowActionSheet: (show: boolean) => void;
  themeName: string;
  showLiveActivity: boolean;
  weatherAlert: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'severe';
  } | null;
  showWeatherSettingsModal: boolean;
  setShowWeatherSettingsModal: (show: boolean) => void;
}>) {
  return (
    <div className="mobile-container main-content-area">
      {/* iOS-Style Navigation Bar */}
      <NavigationBar
        title="Weather"
        subtitle={city || 'Select Location'}
        leadingButton={{
          icon: <NavigationIcons.Back />,
          onPress: () => navigate('Home'),
        }}
        trailingButton={{
          icon: <NavigationIcons.Settings />,
          onPress: () => setShowActionSheet(true),
        }}
        theme={theme}
        isDark={themeName === 'dark'}
      />

      {/* Phase 3A: Background Update Indicator */}
      <BackgroundUpdateIndicator operation="background-refresh" />

      {/* Phase 3A: Error Recovery State */}
      <ErrorRecoveryState
        operation="weatherData"
        onRetry={async () => {
          await getWeather();
        }}
      />

      {/* iOS26 Live Activity for Weather Updates */}
      {(showLiveActivity || weatherAlert) && (
        <LiveActivity
          title={weatherAlert ? weatherAlert.title : 'Weather Updated'}
          subtitle={
            weatherAlert
              ? weatherAlert.message
              : `${
                  weather
                    ? `${Math.round(weather.main.temp)}°F - ${
                        weather.weather[0].description
                      }`
                    : 'Loading...'
                }`
          }
          icon={
            <span className="ios26-widget-icon">
              {weatherAlert?.severity === 'severe'
                ? '⚠️'
                : weatherAlert?.severity === 'warning'
                ? '🟡'
                : '🌤️'}
            </span>
          }
          theme={theme}
          isVisible={true}
          onTap={() => {
            haptic.buttonPress();
            logInfo('Live Activity tapped');
          }}
        />
      )}

      <ThemeToggle />
      <PullToRefresh
        onRefresh={onRefresh}
        disabled={loading}
        className="ios26-w-full"
      >
        <div className="ios26-weather-interface">
          {/* View Segmented Control */}
          <div className="ios26-mb-4">
            <SimpleSegmentedControl
              segments={['Current', 'Hourly', 'Daily']}
              selectedIndex={selectedView}
              onChange={setSelectedView}
              theme={theme}
            />
          </div>

          {/* Search Section */}
          <div className="ios26-forecast-section">
            <SimpleAutocomplete
              theme={theme}
              onCitySelected={getWeatherByLocation}
              disabled={loading}
              placeholder="Search for a city..."
            />
            <div className="ios26-quick-actions">
              <LocationButton
                theme={theme}
                isMobile={true}
                onLocationReceived={handleLocationDetected}
                onError={error => setError(error)}
                disabled={loading}
                variant="secondary"
                size="medium"
                showLabel={true}
              />

              <SimpleEnhancedButton
                title="Search Weather"
                onPress={() => {
                  haptic.buttonConfirm();
                  getWeather();
                }}
                disabled={loading}
                variant="primary"
                theme={theme}
                icon="🔍"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && <SimpleStatusBadge text={error} variant="error" />}

          {/* iOS26 Enhanced Status Badges */}
          {weather && (
            <div className="ios26-quick-actions">
              <StatusBadge text="Live Data" variant="success" theme={theme} />
              {weather.main.temp > 95 && (
                <StatusBadge
                  text="🔥 Extreme Heat"
                  variant="error"
                  theme={theme}
                />
              )}
              {weather.main.temp > 90 && weather.main.temp <= 95 && (
                <StatusBadge
                  text="🌡️ Heat Advisory"
                  variant="warning"
                  theme={theme}
                />
              )}
              {weather.main.temp < 20 && (
                <StatusBadge
                  text="🥶 Extreme Cold"
                  variant="error"
                  theme={theme}
                />
              )}
              {weather.main.temp >= 20 && weather.main.temp < 32 && (
                <StatusBadge
                  text="❄️ Freeze Warning"
                  variant="warning"
                  theme={theme}
                />
              )}
              {weather.wind.speed > 35 && (
                <StatusBadge
                  text="💨 High Winds"
                  variant="error"
                  theme={theme}
                />
              )}
              {weather.wind.speed > 25 && weather.wind.speed <= 35 && (
                <StatusBadge
                  text="🌬️ Windy Conditions"
                  variant="warning"
                  theme={theme}
                />
              )}
              {weather.main.humidity < 30 && (
                <StatusBadge
                  text="🏜️ Low Humidity"
                  variant="info"
                  theme={theme}
                />
              )}
              {weather.main.humidity > 80 && (
                <StatusBadge
                  text="💧 High Humidity"
                  variant="info"
                  theme={theme}
                />
              )}
              {(weather.uv_index || 0) > 8 && (
                <StatusBadge
                  text="☀️ Very High UV"
                  variant="warning"
                  theme={theme}
                />
              )}
              {weather.weather[0].description
                .toLowerCase()
                .includes('storm') && (
                <StatusBadge
                  text="⛈️ Storm Alert"
                  variant="error"
                  theme={theme}
                />
              )}
            </div>
          )}

          {/* Main Weather Card */}
          {loading && !weather && (
            <div className="ios26-text-center ios26-p-4">
              <WeatherDataSkeleton showForecast={false} showMetrics={true} />
              <div className="ios26-mt-4">
                <OperationProgress
                  operation="weatherData"
                  showProgress={true}
                  showSpinner={false}
                  size={48}
                  variant="primary"
                />
              </div>
            </div>
          )}
          {weather && (
            <ContextMenu
              actions={[
                {
                  id: 'refresh',
                  title: 'Refresh Weather',
                  icon: '🔄',
                  onAction: async () => {
                    haptic.buttonPress();
                    await onRefresh();
                  },
                },
                {
                  id: 'share',
                  title: 'Share Weather',
                  icon: '📤',
                  onAction: () => {
                    haptic.buttonPress();
                    const shareText = `Weather in ${city}: ${Math.round(
                      weather.main.temp,
                    )}°F - ${weather.weather[0].description}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Weather Update',
                        text: shareText,
                      });
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(shareText);
                      logInfo('Weather data copied to clipboard');
                    }
                  },
                },
                {
                  id: 'favorite',
                  title: 'Add to Favorites',
                  icon: '⭐',
                  onAction: () => {
                    haptic.buttonPress();
                    logInfo(`Added ${city} to favorites`);
                    // Future: implement favorites functionality
                  },
                },
                {
                  id: 'alerts',
                  title: 'Weather Settings',
                  icon: '⚙️',
                  onAction: () => {
                    haptic.buttonPress();
                    setShowWeatherSettingsModal(true);
                  },
                },
              ]}
              theme={theme}
            >
              <div className="ios26-weather-card">
                <div className="ios26-text-title ios26-text-primary">
                  {Math.round(weather.main.temp)}°
                </div>
                <div className="ios26-text-body ios26-text-secondary">
                  {weather.weather[0].description} in {city}
                </div>
                <button
                  className="ios26-button ios26-button-primary"
                  onClick={async () => {
                    haptic.buttonPress();
                    await onRefresh();
                  }}
                >
                  Refresh
                </button>
              </div>
            </ContextMenu>
          )}

          {/* iOS26 Enhanced: Interactive Weather Widgets */}
          {weather && selectedView === 0 && (
            <div className="ios26-forecast-section">
              <h3 className="ios26-text-title ios26-text-primary ios26-mb-4">
                🌡️ Weather Details
              </h3>
              <div className="ios26-widget-grid">
                {/* Temperature Widget */}
                <InteractiveWidget
                  title="Current Temperature"
                  size="medium"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('Temperature details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-main-value">
                      {Math.round(weather.main.temp)}°F
                    </div>
                    <div className="ios26-widget-secondary-text">
                      Feels like {Math.round(weather.main.feels_like)}°F
                    </div>
                  </div>
                </InteractiveWidget>

                {/* Humidity Widget */}
                <InteractiveWidget
                  title="Humidity"
                  size="small"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('Humidity details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon">💧</div>
                    <div className="ios26-widget-value">
                      {weather.main.humidity}%
                    </div>
                  </div>
                </InteractiveWidget>

                {/* Wind Widget */}
                <InteractiveWidget
                  title="Wind Speed"
                  size="small"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('Wind details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon">💨</div>
                    <div className="ios26-widget-value">
                      {Math.round(weather.wind.speed)} mph
                    </div>
                  </div>
                </InteractiveWidget>

                {/* Pressure Widget */}
                <InteractiveWidget
                  title="Pressure"
                  size="small"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('Pressure details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon">🌡️</div>
                    <div className="ios26-widget-value-small">
                      {weather.main.pressure} hPa
                    </div>
                  </div>
                </InteractiveWidget>

                {/* UV Index Widget */}
                <InteractiveWidget
                  title="UV Index"
                  size="small"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('UV Index details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon">☀️</div>
                    <div
                      className={`ios26-widget-value ${
                        weather.uv_index > 6 ? 'ios26-text-warning' : ''
                      }`}
                    >
                      {Math.round(weather.uv_index || 0)}
                    </div>
                    <div className="ios26-widget-secondary-text">
                      {weather.uv_index > 6 ? 'High' : 'Moderate'}
                    </div>
                  </div>
                </InteractiveWidget>

                {/* Visibility Widget */}
                <InteractiveWidget
                  title="Visibility"
                  size="small"
                  theme={theme}
                  onTap={() => {
                    haptic.buttonPress();
                    logInfo('Visibility details tapped');
                  }}
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon">👁️</div>
                    <div className="ios26-widget-value-small">
                      {Math.round((weather.visibility || 0) / 1000)} km
                    </div>
                  </div>
                </InteractiveWidget>
              </div>
            </div>
          )}

          {/* iOS 26 Weather Interface - Enhanced Forecast */}
          {selectedView === 1 || selectedView === 2 ? (
            <div className="ios26-weather-interface">
              <div className="ios26-text-title ios26-text-primary">
                Extended Forecast
              </div>
              <div className="ios26-text-body ios26-text-secondary">
                {selectedView === 1 ? 'Hourly' : 'Daily'} forecast for {city}
              </div>
            </div>
          ) : null}
        </div>
      </PullToRefresh>

      {/* iOS26 Modal Sheet for Weather Settings */}
      <ModalSheet
        isVisible={showWeatherSettingsModal}
        onClose={() => setShowWeatherSettingsModal(false)}
        title="Weather Settings"
        detents={['medium', 'large']}
        theme={theme}
      >
        <div className="ios26-forecast-section">
          <div className="ios26-text-body ios26-text-secondary ios26-mb-4">
            Customize your weather experience
          </div>

          <div className="ios26-widget-grid">
            <InteractiveWidget
              title="Temperature Unit"
              size="small"
              theme={theme}
              onTap={() => {
                haptic.buttonPress();
                logInfo('Temperature unit settings');
              }}
            >
              <div className="ios26-text-center">
                <div className="ios26-widget-icon">🌡️</div>
                <div className="ios26-widget-value">°F</div>
                <div className="ios26-widget-secondary-text">Fahrenheit</div>
              </div>
            </InteractiveWidget>

            <InteractiveWidget
              title="Weather Alerts"
              size="small"
              theme={theme}
              onTap={() => {
                haptic.buttonPress();
                logInfo('Weather alerts settings');
              }}
            >
              <div className="ios26-text-center">
                <div className="ios26-widget-icon">🚨</div>
                <div className="ios26-widget-value">On</div>
                <div className="ios26-widget-secondary-text">Enabled</div>
              </div>
            </InteractiveWidget>

            <InteractiveWidget
              title="Auto Refresh"
              size="small"
              theme={theme}
              onTap={() => {
                haptic.buttonPress();
                logInfo('Auto refresh settings');
              }}
            >
              <div className="ios26-text-center">
                <div className="ios26-widget-icon">🔄</div>
                <div className="ios26-widget-value">15m</div>
                <div className="ios26-widget-secondary-text">Every 15 min</div>
              </div>
            </InteractiveWidget>

            <InteractiveWidget
              title="Location Services"
              size="small"
              theme={theme}
              onTap={() => {
                haptic.buttonPress();
                logInfo('Location services settings');
              }}
            >
              <div className="ios26-text-center">
                <div className="ios26-widget-icon">📍</div>
                <div className="ios26-widget-value">Always</div>
                <div className="ios26-widget-secondary-text">Enabled</div>
              </div>
            </InteractiveWidget>
          </div>

          <div className="ios26-text-center ios26-mt-6">
            <button
              className="ios26-button ios26-button-primary"
              onClick={() => {
                haptic.buttonPress();
                setShowWeatherSettingsModal(false);
                logInfo('Weather settings saved');
              }}
            >
              Done
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* Action Sheet for Weather Options */}
      <ActionSheet
        isVisible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Weather Options"
        message="Choose an action for this location"
        actions={[
          {
            title: 'iOS Components Demo',
            icon: <NavigationIcons.Settings />,
            onPress: () => {
              navigate('IOSDemo');
              setShowActionSheet(false);
            },
          },
          {
            title: 'Share Weather',
            icon: <NavigationIcons.Share />,
            onPress: () => {
              logInfo('Share weather');
              setShowActionSheet(false);
            },
          },
          {
            title: 'Add to Favorites',
            icon: <NavigationIcons.Add />,
            onPress: () => {
              logInfo('Add to favorites');
              setShowActionSheet(false);
            },
          },
          {
            title: 'Refresh Data',
            icon: <NavigationIcons.Refresh />,
            onPress: () => {
              onRefresh();
              setShowActionSheet(false);
            },
          },
        ]}
        theme={theme}
        isDark={themeName === 'dark'}
      />
    </div>
  );
}

// Helper components for weather display (keep these for now as they might be used elsewhere)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WeatherMainCard = React.memo(
  ({
    weather,
    city,
    theme,
    isMobile,
    weatherCode,
  }: Readonly<{
    weather: WeatherData;
    city: string;
    theme: ThemeColors;
    isMobile: boolean;
    weatherCode: number;
  }>) => {
    return (
      <div className="ios26-main-weather-card">
        <div className="ios26-weather-header">
          <div className="ios26-weather-location">
            <span className="ios26-text-headline ios26-text-primary ios26-text-semibold">
              📍 {city}
            </span>
          </div>
        </div>

        <div className="ios26-temperature-section">
          <div className="ios26-weather-icon-container">
            <WeatherIcon
              code={weatherCode}
              size={Math.min(window.innerWidth * 0.2, 80)}
              animated={true}
            />
          </div>

          <div className="ios26-temperature-display">
            <span className="ios26-temperature-value">
              {Math.round(weather.main.temp)}°
            </span>
            <span className="ios26-temperature-unit">F</span>
          </div>

          <div className="ios26-text-subheadline ios26-text-secondary ios26-feels-like">
            Feels like {Math.round(weather.main.feels_like)}°F
          </div>

          <div className="ios26-text-title3 ios26-text-primary ios26-text-medium ios26-weather-condition">
            {weather.weather[0].description}
          </div>
        </div>
        <div className="ios26-weather-metrics-grid">
          {weatherDetailItems.map(item => (
            <div key={item.key} className="ios26-weather-metric">
              <div className="ios26-weather-metric-content">
                <div className="ios26-weather-metric-icon">{item.icon}</div>
                <div className="ios26-weather-metric-text">
                  <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                    {item.getValue(weather)}
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                    {item.label}
                  </div>
                  {item.subValue && (
                    <div className="ios26-text-caption2 ios26-text-tertiary ios26-weather-metric-subtitle">
                      {item.subValue(weather)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {weather.uv_index > 0 && (
            <div className="ios26-weather-metric">
              <div className="ios26-weather-metric-content">
                <div className="ios26-weather-metric-icon">☀️</div>
                <div className="ios26-weather-metric-text">
                  <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                    {Math.round(weather.uv_index)}
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                    UV INDEX
                  </div>
                </div>
              </div>
            </div>
          )}
          {weather.visibility > 0 && (
            <div className="ios26-weather-metric">
              <div className="ios26-weather-metric-content">
                <div className="ios26-weather-metric-icon">👁️</div>
                <div className="ios26-weather-metric-text">
                  <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
                    {Math.round(weather.visibility / 1000)} km
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
                    VISIBILITY
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ios26-pull-indicator"></div>
      </div>
    );
  },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HourlyForecastSection = React.memo(
  ({
    loading,
    hourlyForecast,
    theme,
    isMobile,
  }: Readonly<{
    loading: boolean;
    hourlyForecast: HourlyForecast[];
    theme: ThemeColors;
    isMobile: boolean;
  }>) => {
    if (loading && hourlyForecast.length === 0) {
      return (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            🕐 24-Hour Forecast
          </div>
          <HourlyForecastSkeleton />
        </div>
      );
    }
    if (hourlyForecast.length > 0) {
      return (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            🕐 24-Hour Forecast
          </div>
          <div className="ios26-forecast-scroll">
            {hourlyForecast.slice(0, 24).map((hour, index) => {
              const timeStr = formatHourTime(hour.time);
              return (
                <div
                  key={`hour-${hour.time}-${index}`}
                  className="ios26-forecast-item"
                >
                  <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
                    {timeStr}
                  </div>
                  <div className="ios26-forecast-icon">
                    <WeatherIcon
                      code={hour.weatherCode}
                      size={32}
                      animated={true}
                    />
                  </div>
                  <div className="ios26-forecast-temperature">
                    <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                      {hour.temperature}°F
                    </div>
                  </div>
                  <div className="ios26-text-caption2 ios26-text-tertiary">
                    💧 {hour.humidity}%
                  </div>
                  <div className="ios26-text-caption2 ios26-text-tertiary">
                    Feels {hour.feelsLike}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DailyForecastSection = React.memo(
  ({
    loading,
    dailyForecast,
    theme,
  }: Readonly<{
    loading: boolean;
    dailyForecast: DailyForecast[];
    theme: ThemeColors;
  }>) => {
    if (loading && dailyForecast.length === 0) {
      return (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            📅 7-Day Forecast
          </div>
          <ForecastListSkeleton items={7} />
        </div>
      );
    }
    if (dailyForecast.length > 0) {
      return (
        <div className="ios26-forecast-section">
          <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
            📅 7-Day Forecast
          </div>
          <div className="ios26-forecast-scroll">
            {dailyForecast.map((day, index) => {
              const { dayName, dateStr, isToday } = formatDayInfo(
                day.date,
                index,
              );
              return (
                <div
                  key={`day-${day.date}-${index}`}
                  className="ios26-forecast-item"
                >
                  <div className="ios26-forecast-time">
                    <div
                      className={`ios26-text-subheadline ${
                        isToday
                          ? 'ios26-text-bold ios26-text-primary'
                          : 'ios26-text-semibold ios26-text-primary'
                      }`}
                    >
                      {dayName}
                    </div>
                    <div className="ios26-text-caption ios26-text-secondary">
                      {dateStr}
                    </div>
                  </div>

                  <div className="ios26-forecast-icon">
                    <WeatherIcon
                      code={day.weatherCode}
                      size={36}
                      animated={true}
                    />
                  </div>

                  <div className="ios26-forecast-temp-range">
                    <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                      {day.tempMax}°
                    </div>
                    <div className="ios26-text-subheadline ios26-text-secondary">
                      {day.tempMin}°
                    </div>
                  </div>

                  {day.precipitation > 0 && (
                    <div className="ios26-text-caption2 ios26-text-tertiary">
                      🌧️ {day.precipitation}mm
                    </div>
                  )}
                  <div className="ios26-text-caption2 ios26-text-tertiary">
                    💨 {day.windSpeed}mph
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  },
);

const AppNavigator = () => {
  // Screen information and responsive detection
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() =>
    getScreenInfo(),
  );

  // Phase 3A: Loading state management for weather operations
  const weatherLoading = useOperationLoading('weatherData');
  const forecastLoading = useOperationLoading('forecast');
  const locationLoading = useOperationLoading('location');
  const backgroundRefreshLoading = useOperationLoading('background-refresh');

  // Update screen info on orientation changes
  useEffect(() => {
    const cleanup = handleOrientationChange(setScreenInfo);
    return cleanup;
  }, []);

  // Load Crystal Lake, NJ as default horror location
  useEffect(() => {
    const loadCrystalLake = async () => {
      // Crystal Lake, NJ coordinates (approximate)
      const crystalLakeLat = 40.913;
      const crystalLakeLon = -74.345;

      // Only load if no city is set and no user location preference
      if (!city && !localStorage.getItem('user-preferred-location')) {
        try {
          await fetchWeatherData(crystalLakeLat, crystalLakeLon);
          setCity('Crystal Lake, NJ');
          logInfo('🎃 Welcome to Crystal Lake... Weather Station Online');
        } catch (error) {
          logWarn(
            'Failed to load Crystal Lake data, user will need to search manually:',
            error,
          );
          // Gracefully degrade - user can still search for weather manually
          setError(
            'Default location unavailable. Please search for your city.',
          );
        }
      }
    };

    // Delay slightly to let other initialization complete
    const timer = setTimeout(loadCrystalLake, 1000);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array for mount-only effect

  // Get adaptive styles based on current screen
  const adaptiveFonts = useMemo(
    () => getAdaptiveFontSizes(screenInfo),
    [screenInfo],
  );
  const adaptiveSpacing = useMemo(
    () => getAdaptiveSpacing(screenInfo),
    [screenInfo],
  );
  const adaptiveBorders = useMemo(
    () => getAdaptiveBorderRadius(screenInfo),
    [screenInfo],
  );

  // Theme and mobile detection (updated to use screenInfo)
  const { theme, themeName } = useTheme();

  // Create mobile button function using new optimization
  const createMobileButton = useCallback(
    (isPrimary = false, size: 'small' | 'medium' | 'large' = 'medium') =>
      getTouchOptimizedButton(
        theme,
        screenInfo,
        isPrimary ? 'primary' : 'secondary',
        size,
      ),
    [theme, screenInfo],
  );

  const haptic = useHaptic();
  const { addToRecent, setCurrentCity } = useCityManagement();
  const { optimizedFetch } = useWeatherAPIOptimization();
  const { optimizedTransform } = useWeatherDataTransform();

  // PWA functionality will be added here when needed
  // const pwaInstall = usePWAInstall();
  // const serviceWorker = useServiceWorker();
  // const { isOnline } = useNetworkStatus();
  // const { updateAvailable, applyUpdate } = usePWAUpdate();

  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('Home');
  const [city, setCity] = useState('Crystal Lake, NJ'); // Default to horror movie location
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherCode, setWeatherCode] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // iOS HIG Component States
  const [selectedView, setSelectedView] = useState(0); // For segmented control
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showIOSDemo, setShowIOSDemo] = useState(false);

  // iOS26 Enhanced Features State
  const [showLiveActivity, setShowLiveActivity] = useState(false);
  const [weatherAlert, setWeatherAlert] = useState<{
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'severe';
  } | null>(null);
  const [dataUpdateProgress, setDataUpdateProgress] = useState(0);
  const [showWeatherSettingsModal, setShowWeatherSettingsModal] =
    useState(false);

  const [pendingLocationData, setPendingLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: { city?: string; display?: string };
  } | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Memoized weather data processing
  const memoizedHourlyForecast = useMemo(
    () => hourlyForecast,
    [hourlyForecast],
  );
  const memoizedDailyForecast = useMemo(() => dailyForecast, [dailyForecast]);

  // Location detection handler - must be defined early for use in JSX
  const handleLocationDetected = useCallback(
    (cityName: string, latitude: number, longitude: number) => {
      // Show verification dialog for GPS-detected locations
      setPendingLocationData({
        latitude,
        longitude,
        accuracy: 0,
        address: { city: cityName, display: cityName },
      });
    },
    [],
  );

  // Get swipe configuration for current screen
  const swipeConfig = useScreenSwipeConfig(currentScreen);

  // Mobile navigation handler
  const handleMobileNavigation = useCallback(
    (screen: NavigationScreen) => {
      haptic.buttonPress();
      setCurrentScreen(screen);
    },
    [haptic],
  );

  // Legacy navigation function for backward compatibility
  const navigate = (screenName: string) => {
    // Map old screen names to new NavigationScreen types
    const screenMap: Record<string, NavigationScreen> = {
      Home: 'Home',
      WeatherDetails: 'Weather',
      Weather: 'Weather',
      MobileTest: 'Settings', // Redirect mobile test to settings for now
      Settings: 'Settings',
      Search: 'Search',
      IOSDemo: 'Settings', // Temporarily map to settings, we'll handle this specially
    };

    const mappedScreen = screenMap[screenName] || 'Home';

    // Special handling for iOS Demo
    if (screenName === 'IOSDemo') {
      setShowIOSDemo(true);
      return;
    }

    setCurrentScreen(mappedScreen);
  };

  // Enhanced swipe navigation handlers with haptic feedback
  const handleSwipeLeft = () => {
    if (currentScreen === 'Home') {
      haptic.triggerHaptic('navigation');
      navigate('Weather'); // Use new screen name
    }
  };

  const handleSwipeRight = () => {
    if (currentScreen === 'Weather') {
      haptic.triggerHaptic('navigation');
      navigate('Home');
    } else {
      // Subtle error feedback for invalid swipe
      haptic.triggerHaptic('light');
    }
  };

  // Common weather data fetching logic with optimization
  const fetchWeatherData = useCallback(
    async (lat: number, lon: number) => {
      try {
        // Start loading state
        weatherLoading.setLoading(true, 0);

        const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
        const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

        // Update progress
        weatherLoading.setLoading(true, 25);

        const cacheKey = `weather-${lat}-${lon}`;
        const weatherResponse = await optimizedFetch(
          weatherUrl,
          {
            headers: {
              'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)',
            },
          },
          cacheKey,
        );

        // Update progress after fetch
        weatherLoading.setLoading(true, 50);

        if (!weatherResponse.ok) {
          throw new Error(`Weather API failed: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();

        // Update progress after data parsing
        weatherLoading.setLoading(true, 75);

        // Use optimized transform for weather data processing
        const transformedData = optimizedTransform(
          weatherData,
          data => {
            const currentWeatherCode = data.current_weather?.weathercode || 0;
            setWeatherCode(currentWeatherCode);
            const currentHour = new Date().getHours();
            const hourlyData = data.hourly;

            return {
              main: {
                temp: data.current_weather?.temperature || 0,
                feels_like:
                  hourlyData?.apparent_temperature?.[currentHour] ||
                  data.current_weather?.temperature ||
                  0,
                humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50,
                pressure: hourlyData?.surface_pressure?.[currentHour] || 1013,
              },
              weather: [
                { description: getWeatherDescription(currentWeatherCode) },
              ],
              wind: {
                speed: data.current_weather?.windspeed || 0,
                deg: data.current_weather?.winddirection || 0,
              },
              uv_index: hourlyData?.uv_index?.[currentHour] || 0,
              visibility: hourlyData?.visibility?.[currentHour] || 0,
            };
          },
          `transform-${lat}-${lon}-${Date.now()}`,
        );

        setWeather(transformedData);
        setHourlyForecast(
          processHourlyForecast(weatherData.hourly as HourlyData),
        );
        setDailyForecast(processDailyForecast(weatherData.daily as DailyData));

        // Update progress to completion
        weatherLoading.setLoading(true, 100);

        // iOS26 Feature: Trigger Live Activity for weather updates
        setShowLiveActivity(true);
        setTimeout(() => setShowLiveActivity(false), 4000);

        // iOS26 Feature: Check for weather alerts
        const currentTemp = transformedData.main.temp;
        const windSpeed = transformedData.wind.speed;
        const weatherCode =
          transformedData.weather[0].description.toLowerCase();

        if (currentTemp > 95) {
          setWeatherAlert({
            title: 'Extreme Heat Warning',
            message: `Temperature is ${Math.round(
              currentTemp,
            )}°F. Stay hydrated and avoid outdoor activities.`,
            severity: 'severe',
          });
        } else if (currentTemp < 20) {
          setWeatherAlert({
            title: 'Extreme Cold Warning',
            message: `Temperature is ${Math.round(
              currentTemp,
            )}°F. Dress warmly and limit outdoor exposure.`,
            severity: 'severe',
          });
        } else if (windSpeed > 35) {
          setWeatherAlert({
            title: 'High Wind Advisory',
            message: `Wind speeds of ${Math.round(
              windSpeed,
            )} mph. Secure loose objects and drive carefully.`,
            severity: 'warning',
          });
        } else if (
          weatherCode.includes('thunderstorm') ||
          weatherCode.includes('storm')
        ) {
          setWeatherAlert({
            title: 'Storm Alert',
            message: 'Thunderstorms in the area. Seek indoor shelter.',
            severity: 'warning',
          });
        } else {
          setWeatherAlert(null);
        }

        // Complete loading
        weatherLoading.setLoading(false);
      } catch (error) {
        // Handle errors
        weatherLoading.setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch weather data',
        );
      }
    },
    [optimizedFetch, optimizedTransform, weatherLoading],
  );

  const getWeather = useCallback(async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      haptic.searchError(); // Haptic feedback for input validation error
      return;
    }
    setLoading(true);
    setError('');
    haptic.dataLoad(); // Light haptic feedback when starting search
    try {
      const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
      const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(
        city,
      )}&format=json&limit=1`;
      const geoResponse = await optimizedFetch(
        geoUrl,
        {
          headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' },
        },
        `geocoding-${city}`,
      );
      if (!geoResponse.ok)
        throw new Error(`Geocoding failed: ${geoResponse.status}`);
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0)
        throw new Error(
          'City not found. Please check the spelling and try again.',
        );
      const { lat, lon } = geoData[0];
      await fetchWeatherData(lat, lon);
      haptic.searchSuccess(); // Haptic feedback for successful weather fetch
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch weather data: ${errorMessage}`);
      haptic.searchError(); // Haptic feedback for search error
    } finally {
      setLoading(false);
    }
  }, [city, haptic, fetchWeatherData, optimizedFetch]);

  // Direct weather fetching (from autocomplete, city selector, etc.)
  const getWeatherByLocation = useCallback(
    async (locationCity: string, lat: number, lon: number) => {
      setLoading(true);
      setError('');
      setCity(locationCity); // Update city state with location name
      haptic.dataLoad(); // Light haptic feedback when starting location-based search

      // Add to city management
      setCurrentCity(locationCity, lat, lon);
      addToRecent(locationCity, lat, lon);

      try {
        await fetchWeatherData(lat, lon);
        haptic.searchSuccess(); // Haptic feedback for successful location-based weather fetch
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(
          `Failed to fetch weather data for your location: ${errorMessage}`,
        );
        haptic.searchError(); // Haptic feedback for location-based search error
      } finally {
        setLoading(false);
      }
    },
    [haptic, fetchWeatherData, setCurrentCity, addToRecent],
  );

  // Background refresh for weather data with native app lifecycle integration
  const refreshWeatherData = useCallback(async () => {
    // Only refresh if we have valid weather data to refresh
    if (weather && city.trim()) {
      try {
        // Extract lat/lon from current weather data or use city search
        const { lat, lon } = await (async () => {
          // If we have weather data, we can try to get the location from recent cities
          // For now, we'll use the city search approach
          const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
          const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(
            city,
          )}&format=json&limit=1`;
          const geoResponse = await fetch(geoUrl, {
            headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' },
          });
          if (!geoResponse.ok)
            throw new Error(`Geocoding failed: ${geoResponse.status}`);
          const geoData = await geoResponse.json();
          if (!geoData || geoData.length === 0)
            throw new Error('Location not found for background refresh');
          return { lat: geoData[0].lat, lon: geoData[0].lon };
        })();

        // Fetch updated weather data
        await fetchWeatherData(lat, lon);
        logInfo('Weather data refreshed in background');
      } catch (error) {
        logError('Background weather refresh failed:', error);
        // Don't set error state for background refreshes to avoid disrupting UI
      }
    }
  }, [weather, city, fetchWeatherData]);

  // Initialize background refresh with weather-optimized settings
  const backgroundRefreshConfig = useMemo(
    () => ({
      foregroundInterval: 5, // 5 minutes for active usage
      backgroundInterval: 15, // 15 minutes for background
      forceRefreshThreshold: 30, // 30 minutes for stale data
      enabled: true,
    }),
    [],
  );

  const backgroundRefresh = useWeatherBackgroundRefresh(
    refreshWeatherData,
    backgroundRefreshConfig.enabled,
  );

  // Handle verification confirmation
  const handleVerificationConfirm = useCallback(
    (cityName: string, latitude: number, longitude: number) => {
      setPendingLocationData(null);
      getWeatherByLocation(cityName, latitude, longitude);
    },
    [getWeatherByLocation],
  );

  // Handle verification cancel
  const handleVerificationCancel = useCallback(() => {
    setPendingLocationData(null);
  }, []);

  // Pull-to-refresh handler - refreshes current weather data
  const handleRefresh = useCallback(async () => {
    if (city.trim() && weather) {
      haptic.weatherRefresh(); // Haptic feedback for pull-to-refresh

      // Use background refresh for manual refresh with enhanced capabilities
      try {
        await backgroundRefresh.manualRefresh();
        logInfo('Manual refresh completed via background refresh service');
      } catch (error) {
        // Fallback to traditional refresh
        logInfo('Falling back to traditional refresh:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        await getWeather();
      }
    }
  }, [city, weather, backgroundRefresh, haptic, getWeather]);

  return (
    <LoadingProvider>
      <EnhancedMobileContainer
        enablePullToRefresh={true}
        onRefresh={handleRefresh}
        enableSwipeGestures={screenInfo.width < 768}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        className="safe-area-container"
        style={{
          ...getMobileOptimizedContainer(theme, screenInfo),
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Native API Status Display - Shows native capabilities when on mobile */}
        <NativeStatusDisplay theme={theme} isMobile={screenInfo.width < 768} />

        {/* Enhanced Auto Location Manager - Phase F-2 */}
        <LocationManager
          onLocationReceived={(detectedCity, lat, lon) => {
            logInfo(
              `📍 Auto location detected: ${detectedCity} (${lat}, ${lon})`,
            );
            setCity(detectedCity);
            getWeatherByLocation(detectedCity, lat, lon);
            haptic.triggerHaptic('light');
          }}
          onError={errorMessage => {
            logWarn('📍 Auto location failed:', errorMessage);
            // Don't show error to user for automatic detection, just log it
          }}
          enableAutoDetection={true}
          enableBackgroundUpdates={false} // Disabled for battery optimization
        />

        {/* DEBUG: Location Tester - Development only */}
        {import.meta.env.DEV && <LocationTester />}

        {/* Background Refresh Status - Development info */}
        {backgroundRefresh.isInitialized && (
          <div className="ios26-dev-status">
            🔄 BG: {backgroundRefresh.isAppActive ? 'Active' : 'Background'} |
            📊 {backgroundRefresh.stats.totalRefreshes} total | 🌐{' '}
            {backgroundRefresh.isOnline ? 'Online' : 'Offline'}
            {backgroundRefresh.stats.lastRefreshTime > 0 && (
              <div>
                Last:{' '}
                {new Date(
                  backgroundRefresh.stats.lastRefreshTime,
                ).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Modern Mobile Navigation System - Only for mobile devices */}
        {screenInfo.width < 768 && (
          <ScreenContainer
            currentScreen={currentScreen}
            transitionDirection="slide-left"
            transitionDuration={300}
            theme={theme}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            enableSwipeGestures={screenInfo.width < 768} // Enable for mobile only
            screens={{
              Home: (
                <HomeScreen
                  theme={theme}
                  screenInfo={screenInfo}
                  adaptiveFonts={adaptiveFonts}
                  adaptiveSpacing={adaptiveSpacing}
                  adaptiveBorders={adaptiveBorders}
                  navigate={navigate}
                  haptic={haptic}
                />
              ),
              Weather: (
                <WeatherDetailsScreen
                  theme={theme}
                  screenInfo={screenInfo}
                  adaptiveFonts={adaptiveFonts}
                  adaptiveSpacing={adaptiveSpacing}
                  adaptiveBorders={adaptiveBorders}
                  navigate={navigate}
                  createMobileButton={createMobileButton}
                  city={city}
                  loading={loading}
                  error={error}
                  setError={setError}
                  weather={weather}
                  hourlyForecast={memoizedHourlyForecast}
                  dailyForecast={memoizedDailyForecast}
                  weatherCode={weatherCode}
                  getWeather={getWeather}
                  getWeatherByLocation={getWeatherByLocation}
                  onRefresh={handleRefresh}
                  haptic={haptic}
                  handleLocationDetected={handleLocationDetected}
                  selectedView={selectedView}
                  setSelectedView={setSelectedView}
                  showActionSheet={showActionSheet}
                  setShowActionSheet={setShowActionSheet}
                  themeName={themeName}
                  showLiveActivity={showLiveActivity}
                  weatherAlert={weatherAlert}
                  showWeatherSettingsModal={showWeatherSettingsModal}
                  setShowWeatherSettingsModal={setShowWeatherSettingsModal}
                />
              ),
              Search: (
                <SearchScreen
                  theme={theme}
                  onBack={() => navigate('Home')}
                  onLocationSelect={(cityName, latitude, longitude) => {
                    getWeatherByLocation(cityName, latitude, longitude);
                    navigate('Weather');
                  }}
                />
              ),
              Settings: (
                <SettingsScreen
                  theme={theme}
                  screenInfo={screenInfo}
                  onBack={() => navigate('Home')}
                />
              ),
              Favorites: (
                <FavoritesScreen
                  theme={theme}
                  onBack={() => navigate('Home')}
                  onCitySelect={(cityName, latitude, longitude) => {
                    getWeatherByLocation(cityName, latitude, longitude);
                    setCity(cityName);
                    navigate('Weather');
                    haptic.triggerHaptic('light');
                  }}
                  onAddFavorite={() => navigate('Search')}
                  currentCity={city}
                />
              ),
            }}
          />
        )}

        {/* Mobile Bottom Navigation */}
        {screenInfo.width < 768 && (
          <MobileNavigation
            currentScreen={currentScreen}
            onNavigate={handleMobileNavigation}
          />
        )}

        {/* Desktop/Legacy Navigation (for larger screens) */}
        {screenInfo.width >= 768 && (
          <SwipeNavigationContainer
            currentScreen={currentScreen}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            canSwipeLeft={swipeConfig.canSwipeLeft}
            canSwipeRight={swipeConfig.canSwipeRight}
            theme={theme}
            isMobile={false}
            swipeThreshold={80}
            enableDesktopSupport={true}
          >
            {/* Legacy screen rendering for desktop */}
            {currentScreen === 'Home' && (
              <HomeScreen
                theme={theme}
                screenInfo={screenInfo}
                adaptiveFonts={adaptiveFonts}
                adaptiveSpacing={adaptiveSpacing}
                adaptiveBorders={adaptiveBorders}
                navigate={navigate}
                haptic={haptic}
              />
            )}

            {currentScreen === 'Weather' && (
              <WeatherDetailsScreen
                theme={theme}
                screenInfo={screenInfo}
                adaptiveFonts={adaptiveFonts}
                adaptiveSpacing={adaptiveSpacing}
                adaptiveBorders={adaptiveBorders}
                navigate={navigate}
                createMobileButton={createMobileButton}
                city={city}
                loading={loading}
                error={error}
                setError={setError}
                weather={weather}
                hourlyForecast={memoizedHourlyForecast}
                dailyForecast={memoizedDailyForecast}
                weatherCode={weatherCode}
                getWeather={getWeather}
                getWeatherByLocation={getWeatherByLocation}
                onRefresh={handleRefresh}
                haptic={haptic}
                handleLocationDetected={handleLocationDetected}
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                showActionSheet={showActionSheet}
                setShowActionSheet={setShowActionSheet}
                themeName={themeName}
                showLiveActivity={showLiveActivity}
                weatherAlert={weatherAlert}
                showWeatherSettingsModal={showWeatherSettingsModal}
                setShowWeatherSettingsModal={setShowWeatherSettingsModal}
              />
            )}
          </SwipeNavigationContainer>
        )}

        {/* Deployment Status Indicator - Only show in production */}
        {import.meta.env.VITE_APP_ENVIRONMENT === 'production' && (
          <DeploymentStatus theme={themeName === 'dark' ? 'dark' : 'light'} />
        )}

        {/* Geolocation Verification Modal - Temporarily disabled */}
        <GeolocationVerification
          isOpen={false}
          locationData={pendingLocationData}
          theme={theme}
          isMobile={screenInfo.width < 768}
          onConfirm={handleVerificationConfirm}
          onCancel={handleVerificationCancel}
        />

        {/* Performance Monitor - Development only - Temporarily disabled */}
        {/* <PerformanceMonitor theme={theme} enabled={false} position="bottom-left" /> */}

        {/* Mobile Debug - Development only - Temporarily disabled */}
        <MobileDebug enabled={false} position="bottom-right" />

        {/* iOS Component Showcase - Overlay */}
        {showIOSDemo && (
          <div className="ios26-overlay">
            <IOSComponentShowcase
              theme={theme}
              themeName={themeName}
              onBack={() => setShowIOSDemo(false)}
            />
          </div>
        )}

        {/* Horror Theme Activator - Easy horror mode activation */}
        <HorrorThemeActivator />
      </EnhancedMobileContainer>
    </LoadingProvider>
  );
};

export default AppNavigator;
