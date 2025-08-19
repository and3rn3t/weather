/**
 * iOS 26 Integration Guide - August 2025
 * 
 * This file demonstrates how to integrate the new iOS 26 weather interface
 * with the existing AppNavigator component. It provides a practical example
 * of applying iOS 26 design classes to existing weather components.
 * 
 * Usage:
 * 1. Import this component into AppNavigator.tsx
 * 2. Replace existing weather card components with iOS 26 versions
 * 3. Use iOS 26 design classes for consistent styling
 * 4. Apply appropriate ARIA labels for accessibility
 */

// Example integration for existing AppNavigator component
// This shows how to enhance existing weather displays with iOS 26 design

const iOS26WeatherCardExample = `
{/* Replace existing weather card with iOS 26 enhanced version */}
<div className="ios26-main-weather-card">
  {/* Header with location */}
  <div className="ios26-weather-header">
    <div className="ios26-weather-location" onClick={handleLocationChange}>
      <span className="ios26-text-headline ios26-text-primary ios26-text-semibold">
        {currentWeather.location}
      </span>
      <span className="ios26-location-icon">📍</span>
    </div>
    <div className="ios26-text-caption2 ios26-text-tertiary ios26-last-updated">
      Updated {lastUpdated}
    </div>
  </div>

  {/* Main temperature display */}
  <div className="ios26-temperature-section">
    <div className="ios26-weather-icon-container">
      <WeatherIcon 
        code={currentWeather.weatherCode} 
        size={Math.min(window.innerWidth * 0.25, 120)}
        animate={true}
      />
    </div>
    
    <div className="ios26-temperature-display">
      <span className="ios26-temperature-value">
        {Math.round(currentWeather.temperature)}°
      </span>
      <span className="ios26-temperature-unit">F</span>
    </div>
    
    <div className="ios26-text-title3 ios26-text-primary ios26-text-medium ios26-weather-condition">
      {currentWeather.condition}
    </div>
    
    <div className="ios26-text-subheadline ios26-text-secondary ios26-feels-like">
      Feels like {Math.round(currentWeather.feelsLike)}°F
    </div>
  </div>
</div>

{/* Weather metrics using iOS 26 grid */}
<div className="ios26-weather-metrics-grid">
  <div className="ios26-weather-metric">
    <div className="ios26-weather-metric-content">
      <div className="ios26-weather-metric-icon">💧</div>
      <div className="ios26-weather-metric-text">
        <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
          {currentWeather.humidity}%
        </div>
        <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
          Humidity
        </div>
      </div>
    </div>
  </div>
  
  <div className="ios26-weather-metric">
    <div className="ios26-weather-metric-content">
      <div className="ios26-weather-metric-icon">💨</div>
      <div className="ios26-weather-metric-text">
        <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
          {Math.round(currentWeather.windSpeed)} mph
        </div>
        <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
          Wind
        </div>
      </div>
    </div>
  </div>
  
  <div className="ios26-weather-metric">
    <div className="ios26-weather-metric-content">
      <div className="ios26-weather-metric-icon">📊</div>
      <div className="ios26-weather-metric-text">
        <div className="ios26-text-title2 ios26-text-primary ios26-weather-metric-value">
          {Math.round(currentWeather.pressure)}
        </div>
        <div className="ios26-text-footnote ios26-text-secondary ios26-weather-metric-label">
          Pressure
        </div>
        <div className="ios26-text-caption2 ios26-text-tertiary ios26-weather-metric-subtitle">
          hPa
        </div>
      </div>
    </div>
  </div>
</div>

{/* Hourly forecast with iOS 26 styling */}
<div className="ios26-forecast-section">
  <div className="ios26-text-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
    24-Hour Forecast
  </div>
  
  <div className="ios26-forecast-scroll">
    {hourlyForecast.map((hour, index) => (
      <div key={index} className="ios26-forecast-item">
        <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time">
          {hour.time}
        </div>
        
        <div className="ios26-forecast-icon">
          <WeatherIcon 
            code={hour.weatherCode} 
            size={28}
            animate={true}
          />
        </div>
        
        <div className="ios26-forecast-temperature">
          <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
            {Math.round(hour.temperature)}°
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
`;

/**
 * Quick Integration Steps:
 * 
 * 1. TYPOGRAPHY: Replace existing text classes
 *    OLD: className="temperature-display"
 *    NEW: className="ios26-temperature-value ios26-text-large-title"
 * 
 * 2. CARDS: Replace weather card containers
 *    OLD: className="weather-card"
 *    NEW: className="ios26-main-weather-card" or "ios26-weather-metric"
 * 
 * 3. LAYOUT: Use iOS 26 layout classes
 *    OLD: className="metrics-grid"
 *    NEW: className="ios26-weather-metrics-grid"
 * 
 * 4. COLORS: Apply iOS 26 color classes
 *    OLD: style={{ color: theme.textPrimary }}
 *    NEW: className="ios26-text-primary"
 * 
 * 5. SPACING: Use iOS 26 spacing tokens
 *    OLD: style={{ marginBottom: '16px' }}
 *    NEW: className="ios26-mb-4" (or use CSS custom properties)
 * 
 * 6. BUTTONS: Enhance with iOS 26 button styles
 *    OLD: className="refresh-button"
 *    NEW: className="ios26-button ios26-button-secondary"
 */

// Example of enhanced navigation with iOS 26 classes
const iOS26NavigationExample = `
{/* Enhanced mobile navigation with iOS 26 styling */}
<div className="mobile-navigation ios26-material-regular" role="navigation">
  <div 
    className="nav-item ios26-button ios26-button-ghost"
    onClick={() => setCurrentScreen('home')}
    role="button"
    tabIndex={0}
    aria-pressed={currentScreen === 'home'}
  >
    <span className="nav-icon">🏠</span>
    <span className="ios26-text-caption ios26-text-center ios26-text-semibold">Home</span>
  </div>
  
  <div 
    className="nav-item ios26-button ios26-button-ghost"
    onClick={() => setCurrentScreen('weather')}
    role="button"
    tabIndex={0}
    aria-pressed={currentScreen === 'weather'}
  >
    <span className="nav-icon">☀️</span>
    <span className="ios26-text-caption ios26-text-center ios26-text-semibold">Weather</span>
  </div>
  
  <div 
    className="nav-item ios26-button ios26-button-ghost"
    onClick={() => setCurrentScreen('settings')}
    role="button"
    tabIndex={0}
    aria-pressed={currentScreen === 'settings'}
  >
    <span className="nav-icon">⚙️</span>
    <span className="ios26-text-caption ios26-text-center ios26-text-semibold">Settings</span>
  </div>
</div>
`;

/**
 * CSS Class Reference - Quick Lookup:
 * 
 * TYPOGRAPHY:
 * - ios26-text-large-title: 34px, bold (main temperatures)
 * - ios26-text-title1: 28px, bold (section headers)
 * - ios26-text-title2: 22px, bold (metric values)
 * - ios26-text-title3: 20px, regular (weather conditions)
 * - ios26-text-headline: 17px, semibold (location names)
 * - ios26-text-subheadline: 15px, regular (feels like, details)
 * - ios26-text-body: 17px, regular (body text)
 * - ios26-text-footnote: 13px, regular (time, labels)
 * - ios26-text-caption: 12px, regular (small details)
 * 
 * COLORS:
 * - ios26-text-primary: Main text color
 * - ios26-text-secondary: Secondary text (60% opacity)
 * - ios26-text-tertiary: Tertiary text (40% opacity)
 * - ios26-text-quaternary: Quaternary text (25% opacity)
 * 
 * MATERIALS:
 * - ios26-material-thin: Light glassmorphism
 * - ios26-material-regular: Standard glassmorphism
 * - ios26-material-thick: Heavy glassmorphism
 * - ios26-material-chrome: Chrome-like surface
 * 
 * COMPONENTS:
 * - ios26-main-weather-card: Primary weather display
 * - ios26-weather-metrics-grid: Metrics layout grid
 * - ios26-forecast-section: Forecast containers
 * - ios26-button: Enhanced button styling
 */

export default iOS26WeatherCardExample;
