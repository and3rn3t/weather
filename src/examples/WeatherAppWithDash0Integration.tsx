/**
 * Complete Dash0 Integration Example
 * This shows exactly how to integrate Dash0 into your existing weather app
 */

import { useEffect, useState } from 'react';
import {
  AppNavigatorWithTelemetry,
  NavigationButtonWithTelemetry,
  SearchWithTelemetry,
  ThemeToggleWithTelemetry,
} from '../components/AppNavigatorWithTelemetry';
import {
  Dash0ErrorBoundary,
  usePerformanceMonitor,
} from '../components/Dash0ErrorBoundary';
import { useDash0Telemetry } from '../hooks/useDash0Telemetry';
import { useWeatherApiWithTelemetry } from '../services/weatherApiWithTelemetry';

/**
 * Enhanced Weather Component with Dash0 Integration
 * This replaces/enhances your existing weather components
 */
function WeatherAppWithDash0() {
  // State management
  const [currentScreen, setCurrentScreen] = useState('home');
  const [previousScreen, setPreviousScreen] = useState<string>('');
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dash0 hooks
  const weatherApi = useWeatherApiWithTelemetry();
  const telemetry = useDash0Telemetry();
  const performance = usePerformanceMonitor({
    componentName: 'WeatherApp',
    trackRender: true,
    trackMount: true,
    trackUnmount: true,
    trackInteractions: true,
  });

  // Navigation handler with telemetry
  const handleNavigation = (newScreen: string) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(newScreen);

    // Track custom navigation events
    performance.trackInteraction('navigation', {
      from: currentScreen,
      to: newScreen,
    });
  };

  // Weather search with telemetry
  const handleWeatherSearch = async (city: string) => {
    setIsLoading(true);
    setError('');

    try {
      // This automatically tracks API calls, response times, and errors
      const data = await weatherApi.searchWeatherByCity(city);
      setWeatherData(data);

      // Track successful weather data display
      telemetry.trackUserInteraction({
        action: 'weather_data_displayed',
        component: 'WeatherApp',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      // Errors are automatically tracked by the API service
      // But you can add custom error context here
      telemetry.trackUserInteraction({
        action: 'weather_search_failed',
        component: 'WeatherApp',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Theme toggle with telemetry
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    // This automatically tracks theme changes
    telemetry.trackThemeChange({
      theme: newTheme ? 'dark' : 'light',
    });
  };

  // Track app initialization
  useEffect(() => {
    telemetry.trackUserInteraction({
      action: 'app_initialized',
      component: 'WeatherApp',
    });
  }, [telemetry]);

  return (
    <Dash0ErrorBoundary>
      <AppNavigatorWithTelemetry
        currentScreen={currentScreen}
        previousScreen={previousScreen}
        weatherData={weatherData}
      >
        <div className={`weather-app ${isDarkMode ? 'dark' : 'light'}`}>
          {/* Header with theme toggle */}
          <header className="app-header">
            <h1>🌤️ Premium Weather</h1>
            <ThemeToggleWithTelemetry
              isDarkMode={isDarkMode}
              onToggle={handleThemeToggle}
            />
          </header>

          {/* Navigation */}
          <nav className="app-navigation">
            <NavigationButtonWithTelemetry
              onPress={() => handleNavigation('home')}
              screen="home"
              label="Home"
              isActive={currentScreen === 'home'}
            >
              🏠 Home
            </NavigationButtonWithTelemetry>

            <NavigationButtonWithTelemetry
              onPress={() => handleNavigation('search')}
              screen="search"
              label="Search"
              isActive={currentScreen === 'search'}
            >
              🔍 Search
            </NavigationButtonWithTelemetry>

            <NavigationButtonWithTelemetry
              onPress={() => handleNavigation('settings')}
              screen="settings"
              label="Settings"
              isActive={currentScreen === 'settings'}
            >
              ⚙️ Settings
            </NavigationButtonWithTelemetry>
          </nav>

          {/* Main content */}
          <main className="app-content">
            {currentScreen === 'home' && (
              <HomeScreenWithTelemetry
                weatherData={weatherData}
                onSearch={handleWeatherSearch}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentScreen === 'search' && (
              <SearchScreenWithTelemetry
                onSearch={handleWeatherSearch}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreenWithTelemetry
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
              />
            )}
          </main>
        </div>
      </AppNavigatorWithTelemetry>
    </Dash0ErrorBoundary>
  );
}

/**
 * Home Screen with Telemetry
 */
function HomeScreenWithTelemetry({
  weatherData,
  onSearch,
  isLoading,
  error,
}: any) {
  const telemetry = useDash0Telemetry();

  const handleQuickCitySearch = (city: string) => {
    // Track quick city searches
    telemetry.trackUserInteraction({
      action: 'quick_city_selected',
      component: 'HomeScreen',
    });

    onSearch(city);
  };

  return (
    <div className="home-screen">
      <h2>Current Weather</h2>

      {/* Quick city buttons with telemetry */}
      <div className="quick-cities">
        {['New York', 'London', 'Tokyo', 'Sydney'].map(city => (
          <button
            key={city}
            onClick={() => handleQuickCitySearch(city)}
            className="quick-city-button"
          >
            {city}
          </button>
        ))}
      </div>

      {/* Weather display */}
      {isLoading && <div className="loading">🌀 Loading weather...</div>}
      {error && <div className="error">❌ {error}</div>}
      {weatherData && <WeatherDisplayWithTelemetry data={weatherData} />}
    </div>
  );
}

/**
 * Search Screen with Telemetry
 */
function SearchScreenWithTelemetry({ onSearch, isLoading, error }: any) {
  return (
    <div className="search-screen">
      <h2>Search Weather</h2>

      <SearchWithTelemetry
        onSearch={onSearch}
        placeholder="Enter city name..."
      />

      {isLoading && <div className="loading">🌀 Searching...</div>}
      {error && <div className="error">❌ {error}</div>}
    </div>
  );
}

/**
 * Settings Screen with Telemetry
 */
function SettingsScreenWithTelemetry({ isDarkMode, onThemeToggle }: any) {
  const telemetry = useDash0Telemetry();

  const handleSettingChange = (setting: string, value: any) => {
    telemetry.trackUserInteraction({
      action: 'setting_changed',
      component: 'SettingsScreen',
    });
  };

  return (
    <div className="settings-screen">
      <h2>Settings</h2>

      <div className="setting-item">
        <label>Theme</label>
        <ThemeToggleWithTelemetry
          isDarkMode={isDarkMode}
          onToggle={onThemeToggle}
        />
      </div>

      <div className="setting-item">
        <label>Temperature Unit</label>
        <select
          onChange={e =>
            handleSettingChange('temperature_unit', e.target.value)
          }
        >
          <option value="fahrenheit">Fahrenheit</option>
          <option value="celsius">Celsius</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Weather Display with Telemetry
 */
function WeatherDisplayWithTelemetry({ data }: any) {
  const telemetry = useDash0Telemetry();

  useEffect(() => {
    // Track weather data viewing
    telemetry.trackUserInteraction({
      action: 'weather_data_viewed',
      component: 'WeatherDisplay',
    });
  }, [data, telemetry]);

  if (!data) return null;

  return (
    <div className="weather-display">
      <div className="current-weather">
        <h3>{data.location?.name}</h3>
        <div className="temperature">{data.current?.temp}°F</div>
        <div className="description">{data.current?.description}</div>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <span>Feels like</span>
          <span>{data.current?.feels_like}°F</span>
        </div>
        <div className="detail-item">
          <span>Humidity</span>
          <span>{data.current?.humidity}%</span>
        </div>
        <div className="detail-item">
          <span>Wind</span>
          <span>{data.current?.wind_speed} mph</span>
        </div>
      </div>

      {/* Hourly forecast with interaction tracking */}
      {data.hourly && (
        <div className="hourly-forecast">
          <h4>24-Hour Forecast</h4>
          <div className="hourly-items">
            {data.hourly.slice(0, 8).map((hour: any, index: number) => (
              <div
                key={index}
                className="hourly-item"
                onClick={() =>
                  telemetry.trackUserInteraction({
                    action: 'hourly_forecast_clicked',
                    component: 'WeatherDisplay',
                  })
                }
              >
                <div className="hour">{new Date(hour.time).getHours()}:00</div>
                <div className="temp">{hour.temp}°</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherAppWithDash0;

/**
 * Usage Instructions:
 *
 * 1. Replace your main App component with WeatherAppWithDash0
 * 2. Make sure you have the environment variable set:
 *    VITE_DASH0_AUTH_TOKEN=your_token_here
 * 3. Start your app and check the browser console for telemetry logs
 * 4. Open Dash0 dashboard to see real-time data
 *
 * What gets tracked automatically:
 * - All weather API calls (geocoding + weather data)
 * - User navigation between screens
 * - Theme changes
 * - Search interactions
 * - Button clicks and user interactions
 * - Component render performance
 * - Error tracking and crashes
 * - App load times and sessions
 */
