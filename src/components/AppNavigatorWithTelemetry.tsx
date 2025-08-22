/**
 * Enhanced AppNavigator with Dash0 Telemetry
 * This wraps your existing AppNavigator with comprehensive telemetry tracking
 */

import React, { useEffect } from 'react';
import { useDash0Telemetry } from '../hooks/useDash0Telemetry';

// TypeScript interfaces
interface NavigationTelemetryProps {
  children: React.ReactNode;
  currentScreen: string;
  previousScreen?: string;
  weatherData?: {
    location?: { name?: string };
    current?: { temp?: number };
    hourly?: unknown[];
    daily?: unknown[];
  };
}

/**
 * Enhanced Navigation Wrapper with Dash0 Telemetry
 * Wrap your main AppNavigator with this component
 */
export function AppNavigatorWithTelemetry({
  children,
  currentScreen,
  previousScreen,
  weatherData,
}: NavigationTelemetryProps) {
  const telemetry = useDash0Telemetry();

  // Track screen changes
  useEffect(() => {
    if (currentScreen) {
      telemetry.trackPageView(currentScreen, {
        previousScreen: previousScreen || 'none',
        timestamp: Date.now(),
      });

      // Track screen navigation performance
      telemetry.trackPerformance({
        name: 'screen_navigation',
        value: Date.now(),
        unit: 'milliseconds',
      });
    }
  }, [currentScreen, previousScreen, telemetry]);

  // Track app session
  useEffect(() => {
    telemetry.trackUserInteraction({
      action: 'app_session_start',
      component: 'AppNavigator',
    });

    // Track performance metrics
    if ('performance' in window && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;

      telemetry.trackPerformance({
        name: 'app_load_time',
        value: loadTime,
        unit: 'milliseconds',
      });
    }

    // Cleanup on unmount
    return () => {
      telemetry.trackUserInteraction({
        action: 'app_session_end',
        component: 'AppNavigator',
      });
    };
  }, [telemetry, currentScreen]);

  // Track weather data updates
  useEffect(() => {
    if (weatherData) {
      telemetry.trackUserInteraction({
        action: 'weather_data_display',
        component: 'AppNavigator',
      });
    }
  }, [weatherData, currentScreen, telemetry]);

  return <>{children}</>;
}

/**
 * Navigation Button with Telemetry
 * Replace your navigation buttons with this component
 */
interface NavigationButtonProps {
  onPress: () => void;
  screen: string;
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function NavigationButtonWithTelemetry({
  onPress,
  screen: _screen,
  label,
  isActive,
  icon,
  children,
}: NavigationButtonProps) {
  const telemetry = useDash0Telemetry();

  const handlePress = () => {
    // Track navigation action
    telemetry.trackUserInteraction({
      action: 'navigation_click',
      component: 'NavigationButton',
    });

    // Track button performance
    const startTime = performance.now();

    try {
      onPress();

      // Track successful navigation
      const endTime = performance.now();
      telemetry.trackPerformance({
        name: 'navigation_response_time',
        value: endTime - startTime,
        unit: 'milliseconds',
      });
    } catch (error) {
      // Track navigation errors
      telemetry.trackError(error as Error, 'navigation_button');
    }
  };

  return (
    <button
      onClick={handlePress}
      className={`navigation-button ${isActive ? 'active' : ''}`}
      aria-label={label}
    >
      {icon}
      {children || label}
    </button>
  );
}

/**
 * Search Component with Telemetry
 * Replace your search functionality with this component
 */
interface SearchWithTelemetryProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchWithTelemetry({
  onSearch,
  placeholder = 'Search for a city...',
  value = '',
  onChange,
}: SearchWithTelemetryProps) {
  const telemetry = useDash0Telemetry();
  const [searchQuery, setSearchQuery] = React.useState(value);

  const handleSearch = (query: string) => {
    // Track search initiation
    telemetry.trackUserInteraction({
      action: 'weather_search_initiated',
      component: 'SearchInput',
    });

    const startTime = performance.now();

    try {
      onSearch(query);

      // Track search success
      const endTime = performance.now();
      telemetry.trackPerformance({
        name: 'search_execution_time',
        value: endTime - startTime,
        unit: 'milliseconds',
      });
    } catch (error) {
      // Track search errors
      telemetry.trackError(error as Error, 'weather_search');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    if (onChange) {
      onChange(newValue);
    }

    // Track typing behavior (throttled)
    if (newValue.length > 0 && newValue.length % 3 === 0) {
      telemetry.trackUserInteraction({
        action: 'search_typing',
        component: 'SearchInput',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="search-input"
        aria-label="City search input"
      />
      <button
        onClick={() => handleSearch(searchQuery.trim())}
        disabled={!searchQuery.trim()}
        className="search-button"
        aria-label="Search for weather"
      >
        🔍 Search
      </button>
    </div>
  );
}

/**
 * Theme Toggle with Telemetry
 * Replace your theme toggle component with this
 */
interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function ThemeToggleWithTelemetry({
  isDarkMode,
  onToggle,
}: ThemeToggleProps) {
  const telemetry = useDash0Telemetry();

  const handleToggle = () => {
    const startTime = performance.now();

    telemetry.trackThemeChange({
      theme: isDarkMode ? 'light' : 'dark',
    });

    try {
      onToggle();

      const endTime = performance.now();
      telemetry.trackPerformance({
        name: 'theme_toggle_time',
        value: endTime - startTime,
        unit: 'milliseconds',
      });
    } catch (error) {
      telemetry.trackError(error as Error, 'theme_toggle');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
}
