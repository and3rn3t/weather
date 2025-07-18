import { useState } from 'react';

type WeatherData = {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    description: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  uv_index: number;
  visibility: number;
};

/**
 * AppNavigator component.
 * Sets up a modern navigation structure for the weather app with two screens: Home and WeatherDetails.
 * 
 * Features:
 * - Glassmorphism design with gradient backgrounds
 * - OpenMeteo weather API integration (free, no API key required)
 * - OpenStreetMap Nominatim geocoding (free)
 * - Responsive animations and hover effects
 * - Imperial units (Fahrenheit) display
 */
const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = (screenName: string) => {
    setCurrentScreen(screenName);
  };

  const getWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Step 1: Get coordinates from city name using OpenStreetMap Nominatim (free geocoding)
      const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search';
      const geoUrl = `${GEOCODING_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
      
      console.log('Getting coordinates for city:', city);
      const geoResponse = await fetch(geoUrl, {
        headers: {
          'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' // Required by Nominatim for API compliance
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
      console.log(`Coordinates for ${city}: lat=${lat}, lon=${lon}`);

      // Step 2: Get weather data using OpenMeteo API (completely free, no API key required)
      const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
      const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
      
      console.log('Getting weather data from OpenMeteo...');
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.text();
        console.error('OpenMeteo API Error:', errorData);
        throw new Error(`Weather API failed: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      console.log('Weather data received:', weatherData);
      console.log('Current weather object:', weatherData.current_weather);
      console.log('Current data object:', weatherData.current);
      console.log('Available current properties:', weatherData.current ? Object.keys(weatherData.current) : 'No current object');
      
      // Get weather code from current_weather data
      const weatherCode = weatherData.current_weather?.weathercode || 0;
      
      // Weather codes mapping for OpenMeteo API
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
      
      // Transform OpenMeteo response to match our expected format
      // Since current object doesn't exist, we'll use current_weather and get current hour from hourly data
      const currentHour = new Date().getHours();
      const hourlyData = weatherData.hourly;
      
      const transformedData = {
        main: {
          temp: weatherData.current_weather?.temperature || 0,
          feels_like: hourlyData?.apparent_temperature?.[currentHour] || weatherData.current_weather?.temperature || 0,
          humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50, // Default reasonable value
          pressure: hourlyData?.surface_pressure?.[currentHour] || 1013 // Default sea level pressure
        },
        weather: [{
          description: getWeatherDescription(weatherCode)
        }],
        wind: {
          speed: weatherData.current_weather?.windspeed || 0,
          deg: weatherData.current_weather?.winddirection || 0
        },
        uv_index: hourlyData?.uv_index?.[currentHour] || 0,
        visibility: hourlyData?.visibility?.[currentHour] || 0
      };
      
      setWeather(transformedData);
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch weather data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

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
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '16px', 
            color: '#1a202c',
            letterSpacing: '-0.5px'
          }}>
            Weather App
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#718096',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Get real-time weather information for any city around the world
          </p>
          
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
                  marginBottom: '24px'
                }}>
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
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <div>Unknown screen</div>;
};

export default AppNavigator;
