/**
 * Clean Weather App - Modern, Simple, Functional
 *
 * A complete refactor with:
 * - Clean component structure
 * - Modern, beautiful UI
 * - Simple, maintainable code
 * - Working functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './utils/themeContext';
import { useTheme } from './utils/useTheme';
import { optimizedFetchJson } from './utils/optimizedFetch';
import { getStoredUnits, getTemperatureSymbol, formatWindSpeed, formatVisibility, formatPrecipitation } from './utils/units';
import { getWeatherDescription } from './utils/weatherCodes';
import WeatherIcon from './utils/weatherIcons';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

// Types
interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  visibility: number;
  weatherCode: number;
  description: string;
}

interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
}

interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitation: number;
}

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
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

const WeatherApp: React.FC = () => {
  const { themeName } = useTheme();
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{name: string; lat: number; lon: number; display_name: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch weather data
  const fetchWeather = useCallback(async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    setError('');

    try {
      const units = getStoredUnits();
      const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
      const windUnit = units === 'imperial' ? 'mph' : 'kmh';
      const precipUnit = units === 'imperial' ? 'inch' : 'mm';

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,weathercode,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&forecast_days=7`;

      const data = await optimizedFetchJson<OpenMeteoResponse>(
        url,
        {
          headers: {
            'Accept': 'application/json',
          },
        },
        `weather:${lat},${lon}`
      );

      if (!data?.current) {
        throw new Error('Invalid weather data received');
      }

      const current = data.current;
      const weatherData: WeatherData = {
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        pressure: Math.round(current.surface_pressure),
        windSpeed: current.windspeed_10m || 0,
        windDirection: current.winddirection_10m || 0,
        uvIndex: current.uv_index || 0,
        visibility: current.visibility || 10000,
        weatherCode: current.weathercode,
        description: getWeatherDescription(current.weathercode),
      };

      // Process hourly forecast (next 24 hours)
      const hourly: HourlyForecast[] = [];
      const now = new Date();
      const nowTime = now.getTime();

      // Get next 24 hours of forecast data
      for (let i = 0; i < data.hourly.time.length; i++) {
        const forecastTime = new Date(data.hourly.time[i]);
        const forecastTimeMs = forecastTime.getTime();
        const hoursFromNow = (forecastTimeMs - nowTime) / (1000 * 60 * 60);

        // Include current hour and next 23 hours (24 total)
        if (hoursFromNow >= 0 && hoursFromNow < 24 && hourly.length < 24) {
          hourly.push({
            time: forecastTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            temp: Math.round(data.hourly.temperature_2m[i]),
            weatherCode: data.hourly.weathercode[i],
          });
        }
      }

      // Process daily forecast
      const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weathercode[i],
        precipitation: data.daily.precipitation_sum?.[i] || 0,
      }));

      setWeather(weatherData);
      setHourlyForecast(hourly);
      setDailyForecast(daily);
      if (cityName) setCity(cityName);
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to fetch weather data. Please check your internet connection and try again.';
      setError(errorMessage);
      setWeather(null);
      setHourlyForecast([]);
      setDailyForecast([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Get city name from reverse geocoding
      const geoData = await optimizedFetchJson<{address?: {city?: string; town?: string; village?: string; municipality?: string; state?: string}}>(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            'User-Agent': 'PremiumWeatherApp/1.0 (weather-app@andernet.dev)',
            'Accept': 'application/json',
          },
        },
        `reverse:${latitude},${longitude}`
      );

      const cityName =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.municipality ||
        `${geoData.address?.state || 'Current Location'}`;
      setCity(cityName);
      await fetchWeather(latitude, longitude, cityName);

      // Save location to localStorage
      localStorage.setItem('lastCity', JSON.stringify({
        name: cityName,
        lat: latitude,
        lon: longitude,
      }));
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable');
            break;
          case err.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('Failed to get location');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to get location');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWeather]);

  // Search for cities
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await optimizedFetchJson<Array<{name?: string; lat: string; lon: string; display_name: string; class?: string}>>(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PremiumWeatherApp/1.0 (weather-app@andernet.dev)',
            'Accept': 'application/json',
          },
        },
        `search:${query}`
      );

      const suggestions = data
        .filter(item => item.class === 'place')
        .map(item => ({
          name: item.name || item.display_name.split(',')[0],
          lat: Number.parseFloat(item.lat),
          lon: Number.parseFloat(item.lon),
          display_name: item.display_name,
        }));

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch {
      // Silently fail search suggestions
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Auto-fetch on mount if we have a saved city, or prompt for location
  useEffect(() => {
    const savedCity = localStorage.getItem('lastCity');
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        setCity(parsed.name);
        fetchWeather(parsed.lat, parsed.lon, parsed.name);
      } catch {
        // Ignore parse errors, will show empty state
      }
    }
    // Note: We don't auto-request location on mount to respect user privacy
    // User can click the location button if they want to use their location
  }, [fetchWeather]);

  const units = getStoredUnits();
  const tempSymbol = getTemperatureSymbol(units);

  return (
    <div className={`weather-app theme-${themeName}`}>
      <div className="weather-container">
        {/* Header */}
        <header className="weather-header">
          <h1 className="app-title">Weather</h1>
          <div className="header-actions">
            {weather && (
              <button
                className="refresh-btn"
                onClick={() => {
                  const savedCity = localStorage.getItem('lastCity');
                  if (savedCity) {
                    try {
                      const parsed = JSON.parse(savedCity);
                      fetchWeather(parsed.lat, parsed.lon, parsed.name);
                    } catch {
                      // Ignore
                    }
                  }
                }}
                disabled={loading}
                aria-label="Refresh weather data"
                title="Refresh"
              >
                🔄
              </button>
            )}
            <button
              className="location-btn"
              onClick={getCurrentLocation}
              disabled={loading}
              aria-label="Get current location"
              title="Use current location"
            >
              📍
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                // If user presses Enter, select first suggestion or trigger search
                if (searchSuggestions.length > 0) {
                  const first = searchSuggestions[0];
                  setSearchQuery(first.name);
                  setShowSuggestions(false);
                  fetchWeather(first.lat, first.lon, first.name);
                  localStorage.setItem('lastCity', JSON.stringify({
                    name: first.name,
                    lat: first.lat,
                    lon: first.lon,
                  }));
                }
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            aria-label="Search for a city"
            role="searchbox"
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {searchSuggestions.map((suggestion: {name: string; lat: number; lon: number; display_name: string}, idx: number) => (
                <button
                  key={`${suggestion.lat}-${suggestion.lon}-${idx}`}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchQuery(suggestion.name);
                    setShowSuggestions(false);
                    fetchWeather(suggestion.lat, suggestion.lon, suggestion.name);
                    localStorage.setItem('lastCity', JSON.stringify({
                      name: suggestion.name,
                      lat: suggestion.lat,
                      lon: suggestion.lon,
                    }));
                  }}
                >
                  <span className="suggestion-name">{suggestion.name}</span>
                  <span className="suggestion-details">{suggestion.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !weather && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading weather data...</p>
          </div>
        )}

        {/* Weather Display */}
        {weather && !loading && (
          <>
            {/* Current Weather Card */}
            <div className="weather-card main-card">
              <div className="weather-location">{city || 'Current Location'}</div>
              <div className="weather-main">
                <div className="weather-icon-large">
                  <WeatherIcon code={weather.weatherCode} size={120} animated={true} isDay={true} />
                </div>
                <div className="weather-temp">
                  {weather.temp}{tempSymbol}
                </div>
                <div className="weather-description">{weather.description}</div>
                <div className="weather-feels-like">
                  Feels like {weather.feelsLike}{tempSymbol}
                </div>
              </div>

              {/* Weather Metrics Grid */}
              <div className="weather-metrics">
                <div className="metric">
                  <div className="metric-label">Humidity</div>
                  <div className="metric-value">{weather.humidity}%</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Wind</div>
                  <div className="metric-value">{formatWindSpeed(weather.windSpeed, units)}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Pressure</div>
                  <div className="metric-value">{weather.pressure} hPa</div>
                </div>
                <div className="metric">
                  <div className="metric-label">UV Index</div>
                  <div className="metric-value">{weather.uvIndex}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Visibility</div>
                  <div className="metric-value">{formatVisibility(weather.visibility, units)}</div>
                </div>
              </div>
            </div>

            {/* Hourly Forecast */}
            {hourlyForecast.length > 0 && (
              <div className="weather-card">
                <h2 className="forecast-title">24-Hour Forecast</h2>
                <div className="hourly-forecast">
                  {hourlyForecast.slice(0, 12).map((hour: HourlyForecast, idx: number) => (
                    <div key={`${hour.time}-${idx}`} className="hourly-item">
                      <div className="hourly-time">{idx === 0 ? 'Now' : hour.time}</div>
                      <div className="hourly-icon">
                        <WeatherIcon code={hour.weatherCode} size={32} animated={false} isDay={true} />
                      </div>
                      <div className="hourly-temp">{hour.temp}{tempSymbol}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Forecast */}
            {dailyForecast.length > 0 && (
              <div className="weather-card">
                <h2 className="forecast-title">7-Day Forecast</h2>
                <div className="daily-forecast">
                  {dailyForecast.map((day: DailyForecast, idx: number) => (
                    <div key={`${day.date}-${idx}`} className="daily-item">
                      <div className="daily-date">{idx === 0 ? 'Today' : day.date}</div>
                      <div className="daily-icon">
                        <WeatherIcon code={day.weatherCode} size={40} animated={false} isDay={true} />
                      </div>
                      <div className="daily-temps">
                        <span className="daily-temp-max">{day.tempMax}{tempSymbol}</span>
                        <span className="daily-temp-min">{day.tempMin}{tempSymbol}</span>
                      </div>
                      {day.precipitation > 0 && (
                        <div className="daily-precip">
                          {formatPrecipitation(day.precipitation, units)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!weather && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🌤️</div>
            <h2>Welcome to Weather</h2>
            <p>Search for a city or use your current location to get started.</p>
            <button className="btn-primary" onClick={getCurrentLocation}>
              Use Current Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WeatherApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
