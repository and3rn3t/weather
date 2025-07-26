import React, { useState, useCallback, useMemo, useEffect } from 'react';
import WeatherIcon, { weatherIconStyles } from '../utils/weatherIcons';
import { useTheme } from '../utils/useTheme';
import { useHaptic } from '../utils/hapticHooks';
import { useScreenSwipeConfig } from '../utils/useScreenSwipeConfig';
import SwipeNavigationContainer from '../utils/SwipeNavigationContainer';
import DeploymentStatus from '../utils/DeploymentStatus';
import LocationButton from '../utils/LocationButton';
import CitySelector from '../utils/CitySelector';
import AutoCompleteSearch from '../utils/AutoCompleteSearch';
import GeolocationVerification from '../utils/GeolocationVerification';
import { useCityManagement } from '../utils/useCityManagement';
import type { ThemeColors } from '../utils/themeConfig';
import ThemeToggle from '../utils/ThemeToggle';
import { WeatherCardSkeleton, ForecastListSkeleton, HourlyForecastSkeleton } from '../utils/LoadingSkeletons';
import PullToRefresh from '../utils/PullToRefresh';
import NativeStatusDisplay from '../utils/NativeStatusDisplay';
import { useWeatherBackgroundRefresh } from '../utils/useBackgroundRefresh';
import { useWeatherAPIOptimization, useWeatherDataTransform } from '../utils/useWeatherOptimization';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import { LocationTester } from '../utils/LocationTester';
import MobileDebug from '../utils/MobileDebug';
import MobileNavigation, { type NavigationScreen } from '../components/MobileNavigation';
import { ScreenContainer } from '../components/ScreenTransition';
import SettingsScreen from '../components/SettingsScreen';
import SearchScreen from '../components/SearchScreen';
import { 
  getScreenInfo, 
  getAdaptiveFontSizes,
  getAdaptiveSpacing,
  getAdaptiveBorderRadius,
  getTouchOptimizedButton,
  getMobileOptimizedContainer,
  getMobileOptimizedCard,
  handleOrientationChange,
  type ScreenInfo
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
    99: 'thunderstorm with heavy hail'
  };
  return descriptions[code] || 'unknown';
};

/**
 * WeatherData type definition for the transformed weather response
 * This structure standardizes the OpenMeteo API response for our UI components
 */
type WeatherData = {
  main: {
    temp: number;           // Current temperature in Fahrenheit
    feels_like: number;     // Apparent temperature in Fahrenheit
    humidity: number;       // Relative humidity percentage
    pressure: number;       // Atmospheric pressure in hPa
  };
  weather: {
    description: string;    // Human-readable weather condition
  }[];
  wind: {
    speed: number;          // Wind speed in mph
    deg: number;            // Wind direction in degrees
  };
  uv_index: number;         // UV index (0-11+ scale)
  visibility: number;       // Visibility in meters
};

/**
 * HourlyForecast type definition for hourly weather forecast
 */
type HourlyForecast = {
  time: string;             // ISO timestamp
  temperature: number;      // Temperature in Fahrenheit
  weatherCode: number;      // OpenMeteo weather code
  humidity: number;         // Relative humidity percentage
  feelsLike: number;        // Apparent temperature
};

/**
 * DailyForecast type definition for daily weather forecast
 */
type DailyForecast = {
  date: string;             // ISO date
  weatherCode: number;      // OpenMeteo weather code
  tempMax: number;          // Maximum temperature in Fahrenheit
  tempMin: number;          // Minimum temperature in Fahrenheit
  precipitation: number;    // Total precipitation in mm
  windSpeed: number;        // Maximum wind speed in mph
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
const createCardStyle = (theme: ThemeColors, isWeatherCard = false) => ({
  backgroundColor: isWeatherCard ? theme.weatherCardBackground : theme.forecastCardBackground,
  padding: '16px', // Base mobile padding
  borderRadius: '12px',
  border: `1px solid ${isWeatherCard ? theme.weatherCardBorder : theme.forecastCardBorder}`,
  transition: 'all 0.5s ease',
  // Mobile optimizations
  minHeight: '44px', // Ensure touch-friendly minimum size
  boxSizing: 'border-box' as const,
  // Responsive padding via CSS custom properties
  '@media (min-width: 768px)': {
    padding: '20px'
  },
  '@media (min-width: 1024px)': {
    padding: '24px'
  }
});

/** Weather detail item configuration */
const weatherDetailItems = [
  { key: 'humidity', icon: '💧', label: 'HUMIDITY', getValue: (weather: WeatherData) => `${weather.main.humidity}%` },
  { key: 'wind', icon: '💨', label: 'WIND', getValue: (weather: WeatherData) => `${Math.round(weather.wind.speed)} mph`, subValue: (weather: WeatherData) => `${weather.wind.deg}° direction` },
  { key: 'pressure', icon: '🌡️', label: 'PRESSURE', getValue: (weather: WeatherData) => `${Math.round(weather.main.pressure)} hPa` },
];

/** Process hourly forecast data into structured format */
const processHourlyForecast = (hourlyData: HourlyData): HourlyForecast[] => {
  if (!hourlyData?.time || !hourlyData?.temperature_2m) {
    console.warn('⚠️ No hourly data available for forecast');
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
        feelsLike: Math.round(hourlyData.apparent_temperature?.[i] || 0)
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
    hour12: true 
  });
};

/** Format date for daily forecast display */
const formatDayInfo = (dateString: string, index: number) => {
  const dayDate = new Date(dateString);
  const isToday = index === 0;
  const dayName = isToday ? 'Today' : dayDate.toLocaleDateString([], { weekday: 'short' });
  const dateStr = dayDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return { dayName, dateStr, isToday };
};

/** Process daily forecast data into structured format */
const processDailyForecast = (dailyData: DailyData): DailyForecast[] => {
  if (!dailyData?.time || !dailyData?.temperature_2m_max) {
    console.warn('⚠️ No daily data available for forecast');
    return [];
  }

  const next7Days: DailyForecast[] = [];
  
  for (let i = 0; i < Math.min(7, dailyData.time.length); i++) {
    next7Days.push({
      date: dailyData.time[i],
      weatherCode: dailyData.weathercode?.[i] || 0,
      tempMax: Math.round(dailyData.temperature_2m_max[i] || 0),
      tempMin: Math.round(dailyData.temperature_2m_min[i] || 0),
      precipitation: Math.round((dailyData.precipitation_sum?.[i] || 0) * 10) / 10,
      windSpeed: Math.round(dailyData.windspeed_10m_max?.[i] || 0)
    });
  }
  
  return next7Days;
};

function HomeScreen({
  theme,
  screenInfo,
  adaptiveFonts,
  adaptiveSpacing,
  adaptiveBorders,
  navigate,
  haptic
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
    <div className="mobile-container fade-in">
      <ThemeToggle />
      <div className="mobile-card weather-display">
        <div style={{
          width: screenInfo.isVerySmallScreen ? '100px' : '120px',
          height: screenInfo.isVerySmallScreen ? '100px' : '120px',
          background: theme.primaryGradient,
          borderRadius: adaptiveBorders.large,
          margin: `0 auto ${adaptiveSpacing.sectionGap}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: theme.buttonShadow
        }}>
          <WeatherIcon code={0} size={screenInfo.isVerySmallScreen ? 48 : 64} animated={true} className="home-main-icon" />
          <div style={{ position: 'absolute', top: '-10px', right: '-10px' }}>
            <WeatherIcon code={61} size={screenInfo.isVerySmallScreen ? 18 : 24} animated={true} className="home-floating-icon" />
          </div>
          <div style={{ position: 'absolute', bottom: '-8px', left: '-8px' }}>
            <WeatherIcon code={3} size={screenInfo.isVerySmallScreen ? 16 : 20} animated={true} className="home-floating-icon" />
          </div>
        </div>
        <h1 className="mobile-title" style={{
          color: theme.primaryText,
          letterSpacing: screenInfo.isVerySmallScreen ? '-0.3px' : '-0.5px',
            transition: 'color 0.5s ease'
        }}>
          Weather App
        </h1>
        <p className="mobile-body" style={{
          color: theme.secondaryText,
          lineHeight: '1.6',
          transition: 'color 0.5s ease',
          textAlign: 'center',
          maxWidth: screenInfo.isVerySmallScreen ? '280px' : '100%'
        }}>
          Get real-time weather information for any city around the world
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: adaptiveSpacing.elementGap,
          marginBottom: adaptiveSpacing.sectionGap,
          flexWrap: 'wrap'
        }}>
          {[
            { code: 0, label: 'Sunny' },
            { code: 61, label: 'Rainy' },
            { code: 71, label: 'Snow' },
            { code: 95, label: 'Storms' }
          ].map(({ code, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <WeatherIcon code={code} size={screenInfo.isVerySmallScreen ? 24 : 32} animated={true} />
              <div style={{ 
                fontSize: adaptiveFonts.bodySmall, 
                color: theme.secondaryText, 
                marginTop: '4px' 
              }}>{label}</div>
            </div>
          ))}
        </div>
        <button
          className="mobile-button mobile-button-large"
          onClick={() => {
            haptic.buttonPress(); // Haptic feedback for navigation button
            navigate('WeatherDetails');
          }}
          style={{
            background: theme.primaryGradient,
            color: theme.inverseText,
            boxShadow: theme.buttonShadow,
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}
          onMouseEnter={e => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(-2px)';
            target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={e => {
            const target = e.target as HTMLButtonElement;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
          }}
        >
          Check Weather →
        </button>
        
        {/* Mobile Test Button - Development only */}
        {import.meta.env.DEV && (
          <button
            className="mobile-button"
            onClick={() => {
              haptic.buttonPress();
              navigate('MobileTest');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: theme.primaryText,
              border: `1px solid ${theme.primaryText}30`
            }}
          >
            🔧 Mobile Test
          </button>
        )}
      </div>
    </div>
  );
}

// WeatherDetailsScreen component definition
function WeatherDetailsScreen({
  theme,
  screenInfo,
  adaptiveFonts,
  adaptiveSpacing,
  adaptiveBorders,
  navigate,
  createMobileButton,
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
  handleLocationDetected
}: Readonly<{
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  adaptiveFonts: ReturnType<typeof getAdaptiveFontSizes>;
  adaptiveSpacing: ReturnType<typeof getAdaptiveSpacing>;
  adaptiveBorders: ReturnType<typeof getAdaptiveBorderRadius>;
  navigate: (screenName: string) => void;
  createMobileButton: (isPrimary?: boolean, size?: 'small' | 'medium' | 'large') => React.CSSProperties;
  city: string;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  weather: WeatherData | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  weatherCode: number;
  getWeather: () => void;
  getWeatherByLocation: (city: string, lat: number, lon: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  haptic: ReturnType<typeof useHaptic>;
  handleLocationDetected: (cityName: string, latitude: number, longitude: number) => void;
}>) {
  const cardStyles = getMobileOptimizedCard(theme, screenInfo);

  return (
    <div className="mobile-container">
      <ThemeToggle />
      <PullToRefresh
        onRefresh={onRefresh}
        disabled={loading}
        style={{ width: '100%' }}
      >
        <div className="mobile-navigation">
          <button
            className="mobile-back-button"
            onClick={() => {
              haptic.buttonPress(); // Haptic feedback for back button
              navigate('Home');
            }}
            style={{
              ...createMobileButton(false, 'medium'),
              marginBottom: adaptiveSpacing.sectionGap
            }}
            onMouseEnter={e => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={e => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ← Back to Home
          </button>
        </div>
        
        <div style={cardStyles}>
              <h1 style={{
                fontSize: adaptiveFonts.pageTitle,
                fontWeight: '700',
                marginBottom: adaptiveSpacing.sectionGap,
                color: theme.primaryText,
                textAlign: 'center',
                letterSpacing: screenInfo.isVerySmallScreen ? '-0.3px' : '-0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: adaptiveSpacing.elementGap,
                flexWrap: 'wrap'
              }}>
                <WeatherIcon code={0} size={screenInfo.isVerySmallScreen ? 28 : 36} animated={true} className="header-weather-icon" />
                Weather Forecast
                <WeatherIcon code={1} size={screenInfo.isVerySmallScreen ? 28 : 36} animated={true} className="header-weather-icon" />
              </h1>
              <div style={{
                marginBottom: adaptiveSpacing.sectionGap,
                display: 'flex',
                gap: adaptiveSpacing.elementGap,
                flexDirection: screenInfo.isVerySmallScreen ? 'column' : 'row',
                flexWrap: 'wrap'
              }}>
                <AutoCompleteSearch
                  theme={theme}
                  isMobile={screenInfo.width < 768}
                  onCitySelected={getWeatherByLocation}
                  onError={(error) => setError(error)}
                  disabled={loading}
                  placeholder="Search for a city..."
                  initialValue={city}
                />
                <div style={{ 
                  display: 'flex', 
                  gap: adaptiveSpacing.elementGap,
                  flexWrap: screenInfo.isVerySmallScreen ? 'wrap' : 'nowrap',
                  width: screenInfo.isVerySmallScreen ? '100%' : 'auto'
                }}>
                  <LocationButton
                    theme={theme}
                    isMobile={screenInfo.width < 768}
                    onLocationReceived={handleLocationDetected}
                    onError={(error) => {
                      // Set error state for location failures
                      setError(error);
                    }}
                    disabled={loading}
                    variant="secondary"
                    size="medium"
                    showLabel={!screenInfo.isVerySmallScreen} // Hide label on very small screens for space
                  />
                  
                  <CitySelector
                    theme={theme}
                    isMobile={screenInfo.width < 768}
                    onCitySelected={getWeatherByLocation}
                    disabled={loading}
                    currentCity={city}
                  />
                  <button
                    onClick={() => {
                      haptic.buttonConfirm(); // Haptic feedback for search button
                      getWeather();
                    }}
                    disabled={loading}
                    style={{
                      background: loading ? theme.loadingBackground : theme.buttonGradient,
                      color: theme.inverseText,
                      border: 'none',
                      borderRadius: adaptiveBorders.medium,
                      padding: adaptiveSpacing.buttonPadding,
                      fontSize: adaptiveFonts.buttonText,
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : theme.buttonShadow,
                      transition: 'all 0.3s ease',
                      minWidth: screenInfo.isVerySmallScreen ? '120px' : '140px',
                      minHeight: '44px'
                    }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: adaptiveSpacing.elementGap }}>
                        <span style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></span>{' '}
                        {screenInfo.isVerySmallScreen ? '...' : 'Loading...'}
                      </span>
                    ) : (
                      (() => {
                        const searchText = screenInfo.isVerySmallScreen ? 'Go' : 'Search';
                        return `🔍 ${searchText}`;
                      })()
                    )}
                  </button>
                </div>
              </div>
            {error && (
              <div style={{
                background: theme.errorBackground,
                color: theme.errorText,
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: `1px solid ${theme.errorBorder}`,
                fontSize: '16px',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}
            {loading && !weather && <WeatherCardSkeleton />}
            {weather && (
              <WeatherMainCard
                weather={weather}
                city={city}
                theme={theme}
                isMobile={screenInfo.width < 768}
                weatherCode={weatherCode}
              />
            )}
            <HourlyForecastSection
              loading={loading}
              hourlyForecast={hourlyForecast}
              theme={theme}
              isMobile={screenInfo.width < 768}
            />
            <DailyForecastSection
              loading={loading}
              dailyForecast={dailyForecast}
              theme={theme}
            />
          </div>
        
        {/* Add styles */}
        <style>{`
          .autocomplete-search {
            flex: 1;
            min-width: ${screenInfo.isVerySmallScreen ? '100%' : '250px'};
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }
          ${weatherIconStyles}
          .home-main-icon { filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)); }
          .home-floating-icon { animation: float 6s ease-in-out infinite; opacity: 0.8; }
          .home-floating-icon:hover { opacity: 1; transform: scale(1.2); }
          .header-weather-icon { opacity: 0.8; }
          div::-webkit-scrollbar { height: 6px; }
          div::-webkit-scrollbar-track { background: rgba(14, 165, 233, 0.1); border-radius: 3px; }
          div::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.3); border-radius: 3px; }
          div::-webkit-scrollbar-thumb:hover { background: rgba(14, 165, 233, 0.5); }
        `}</style>
      </PullToRefresh>
    </div>
  );
}

// Helper components for weather display
const WeatherMainCard = React.memo(({ weather, city, theme, isMobile, weatherCode }: Readonly<{
  weather: WeatherData,
  city: string,
  theme: ThemeColors,
  isMobile: boolean,
  weatherCode: number
}>) => {
  return (
    <div style={{
      background: theme.weatherCardBackground,
      padding: '32px',
      borderRadius: '20px',
      border: `2px solid ${theme.weatherCardBorder}`,
      boxShadow: '0 10px 30px rgba(14, 165, 233, 0.1)',
      textAlign: 'center',
      transition: 'all 0.6s ease'
    }}>
      <div style={{
        display: 'inline-block',
        background: theme.weatherCardBadge,
        color: theme.inverseText,
        padding: '12px 24px',
        borderRadius: '50px',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '24px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        📍 {city}
      </div>
      <div style={{
        fontSize: isMobile ? '36px' : '48px',
        fontWeight: '800',
        color: theme.primaryText,
        marginBottom: '8px',
        letterSpacing: isMobile ? '-1px' : '-2px'
      }}>
        {Math.round(weather.main.temp)}°F
      </div>
      <div style={{
        fontSize: '16px',
        color: theme.secondaryText,
        marginBottom: '8px'
      }}>
        Feels like {Math.round(weather.main.feels_like)}°F
      </div>
      <div style={{
        fontSize: '20px',
        color: theme.primaryText,
        textTransform: 'capitalize',
        fontWeight: '500',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <WeatherIcon code={weatherCode} size={48} animated={true} className="main-weather-icon" />
        {weather.weather[0].description}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
        textAlign: 'left'
      }}>
        {weatherDetailItems.map(item => (
          <div key={item.key} style={createCardStyle(theme)}>
            <div style={{ fontSize: '12px', color: theme.secondaryText, marginBottom: '4px', fontWeight: '600' }}>
              {item.icon} {item.label}
            </div>
            <div style={{ fontSize: '18px', color: theme.primaryText, fontWeight: '700' }}>
              {item.getValue(weather)}
            </div>
            {item.subValue && (
              <div style={{ fontSize: '12px', color: theme.secondaryText }}>
                {item.subValue(weather)}
              </div>
            )}
          </div>
        ))}
        {weather.uv_index > 0 && (
          <div style={createCardStyle(theme)}>
            <div style={{ fontSize: '12px', color: theme.secondaryText, marginBottom: '4px', fontWeight: '600' }}>
              ☀️ UV INDEX
            </div>
            <div style={{ fontSize: '18px', color: theme.primaryText, fontWeight: '700' }}>
              {Math.round(weather.uv_index)}
            </div>
          </div>
        )}
        {weather.visibility > 0 && (
          <div style={createCardStyle(theme)}>
            <div style={{ fontSize: '12px', color: theme.secondaryText, marginBottom: '4px', fontWeight: '600' }}>
              👁️ VISIBILITY
            </div>
            <div style={{ fontSize: '18px', color: theme.primaryText, fontWeight: '700' }}>
              {Math.round(weather.visibility / 1000)} km
            </div>
          </div>
        )}
      </div>
      <div style={{
        width: '60px',
        height: '4px',
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        borderRadius: '2px',
        margin: '0 auto',
        marginBottom: '32px'
      }}></div>
    </div>
  );
});

const HourlyForecastSection = React.memo(({ loading, hourlyForecast, theme, isMobile }: Readonly<{
  loading: boolean,
  hourlyForecast: HourlyForecast[],
  theme: ThemeColors,
  isMobile: boolean
}>) => {
  if (loading && hourlyForecast.length === 0) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.primaryText,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🕐 24-Hour Forecast
        </h3>
        <HourlyForecastSkeleton />
      </div>
    );
  }
  if (hourlyForecast.length > 0) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.primaryText,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🕐 24-Hour Forecast
        </h3>
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          scrollPadding: '16px'
        }}>
          {hourlyForecast.slice(0, 24).map((hour, index) => {
            const timeStr = formatHourTime(hour.time);
            return (
              <div
                key={`hour-${hour.time}-${index}`}
                style={{
                  minWidth: '80px',
                  ...createCardStyle(theme),
                  padding: '12px 8px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  scrollSnapAlign: isMobile ? 'start' : 'none',
                  flexShrink: 0
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  fontWeight: '500',
                  marginBottom: '6px'
                }}>
                  {timeStr}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <WeatherIcon code={hour.weatherCode} size={32} animated={true} />
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: theme.primaryText,
                  marginBottom: '4px'
                }}>
                  {hour.temperature}°F
                </div>
                <div style={{
                  fontSize: '10px',
                  color: theme.secondaryText,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}>
                  <span>💧 {hour.humidity}%</span>
                  <span>Feels {hour.feelsLike}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
});

const DailyForecastSection = React.memo(({ loading, dailyForecast, theme }: Readonly<{
  loading: boolean,
  dailyForecast: DailyForecast[],
  theme: ThemeColors
}>) => {
  if (loading && dailyForecast.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.primaryText,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 7-Day Forecast
        </h3>
        <ForecastListSkeleton items={7} />
      </div>
    );
  }
  if (dailyForecast.length > 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.primaryText,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 7-Day Forecast
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {dailyForecast.map((day, index) => {
            const { dayName, dateStr, isToday } = formatDayInfo(day.date, index);
            return (
              <div
                key={`day-${day.date}-${index}`}
                style={{
                  ...createCardStyle(theme),
                  backgroundColor: isToday ? `${theme.weatherCardBorder}20` : theme.forecastCardBackground,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: `1px solid ${isToday ? theme.weatherCardBorder + '50' : theme.forecastCardBorder}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: isToday ? '700' : '600',
                    color: isToday ? theme.weatherCardBorder : theme.primaryText
                  }}>
                    {dayName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.secondaryText
                  }}>
                    {dateStr}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: '1',
                  justifyContent: 'center'
                }}>
                  <WeatherIcon code={day.weatherCode} size={36} animated={true} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '100px',
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: theme.primaryText
                  }}>
                    {day.tempMax}°
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.secondaryText
                  }}>
                    {day.tempMin}°
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  fontSize: '12px',
                  color: theme.secondaryText,
                  gap: '2px'
                }}>
                  {day.precipitation > 0 && (
                    <span>🌧️ {day.precipitation}mm</span>
                  )}
                  <span>💨 {day.windSpeed}mph</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
});

const AppNavigator = () => {
  // Screen information and responsive detection
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => getScreenInfo());
  
  // Update screen info on orientation changes
  useEffect(() => {
    const cleanup = handleOrientationChange(setScreenInfo);
    return cleanup;
  }, []);

  // Get adaptive styles based on current screen
  const adaptiveFonts = useMemo(() => getAdaptiveFontSizes(screenInfo), [screenInfo]);
  const adaptiveSpacing = useMemo(() => getAdaptiveSpacing(screenInfo), [screenInfo]);
  const adaptiveBorders = useMemo(() => getAdaptiveBorderRadius(screenInfo), [screenInfo]);

  // Theme and mobile detection (updated to use screenInfo)
  const { theme, themeName } = useTheme();
  
  // Create mobile button function using new optimization
  const createMobileButton = useCallback((isPrimary = false, size: 'small' | 'medium' | 'large' = 'medium') => 
    getTouchOptimizedButton(theme, screenInfo, isPrimary ? 'primary' : 'secondary', size), 
    [theme, screenInfo]
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
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherCode, setWeatherCode] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLocationVerification, setShowLocationVerification] = useState(false);
  const [pendingLocationData, setPendingLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: { city?: string; display?: string };
  } | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Memoized weather data processing
  const memoizedHourlyForecast = useMemo(() => hourlyForecast, [hourlyForecast]);
  const memoizedDailyForecast = useMemo(() => dailyForecast, [dailyForecast]);

  // Location detection handler - must be defined early for use in JSX
  const handleLocationDetected = useCallback((cityName: string, latitude: number, longitude: number) => {
    // Show verification dialog for GPS-detected locations
    setPendingLocationData({
      latitude: latitude,
      longitude: longitude,
      accuracy: 0,
      address: { city: cityName, display: cityName }
    });
    setShowLocationVerification(true);
  }, []);

  // Get swipe configuration for current screen
  const swipeConfig = useScreenSwipeConfig(currentScreen);

  // Mobile navigation handler
  const handleMobileNavigation = useCallback((screen: NavigationScreen) => {
    haptic.buttonPress();
    setCurrentScreen(screen);
  }, [haptic]);

  // Legacy navigation function for backward compatibility
  const navigate = (screenName: string) => {
    // Map old screen names to new NavigationScreen types
    const screenMap: Record<string, NavigationScreen> = {
      'Home': 'Home',
      'WeatherDetails': 'Weather',
      'MobileTest': 'Settings', // Redirect mobile test to settings for now
      'Settings': 'Settings',
      'Search': 'Search'
    };
    
    const mappedScreen = screenMap[screenName] || 'Home';
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
  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
    const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;
    
    const cacheKey = `weather-${lat}-${lon}`;
    const weatherResponse = await optimizedFetch(weatherUrl, {
      headers: {
        'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)'
      }
    }, cacheKey);
    
    if (!weatherResponse.ok) throw new Error(`Weather API failed: ${weatherResponse.status}`);
    const weatherData = await weatherResponse.json();
    
    // Use optimized transform for weather data processing
    const transformedData = optimizedTransform(
      weatherData,
      (data) => {
        const currentWeatherCode = data.current_weather?.weathercode || 0;
        setWeatherCode(currentWeatherCode);
        const currentHour = new Date().getHours();
        const hourlyData = data.hourly;
        
        return {
          main: {
            temp: data.current_weather?.temperature || 0,
            feels_like: hourlyData?.apparent_temperature?.[currentHour] || data.current_weather?.temperature || 0,
            humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50,
            pressure: hourlyData?.surface_pressure?.[currentHour] || 1013
          },
          weather: [{ description: getWeatherDescription(currentWeatherCode) }],
          wind: {
            speed: data.current_weather?.windspeed || 0,
            deg: data.current_weather?.winddirection || 0
          },
          uv_index: hourlyData?.uv_index?.[currentHour] || 0,
          visibility: hourlyData?.visibility?.[currentHour] || 0
        };
      },
      `transform-${lat}-${lon}-${Date.now()}`
    );
    
    setWeather(transformedData);
    setHourlyForecast(processHourlyForecast(weatherData.hourly as HourlyData));
    setDailyForecast(processDailyForecast(weatherData.daily as DailyData));
  }, [optimizedFetch, optimizedTransform]);

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
      const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const geoResponse = await optimizedFetch(geoUrl, {
        headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' }
      }, `geocoding-${city}`);
      if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.status}`);
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) throw new Error('City not found. Please check the spelling and try again.');
      const { lat, lon } = geoData[0];
      await fetchWeatherData(lat, lon);
      haptic.searchSuccess(); // Haptic feedback for successful weather fetch
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch weather data: ${errorMessage}`);
      haptic.searchError(); // Haptic feedback for search error
    } finally {
      setLoading(false);
    }
  }, [city, haptic, fetchWeatherData, optimizedFetch]);

  // Direct weather fetching (from autocomplete, city selector, etc.)
  const getWeatherByLocation = useCallback(async (locationCity: string, lat: number, lon: number) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch weather data for your location: ${errorMessage}`);
      haptic.searchError(); // Haptic feedback for location-based search error
    } finally {
      setLoading(false);
    }
  }, [haptic, fetchWeatherData, setCurrentCity, addToRecent]);

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
          const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
          const geoResponse = await fetch(geoUrl, {
            headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' }
          });
          if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.status}`);
          const geoData = await geoResponse.json();
          if (!geoData || geoData.length === 0) throw new Error('Location not found for background refresh');
          return { lat: geoData[0].lat, lon: geoData[0].lon };
        })();

        // Fetch updated weather data
        await fetchWeatherData(lat, lon);
        console.log('Weather data refreshed in background');
      } catch (error) {
        console.error('Background weather refresh failed:', error);
        // Don't set error state for background refreshes to avoid disrupting UI
      }
    }
  }, [weather, city, fetchWeatherData]);

  // Initialize background refresh with weather-optimized settings
  const backgroundRefreshConfig = useMemo(() => ({
    foregroundInterval: 5, // 5 minutes for active usage
    backgroundInterval: 15, // 15 minutes for background
    forceRefreshThreshold: 30, // 30 minutes for stale data
    enabled: true
  }), []);

  const backgroundRefresh = useWeatherBackgroundRefresh(
    refreshWeatherData,
    backgroundRefreshConfig.enabled
  );

  // Handle verification confirmation
  const handleVerificationConfirm = useCallback((cityName: string, latitude: number, longitude: number) => {
    setShowLocationVerification(false);
    setPendingLocationData(null);
    getWeatherByLocation(cityName, latitude, longitude);
  }, [getWeatherByLocation]);

  // Handle verification cancel
  const handleVerificationCancel = useCallback(() => {
    setShowLocationVerification(false);
    setPendingLocationData(null);
  }, []);

  // Pull-to-refresh handler - refreshes current weather data
  const handleRefresh = useCallback(async () => {
    if (city.trim() && weather) {
      haptic.weatherRefresh(); // Haptic feedback for pull-to-refresh
      
      // Use background refresh for manual refresh with enhanced capabilities
      try {
        await backgroundRefresh.manualRefresh();
        console.log('Manual refresh completed via background refresh service');
      } catch (error) {
        // Fallback to traditional refresh
        console.log('Falling back to traditional refresh:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        await getWeather();
      }
    }
  }, [city, weather, backgroundRefresh, haptic, getWeather]);

  return (
    <div 
      className="safe-area-container"
      style={{
        ...getMobileOptimizedContainer(theme, screenInfo),
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Native API Status Display - Shows native capabilities when on mobile */}
      <NativeStatusDisplay theme={theme} isMobile={screenInfo.width < 768} />
      
      {/* DEBUG: Location Tester - Remove this after debugging */}
      <LocationTester />
      
      {/* Background Refresh Status - Development info */}
      {backgroundRefresh.isInitialized && (
        <div style={{
          position: 'fixed',
          top: screenInfo.width < 768 ? '40px' : '10px',
          right: '10px',
          zIndex: 1000,
          fontSize: '10px',
          color: theme.primaryText,
          background: theme.cardBackground,
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${theme.weatherCardBorder}`,
          opacity: 0.7,
        }}>
          🔄 BG: {backgroundRefresh.isAppActive ? 'Active' : 'Background'} | 
          📊 {backgroundRefresh.stats.totalRefreshes} total | 
          🌐 {backgroundRefresh.isOnline ? 'Online' : 'Offline'}
          {backgroundRefresh.stats.lastRefreshTime > 0 && (
            <div>Last: {new Date(backgroundRefresh.stats.lastRefreshTime).toLocaleTimeString()}</div>
          )}
        </div>
      )}
      
      {/* Modern Mobile Navigation System */}
      <ScreenContainer
        currentScreen={currentScreen}
        transitionDirection="slide-left"
        transitionDuration={300}
        theme={theme}
        screens={{
          'Home': (
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
          'Weather': (
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
            />
          ),
          'Search': (
            <SearchScreen
              theme={theme}
              onBack={() => navigate('Home')}
              onLocationSelect={(cityName, latitude, longitude) => {
                getWeatherByLocation(cityName, latitude, longitude);
                navigate('Weather');
              }}
            />
          ),
          'Settings': (
            <SettingsScreen
              theme={theme}
              screenInfo={screenInfo}
              onBack={() => navigate('Home')}
            />
          )
        }}
      />
      
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
            />
          )}
        </SwipeNavigationContainer>
      )}
      
      {/* Deployment Status Indicator - Only show in production */}
      {import.meta.env.VITE_APP_ENVIRONMENT === 'production' && (
        <DeploymentStatus theme={themeName} />
      )}

      {/* Geolocation Verification Modal */}
      <GeolocationVerification
        isOpen={showLocationVerification}
        locationData={pendingLocationData}
        theme={theme}
        isMobile={screenInfo.width < 768}
        onConfirm={handleVerificationConfirm}
        onCancel={handleVerificationCancel}
      />

      {/* Performance Monitor - Development only */}
      <PerformanceMonitor
        theme={theme}
        enabled={import.meta.env.DEV}
        position="bottom-left"
      />

      {/* Mobile Debug - Development only */}
      <MobileDebug
        enabled={import.meta.env.DEV}
        position="bottom-right"
      />
    </div>
  );
};

export default AppNavigator;
