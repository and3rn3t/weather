import type { MouseEvent } from 'react';
import { useHaptic } from './hapticHooks';
import { useTheme } from './useTheme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps): JSX.Element => {
  const { isDark, themeName, toggleTheme } = useTheme();
  const haptic = useHaptic();

  const handleThemeToggle = () => {
    haptic.settingsChange(); // Haptic feedback for theme change
    toggleTheme();
  };

  // Get appropriate icon and title based on current theme
  const getThemeIcon = () => {
    switch (themeName) {
      case 'light':
        return '🌙'; // Next: dark
      case 'dark':
        return '💀'; // Next: horror
      case 'horror':
        return '☀️'; // Next: light
      default:
        return '🌙';
    }
  };

  const getThemeTitle = () => {
    switch (themeName) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to horror mode';
      case 'horror':
        return 'Switch to light mode';
      default:
        return 'Switch theme';
    }
  };

  const getThemeClass = () => {
    switch (themeName) {
      case 'horror':
        return 'theme-toggle-horror';
      case 'dark':
        return 'theme-toggle-dark';
      default:
        return 'theme-toggle-light';
    }
  };

  return (
    <button
      onClick={handleThemeToggle}
      className={`theme-toggle-btn ${getThemeClass()}${
        className ? ` ${  className}` : ''
      }`}
      title={getThemeTitle()}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        if (themeName === 'horror') {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 0, 0, 0.6)';
        } else {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
        }
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (themeName === 'horror') {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.4)';
        } else {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
