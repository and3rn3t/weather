/**
 * Simplified AppNavigator for Mobile Testing
 * 
 * Clean version focused on mobile optimization testing
 */

import React, { useState, useMemo, Suspense } from 'react';
import { getScreenInfo, getAdaptiveSpacing, getAdaptiveBorderRadius } from '../utils/mobileScreenOptimization';
import ThemeToggle from '../utils/ThemeToggle';
import useLocationServices from '../utils/useLocationServices';
import { WeatherCardSkeleton } from '../utils/LoadingSkeletons';
const WeatherIcon = React.lazy(() => import('../utils/weatherIcons'));

type WeatherData = {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
  city?: string;
  country?: string;
};

type HourlyForecast = {
  time: string;
  temperature: number;
  weatherCode: number;
  humidity: number;
  feelsLike: number;
};

type DailyForecast = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
};

// Maps OpenMeteo weather codes to detailed descriptions
const getWeatherDescription = (code: number): string => {
  const descriptions: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Light rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return descriptions[code] || 'Unknown weather';
};

const SimpleMobileApp: React.FC = () => {
  // const { theme } = useTheme();
  // Only one screen now
  const screenInfo = useMemo(() => getScreenInfo(), []);
  const adaptiveSpacing = useMemo(() => getAdaptiveSpacing(screenInfo), [screenInfo]);
  const adaptiveBorders = useMemo(() => getAdaptiveBorderRadius(screenInfo), [screenInfo]);

  const { getCurrentLocation } = useLocationServices();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [cityPrompt, setCityPrompt] = useState<string>('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Fetch weather from OpenMeteo API
  const fetchWeather = async (lat: number, lon: number, city?: string, country?: string): Promise<void> => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      setWeather({ ...data.current_weather, city, country });
      // Process hourly forecast
      const hourly: HourlyForecast[] = [];
      if (data.hourly && data.hourly.time) {
        for (let i = 0; i < Math.min(24, data.hourly.time.length); i++) {
          hourly.push({
            time: data.hourly.time[i],
            temperature: Math.round(data.hourly.temperature_2m[i] || 0),
            weatherCode: data.hourly.weathercode?.[i] || 0,
            humidity: Math.round(data.hourly.relative_humidity_2m?.[i] || 0),
            feelsLike: Math.round(data.hourly.apparent_temperature?.[i] || 0)
          });
        }
      }
      setHourlyForecast(hourly);
      // Process daily forecast
      const daily: DailyForecast[] = [];
      if (data.daily && data.daily.time) {
        for (let i = 0; i < Math.min(7, data.daily.time.length); i++) {
          daily.push({
            date: data.daily.time[i],
            weatherCode: data.daily.weathercode?.[i] || 0,
            tempMax: Math.round(data.daily.temperature_2m_max[i] || 0),
            tempMin: Math.round(data.daily.temperature_2m_min[i] || 0),
            precipitation: Math.round((data.daily.precipitation_sum?.[i] || 0) * 10) / 10,
            windSpeed: Math.round(data.daily.windspeed_10m_max?.[i] || 0)
          });
        }
      }
      setDailyForecast(daily);
    } catch (e: unknown) {
      setWeatherError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch weather by city name (geocode first)
  const fetchWeatherByCity = async (city: string): Promise<void> => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error('Geocoding error');
      const geoData = await geoRes.json();
      if (!geoData[0]) throw new Error('City not found');
      await fetchWeather(
        parseFloat(geoData[0].lat),
        parseFloat(geoData[0].lon),
        geoData[0].display_name?.split(',')[0] || city,
        geoData[0].address?.country || ''
      );
    } catch (e: unknown) {
      setWeatherError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handler for Check Weather button
  const handleCheckWeather = async () => {
    setWeather(null);
    setWeatherError('');
    setShowCityInput(false);
    // Try geolocation first
    const loc = await getCurrentLocation({ includeAddress: true });
    if (loc && loc.latitude && loc.longitude) {
      await fetchWeather(loc.latitude, loc.longitude, loc.city, loc.country);
    } else {
      setShowCityInput(true);
    }
  };

  // Handler for city input submit
  const handleCitySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cityPrompt.trim()) {
      fetchWeatherByCity(cityPrompt.trim());
      setShowCityInput(false);
    }
  };

  return (
    <div className="safe-area-container" style={{ background: 'var(--primary-gradient)', minHeight: '100vh' }}>
      <ThemeToggle />
      
      <div className="mobile-container fade-in">
        <div className="mobile-card weather-display">
          <Suspense fallback={null}>
            <div
              className="flex-center-col custom-shadow"
              style={{
                width: screenInfo.isVerySmallScreen ? '100px' : '120px',
                height: screenInfo.isVerySmallScreen ? '100px' : '120px',
                background: 'var(--primary-gradient)',
                borderRadius: adaptiveBorders.large,
                margin: `0 auto ${adaptiveSpacing.sectionGap}`,
                boxShadow: 'var(--button-shadow)'
              }}
            >
              <WeatherIcon code={0} size={screenInfo.isVerySmallScreen ? 48 : 64} animated={true} />
              <div className="abs-top-right">
                <WeatherIcon code={61} size={screenInfo.isVerySmallScreen ? 18 : 24} animated={true} />
              </div>
              <div className="abs-bottom-left">
                <WeatherIcon code={3} size={screenInfo.isVerySmallScreen ? 16 : 20} animated={true} />
              </div>
            </div>
          </Suspense>
          
          <h1 className="mobile-title custom-font" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
            Weather
          </h1>
          <div className="flex-center-col" style={{ marginBottom: 16 }}>
            <button
              className="mobile-button mobile-button-large custom-shadow"
              style={{
                background: 'var(--button-gradient)',
                color: 'var(--inverse-text)',
                boxShadow: 'var(--button-shadow)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 18,
                minWidth: 160,
                minHeight: 48
              }}
              onClick={handleCheckWeather}
              aria-label="Check weather"
            >
              <span style={{ fontSize: 20, display: 'inline-flex', alignItems: 'center' }}>🌦️</span>
              Check Weather
            </button>
          </div>
          {/* Weather loading/error/city input UI */}
          {weatherLoading && <WeatherCardSkeleton />}
          {weatherError && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.45)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                setWeatherError('');
              }}
              role="dialog"
              aria-modal="true"
            >
              <div
                style={{
                  background: 'var(--card-background, #fff)',
                  color: 'var(--primary-text, #1f2937)',
                  borderRadius: 16,
                  padding: 32,
                  minWidth: 240,
                  maxWidth: 320,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  textAlign: 'center',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Error</div>
                <div style={{ marginBottom: 20 }}>{weatherError}</div>
                <button
                  className="mobile-button"
                  style={{ marginTop: 8, minWidth: 80 }}
                  onClick={() => {
                    setWeatherError('');
                  }}
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {showCityInput && (
            <form className="flex-center-col mt-20" onSubmit={handleCitySubmit}>
              <input
                type="text"
                placeholder="Enter city name"
                value={cityPrompt}
                onChange={e => setCityPrompt(e.target.value)}
                style={{ padding: '12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, width: 200, maxWidth: '90%' }}
                aria-label="City name"
                autoFocus
              />
              <button className="mobile-button mt-20" type="submit">Get Weather</button>
            </form>
          )}
          {/* Weather display */}
          {weather && !weatherLoading && (
            <>
              <div className="mobile-body mt-20">
                {weather.city && (
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                    📍 {weather.city}{weather.country ? `, ${weather.country}` : ''}
                  </div>
                )}
                <div style={{ fontSize: 17, color: 'var(--primary-text)', marginBottom: 8 }}>
                  {getWeatherDescription(weather.weathercode)}
                </div>
                <div>🌡️ Temp: {weather.temperature}°F</div>
                <div>💨 Wind: {weather.windspeed} mph</div>
                <div>🌀 Code: {weather.weathercode}</div>
                <div>🕒 Time: {weather.time}</div>
              </div>
              {/* Hourly Forecast */}
              {hourlyForecast.length > 0 && (
                <div className="hourly-forecast-section mt-24">
                  <h3 className="custom-font" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🕐 24-Hour Forecast
                  </h3>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory', scrollPadding: '16px' }}>
                    {hourlyForecast.map((hour, idx) => {
                      const hourDate = new Date(hour.time);
                      const hourStr = hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={hour.time + idx} style={{ minWidth: 80, background: 'var(--card-background)', borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', scrollSnapAlign: 'start', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: 500, marginBottom: 6 }}>{hourStr}</div>
                          <div style={{ marginBottom: 8 }}>
                            <WeatherIcon code={hour.weatherCode} size={32} animated={true} />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>{hour.temperature}°F</div>
                          <div style={{ fontSize: 10, color: 'var(--secondary-text)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span>💧 {hour.humidity}%</span>
                            <span>Feels {hour.feelsLike}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Daily Forecast */}
              {dailyForecast.length > 0 && (
                <div className="daily-forecast-section mt-24 forecast-bg">
                  <h3 className="custom-font" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📅 7-Day Forecast
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                    {dailyForecast.map((day, idx) => {
                      const dayDate = new Date(day.date);
                      const isToday = idx === 0;
                      const dayName = isToday ? 'Today' : dayDate.toLocaleDateString([], { weekday: 'short' });
                      const dateStr = dayDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      return (
                        <div
                          key={day.date + idx}
                          className={isToday ? 'forecast-card today-card' : 'forecast-card'}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 0.8fr 1fr auto',
                            alignItems: 'center',
                            gap: 16,
                            width: '100%',
                            boxSizing: 'border-box',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '16px 16px',
                            minHeight: 64
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <div style={{ fontSize: 17, fontWeight: isToday ? 800 : 600, color: 'var(--primary-text)', marginBottom: 2 }}>{dayName}</div>
                            <div style={{ fontSize: 12, color: 'var(--secondary-text)' }}>{dateStr}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36 }}>
                            <WeatherIcon code={day.weatherCode} size={36} animated={true} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2, minWidth: 48 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-text)', textAlign: 'right' }}>{day.tempMax}°</div>
                            <div style={{ fontSize: 14, color: 'var(--secondary-text)', textAlign: 'right' }}>{day.tempMin}°</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 13, color: 'var(--secondary-text)', gap: 2, minWidth: 56, overflow: 'visible', whiteSpace: 'nowrap' }}>
                            {day.precipitation > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2, textAlign: 'right', whiteSpace: 'nowrap' }}>🌧️ <span>{day.precipitation}mm</span></span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, textAlign: 'right', whiteSpace: 'nowrap' }}>💨 <span>{day.windSpeed}mph</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default SimpleMobileApp;
