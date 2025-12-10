import type { MouseEvent } from 'react';
import { useDash0Telemetry } from '../dash0/hooks/useDash0Telemetry';
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
  const telemetry = useDash0Telemetry();
  const interactionFeedback = useInteractionFeedback();
  const weatherAnnouncements = useWeatherAnnouncements();

  const handleThemeToggle = async () => {
    const previousTheme = themeName;

    telemetry.trackUserInteraction({
      action: 'theme_toggle',
      component: 'ThemeToggle',
      metadata: {
        fromTheme: previousTheme,
        direction: 'forward',
        method: 'button_click',
      },
    });

    haptic.settingsChange();
    await interactionFeedback.onButtonPress();

    // Cycle through: light -> dark -> horror -> light
    const themeCycle: Array<'light' | 'dark' | 'horror'> = ['light', 'dark', 'horror'];
    const currentIndex = themeCycle.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    const nextTheme = themeCycle[nextIndex];

    toggleTheme();

    telemetry.trackMetric({
      name: 'theme_change_success',
      value: 1,
      tags: {
        fromTheme: previousTheme,
        toTheme: nextTheme,
        hasMultiSensoryFeedback: 'true',
      },
    });

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
        return '🎃'; // Next: horror
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
      case 'dark':
        return 'theme-toggle-dark';
      case 'horror':
        return 'theme-toggle-horror';
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
