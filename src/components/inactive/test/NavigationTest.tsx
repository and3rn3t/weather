/**
 * Navigation Test - Simple test to verify iOS-style navigation positioning
 *
 * This component demonstrates:
 * - Navigation stays at bottom of screen (iOS guidelines)
 * - Content respects navigation space
 * - No blue rectangles or transparency issues
 * - Proper accessibility with semantic HTML
 */

import React from 'react';
import MobileNavigation, { type NavigationScreen } from '../../MobileNavigation';
import InteractiveWeatherWidget from '../modernWeatherUI/InteractiveWeatherWidget';
import { useTheme } from '../utils/useTheme';
import { logInfo } from '../utils/logger';

const NavigationTest: React.FC = () => {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] =
    React.useState<NavigationScreen>('Home');

  // Mock weather data for the widget
  const mockWeatherData = {
    location: 'San Francisco',
    temperature: 72,
    condition: 'Partly Cloudy',
    icon: '⛅',
    humidity: 65,
    windSpeed: 8,
    pressure: 1013,
    feelsLike: 75,
  };

  const containerStyle: React.CSSProperties = {
    background: theme.appBackground,
    color: theme.primaryText,
    minHeight: '100vh',
    position: 'relative',
    padding: '20px',
    paddingBottom: '100px', // Extra space for navigation
    boxSizing: 'border-box',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center',
    paddingTop: '40px',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '8px',
    background: theme.primaryGradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };

  const subheaderStyle: React.CSSProperties = {
    fontSize: '16px',
    color: theme.secondaryText,
    marginBottom: '40px',
    lineHeight: 1.4,
  };

  const testItemStyle: React.CSSProperties = {
    background: theme.cardBackground,
    border: `1px solid ${theme.weatherCardBorder}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'left',
  };

  const screenInfo = {
    title: {
      Home: '🏠 Home Screen',
      Weather: '🌤️ Weather Screen',
      Search: '🔍 Search Screen',
      Favorites: '⭐ Favorites Screen',
      Settings: '⚙️ Settings Screen',
      iOS26: '📱 iOS 26 Screen',
    }[currentScreen],
    description: {
      Home: 'Main dashboard with overview',
      Weather: 'Detailed weather information',
      Search: 'Search for new locations',
      Favorites: 'Your saved locations',
      Settings: 'App preferences and settings',
      iOS26: 'iOS 26 navigation test interface',
    }[currentScreen],
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={headerStyle}>Navigation Test</h1>
        <p style={subheaderStyle}>
          Testing iOS-style bottom navigation positioning and content layout
        </p>

        <div style={testItemStyle}>
          <h3 style={{ color: theme.primaryText, marginBottom: '8px' }}>
            📱 Current Screen: {screenInfo.title}
          </h3>
          <p style={{ color: theme.secondaryText, margin: 0 }}>
            {screenInfo.description}
          </p>
        </div>

        <div style={testItemStyle}>
          <h3 style={{ color: theme.primaryText, marginBottom: '8px' }}>
            ✅ Navigation Position Test
          </h3>
          <ul
            style={{
              color: theme.secondaryText,
              margin: 0,
              paddingLeft: '20px',
            }}
          >
            <li>Navigation is fixed at bottom of screen</li>
            <li>Content has proper spacing above navigation</li>
            <li>No blue rectangles or transparency issues</li>
            <li>Uses semantic HTML (nav, button elements)</li>
            <li>Follows iOS Human Interface Guidelines</li>
          </ul>
        </div>

        <div style={{ marginTop: '24px' }}>
          <InteractiveWeatherWidget
            weatherData={mockWeatherData}
            isDark={theme.appBackground.includes('28, 28, 30')} // Simple dark mode detection
            isCompact={false}
            onRefresh={() => logInfo('Weather refreshed!')}
          />
        </div>

        <div style={testItemStyle}>
          <h3 style={{ color: theme.primaryText, marginBottom: '8px' }}>
            🎯 Test Instructions
          </h3>
          <ol
            style={{
              color: theme.secondaryText,
              margin: 0,
              paddingLeft: '20px',
            }}
          >
            <li>Navigation should be visible at the bottom of the screen</li>
            <li>Tapping navigation buttons should change the current screen</li>
            <li>Content should scroll without going behind navigation</li>
            <li>No blue rectangles should appear when tapping</li>
            <li>Navigation should have proper glassmorphism effect</li>
          </ol>
        </div>

        {/* Spacer to ensure scrolling works properly */}
        <div
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: theme.secondaryText, fontStyle: 'italic' }}>
            Scroll to test navigation visibility
          </p>
        </div>
      </div>

      {/* Mobile Navigation - Should stay at bottom */}
      <MobileNavigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
};

export default NavigationTest;
