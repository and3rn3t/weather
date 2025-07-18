import { useState } from 'react';

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
const AppNavigator = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /** Current active screen ('Home' | 'WeatherDetails') */
  const [currentScreen, setCurrentScreen] = useState('Home');
  
  /** User input city name for weather search */
  const [city, setCity] = useState('');
  
  /** Transformed weather data from OpenMeteo API */
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  /** Current weather code from OpenMeteo (used for icon selection) */
  const [weatherCode, setWeatherCode] = useState(0);
  
  /** Loading state for API requests */
  const [loading, setLoading] = useState(false);
  
  /** Error message for display to user */
  const [error, setError] = useState('');

  // ============================================================================
  // NAVIGATION FUNCTIONS
  // ============================================================================
  
  /**
   * Navigate between screens
   * @param screenName - Target screen name
   */
  const navigate = (screenName: string) => {
    setCurrentScreen(screenName);
  };

  // ============================================================================
  // WEATHER ICON MAPPING
  // ============================================================================
  
  /**
   * Maps OpenMeteo weather codes to animated emoji icons
   * @param code - OpenMeteo weather code (0-99)
   * @returns Emoji string for the weather condition
   */
  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';                    // Clear sky
    if (code === 1) return '🌤️';                   // Mainly clear
    if (code === 2 || code === 3) return '☁️';     // Partly cloudy / Overcast
    if (code === 45 || code === 48) return '🌫️';  // Fog / Depositing rime fog
    if (code >= 51 && code <= 55) return '🌦️';    // Drizzle (light to dense)
    if (code >= 61 && code <= 65) return '🌧️';    // Rain (light to heavy)
    if (code >= 71 && code <= 75) return '❄️';     // Snow (light to heavy)
    if (code >= 80 && code <= 82) return '🌦️';    // Rain showers (light to violent)
    if (code >= 95 && code <= 99) return '⛈️';     // Thunderstorms (with/without hail)
    return '🌤️';                                   // Default fallback
  };

  // ============================================================================
  // MAIN WEATHER API FUNCTION
  // ============================================================================
  
  /**
   * Fetches weather data using a two-step process:
   * 1. Convert city name to coordinates using OpenStreetMap Nominatim
   * 2. Get weather data from OpenMeteo using coordinates
   * 
   * This approach ensures accurate weather data for any global location
   * while using completely free APIs with no rate limits or API keys required.
   */
  const getWeather = async () => {
    // Input validation
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // ========================================================================
      // STEP 1: GEOCODING - Convert city name to coordinates
      // ========================================================================
      
      const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
      const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
      
      console.log('🔍 Geocoding city:', city);
      const geoResponse = await fetch(geoUrl, {
        headers: {
          // Required by Nominatim API for compliance and abuse prevention
          'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)'
        }
      });
      
      if (!geoResponse.ok) {
        throw new Error(`Geocoding failed: ${geoResponse.status}`);
      }
      
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error('City not found. Please check the spelling and try again.');
      }
      
      const { lat, lon } = geoData[0];
      console.log(`📍 Coordinates found: ${city} → lat=${lat}, lon=${lon}`);

      // ========================================================================
      // STEP 2: WEATHER DATA - Get current conditions and hourly data
      // ========================================================================
      
      const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
      const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
      
      console.log('🌤️ Fetching weather data from OpenMeteo...');
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.text();
        console.error('❌ OpenMeteo API Error:', errorData);
        throw new Error(`Weather API failed: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      console.log('✅ Weather data received:', weatherData);

      // ========================================================================
      // STEP 3: DATA PROCESSING - Extract and transform weather information
      // ========================================================================
      
      // Get weather code for icon selection
      const currentWeatherCode = weatherData.current_weather?.weathercode || 0;
      setWeatherCode(currentWeatherCode);
      
      /**
       * Maps OpenMeteo weather codes to human-readable descriptions
       * Reference: https://open-meteo.com/en/docs
       */
      const getWeatherDescription = (code: number) => {
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
      
      // ========================================================================
      // STEP 4: DATA TRANSFORMATION - Convert to standardized format
      // ========================================================================
      
      /*
       * OpenMeteo API Structure:
       * - current_weather: Basic conditions (temp, wind, weather code)
       * - hourly: Detailed metrics in arrays (humidity, pressure, UV, etc.)
       * 
       * We extract current hour data from hourly arrays for detailed metrics
       */
      const currentHour = new Date().getHours();
      const hourlyData = weatherData.hourly;
      
      const transformedData = {
        main: {
          // Temperature from current_weather (always available)
          temp: weatherData.current_weather?.temperature || 0,
          
          // Feels-like temperature from hourly data, fallback to actual temp
          feels_like: hourlyData?.apparent_temperature?.[currentHour] || 
                     weatherData.current_weather?.temperature || 0,
          
          // Humidity from hourly data with reasonable default
          humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50,
          
          // Atmospheric pressure from hourly data with sea level default
          pressure: hourlyData?.surface_pressure?.[currentHour] || 1013
        },
        weather: [{
          description: getWeatherDescription(currentWeatherCode)
        }],
        wind: {
          // Wind data from current_weather
          speed: weatherData.current_weather?.windspeed || 0,
          deg: weatherData.current_weather?.winddirection || 0
        },
        // Additional metrics from hourly data
        uv_index: hourlyData?.uv_index?.[currentHour] || 0,
        visibility: hourlyData?.visibility?.[currentHour] || 0
      };
      
      setWeather(transformedData);
      console.log('🎉 Weather data successfully processed and displayed');
      
    } catch (error) {
      console.error('💥 Error in weather fetch process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch weather data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER LOGIC - SCREEN ROUTING
  // ============================================================================

  // HOME SCREEN - Landing page with app introduction
  if (currentScreen === 'Home') {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Glassmorphism Card Container */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          maxWidth: '500px',
          width: '100%'
        }}>
          {/* App Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '20px',
            margin: '0 auto 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px'
          }}>
            🌤️
          </div>
          
          {/* App Title */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '16px', 
            color: '#1a202c',
            letterSpacing: '-0.5px'
          }}>
            Weather App
          </h1>
          
          {/* App Description */}
          <p style={{
            fontSize: '18px',
            color: '#718096',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Get real-time weather information for any city around the world
          </p>
          
          {/* Navigation Button */}
          <button 
            onClick={() => navigate('WeatherDetails')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
            }}
          >
            Check Weather →
          </button>
        </div>
      </div>
    );
  }

  // WEATHER DETAILS SCREEN - Main weather interface
  if (currentScreen === 'WeatherDetails') {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button 
            onClick={() => navigate('Home')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '30px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ← Back to Home
          </button>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              marginBottom: '32px', 
              color: '#1a202c',
              textAlign: 'center',
              letterSpacing: '-0.5px'
            }}>
              🌍 Weather Forecast
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
                onChange={(e) => setCity(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '250px',
                  height: '56px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '0 20px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: '#f8fafc',
                  color: '#1a202c',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#667eea';
                  target.style.backgroundColor = '#ffffff';
                  target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#e2e8f0';
                  target.style.backgroundColor = '#f8fafc';
                  target.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => e.key === 'Enter' && getWeather()}
              />
              <button 
                onClick={getWeather}
                disabled={loading}
                style={{
                  background: loading ? 'linear-gradient(135deg, #a0a0a0, #808080)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 10px 25px rgba(102, 126, 234, 0.3)',
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
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                color: '#dc2626',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: '1px solid #fca5a5',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}

            {weather && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                padding: '32px',
                borderRadius: '20px',
                border: '2px solid #0ea5e9',
                boxShadow: '0 10px 30px rgba(14, 165, 233, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: 'white',
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
                
                {/* Main Temperature */}
                <div style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: '#0c4a6e',
                  marginBottom: '8px',
                  letterSpacing: '-2px'
                }}>
                  {Math.round(weather.main.temp)}°F
                </div>
                
                <div style={{
                  fontSize: '16px',
                  color: '#0369a1',
                  marginBottom: '8px'
                }}>
                  Feels like {Math.round(weather.main.feels_like)}°F
                </div>
                
                <div style={{
                  fontSize: '20px',
                  color: '#0369a1',
                  textTransform: 'capitalize',
                  fontWeight: '500',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    fontSize: '32px',
                    animation: 'bounce 2s ease-in-out infinite'
                  }}>
                    {getWeatherIcon(weatherCode)}
                  </span>
                  {weather.weather[0].description}
                </div>
                
                {/* Weather Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                      💧 HUMIDITY
                    </div>
                    <div style={{ fontSize: '18px', color: '#0c4a6e', fontWeight: '700' }}>
                      {weather.main.humidity}%
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                      💨 WIND
                    </div>
                    <div style={{ fontSize: '18px', color: '#0c4a6e', fontWeight: '700' }}>
                      {Math.round(weather.wind.speed)} mph
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {weather.wind.deg}° direction
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                      🌡️ PRESSURE
                    </div>
                    <div style={{ fontSize: '18px', color: '#0c4a6e', fontWeight: '700' }}>
                      {Math.round(weather.main.pressure)} hPa
                    </div>
                  </div>
                  
                  {weather.uv_index > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(14, 165, 233, 0.2)'
                    }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                        ☀️ UV INDEX
                      </div>
                      <div style={{ fontSize: '18px', color: '#0c4a6e', fontWeight: '700' }}>
                        {Math.round(weather.uv_index)}
                      </div>
                    </div>
                  )}
                  
                  {weather.visibility > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(14, 165, 233, 0.2)'
                    }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                        👁️ VISIBILITY
                      </div>
                      <div style={{ fontSize: '18px', color: '#0c4a6e', fontWeight: '700' }}>
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
                  margin: '0 auto'
                }}></div>
              </div>
            )}
          </div>
        </div>
        
        {/* CSS Animations for loading spinner and weather icon bounce */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { 
              transform: translateY(0); 
            }
            40% { 
              transform: translateY(-8px); 
            }
            60% { 
              transform: translateY(-4px); 
            }
          }
        `}</style>
      </div>
    );
  }

  // Fallback for unknown screen states
  return <div>Unknown screen</div>;
};

export default AppNavigator;
