/**
 * App Component - Simplified Weather Application Entry Point
 *
 * A simplified version to debug display issues.
 */

import React, { useState } from 'react';
import './App.css';
import EnhancedSearchScreen from './components/EnhancedSearchScreen';
import { OfflineStatusIndicator } from './components/mobile/OfflineStatusIndicator';
import MobileNavigation, {
  type NavigationScreen,
} from './components/MobileNavigation';
import SettingsScreen from './components/SettingsScreen';
import ErrorBoundary from './ErrorBoundary';
import './styles/mobileEnhancements.css';
import { HapticFeedbackProvider } from './utils/hapticContext';
import { logError } from './utils/logger';
import type { ScreenInfo } from './utils/mobileScreenOptimization';
import { getScreenInfo } from './utils/mobileScreenOptimization';
import { optimizedFetchJson } from './utils/optimizedFetch';
import { ThemeProvider } from './utils/themeContext';
import ThemeToggle from './utils/ThemeToggle';
import { useTheme } from './utils/useTheme';
import { getWeatherDescription as describeWeather } from './utils/weatherCodes';
import WeatherIcon from './utils/weatherIcons';

// Interfaces for type safety
// Nominatim result shapes are typed ad-hoc where needed in this file

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

// Minimal Open-Meteo response shape used in this file
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    weathercode: number;
    windspeed_10m?: number;
    winddirection_10m?: number;
    uv_index?: number;
    visibility?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

// Simple weather component for debugging
const SimpleWeatherApp: React.FC = () => {
  const { theme } = useTheme();

  // Create basic screen info for SettingsScreen
  const screenInfo: ScreenInfo = getScreenInfo();

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
      const geoData = await optimizedFetchJson<
        { lat: string; lon: string; display_name: string }[]
      >(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          city
        )}&format=json&limit=1`,
        {},
        `app:geo:${city}`
      );

      if (!geoData || geoData.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = geoData[0];

      // Step 2: Get weather data with hourly and daily forecasts
      const weatherData = await optimizedFetchJson<OpenMeteoResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`,
        {},
        `app:weather:${lat},${lon}`
      );

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
            description: describeWeather(weatherData.current.weathercode),
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
      const geoData = await optimizedFetchJson<{
        address?: { city?: string; town?: string; village?: string };
      }>(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {},
        `app:rev:${latitude},${longitude}`
      );

      const cityName =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        'Unknown Location';
      setCity(cityName);

      // Get weather data directly with forecasts
      const weatherData = await optimizedFetchJson<OpenMeteoResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`,
        {},
        `app:weather:${latitude},${longitude}`
      );

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
            description: describeWeather(weatherData.current.weathercode),
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

  // Weather description now centralized in utils/weatherCodes

  const handleRefresh = async () => {
    if (!weather) return; // Only refresh if we have weather data

    setRefreshing(true);
    try {
      if (city) {
        await getWeather();
      }
    } catch (err) {
      logError('Refresh failed:', err);
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
      const data = await optimizedFetchJson<
        {
          name?: string;
          lat: string;
          lon: string;
          display_name: string;
          class?: string;
        }[]
      >(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchTerm
        )}&format=json&limit=5&addressdetails=1`,
        {},
        `app:suggest:${searchTerm}`
      );

      const suggestions = data
        .filter(item => (item as { class?: string }).class === 'place')
        .map(item => ({
          name:
            (item as { name?: string }).name || item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name,
        }));

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      logError('Failed to fetch suggestions:', error);
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
      const weatherData = await optimizedFetchJson<OpenMeteoResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`,
        {},
        `app:weather:${lat},${lon}`
      );

      const currentWeather: WeatherData = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure,
        },
        weather: [
          {
            description: describeWeather(weatherData.current.weathercode),
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
      logError('Weather fetch error:', err);
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
    <div className="app-section">
      <h1 className="app-title text-primary">🌤️ Weather App</h1>

      <div className="card card-large border-weather">
        <div className="emoji-xl">☀️</div>
        <h2 className="subtitle text-primary">Welcome to Weather</h2>
        <p className="paragraph text-secondary">
          Get real-time weather updates, forecasts, and alerts for any location
          worldwide.
        </p>

        <button
          onClick={() => handleNavigate('Weather')}
          className="btn-primary"
        >
          Check Weather
        </button>

        <button
          onClick={getCurrentLocation}
          disabled={locationLoading}
          className="btn-outline text-primary"
        >
          {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
        </button>
      </div>

      {weather && (
        <div className="card border-weather">
          <h3 className="metric-title text-primary">Current Weather</h3>
          <div className="metric-primary text-primary">
            {city}: {weather.main.temp}°F
          </div>
          <div className="metric-secondary text-secondary">
            {weather.weather[0].description}
          </div>
        </div>
      )}
    </div>
  );
  // Weather Screen - Full weather functionality
  const renderWeatherScreen = () => (
    <div className="app-section">
      <h1 className="app-title text-primary">🌤️ Weather Details</h1>

      <div className="search-wrapper">
        <input
          type="text"
          value={city}
          onChange={e => handleCitySearch(e.target.value)}
          placeholder="Enter city name..."
          className="search-input"
          onKeyDown={e => e.key === 'Enter' && getWeather()}
          onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="suggestions">
            {searchSuggestions.map(suggestion => (
              <button
                key={`${suggestion.lat}-${suggestion.lon}`}
                className="suggestion-btn"
                onClick={() => {
                  setCity(suggestion.name);
                  setShowSuggestions(false);
                  // Auto-fetch weather for suggestion
                  setTimeout(() => {
                    fetchWeatherForLocation(suggestion.lat, suggestion.lon);
                  }, 100);
                }}
              >
                <div className="suggestion-title">{suggestion.name}</div>
                <div className="suggestion-sub">{suggestion.display_name}</div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={getWeather}
          disabled={loading}
          className={`btn-action${loading ? ' is-disabled' : ''}`}
        >
          {loading ? 'Loading...' : 'Get Weather'}
        </button>

        <button
          onClick={getCurrentLocation}
          disabled={locationLoading || loading}
          className={`btn-ghost${locationLoading || loading ? ' is-disabled' : ''}`}
        >
          {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <div className="alerts">
          {weatherAlerts.map((alert, alertIndex) => (
            <div
              key={`${alert.type}-${alertIndex}`}
              className={`alert-item ${alert.severity === 'high' ? 'alert-high' : 'alert-medium'}`}
            >
              <span className="alert-icon">
                {alert.severity === 'high' ? '⚠️' : 'ℹ️'}
              </span>
              <div>
                <div className="alert-title">{alert.type}</div>
                <div className="alert-message">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {weather && (
        <div className="card border-weather mb-20">
          <div className="header-row">
            <h2 className="m-0 text-primary">{city}</h2>
            <button
              onClick={() => {
                if (isFavorite(city)) {
                  removeFromFavorites(city);
                } else {
                  // Get coordinates for favorites (simplified)
                  addToFavorites(city, 0, 0);
                }
              }}
              className="icon-btn"
            >
              {isFavorite(city) ? '⭐' : '☆'}
            </button>
          </div>

          {/* Weather Icon */}
          <div className="mb-15">
            <WeatherIcon
              code={weather.weatherCode}
              size={80}
              animated={true}
              isDay={true}
            />
          </div>

          <div className="temp-lg my-10 text-primary">
            {weather.main.temp}°F
          </div>
          <div className="fs-18 mb-15 text-secondary capitalize">
            {weather.weather[0].description}
          </div>

          {/* Weather Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">FEELS LIKE</div>
              <div className="metric-value">{weather.main.feels_like}°F</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">HUMIDITY</div>
              <div className="metric-value">{weather.main.humidity}%</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">WIND SPEED</div>
              <div className="metric-value">{weather.wind.speed} mph</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">PRESSURE</div>
              <div className="metric-value">{weather.main.pressure} hPa</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">UV INDEX</div>
              <div className="metric-value">{weather.uv_index}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">VISIBILITY</div>
              <div className="metric-value">{weather.visibility} mi</div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {hourlyForecast.length > 0 && (
        <div className="card border-weather forecast-section">
          <h3 className="section-title">24-Hour Forecast</h3>
          <div className="hourly-list">
            {hourlyForecast.slice(0, 12).map((hour, hourIndex) => (
              <div
                key={`${hour.time}-${hour.temperature}`}
                className={`hour-item${hourIndex === 0 ? ' is-now' : ''}`}
              >
                <div className={`hour-time${hourIndex === 0 ? ' is-now' : ''}`}>
                  {hourIndex === 0 ? 'Now' : hour.time}
                </div>
                <div className="hour-icon">
                  <WeatherIcon
                    code={hour.weatherCode}
                    size={30}
                    animated={false}
                    isDay={true}
                  />
                </div>
                <div className="hour-temp">{hour.temperature}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {dailyForecast.length > 0 && (
        <div className="card border-weather forecast-section">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="daily-list">
            {dailyForecast.map((day, dayIndex) => (
              <div
                key={`${day.date}-${day.tempMax}-${day.tempMin}`}
                className="daily-item"
              >
                <div
                  className={`daily-date${dayIndex === 0 ? ' is-today' : ''}`}
                >
                  {dayIndex === 0 ? 'Today' : day.date}
                </div>
                <div className="daily-icon">
                  <WeatherIcon
                    code={day.weatherCode}
                    size={28}
                    animated={false}
                    isDay={true}
                  />
                </div>
                <div className="daily-temps">
                  <span className="t-max">{day.tempMax}°</span>
                  <span className="t-min">{day.tempMin}°</span>
                </div>
                {day.precipitation > 0 && (
                  <div className="daily-precip">
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

  // Enhanced Search Screen
  const renderSearchScreen = () => (
    <EnhancedSearchScreen
      theme={theme}
      onBack={() => setCurrentScreen('Home')}
      onLocationSelect={(cityName, latitude, longitude) => {
        // Update the location and switch back to weather screen
        setCity(cityName);
        setCurrentScreen('Home');

        // Fetch weather for the new location
        fetchWeatherForLocation(latitude, longitude);
      }}
    />
  );

  // Favorites Screen - Show current favorites
  const renderFavoritesScreen = () => (
    <div className="app-section">
      <h1 className="app-title text-primary">⭐ Favorites</h1>

      {favorites.length > 0 ? (
        <div className="card border-weather">
          <div className="favorites-list">
            {favorites.map(favorite => (
              <button
                key={`favorite-${favorite.name}`}
                className="favorite-item"
                onClick={() => {
                  setCity(favorite.name);
                  handleNavigate('Weather');
                  setTimeout(() => getWeather(), 100);
                }}
              >
                <span className="favorite-name">📍 {favorite.name}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeFromFavorites(favorite.name);
                  }}
                  className="icon-btn"
                  aria-label={`Remove ${favorite.name} from favorites`}
                >
                  ✕
                </button>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card border-weather empty-favorites">
          <div className="emoji-xl mb-16">⭐</div>
          <p className="paragraph text-secondary mb-20">
            No favorite cities yet.
            <br />
            Add some favorites from the Weather screen!
          </p>
          <button
            onClick={() => handleNavigate('Weather')}
            className="btn-primary"
          >
            Find Weather
          </button>
        </div>
      )}
    </div>
  );

  // Settings Screen - Enhanced Settings with Phase 5A-5C Features
  const renderSettingsScreen = () => (
    <SettingsScreen
      theme={theme}
      screenInfo={screenInfo}
      onBack={() => setCurrentScreen('Home')}
    />
  );

  return (
    <div className="app-root" onTouchStart={handleTouchStart}>
      {/* Dev-only debug banner to confirm render and layering */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="dev-debug-bar">
          UI Debug: App rendered. If you see only this bar, a full-screen
          overlay or opacity rule may be hiding content.
        </div>
      )}
      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className={`pull-refresh${refreshing ? ' is-refreshing' : ''}`}
          data-pull-top={Math.max(10, pullDistance - 30)}
        >
          {refreshing ? (
            <>
              <div className="spinner" />
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

      {/* Offline Status Indicator */}
      <OfflineStatusIndicator
        variant="minimal"
        position="top"
        autoHide={true}
        autoHideDelay={4000}
        showCacheInfo={true}
      />

      {/* Screen Content */}
      {renderScreen()}

      {/* Mobile Navigation */}
      <MobileNavigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
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
