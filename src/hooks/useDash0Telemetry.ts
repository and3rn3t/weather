/* eslint-disable no-console */
/**
 * React Hook for Dash0 Telemetry Integration
 * This hook provides easy integration of Dash0 observability into React components
 */

import { useCallback, useEffect, useRef } from 'react';
import { dash0Telemetry } from '../utils/dash0Setup';

// Weather-specific telemetry events
export interface WeatherTelemetryEvents {
  weatherDataRequested: { city: string; apiType: 'weather' | 'geocoding' };
  weatherDataReceived: { city: string; responseTime: number };
  weatherDataError: { city: string; error: string };
  themeChanged: { theme: 'light' | 'dark' };
  locationRequested: { method: 'search' | 'geolocation' };
  userInteraction: { action: string; component: string };
  performanceMetric: { name: string; value: number; unit?: string };
}

export function useDash0Telemetry() {
  const mountTimeRef = useRef<number>(Date.now());

  // Initialize telemetry on component mount
  useEffect(() => {
    const mountTime = mountTimeRef.current;

    if (!dash0Telemetry.isReady()) {
      dash0Telemetry.initialize().catch(console.error);
    }

    // Track component mount time
    const mountDuration = Date.now() - mountTime;
    dash0Telemetry.trackPerformance(
      'component_mount_time',
      mountDuration,
      'ms'
    );

    return () => {
      // Track component unmount
      const totalTime = Date.now() - mountTime;
      dash0Telemetry.trackPerformance('component_total_time', totalTime, 'ms');
    };
  }, []);

  // Track weather API calls
  const trackWeatherApi = useCallback(
    (event: WeatherTelemetryEvents['weatherDataRequested']) => {
      dash0Telemetry.trackWeatherApiCall(event.city, event.apiType);
    },
    []
  );

  // Track successful weather data
  const trackWeatherSuccess = useCallback(
    (event: WeatherTelemetryEvents['weatherDataReceived']) => {
      dash0Telemetry.trackUserInteraction('weather_data_received', {
        city: event.city,
        response_time: event.responseTime,
      });
      dash0Telemetry.trackPerformance(
        'weather_api_response_time',
        event.responseTime,
        'ms'
      );
    },
    []
  );

  // Track weather API errors
  const trackWeatherError = useCallback(
    (event: WeatherTelemetryEvents['weatherDataError']) => {
      const error = new Error(`Weather API Error: ${event.error}`);
      dash0Telemetry.trackError(error, `Weather data for ${event.city}`);
    },
    []
  );

  // Track theme changes
  const trackThemeChange = useCallback(
    (event: WeatherTelemetryEvents['themeChanged']) => {
      dash0Telemetry.trackUserInteraction('theme_changed', {
        theme: event.theme,
      });
    },
    []
  );

  // Track location requests
  const trackLocationRequest = useCallback(
    (event: WeatherTelemetryEvents['locationRequested']) => {
      dash0Telemetry.trackUserInteraction('location_requested', {
        method: event.method,
      });
    },
    []
  );

  // Track general user interactions
  const trackUserInteraction = useCallback(
    (event: WeatherTelemetryEvents['userInteraction']) => {
      dash0Telemetry.trackUserInteraction(event.action, {
        component: event.component,
      });
    },
    []
  );

  // Track performance metrics
  const trackPerformance = useCallback(
    (event: WeatherTelemetryEvents['performanceMetric']) => {
      dash0Telemetry.trackPerformance(event.name, event.value, event.unit);
    },
    []
  );

  // Track complex operations with automatic timing
  const trackOperation = useCallback(
    <T>(
      operationName: string,
      operation: () => Promise<T>,
      attributes?: Record<string, string | number>
    ): Promise<T> => {
      return dash0Telemetry.trackOperation(
        operationName,
        operation,
        attributes
      );
    },
    []
  );

  // Track page views / screen changes
  const trackPageView = useCallback(
    (screenName: string, properties?: Record<string, string | number>) => {
      dash0Telemetry.trackUserInteraction('page_view', {
        screen: screenName,
        ...properties,
      });
    },
    []
  );

  // Track errors with automatic context
  const trackError = useCallback((error: Error, context?: string) => {
    dash0Telemetry.trackError(error, context);
  }, []);

  // Get telemetry status
  const isReady = useCallback(() => dash0Telemetry.isReady(), []);

  // Get telemetry configuration
  const getConfig = useCallback(() => dash0Telemetry.getConfig(), []);

  return {
    // Weather-specific tracking
    trackWeatherApi,
    trackWeatherSuccess,
    trackWeatherError,
    trackThemeChange,
    trackLocationRequest,

    // General tracking methods
    trackUserInteraction,
    trackPerformance,
    trackOperation,
    trackPageView,
    trackError,

    // Utility methods
    isReady,
    getConfig,
  };
}

// Hook specifically for tracking weather operations
export function useWeatherTelemetry() {
  const telemetry = useDash0Telemetry();

  const trackWeatherSearch = useCallback(
    async (city: string) => {
      return telemetry.trackOperation(
        'weather_search',
        async () => {
          telemetry.trackLocationRequest({ method: 'search' });
          return city;
        },
        { search_city: city }
      );
    },
    [telemetry]
  );

  const trackGeolocation = useCallback(async () => {
    return telemetry.trackOperation('geolocation_request', async () => {
      telemetry.trackLocationRequest({ method: 'geolocation' });
      return true;
    });
  }, [telemetry]);

  const trackApiCall = useCallback(
    async <T>(
      apiType: 'weather' | 'geocoding',
      city: string,
      apiCall: () => Promise<T>
    ): Promise<T> => {
      telemetry.trackWeatherApi({ city, apiType });

      return telemetry.trackOperation(
        `${apiType}_api_call`,
        async () => {
          const startTime = Date.now();
          try {
            const result = await apiCall();
            const responseTime = Date.now() - startTime;
            telemetry.trackWeatherSuccess({ city, responseTime });
            return result;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            telemetry.trackWeatherError({ city, error: errorMessage });
            throw error;
          }
        },
        { city, api_type: apiType }
      );
    },
    [telemetry]
  );

  return {
    trackWeatherSearch,
    trackGeolocation,
    trackApiCall,
    ...telemetry,
  };
}
