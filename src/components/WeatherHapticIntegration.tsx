/**
 * Weather Haptic Integration Component - Phase F-4
 *
 * Provides seamless integration of advanced weather haptic experiences
 * throughout the app, responding to weather changes, user interactions,
 * and atmospheric conditions.
 */

import { useEffect, useRef, useCallback } from 'react';
import useWeatherHapticExperience, {
  type WeatherCondition,
  type WeatherHapticConfig,
} from '../utils/useWeatherHapticExperience';
import {
  logWeatherTransition,
  logWeatherHaptic,
  logTemperatureChange,
  logPressureChange,
  logWindChange,
  logWeatherLoading,
} from '../utils/logger';

export interface WeatherHapticIntegrationProps {
  // Current weather data
  temperature?: number;
  weatherCode?: number;
  windSpeed?: number;
  humidity?: number;
  pressure?: number;

  // State management
  isLoading?: boolean;
  isRefreshing?: boolean;

  // User interactions
  onWeatherLoad?: () => void;
  onWeatherRefresh?: () => void;
  onLocationChange?: () => void;

  // Configuration
  hapticConfig?: WeatherHapticConfig;
  enableWeatherContextHaptics?: boolean;
}

const WeatherHapticIntegration: React.FC<WeatherHapticIntegrationProps> = ({
  temperature,
  weatherCode,
  windSpeed = 0,
  humidity = 50,
  pressure = 1013,
  isLoading = false,
  isRefreshing = false,
  onWeatherLoad,
  onWeatherRefresh,
  onLocationChange,
  hapticConfig = {},
  enableWeatherContextHaptics = true,
}) => {
  // Enhanced weather haptic system
  const weatherHaptic = useWeatherHapticExperience({
    enableWeatherContext: enableWeatherContextHaptics,
    enableTemperatureMapping: true,
    enableTimeOfDayVariation: true,
    enableProgressiveFeedback: true,
    enableAtmosphericPatterns: true,
    intensityMultiplier: 1.0,
    ...hapticConfig,
  });

  // Previous values for change detection
  const prevValues = useRef<{
    temperature?: number;
    weatherCode?: number;
    windSpeed?: number;
    pressure?: number;
  }>({});

  // Determine time of day
  const getTimeOfDay = useCallback(():
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }, []);

  // Determine weather severity
  const getWeatherSeverity = useCallback(
    (weatherCode: number): 'light' | 'moderate' | 'severe' => {
      if (weatherCode >= 95) return 'severe'; // Thunderstorm
      if (weatherCode >= 80) return 'moderate'; // Heavy rain/snow
      if (weatherCode >= 60) return 'moderate'; // Rain
      return 'light'; // Clear/light conditions
    },
    [],
  );

  // Create weather condition object
  const createWeatherCondition = useCallback((): WeatherCondition | null => {
    if (temperature === undefined || weatherCode === undefined) {
      return null;
    }

    return {
      code: weatherCode,
      temperature,
      windSpeed,
      humidity,
      pressure,
      timeOfDay: getTimeOfDay(),
      severity: getWeatherSeverity(weatherCode),
    };
  }, [
    temperature,
    weatherCode,
    windSpeed,
    humidity,
    pressure,
    getTimeOfDay,
    getWeatherSeverity,
  ]);

  // Handle weather data changes
  useEffect(() => {
    if (
      !enableWeatherContextHaptics ||
      isLoading ||
      temperature === undefined ||
      weatherCode === undefined
    ) {
      return;
    }

    const condition = createWeatherCondition();
    if (!condition) return;

    const prev = prevValues.current;

    // Handle weather transitions and initial load
    if (prev.weatherCode !== undefined && prev.weatherCode !== weatherCode) {
      const prevCondition: WeatherCondition = {
        code: prev.weatherCode,
        temperature: prev.temperature ?? condition.temperature,
        windSpeed: prev.windSpeed ?? windSpeed,
        humidity,
        pressure: prev.pressure ?? pressure,
        timeOfDay: getTimeOfDay(),
        severity: getWeatherSeverity(prev.weatherCode),
      };

      logWeatherTransition(
        'Weather transition detected:',
        prev.weatherCode,
        '→',
        weatherCode,
      );
      weatherHaptic.triggerWeatherTransition(prevCondition, condition);
    } else if (prev.weatherCode === undefined) {
      logWeatherHaptic('Initial weather haptic:', condition.code);
      weatherHaptic.triggerWeatherHaptic(condition);
    }

    // Update previous values
    prevValues.current = {
      temperature,
      weatherCode,
      windSpeed,
      pressure,
    };
  }, [
    temperature,
    weatherCode,
    windSpeed,
    pressure,
    humidity,
    enableWeatherContextHaptics,
    isLoading,
    createWeatherCondition,
    getTimeOfDay,
    getWeatherSeverity,
    weatherHaptic,
  ]);

  // Handle temperature changes
  useEffect(() => {
    if (!enableWeatherContextHaptics || temperature === undefined) return;

    const prev = prevValues.current;
    if (prev.temperature !== undefined) {
      const tempDiff = Math.abs(temperature - prev.temperature);
      if (tempDiff >= 3) {
        logTemperatureChange(
          'Temperature change haptic:',
          prev.temperature,
          '→',
          temperature,
        );
        weatherHaptic.triggerTemperatureChange(prev.temperature, temperature);
      }
    }
  }, [temperature, enableWeatherContextHaptics, weatherHaptic]);

  // Handle pressure changes
  useEffect(() => {
    if (!enableWeatherContextHaptics || pressure === undefined) return;

    const prev = prevValues.current;
    if (prev.pressure !== undefined) {
      const pressureDiff = pressure - prev.pressure;
      if (Math.abs(pressureDiff) >= 5) {
        logPressureChange('Pressure change haptic:', pressureDiff);
        weatherHaptic.triggerPressureChange(pressureDiff);
      }
    }
  }, [pressure, enableWeatherContextHaptics, weatherHaptic]);

  // Handle wind changes
  useEffect(() => {
    if (!enableWeatherContextHaptics || windSpeed === undefined) return;

    const prev = prevValues.current;
    if (prev.windSpeed !== undefined) {
      const windDiff = windSpeed - prev.windSpeed;
      if (windDiff >= 10) {
        logWindChange('Wind gust haptic:', windSpeed);
        weatherHaptic.triggerWindGust(windSpeed);
      }
    }
  }, [windSpeed, enableWeatherContextHaptics, weatherHaptic]);

  // Handle loading state
  useEffect(() => {
    if (isLoading && onWeatherLoad) {
      logWeatherLoading('Weather loading haptic');
      weatherHaptic.triggerWeatherLoading();
      onWeatherLoad();
    }
  }, [isLoading, onWeatherLoad, weatherHaptic]);

  // Handle refresh state
  useEffect(() => {
    if (isRefreshing && onWeatherRefresh) {
      const condition = createWeatherCondition();
      logWeatherLoading('Weather refresh haptic');
      weatherHaptic.triggerWeatherRefresh(condition || undefined);
      onWeatherRefresh();
    }
  }, [isRefreshing, onWeatherRefresh, weatherHaptic, createWeatherCondition]);

  // Handle location changes
  useEffect(() => {
    if (onLocationChange) {
      // Reset previous values when location changes
      prevValues.current = {};
      onLocationChange();
    }
  }, [onLocationChange]);

  // This component doesn't render anything, it's purely for haptic management
  return null;
};

export default WeatherHapticIntegration;
