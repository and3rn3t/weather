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
import ErrorBoundary from './ErrorBoundary';
import './App.css';

// Simple weather component for debugging
const SimpleWeatherApp: React.FC = () => {
  const { theme } = useTheme();
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

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

      // Step 2: Get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      
      const weatherData = await weatherResponse.json();
      
      // Transform data
      const currentWeather = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure
        },
        weather: [{
          description: getWeatherDescription(weatherData.current.weathercode)
        }],
        wind: {
          speed: 0,
          deg: 0
        },
        weatherCode: weatherData.current.weathercode
      };

      setWeather(currentWeather);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
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
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Get city name from coordinates
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'WeatherApp/1.0' } }
      );
      const geoData = await geoResponse.json();
      
      const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown Location';
      setCity(cityName);

      // Get weather data directly
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      
      const weatherData = await weatherResponse.json();
      
      // Transform data
      const currentWeather = {
        main: {
          temp: Math.round(weatherData.current.temperature_2m),
          feels_like: Math.round(weatherData.current.apparent_temperature),
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure
        },
        weather: [{
          description: getWeatherDescription(weatherData.current.weathercode)
        }],
        wind: {
          speed: 0,
          deg: 0
        },
        weatherCode: weatherData.current.weathercode
      };

      setWeather(currentWeather);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location services.');
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
        setError(err instanceof Error ? err.message : 'Failed to get current location');
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
      99: 'thunderstorm with heavy hail'
    };
    return descriptions[code] || 'unknown weather';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.appBackground,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Theme Toggle Button */}
      <ThemeToggle />
      
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <h1 style={{ 
          color: theme.primaryText, 
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          🌤️ Weather App
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.secondaryText}`,
              background: theme.cardBackground,
              color: theme.primaryText,
              fontSize: '16px',
              marginBottom: '10px'
            }}
            onKeyDown={(e) => e.key === 'Enter' && getWeather()}
          />
          
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
              marginBottom: '10px'
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
              cursor: (locationLoading || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {weather && (
          <div style={{
            background: theme.weatherCardBackground,
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.weatherCardBorder}`,
            textAlign: 'center'
          }}>
            <h2 style={{ color: theme.primaryText, margin: '0 0 10px 0' }}>
              {city}
            </h2>
            
            {/* Weather Icon */}
            <div style={{ marginBottom: '15px' }}>
              <WeatherIcon 
                code={weather.weatherCode} 
                size={80} 
                animated={true}
                isDay={true} 
              />
            </div>
            
            <div style={{ 
              fontSize: '48px', 
              fontWeight: 'bold',
              color: theme.primaryText,
              margin: '10px 0'
            }}>
              {weather.main.temp}°F
            </div>
            <div style={{ 
              color: theme.secondaryText,
              fontSize: '18px',
              marginBottom: '15px',
              textTransform: 'capitalize'
            }}>
              {weather.weather[0].description}
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              color: theme.secondaryText
            }}>
              <div>Feels like: {weather.main.feels_like}°F</div>
              <div>Humidity: {weather.main.humidity}%</div>
              <div>Pressure: {weather.main.pressure} hPa</div>
            </div>
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
        <HapticFeedbackProvider>
          <SimpleWeatherApp />
        </HapticFeedbackProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
