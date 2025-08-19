/**
 * App Component - Simplified Weather Application Entry Point
 *
 * A simplified version to debug display issues.
 */

import React, { useState } from 'react';
import { ThemeProvider } from './utils/themeContext';
import { HapticFeedbackProvider } from './utils/hapticContext';
import { useTheme } from './utils/useTheme';
import WeatherIcon from './utils/weatherIcons';
import ThemeToggle from './utils/ThemeToggle';
import MobileNavigation, {
  type NavigationScreen,
} from './components/MobileNavigation';
import ErrorBoundary from './ErrorBoundary';
import IOS26WeatherDemo from './components/modernWeatherUI/iOS26WeatherDemo';
import './App.css';
import './styles/mobileEnhancements.css';

// Interfaces for type safety
interface NominatimResult {
  name: string;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
}

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    description: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  weatherCode: number;
  uv_index: number;
  visibility: number;
}

// Simple weather component for debugging
const SimpleWeatherApp: React.FC = () => {
  const { theme } = useTheme();

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('Home');

  // Weather state
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<
    Array<{
      time: string;
      temperature: number;
      weatherCode: number;
      humidity: number;
    }>
  >([]);
  const [dailyForecast, setDailyForecast] = useState<
    Array<{
      date: string;
      weatherCode: number;
      tempMax: number;
      tempMin: number;
      precipitation: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshTriggered, setIsRefreshTriggered] = useState(false);
  const [favorites, setFavorites] = useState<
    Array<{
      name: string;
      lat: number;
      lon: number;
    }>
  >([]);
  const [searchSuggestions, setSearchSuggestions] = useState<
    Array<{
      name: string;
      lat: number;
      lon: number;
      display_name: string;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState<
    Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }>
  >([]);

  const getWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Get coordinates from city name
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      );
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = geoData[0];

      // Step 2: Get weather data with hourly and daily forecasts
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`
      );

      const weatherData = await weatherResponse.json();

      // Transform current weather data
      const currentWeather = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure,
        },
        weather: [
          {
            description: getWeatherDescription(weatherData.current.weathercode),
          },
        ],
        wind: {
          speed: Math.round(weatherData.current.windspeed_10m || 0),
          deg: weatherData.current.winddirection_10m || 0,
        },
        weatherCode: weatherData.current.weathercode,
        uv_index: weatherData.current.uv_index || 0,
        visibility: Math.round(
          (weatherData.current.visibility || 10000) / 1609.34
        ), // Convert meters to miles
      };

      // Transform hourly forecast data (next 24 hours)
      const hourlyData = weatherData.hourly.time
        .slice(0, 24)
        .map((time: string, index: number) => ({
          time: new Date(time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          }),
          temperature: Math.round(weatherData.hourly.temperature_2m[index]),
          weatherCode: weatherData.hourly.weathercode[index],
          humidity: weatherData.hourly.relative_humidity_2m[index],
        }));

      // Transform daily forecast data (next 7 days)
      const dailyData = weatherData.daily.time.map(
        (date: string, index: number) => ({
          date: new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          weatherCode: weatherData.daily.weathercode[index],
          tempMax: Math.round(weatherData.daily.temperature_2m_max[index]),
          tempMin: Math.round(weatherData.daily.temperature_2m_min[index]),
          precipitation: weatherData.daily.precipitation_sum[index] || 0,
        })
      );

      setWeather(currentWeather);
      setHourlyForecast(hourlyData);
      setDailyForecast(dailyData);
      generateWeatherAlerts(currentWeather);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch weather data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setError('');

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Get city name from coordinates
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'WeatherApp/1.0' } }
      );
      const geoData = await geoResponse.json();

      const cityName =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        'Unknown Location';
      setCity(cityName);

      // Get weather data directly with forecasts
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`
      );

      const weatherData = await weatherResponse.json();

      // Transform current weather data
      const currentWeather = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure,
        },
        weather: [
          {
            description: getWeatherDescription(weatherData.current.weathercode),
          },
        ],
        wind: {
          speed: Math.round(weatherData.current.windspeed_10m || 0),
          deg: weatherData.current.winddirection_10m || 0,
        },
        weatherCode: weatherData.current.weathercode,
        uv_index: weatherData.current.uv_index || 0,
        visibility: Math.round(
          (weatherData.current.visibility || 10000) / 1609.34
        ), // Convert meters to miles
      };

      // Transform hourly forecast data (next 24 hours)
      const hourlyData = weatherData.hourly.time
        .slice(0, 24)
        .map((time: string, index: number) => ({
          time: new Date(time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          }),
          temperature: Math.round(weatherData.hourly.temperature_2m[index]),
          weatherCode: weatherData.hourly.weathercode[index],
          humidity: weatherData.hourly.relative_humidity_2m[index],
        }));

      // Transform daily forecast data (next 7 days)
      const dailyData = weatherData.daily.time.map(
        (date: string, index: number) => ({
          date: new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          weatherCode: weatherData.daily.weathercode[index],
          tempMax: Math.round(weatherData.daily.temperature_2m_max[index]),
          tempMin: Math.round(weatherData.daily.temperature_2m_min[index]),
          precipitation: weatherData.daily.precipitation_sum[index] || 0,
        })
      );

      setWeather(currentWeather);
      setHourlyForecast(hourlyData);
      setDailyForecast(dailyData);
      generateWeatherAlerts(currentWeather);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              'Location access denied. Please enable location services.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to get current location'
        );
      }
    } finally {
      setLocationLoading(false);
    }
  };

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
    return descriptions[code] || 'unknown weather';
  };

  const handleRefresh = async () => {
    if (!weather) return; // Only refresh if we have weather data

    setRefreshing(true);
    try {
      if (city) {
        await getWeather();
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
      setIsRefreshTriggered(false);
      setPullDistance(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch && window.scrollY === 0) {
      const startY = touch.clientY;
      const handleTouchMove = (moveEvent: TouchEvent) => {
        const currentTouch = moveEvent.touches[0];
        if (currentTouch) {
          const deltaY = currentTouch.clientY - startY;
          if (deltaY > 0) {
            const distance = Math.min(deltaY * 0.5, 100); // Damping effect
            setPullDistance(distance);

            if (distance > 70 && !isRefreshTriggered) {
              setIsRefreshTriggered(true);
            } else if (distance <= 70 && isRefreshTriggered) {
              setIsRefreshTriggered(false);
            }
          }
        }
      };

      const handleTouchEnd = () => {
        if (isRefreshTriggered && pullDistance > 70) {
          handleRefresh();
        } else {
          setPullDistance(0);
          setIsRefreshTriggered(false);
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  // Load favorites from localStorage on component mount
  React.useEffect(() => {
    const savedFavorites = localStorage.getItem('weather-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Search suggestions handler
  const handleCitySearch = async (searchTerm: string) => {
    setCity(searchTerm);

    if (searchTerm.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'WeatherApp/1.0' } }
      );
      const data = await response.json();

      const suggestions = data
        .filter((item: NominatimResult) => item.class === 'place')
        .map((item: NominatimResult) => ({
          name: item.name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name,
        }));

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  // Add to favorites
  const addToFavorites = (cityName: string, lat: number, lon: number) => {
    const newFavorite = { name: cityName, lat, lon };
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('weather-favorites', JSON.stringify(updatedFavorites));
  };

  // Remove from favorites
  const removeFromFavorites = (cityName: string) => {
    const updatedFavorites = favorites.filter(fav => fav.name !== cityName);
    setFavorites(updatedFavorites);
    localStorage.setItem('weather-favorites', JSON.stringify(updatedFavorites));
  };

  // Check if city is in favorites
  const isFavorite = (cityName: string) => {
    return favorites.some(fav => fav.name === cityName);
  };

  // Fetch weather data for a specific location
  const fetchWeatherForLocation = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`
      );
      const weatherData = await response.json();

      const currentWeather: WeatherData = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure,
        },
        weather: [
          {
            description: getWeatherDescription(weatherData.current.weathercode),
          },
        ],
        wind: {
          speed: Math.round(weatherData.current.windspeed_10m || 0),
          deg: weatherData.current.winddirection_10m || 0,
        },
        weatherCode: weatherData.current.weathercode,
        uv_index: weatherData.current.uv_index || 0,
        visibility: Math.round(
          (weatherData.current.visibility || 10000) / 1609.34
        ),
      };

      setWeather(currentWeather);
      generateWeatherAlerts(currentWeather);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch weather data'
      );
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate weather alerts based on conditions
  const generateWeatherAlerts = (weatherData: WeatherData) => {
    const alerts = [];

    if (weatherData.uv_index > 7) {
      alerts.push({
        type: 'UV Warning',
        message: `High UV index (${weatherData.uv_index}). Use sun protection.`,
        severity: 'high' as const,
      });
    }

    if (weatherData.wind.speed > 25) {
      alerts.push({
        type: 'Wind Advisory',
        message: `Strong winds at ${weatherData.wind.speed} mph.`,
        severity: 'medium' as const,
      });
    }

    if (weatherData.main.temp > 95) {
      alerts.push({
        type: 'Heat Warning',
        message: `Extreme heat at ${weatherData.main.temp}°F. Stay hydrated.`,
        severity: 'high' as const,
      });
    }

    if (weatherData.main.temp < 32) {
      alerts.push({
        type: 'Freeze Warning',
        message: `Below freezing at ${weatherData.main.temp}°F. Protect pipes.`,
        severity: 'medium' as const,
      });
    }

    if (weatherData.visibility < 3) {
      alerts.push({
        type: 'Visibility Warning',
        message: `Low visibility (${weatherData.visibility} miles). Drive carefully.`,
        severity: 'medium' as const,
      });
    }

    setWeatherAlerts(alerts);
  };

  // Navigation handler
  const handleNavigate = (screen: NavigationScreen) => {
    setCurrentScreen(screen);
  };

  // Render different screens based on navigation
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return renderHomeScreen();
      case 'Weather':
        return renderWeatherScreen();
      case 'iOS26':
        return renderIOS26Screen();
      case 'Search':
        return renderSearchScreen();
      case 'Favorites':
        return renderFavoritesScreen();
      case 'Settings':
        return renderSettingsScreen();
      default:
        return renderHomeScreen();
    }
  };

  // Home Screen - Welcome/Overview
  const renderHomeScreen = () => (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <h1
        style={{
          color: theme.primaryText,
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '28px',
          fontWeight: '700',
        }}
      >
        🌤️ Weather App
      </h1>

      <div
        style={{
          background: theme.weatherCardBackground,
          padding: '30px 20px',
          borderRadius: '16px',
          border: `1px solid ${theme.weatherCardBorder}`,
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>☀️</div>
        <h2
          style={{
            color: theme.primaryText,
            margin: '0 0 12px 0',
            fontSize: '20px',
            fontWeight: '600',
          }}
        >
          Welcome to Weather
        </h2>
        <p
          style={{
            color: theme.secondaryText,
            margin: '0 0 20px 0',
            fontSize: '16px',
            lineHeight: '1.5',
          }}
        >
          Get real-time weather updates, forecasts, and alerts for any location
          worldwide.
        </p>

        <button
          onClick={() => handleNavigate('Weather')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Check Weather
        </button>

        <button
          onClick={getCurrentLocation}
          disabled={locationLoading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: `2px solid ${theme.secondaryText}`,
            background: 'transparent',
            color: theme.primaryText,
            fontSize: '16px',
            fontWeight: '500',
            cursor: locationLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
        </button>
      </div>

      {weather && (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
            textAlign: 'center',
          }}
        >
          <h3 style={{ color: theme.primaryText, margin: '0 0 10px 0' }}>
            Current Weather
          </h3>
          <div
            style={{
              fontSize: '18px',
              color: theme.primaryText,
              fontWeight: '600',
            }}
          >
            {city}: {weather.main.temp}°F
          </div>
          <div
            style={{
              fontSize: '14px',
              color: theme.secondaryText,
              textTransform: 'capitalize',
            }}
          >
            {weather.weather[0].description}
          </div>
        </div>
      )}
    </div>
  );

  // iOS 26 Demo Screen - Latest iOS components showcase
  const renderIOS26Screen = () => <IOS26WeatherDemo theme={theme} />;

  // Weather Screen - Full weather functionality
  const renderWeatherScreen = () => (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <h1
        style={{
          color: theme.primaryText,
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        🌤️ Weather Details
      </h1>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          value={city}
          onChange={e => handleCitySearch(e.target.value)}
          placeholder="Enter city name..."
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${theme.secondaryText}`,
            background: theme.cardBackground,
            color: theme.primaryText,
            fontSize: '16px',
            marginBottom: '10px',
          }}
          onKeyDown={e => e.key === 'Enter' && getWeather()}
          onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: theme.cardBackground,
              border: `1px solid ${theme.weatherCardBorder}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {searchSuggestions.map((suggestion, suggestionIndex) => (
              <button
                key={`${suggestion.lat}-${suggestion.lon}`}
                style={{
                  padding: '12px',
                  borderBottom:
                    suggestionIndex < searchSuggestions.length - 1
                      ? `1px solid ${theme.weatherCardBorder}`
                      : 'none',
                  cursor: 'pointer',
                  color: theme.primaryText,
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => {
                  setCity(suggestion.name);
                  setShowSuggestions(false);
                  // Auto-fetch weather for suggestion
                  setTimeout(() => {
                    fetchWeatherForLocation(suggestion.lat, suggestion.lon);
                  }, 100);
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    theme.weatherCardBackground;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontWeight: '500' }}>{suggestion.name}</div>
                <div
                  style={{
                    fontSize: '12px',
                    color: theme.secondaryText,
                    marginTop: '2px',
                  }}
                >
                  {suggestion.display_name}
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={getWeather}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: loading ? '#ccc' : '#4f46e5',
            color: 'white',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
          }}
        >
          {loading ? 'Loading...' : 'Get Weather'}
        </button>

        <button
          onClick={getCurrentLocation}
          disabled={locationLoading || loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${theme.secondaryText}`,
            background: locationLoading ? '#ccc' : theme.cardBackground,
            color: locationLoading ? '#666' : theme.primaryText,
            fontSize: '16px',
            cursor: locationLoading || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {weatherAlerts.map((alert, alertIndex) => (
            <div
              key={`${alert.type}-${alertIndex}`}
              style={{
                background: alert.severity === 'high' ? '#fef2f2' : '#fff7ed',
                color: alert.severity === 'high' ? '#dc2626' : '#ea580c',
                border: `1px solid ${alert.severity === 'high' ? '#fecaca' : '#fed7aa'}`,
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {alert.severity === 'high' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  {alert.type}
                </div>
                <div style={{ fontSize: '13px', marginTop: '2px' }}>
                  {alert.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {weather && (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h2 style={{ color: theme.primaryText, margin: 0 }}>{city}</h2>
            <button
              onClick={() => {
                if (isFavorite(city)) {
                  removeFromFavorites(city);
                } else {
                  // Get coordinates for favorites (simplified)
                  addToFavorites(city, 0, 0);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {isFavorite(city) ? '⭐' : '☆'}
            </button>
          </div>

          {/* Weather Icon */}
          <div style={{ marginBottom: '15px' }}>
            <WeatherIcon
              code={weather.weatherCode}
              size={80}
              animated={true}
              isDay={true}
            />
          </div>

          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: theme.primaryText,
              margin: '10px 0',
            }}
          >
            {weather.main.temp}°F
          </div>
          <div
            style={{
              color: theme.secondaryText,
              fontSize: '18px',
              marginBottom: '15px',
              textTransform: 'capitalize',
            }}
          >
            {weather.weather[0].description}
          </div>

          {/* Weather Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                FEELS LIKE
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.main.feels_like}°F
              </div>
            </div>

            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                HUMIDITY
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.main.humidity}%
              </div>
            </div>

            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                WIND SPEED
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.wind.speed} mph
              </div>
            </div>

            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                PRESSURE
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.main.pressure} hPa
              </div>
            </div>

            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                UV INDEX
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.uv_index}
              </div>
            </div>

            <div
              style={{
                background: theme.cardBackground,
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: theme.secondaryText,
                  marginBottom: '4px',
                }}
              >
                VISIBILITY
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.primaryText,
                }}
              >
                {weather.visibility} mi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {hourlyForecast.length > 0 && (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: theme.primaryText,
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            24-Hour Forecast
          </h3>
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '15px',
              paddingBottom: '5px',
            }}
          >
            {hourlyForecast.slice(0, 12).map((hour, hourIndex) => (
              <div
                key={`${hour.time}-${hour.temperature}`}
                style={{
                  minWidth: '60px',
                  textAlign: 'center',
                  padding: '10px 5px',
                  borderRadius: '8px',
                  background:
                    hourIndex === 0 ? theme.cardBackground : 'transparent',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: theme.secondaryText,
                    marginBottom: '8px',
                    fontWeight: hourIndex === 0 ? '600' : '400',
                  }}
                >
                  {hourIndex === 0 ? 'Now' : hour.time}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <WeatherIcon
                    code={hour.weatherCode}
                    size={30}
                    animated={false}
                    isDay={true}
                  />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.primaryText,
                  }}
                >
                  {hour.temperature}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {dailyForecast.length > 0 && (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: theme.primaryText,
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            7-Day Forecast
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {dailyForecast.map((day, dayIndex) => (
              <div
                key={`${day.date}-${day.tempMax}-${day.tempMin}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom:
                    dayIndex < dailyForecast.length - 1
                      ? `1px solid ${theme.weatherCardBorder}`
                      : 'none',
                }}
              >
                <div
                  style={{
                    flex: '1',
                    fontSize: '14px',
                    fontWeight: dayIndex === 0 ? '600' : '400',
                    color: theme.primaryText,
                  }}
                >
                  {dayIndex === 0 ? 'Today' : day.date}
                </div>
                <div
                  style={{
                    flex: '0 0 40px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <WeatherIcon
                    code={day.weatherCode}
                    size={28}
                    animated={false}
                    isDay={true}
                  />
                </div>
                <div
                  style={{
                    flex: '0 0 80px',
                    textAlign: 'right',
                    fontSize: '14px',
                    color: theme.primaryText,
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{day.tempMax}°</span>
                  <span
                    style={{ color: theme.secondaryText, marginLeft: '5px' }}
                  >
                    {day.tempMin}°
                  </span>
                </div>
                {day.precipitation > 0 && (
                  <div
                    style={{
                      flex: '0 0 40px',
                      textAlign: 'right',
                      fontSize: '12px',
                      color: theme.secondaryText,
                    }}
                  >
                    {day.precipitation.toFixed(1)}mm
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Search Screen - Placeholder
  const renderSearchScreen = () => (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: theme.primaryText, marginBottom: '30px' }}>
        🔍 Search
      </h1>
      <div
        style={{
          background: theme.weatherCardBackground,
          padding: '40px 20px',
          borderRadius: '16px',
          border: `1px solid ${theme.weatherCardBorder}`,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
        <p style={{ color: theme.secondaryText, fontSize: '16px' }}>
          Enhanced search screen coming soon!
          <br />
          Use the Weather tab for now.
        </p>
      </div>
    </div>
  );

  // Favorites Screen - Show current favorites
  const renderFavoritesScreen = () => (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <h1
        style={{
          color: theme.primaryText,
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        ⭐ Favorites
      </h1>

      {favorites.length > 0 ? (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {favorites.map(favorite => (
              <button
                key={`favorite-${favorite.name}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: theme.cardBackground,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => {
                  setCity(favorite.name);
                  handleNavigate('Weather');
                  setTimeout(() => getWeather(), 100);
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme.appBackground;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = theme.cardBackground;
                }}
              >
                <span
                  style={{
                    color: theme.primaryText,
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                >
                  📍 {favorite.name}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeFromFavorites(favorite.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.secondaryText,
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: theme.weatherCardBackground,
            padding: '40px 20px',
            borderRadius: '16px',
            border: `1px solid ${theme.weatherCardBorder}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
          <p
            style={{
              color: theme.secondaryText,
              fontSize: '16px',
              marginBottom: '20px',
            }}
          >
            No favorite cities yet.
            <br />
            Add some favorites from the Weather screen!
          </p>
          <button
            onClick={() => handleNavigate('Weather')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Find Weather
          </button>
        </div>
      )}
    </div>
  );

  // Settings Screen - Placeholder
  const renderSettingsScreen = () => (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: theme.primaryText, marginBottom: '30px' }}>
        ⚙️ Settings
      </h1>
      <div
        style={{
          background: theme.weatherCardBackground,
          padding: '40px 20px',
          borderRadius: '16px',
          border: `1px solid ${theme.weatherCardBorder}`,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
        <p style={{ color: theme.secondaryText, fontSize: '16px' }}>
          Settings screen coming soon!
          <br />
          Theme toggle is available in the top-right corner.
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.appBackground,
        paddingBottom: '80px', // Space for navigation
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
      onTouchStart={handleTouchStart}
    >
      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.max(10, pullDistance - 30)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: theme.cardBackground,
            borderRadius: '20px',
            padding: '8px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `1px solid ${theme.weatherCardBorder}`,
            color: theme.primaryText,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: refreshing ? 'none' : 'all 0.3s ease',
          }}
        >
          {refreshing ? (
            <>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${theme.secondaryText}`,
                  borderTop: `2px solid ${theme.primaryText}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Refreshing...
            </>
          ) : (
            <>
              {isRefreshTriggered ? (
                <>🔄 Release to refresh</>
              ) : (
                <>⬇️ Pull to refresh</>
              )}
            </>
          )}
        </div>
      )}

      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Screen Content */}
      {renderScreen()}

      {/* Mobile Navigation */}
      <MobileNavigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Add CSS for animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HapticFeedbackProvider>
          <SimpleWeatherApp />
        </HapticFeedbackProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
