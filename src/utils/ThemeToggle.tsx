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

  // iOS26 Phase 3C: Multi-sensory theme switching
  const interactionFeedback = useInteractionFeedback();
  const weatherAnnouncements = useWeatherAnnouncements();

  const handleThemeToggle = async () => {
    const previousTheme = themeName;

    // Track theme toggle interaction
    telemetry.trackUserInteraction({
      action: 'theme_toggle',
      component: 'ThemeToggle',
      metadata: {
        fromTheme: previousTheme,
        direction: 'forward', // Always cycles forward through themes
        method: 'button_click',
      },
    });

    haptic.settingsChange(); // Haptic feedback for theme change

    // Enhanced multi-sensory feedback for theme switching
    await interactionFeedback.onButtonPress();

    toggleTheme();

    // Determine next theme for announcement
    let nextTheme: string;
    if (themeName === 'light') {
      nextTheme = 'dark';
    } else if (themeName === 'dark') {
      nextTheme = 'horror';
    } else {
      nextTheme = 'light';
    }

    // Track successful theme change
    telemetry.trackMetric({
      name: 'theme_change_success',
      value: 1,
      tags: {
        fromTheme: previousTheme,
        toTheme: nextTheme,
        hasMultiSensoryFeedback: 'true',
      },
    });

    // Announce theme change for accessibility
    await weatherAnnouncements.announceStateChange(
      'theme-changed',
      `Switched to ${nextTheme} theme`,
    );
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
        className ? ` ${className}` : ''
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
