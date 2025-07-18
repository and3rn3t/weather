import { useState } from 'react';
import WeatherIcon, { weatherIconStyles } from '../utils/weatherIcons';
import { useTheme } from '../utils/useTheme';
import { useTouchGestures } from '../utils/useMobileOptimization';
import type { ThemeColors } from '../utils/themeConfig';
import ThemeToggle from '../utils/ThemeToggle';
import { WeatherCardSkeleton, ForecastListSkeleton, HourlyForecastSkeleton } from '../utils/LoadingSkeletons';

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
const createButtonStyle = (theme: ThemeColors, isPrimary = true, size: 'small' | 'medium' | 'large' = 'medium') => {
  const baseStyle = {
    background: isPrimary ? theme.buttonGradient : theme.toggleBackground,
    color: theme.inverseText,
    border: isPrimary ? 'none' : `1px solid ${theme.toggleBorder}`,
    fontSize: '16px',
    fontWeight: isPrimary ? '600' : '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: isPrimary ? 'none' : 'blur(10px)',
    // Mobile touch optimizations
    minHeight: '44px', // WCAG compliant touch target
    minWidth: '44px',
    borderRadius: '16px',
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    // Enhanced touch feedback
    ':active': {
      transform: 'scale(0.98)',
      opacity: '0.8'
    }
  };

  // Size-specific adjustments
  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '14px', minHeight: '40px' },
    medium: { padding: '12px 20px', fontSize: '16px', minHeight: '44px' },
    large: { padding: '16px 24px', fontSize: '18px', minHeight: '48px' }
  };

  return { ...baseStyle, ...sizeStyles[size] };
};

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

const AppNavigator = () => {
  const { theme, isMobile, isTablet, createMobileButton } = useTheme();
  const gestures = useTouchGestures();
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherCode, setWeatherCode] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  const navigate = (screenName: string) => setCurrentScreen(screenName);

  const swipeHandlers = gestures.createSwipeHandler(
    () => currentScreen === 'Home' && navigate('WeatherDetails'),
    () => currentScreen === 'WeatherDetails' && navigate('Home')
  );

  const getResponsivePadding = () => isMobile ? '16px' : isTablet ? '24px' : '32px';
  const getCardPadding = () => isMobile ? '40px 24px' : isTablet ? '50px 32px' : '60px 40px';

  const getWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
      const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const geoResponse = await fetch(geoUrl, {
        headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' }
      });
      if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.status}`);
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) throw new Error('City not found. Please check the spelling and try again.');
      const { lat, lon } = geoData[0];
      const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
      const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error(`Weather API failed: ${weatherResponse.status}`);
      const weatherData = await weatherResponse.json();
      const currentWeatherCode = weatherData.current_weather?.weathercode || 0;
      setWeatherCode(currentWeatherCode);
      const currentHour = new Date().getHours();
      const hourlyData = weatherData.hourly;
      const transformedData = {
        main: {
          temp: weatherData.current_weather?.temperature || 0,
          feels_like: hourlyData?.apparent_temperature?.[currentHour] || weatherData.current_weather?.temperature || 0,
          humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50,
          pressure: hourlyData?.surface_pressure?.[currentHour] || 1013
        },
        weather: [{ description: getWeatherDescription(currentWeatherCode) }],
        wind: {
          speed: weatherData.current_weather?.windspeed || 0,
          deg: weatherData.current_weather?.winddirection || 0
        },
        uv_index: hourlyData?.uv_index?.[currentHour] || 0,
        visibility: hourlyData?.visibility?.[currentHour] || 0
      };
      setWeather(transformedData);
      setHourlyForecast(processHourlyForecast(hourlyData as HourlyData));
      setDailyForecast(processDailyForecast(weatherData.daily as DailyData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch weather data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Inline components for each screen
  const HomeScreen = () => (
    <>
      <ThemeToggle />
      <div
        style={{
          minHeight: '100vh',
          background: theme.appBackground,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: getResponsivePadding(),
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'background 0.6s ease'
        }}
        {...(isMobile ? swipeHandlers : {})}
      >
        <div style={{
          backgroundColor: theme.cardBackground,
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: getCardPadding(),
          textAlign: 'center',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
          maxWidth: isMobile ? '340px' : '500px',
          width: '100%',
          transition: 'all 0.6s ease'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: theme.primaryGradient,
            borderRadius: '30px',
            margin: '0 auto 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: theme.buttonShadow
          }}>
            <WeatherIcon code={0} size={64} animated={true} className="home-main-icon" />
            <div style={{ position: 'absolute', top: '-10px', right: '-10px' }}>
              <WeatherIcon code={61} size={24} animated={true} className="home-floating-icon" />
            </div>
            <div style={{ position: 'absolute', bottom: '-8px', left: '-8px' }}>
              <WeatherIcon code={3} size={20} animated={true} className="home-floating-icon" />
            </div>
          </div>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '700',
            marginBottom: '16px',
            color: theme.primaryText,
            letterSpacing: '-0.5px',
            transition: 'color 0.5s ease'
          }}>
            Weather App
          </h1>
          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            color: theme.secondaryText,
            marginBottom: isMobile ? '24px' : '32px',
            lineHeight: '1.6',
            transition: 'color 0.5s ease'
          }}>
            Get real-time weather information for any city around the world
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '40px',
            flexWrap: 'wrap'
          }}>
            {[
              { code: 0, label: 'Sunny' },
              { code: 61, label: 'Rainy' },
              { code: 71, label: 'Snow' },
              { code: 95, label: 'Storms' }
            ].map(({ code, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <WeatherIcon code={code} size={32} animated={true} />
                <div style={{ fontSize: '12px', color: theme.secondaryText, marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('WeatherDetails')}
            style={{
              ...(isMobile ? createMobileButton(true) : createButtonStyle(theme, true)),
              padding: isMobile ? '14px 24px' : '16px 32px',
              fontSize: isMobile ? '16px' : '18px',
              boxShadow: theme.buttonShadow,
              transform: 'translateY(0)',
              letterSpacing: '0.5px'
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
        </div>
      </div>
    </>
  );

  const WeatherDetailsScreen = () => (
    <>
      <ThemeToggle />
      <div
        style={{
          minHeight: '100vh',
          background: theme.appBackground,
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'background 0.6s ease'
        }}
        {...(isMobile ? swipeHandlers : {})}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('Home')}
            style={{
              ...(isMobile ? createMobileButton(false) : createButtonStyle(theme, false)),
              padding: isMobile ? '14px 20px' : '12px 20px',
              marginBottom: '30px'
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
          <div style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
            transition: 'all 0.6s ease'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '32px',
              color: theme.primaryText,
              textAlign: 'center',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <WeatherIcon code={0} size={36} animated={true} className="header-weather-icon" />
              Weather Forecast
              <WeatherIcon code={1} size={36} animated={true} className="header-weather-icon" />
            </h1>
            <div style={{
              marginBottom: '32px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder="Enter city name..."
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '250px',
                  height: '56px',
                  border: `2px solid ${theme.cardBorder}`,
                  borderRadius: '16px',
                  padding: '0 20px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: theme.cardBackground,
                  color: theme.primaryText,
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={e => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = theme.weatherCardBorder;
                  target.style.backgroundColor = theme.cardBackground;
                  target.style.boxShadow = `0 0 0 3px ${theme.weatherCardBorder}33`;
                }}
                onBlur={e => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = theme.cardBorder;
                  target.style.backgroundColor = theme.cardBackground;
                  target.style.boxShadow = 'none';
                }}
                onKeyDown={e => e.key === 'Enter' && getWeather()}
              />
              <button
                onClick={getWeather}
                disabled={loading}
                style={{
                  background: loading ? theme.loadingBackground : theme.buttonGradient,
                  color: theme.inverseText,
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : theme.buttonShadow,
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>{' '}
                    Loading...
                  </span>
                ) : (
                  '🔍 Search'
                )}
              </button>
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
                isMobile={isMobile}
                weatherCode={weatherCode}
              />
            )}
            <HourlyForecastSection
              loading={loading}
              hourlyForecast={hourlyForecast}
              theme={theme}
              isMobile={isMobile}
            />
            <DailyForecastSection
              loading={loading}
              dailyForecast={dailyForecast}
              theme={theme}
            />
          </div>
        </div>
        <style>{`
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
      </div>
    </>
  );

  // Helper components for main weather card, hourly and daily forecast
  function WeatherMainCard({ weather, city, theme, isMobile, weatherCode }: {
    weather: WeatherData,
    city: string,
    theme: ThemeColors,
    isMobile: boolean,
    weatherCode: number
  }) {
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
  }

  function HourlyForecastSection({ loading, hourlyForecast, theme, isMobile }: {
    loading: boolean,
    hourlyForecast: HourlyForecast[],
    theme: ThemeColors,
    isMobile: boolean
  }) {
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
  }

  function DailyForecastSection({ loading, dailyForecast, theme }: {
    loading: boolean,
    dailyForecast: DailyForecast[],
    theme: ThemeColors
  }) {
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
                    border: `1px solid ${isToday ? `${theme.weatherCardBorder}50` : theme.forecastCardBorder}`,
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
                    fontSize: '11px',
                    color: theme.secondaryText,
                    minWidth: '60px'
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
  }

  if (currentScreen === 'Home') return <HomeScreen />;
  if (currentScreen === 'WeatherDetails') return <WeatherDetailsScreen />;
  return <div>Unknown screen</div>;
};

export default AppNavigator;
