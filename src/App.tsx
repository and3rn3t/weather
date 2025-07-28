/**
 * App Component - Simplified Weather Application Entry Point
 * 
 * A simplified version to debug display issues.
 */

import React, { useState } from 'react';
import { ThemeProvider } from './utils/themeContext';
import { HapticFeedbackProvider } from './utils/hapticContext';
import { useTheme } from './utils/useTheme';
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
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        }
      };

      setWeather(currentWeather);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 51: 'Light drizzle', 61: 'Light rain', 71: 'Light snow',
      80: 'Rain showers', 95: 'Thunderstorm'
    };
    return descriptions[code] || 'Unknown';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.appBackground,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Get Weather'}
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
              marginBottom: '15px'
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
