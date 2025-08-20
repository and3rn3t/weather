import React from 'react';
import { logInfo } from '../utils/logger';


interface SimpleThemeToggleProps {
  className?: string;
}

const SimpleThemeToggle = ({ className = '' }: SimpleThemeToggleProps) => {
  const handleClick = () => {
    // Get current theme
    const currentTheme = localStorage.getItem('weather-app-theme') || 'light';

    // Cycle through themes
    let nextTheme: string;
    switch (currentTheme) {
      case 'light':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'horror';
        break;
      case 'horror':
      default:
        nextTheme = 'light';
        break;
    }

    // Save theme
    localStorage.setItem('weather-app-theme', nextTheme);

    // Apply theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'horror-theme');
    document.body.classList.add(nextTheme + '-theme');

    // Update title for horror theme
    if (nextTheme === 'horror') {
      document.title = '🎃 Crystal Lake Weather Station';
    } else {
      document.title = 'Weather App';
    }

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent('themeChanged', {
        detail: { theme: nextTheme },
      })
    );

    logInfo(`🎨 Theme changed to: ${nextTheme}`);
  };

  // Get current theme for display
  const getCurrentTheme = () => {
    return localStorage.getItem('weather-app-theme') || 'light';
  };

  const getThemeIcon = () => {
    const theme = getCurrentTheme();
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'horror':
        return '💀';
      default:
        return '☀️';
    }
  };

  const getThemeTitle = () => {
    const theme = getCurrentTheme();
    switch (theme) {
      case 'light':
        return 'Switch to Dark Theme';
      case 'dark':
        return 'Switch to Horror Theme';
      case 'horror':
        return 'Switch to Light Theme';
      default:
        return 'Toggle Theme';
    }
  };

  return React.createElement(
    'button',
    {
      onClick: handleClick,
      className: `theme-toggle-btn ${className}`,
      title: getThemeTitle(),
      style: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
      },
    },
    getThemeIcon()
  );
};

export default SimpleThemeToggle;
