import type { MouseEvent } from 'react';
import { useHaptic } from './hapticHooks';
import {
  useInteractionFeedback,
  useWeatherAnnouncements,
} from './useMultiSensoryWeather';
import { useTheme } from './useTheme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps): JSX.Element => {
  const { themeName, toggleTheme } = useTheme();
  const haptic = useHaptic();
  const interactionFeedback = useInteractionFeedback();
  const weatherAnnouncements = useWeatherAnnouncements();

  const handleThemeToggle = async () => {
    haptic.settingsChange();
    await interactionFeedback.onButtonPress();

    // Cycle through: light -> dark -> light
    const themeCycle: Array<'light' | 'dark'> = ['light', 'dark'];
    const currentIndex = themeCycle.indexOf(themeName as 'light' | 'dark');
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    const nextTheme = themeCycle[nextIndex];

    toggleTheme();

    await weatherAnnouncements.announceStateChange(
      'theme-changed',
      `Switched to ${nextTheme} theme`
    );
  };

  const getThemeIcon = () => {
    switch (themeName) {
      case 'light':
        return '🌙'; // Next: dark
      case 'dark':
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
        return 'Switch to light mode';
      default:
        return 'Switch theme';
    }
  };

  const getThemeClass = () => {
    switch (themeName) {
      case 'dark':
        return 'theme-toggle-dark';
      default:
        return 'theme-toggle-light';
    }
  };

  return (
    <button
      onClick={handleThemeToggle}
      className={`theme-toggle-btn ${getThemeClass()}${className ? ` ${className}` : ''}`}
      title={getThemeTitle()}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
