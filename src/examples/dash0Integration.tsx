/* eslint-disable no-console */
/**
 * Example Dash0 Integration in Weather App Components
 * This file shows how to integrate Dash0 telemetry into your existing weather app
 */

import React, { useEffect } from 'react';
import { useWeatherTelemetry } from '../hooks/useDash0Telemetry';

// Example: Integrated Weather Search Component
export function WeatherSearchWithTelemetry() {
  const telemetry = useWeatherTelemetry();

  const _handleCitySearch = async (city: string) => {
    try {
      // Track the search operation with automatic timing and error handling
      await telemetry.trackWeatherSearch(city);

      // Track the geocoding API call
      const geocodingResult = await telemetry.trackApiCall(
        'geocoding',
        city,
        async () => {
          // Your existing geocoding API call
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              city,
            )}&format=json&limit=1`,
            {
              headers: {
                'User-Agent': 'Premium Weather App 1.0.0',
              },
            },
          );
          return response.json();
        },
      );

      if (geocodingResult.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = geocodingResult[0];

      // Track the weather API call
      const weatherData = await telemetry.trackApiCall(
        'weather',
        city,
        async () => {
          // Your existing weather API call
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit`,
          );
          return response.json();
        },
      );

      // Track successful completion
      telemetry.trackUserInteraction({
        action: 'weather_search_completed',
        component: 'WeatherSearch',
      });

      return weatherData;
    } catch (error) {
      // Telemetry automatically tracks errors in trackApiCall
      // You can also track additional context if needed
      telemetry.trackError(
        error instanceof Error ? error : new Error(String(error)),
        `Weather search for ${city}`,
      );
      throw error;
    }
  };

  const _handleGeolocationRequest = async () => {
    try {
      await telemetry.trackGeolocation();

      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          position => {
            telemetry.trackUserInteraction({
              action: 'geolocation_success',
              component: 'WeatherSearch',
            });
            resolve(position);
          },
          error => {
            telemetry.trackError(
              new Error(error.message),
              'Geolocation request',
            );
            reject(error);
          },
        );
      });
    } catch (error) {
      telemetry.trackError(
        error instanceof Error ? error : new Error(String(error)),
        'Geolocation request',
      );
      throw error;
    }
  };

  return null; // Replace with your actual component JSX
}

// Example: Theme Toggle with Telemetry
export function ThemeToggleWithTelemetry() {
  const telemetry = useWeatherTelemetry();

  const _handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Track theme changes for UX analytics
    telemetry.trackThemeChange({ theme: newTheme });

    // Track performance impact of theme switching
    const startTime = Date.now();

    // Your existing theme change logic here
    // setTheme(newTheme);

    const duration = Date.now() - startTime;
    telemetry.trackPerformance({
      name: 'theme_switch_duration',
      value: duration,
      unit: 'ms',
    });
  };

  return null; // Replace with your actual theme toggle component
}

// Example: Weather Display with Performance Tracking
export function WeatherDisplayWithTelemetry() {
  const telemetry = useWeatherTelemetry();

  useEffect(() => {
    // Track when the weather display component mounts
    telemetry.trackUserInteraction({
      action: 'weather_display_mounted',
      component: 'WeatherDisplay',
    });

    // Track component render performance
    const renderStart = performance.now();

    // Simulate component work
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      telemetry.trackPerformance({
        name: 'weather_display_render_time',
        value: renderTime,
        unit: 'ms',
      });
    });
  }, [telemetry]);

  return null; // Replace with your actual weather display component
}

// Example: Error Boundary with Telemetry
export class WeatherErrorBoundaryWithTelemetry extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track React errors through telemetry
    import('../hooks/useDash0Telemetry').then(({ useDash0Telemetry }) => {
      // Note: This is a simplified example. In a real implementation,
      // you'd want to set up telemetry at the app level
      const telemetry = useDash0Telemetry();
      telemetry.trackError(
        error,
        `React Error Boundary: ${errorInfo.componentStack}`,
      );
    });
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// Example: Integration in App Navigator
export function AppNavigatorWithTelemetry() {
  const telemetry = useWeatherTelemetry();

  useEffect(() => {
    // Track app startup
    telemetry.trackUserInteraction({
      action: 'app_started',
      component: 'AppNavigator',
    });

    // Track telemetry configuration for debugging
    if (telemetry.isReady()) {
      const config = telemetry.getConfig();
      console.log('[Dash0] Telemetry initialized with config:', {
        serviceName: config.serviceName,
        environment: config.environment,
        endpoint: `${config.endpoint.substring(0, 20)}...`,
      });
    }
  }, [telemetry]);

  const _handleScreenChange = (screenName: string) => {
    // Track navigation between screens
    telemetry.trackUserInteraction({
      action: 'screen_changed',
      component: 'AppNavigator',
    });

    // Track page views for analytics
    telemetry.trackPageView(screenName, {
      timestamp: Date.now().toString(),
    });
  };

  // Example of tracking complex operations
  const _handleComplexOperation = async () => {
    return telemetry.trackOperation(
      'complex_weather_operation',
      async () => {
        // Simulate complex operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'success';
      },
      {
        operation_type: 'background_refresh',
        user_initiated: 'false',
      },
    );
  };

  return null; // Replace with your actual app navigator
}
