import React, { useState } from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from './utils/themeContext';
import { useTheme } from './utils/useTheme';

// Minimal weather app component for debugging
const MinimalWeatherApp: React.FC = () => {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState('Home');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.appBackground,
        padding: '20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1 style={{ color: theme.primaryText }}>Weather App</h1>
      <p style={{ color: theme.secondaryText }}>
        Current screen: {currentScreen}
      </p>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setCurrentScreen('Home')}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: theme.buttonGradient,
            color: theme.primaryText,
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Home
        </button>

        <button
          onClick={() => setCurrentScreen('Weather')}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: theme.buttonGradient,
            color: theme.primaryText,
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Weather
        </button>
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          background: theme.cardBackground,
          borderRadius: '10px',
        }}
      >
        {currentScreen === 'Home' && (
          <div>
            <h2 style={{ color: theme.primaryText }}>Welcome to Weather App</h2>
            <p style={{ color: theme.secondaryText }}>
              Your premium weather forecast solution.
            </p>
          </div>
        )}

        {currentScreen === 'Weather' && (
          <div>
            <h2 style={{ color: theme.primaryText }}>Weather Details</h2>
            <p style={{ color: theme.secondaryText }}>
              Weather information would appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function MinimalApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MinimalWeatherApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MinimalApp;
