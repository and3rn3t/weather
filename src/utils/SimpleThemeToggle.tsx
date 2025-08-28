import React from 'react';
import { logInfo } from './logger';

interface SimpleThemeToggleProps {
  className?: string;
}

const SimpleThemeToggle = ({ className = '' }: SimpleThemeToggleProps) => {
  const handleClick = () => {
    // Get current theme
    const currentTheme = localStorage.getItem('weather-app-theme') || 'light';

    // Cycle through light/dark only
    const nextTheme: string = currentTheme === 'light' ? 'dark' : 'light';

    // Save theme
    localStorage.setItem('weather-app-theme', nextTheme);

    // Apply theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${nextTheme}-theme`);

    document.title = 'Weather App';

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
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeTitle = () => {
    const theme = getCurrentTheme();
    return theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
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
