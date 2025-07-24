/**
 * Simplified AppNavigator for Mobile Testing
 * 
 * Clean version focused on mobile optimization testing
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { getScreenInfo, getAdaptiveFontSizes, getAdaptiveSpacing, getAdaptiveBorderRadius } from '../utils/mobileScreenOptimization';
import ThemeToggle from '../utils/ThemeToggle';
import useLocationServices from '../utils/useLocationServices';
import { WeatherCardSkeleton } from '../utils/LoadingSkeletons';

const MobileTest = React.lazy(() => import('../components/MobileTest'));
const MobileDebug = React.lazy(() => import('../utils/MobileDebug'));
const WeatherIcon = React.lazy(() => import('../utils/weatherIcons'));

type WeatherData = {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
  city?: string;
  country?: string;
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
  const [currentScreen, setCurrentScreen] = useState<'home' | 'test'>('home');
  const screenInfo = useMemo(() => getScreenInfo(), []);
  const adaptiveFonts = useMemo(() => getAdaptiveFontSizes(screenInfo), [screenInfo]);
  const adaptiveSpacing = useMemo(() => getAdaptiveSpacing(screenInfo), [screenInfo]);
  const adaptiveBorders = useMemo(() => getAdaptiveBorderRadius(screenInfo), [screenInfo]);

  const { getCurrentLocation } = useLocationServices();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [cityPrompt, setCityPrompt] = useState<string>('');
  const [showCityInput, setShowCityInput] = useState(false);

  // Fetch weather from OpenMeteo API
  const fetchWeather = async (lat: number, lon: number, city?: string, country?: string): Promise<void> => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      setWeather({ ...data.current_weather, city, country });
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

  // Navigation function
  const navigate = useCallback((screen: 'home' | 'test') => {
    setCurrentScreen(screen);
  }, []);

  if (currentScreen === 'test') {
    return (
      <div className="safe-area-container" style={{ background: 'var(--primary-gradient)', minHeight: '100vh' }}>
        <Suspense fallback={null}>
          <MobileTest />
        </Suspense>
        <button 
          className="mobile-back-button fixed-top-left glass-blur"
          onClick={() => navigate('home')}
          aria-label="Go back to home screen"
          style={{
            background: 'var(--toggle-background)',
            color: 'var(--primary-text)',
            border: '1px solid var(--toggle-border)'
          }}
        >
          Back
        </button>
        <Suspense fallback={null}>
          <MobileDebug enabled={true} position="bottom-right" />
        </Suspense>
      </div>
    );
  }

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
          
          <h1 className="mobile-title custom-font">
            Mobile Weather App
          </h1>
          
          <p className="mobile-body custom-font text-center">
            Testing mobile optimizations for better usability on mobile devices
          </p>
          
          <div className="flex-row-wrap-center" style={{ gap: adaptiveSpacing.elementGap, marginBottom: adaptiveSpacing.sectionGap }}>
            {[
              { code: 0, label: 'Sunny' },
              { code: 61, label: 'Rainy' },
              { code: 71, label: 'Snow' },
              { code: 95, label: 'Storms' }
            ].map(({ code, label }) => (
              <div key={label} className="text-center">
                <Suspense fallback={null}>
                  <WeatherIcon code={code} size={screenInfo.isVerySmallScreen ? 24 : 32} animated={true} />
                </Suspense>
                <div className="custom-font" style={{ fontSize: adaptiveFonts.bodySmall, color: 'var(--secondary-text)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex-center-col">
            <button
              className="mobile-button mobile-button-large custom-shadow"
              style={{
                background: 'var(--button-gradient)',
                color: 'var(--inverse-text)',
                boxShadow: 'var(--button-shadow)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={handleCheckWeather}
              aria-label="Check weather (demo button)"
            >
              <span style={{ fontSize: 18, display: 'inline-flex', alignItems: 'center' }}>🌦️</span>
              Check Weather
            </button>
            
            <button
              className="mobile-button-glass"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => navigate('test')}
              aria-label="Test mobile UI"
            >
              <span style={{ fontSize: 18, display: 'inline-flex', alignItems: 'center' }}>🔧</span>
              Test Mobile UI
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
          )}
        </div>
      </div>
      
      <Suspense fallback={null}>
        <MobileDebug enabled={true} position="bottom-right" />
      </Suspense>
    </div>
  );
};

export default SimpleMobileApp;
