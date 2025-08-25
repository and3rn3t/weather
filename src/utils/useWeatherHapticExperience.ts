/**
 * Advanced Weather Haptic Experience System - Phase F-4
 *
 * Creates sophisticated haptic feedback patterns that respond to weather conditions,
 * time of day, temperature changes, and user interaction contexts for an immersive
 * weather app experience.
 */

import { useCallback, useRef } from 'react';
import { useHaptic } from './hapticHooks';
import logger, { logWeatherHaptic, logWeatherTransition } from './logger';

// ============================================================================
// WEATHER-CONTEXTUAL HAPTIC PATTERNS
// ============================================================================

export interface WeatherCondition {
  code: number;
  temperature: number;
  windSpeed: number;
  humidity: number;
  pressure: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  severity: 'light' | 'moderate' | 'severe';
}

export interface WeatherHapticConfig {
  enableWeatherContext?: boolean; // Weather-responsive haptics
  enableTemperatureMapping?: boolean; // Temperature-based intensity
  enableTimeOfDayVariation?: boolean; // Time-aware patterns
  enableProgressiveFeedback?: boolean; // Progressive interaction feedback
  enableAtmosphericPatterns?: boolean; // Weather condition patterns
  intensityMultiplier?: number; // Overall intensity (0.1-2.0)
}

export interface HapticWeatherExperience {
  condition: WeatherCondition;
  pattern: string;
  intensity: number;
  duration: number;
  description: string;
}

// Weather condition to haptic mapping
const WEATHER_HAPTIC_MAPPING: Record<
  number,
  {
    basePattern: string;
    intensityRange: [number, number];
    description: string;
  }
> = {
  // Clear conditions
  0: {
    basePattern: 'gentle-pulse',
    intensityRange: [0.3, 0.5],
    description: 'Clear sunny warmth',
  },
  1: {
    basePattern: 'soft-wave',
    intensityRange: [0.4, 0.6],
    description: 'Mostly clear breeze',
  },

  // Cloudy conditions
  2: {
    basePattern: 'rolling-cloud',
    intensityRange: [0.5, 0.7],
    description: 'Partly cloudy drift',
  },
  3: {
    basePattern: 'heavy-blanket',
    intensityRange: [0.6, 0.8],
    description: 'Overcast weight',
  },

  // Fog
  45: {
    basePattern: 'misty-softness',
    intensityRange: [0.2, 0.4],
    description: 'Foggy mystery',
  },
  48: {
    basePattern: 'crystalline-fog',
    intensityRange: [0.3, 0.5],
    description: 'Rime fog chill',
  },

  // Drizzle
  51: {
    basePattern: 'tiny-droplets',
    intensityRange: [0.3, 0.5],
    description: 'Light drizzle patter',
  },
  53: {
    basePattern: 'steady-drops',
    intensityRange: [0.4, 0.6],
    description: 'Moderate drizzle',
  },
  55: {
    basePattern: 'dense-mist',
    intensityRange: [0.5, 0.7],
    description: 'Dense drizzle shroud',
  },

  // Rain
  61: {
    basePattern: 'gentle-rain',
    intensityRange: [0.5, 0.7],
    description: 'Light rain melody',
  },
  63: {
    basePattern: 'steady-rain',
    intensityRange: [0.6, 0.8],
    description: 'Moderate rain rhythm',
  },
  65: {
    basePattern: 'heavy-downpour',
    intensityRange: [0.8, 1.0],
    description: 'Heavy rain power',
  },

  // Snow
  71: {
    basePattern: 'falling-snow',
    intensityRange: [0.2, 0.4],
    description: 'Light snow flutter',
  },
  73: {
    basePattern: 'thick-snow',
    intensityRange: [0.4, 0.6],
    description: 'Moderate snow blanket',
  },
  75: {
    basePattern: 'blizzard',
    intensityRange: [0.7, 0.9],
    description: 'Heavy snow storm',
  },

  // Thunderstorm
  95: {
    basePattern: 'thunder-strike',
    intensityRange: [0.9, 1.0],
    description: 'Thunderstorm power',
  },
};

// Time of day intensity modifiers
const TIME_INTENSITY_MODIFIERS = {
  morning: 0.8, // Gentle morning
  afternoon: 1.0, // Full intensity
  evening: 0.9, // Slightly softer
  night: 0.6, // Quiet night
};

// Temperature-based intensity mapping
const getTemperatureIntensity = (temperature: number): number => {
  if (temperature < -10) return 0.3; // Freezing cold - subtle
  if (temperature < 0) return 0.4; // Cold - gentle
  if (temperature < 10) return 0.6; // Cool - moderate
  if (temperature < 25) return 0.8; // Comfortable - normal
  if (temperature < 35) return 0.9; // Warm - strong
  return 1.0; // Hot - intense
};

// ============================================================================
// CUSTOM HAPTIC PATTERNS
// ============================================================================

const WEATHER_HAPTIC_PATTERNS: Record<string, number[]> = {
  // Clear weather patterns
  'gentle-pulse': [20, 80, 20],
  'soft-wave': [15, 60, 15, 60, 15],

  // Cloud patterns
  'rolling-cloud': [30, 50, 30, 50, 30],
  'heavy-blanket': [50, 100, 50],

  // Fog patterns
  'misty-softness': [10, 40, 10, 40, 10, 40],
  'crystalline-fog': [15, 30, 15, 30, 15],

  // Drizzle patterns
  'tiny-droplets': [5, 20, 5, 20, 5, 20, 5],
  'steady-drops': [10, 30, 10, 30, 10],
  'dense-mist': [15, 40, 15, 40, 15],

  // Rain patterns
  'gentle-rain': [20, 50, 20, 50, 20],
  'steady-rain': [25, 40, 25, 40, 25, 40],
  'heavy-downpour': [40, 60, 40, 60, 40],

  // Snow patterns
  'falling-snow': [8, 30, 8, 30, 8, 30, 8],
  'thick-snow': [20, 50, 20, 50, 20],
  blizzard: [50, 80, 50, 80, 50],

  // Thunderstorm patterns
  'thunder-strike': [100, 50, 80, 30, 60],

  // Progressive feedback patterns
  'temperature-rising': [10, 20, 15, 30, 20, 40, 25],
  'temperature-falling': [25, 40, 20, 30, 15, 20, 10],
  'pressure-building': [30, 60, 35, 70, 40, 80, 45],
  'wind-gusting': [20, 40, 30, 60, 40, 80, 50],
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useWeatherHapticExperience - Custom React hook for useWeatherHapticExperience functionality
 */
/**
 * useWeatherHapticExperience - Custom React hook for useWeatherHapticExperience functionality
 */
export const useWeatherHapticExperience = (
  config: WeatherHapticConfig = {},
) => {
  const {
    enableWeatherContext = true,
    enableTemperatureMapping = true,
    enableTimeOfDayVariation = true,
    enableProgressiveFeedback = true,
    enableAtmosphericPatterns = true,
    intensityMultiplier = 1.0,
  } = config;

  const haptic = useHaptic();
  const lastWeatherHaptic = useRef<number>(0);
  const currentExperience = useRef<HapticWeatherExperience | null>(null);

  // Rate limiting for weather haptics
  const WEATHER_HAPTIC_COOLDOWN = 2000; // 2 seconds

  // ============================================================================
  // WEATHER-CONTEXTUAL HAPTIC GENERATION
  // ============================================================================

  const createWeatherExperience = useCallback(
    (condition: WeatherCondition): HapticWeatherExperience => {
      const mapping = WEATHER_HAPTIC_MAPPING[condition.code];

      if (!mapping) {
        // Default pattern for unknown weather codes
        return {
          condition,
          pattern: 'gentle-pulse',
          intensity: 0.5,
          duration: 100,
          description: 'Unknown weather condition',
        };
      }

      // Calculate intensity based on multiple factors
      let intensity =
        (mapping.intensityRange[0] + mapping.intensityRange[1]) / 2;

      // Apply temperature mapping
      if (enableTemperatureMapping) {
        intensity *= getTemperatureIntensity(condition.temperature);
      }

      // Apply time of day variation
      if (enableTimeOfDayVariation) {
        intensity *= TIME_INTENSITY_MODIFIERS[condition.timeOfDay];
      }

      // Apply severity multiplier
      const severityMultiplier = {
        light: 0.7,
        moderate: 1.0,
        severe: 1.3,
      };
      intensity *= severityMultiplier[condition.severity];

      // Apply global intensity multiplier
      intensity *= intensityMultiplier;

      // Clamp intensity between 0.1 and 1.0
      intensity = Math.max(0.1, Math.min(1.0, intensity));

      return {
        condition,
        pattern: mapping.basePattern,
        intensity,
        duration: 150,
        description: mapping.description,
      };
    },
    [enableTemperatureMapping, enableTimeOfDayVariation, intensityMultiplier],
  );

  // ============================================================================
  // HAPTIC EXECUTION
  // ============================================================================

  const executeWeatherHaptic = useCallback(
    async (pattern: string, intensity: number = 1.0) => {
      if (!enableAtmosphericPatterns) return;

      const patternData = WEATHER_HAPTIC_PATTERNS[pattern];
      if (!patternData) {
        logger.warn(`Unknown weather haptic pattern: ${pattern}`);
        return;
      }

      // Apply intensity scaling to pattern
      const scaledPattern = patternData.map(duration =>
        Math.round(duration * intensity),
      );

      try {
        // Use web vibration API for custom patterns
        if (navigator.vibrate) {
          navigator.vibrate(scaledPattern);
        }
      } catch (error) {
        logger.warn('Weather haptic execution failed:', error);
      }
    },
    [enableAtmosphericPatterns],
  );

  // ============================================================================
  // PUBLIC INTERFACE
  // ============================================================================

  const triggerWeatherHaptic = useCallback(
    async (condition: WeatherCondition) => {
      if (!enableWeatherContext) return;

      const now = Date.now();
      if (now - lastWeatherHaptic.current < WEATHER_HAPTIC_COOLDOWN) {
        return; // Rate limited
      }

      const experience = createWeatherExperience(condition);
      currentExperience.current = experience;
      lastWeatherHaptic.current = now;

      logWeatherHaptic(
        `${experience.description} (intensity: ${experience.intensity.toFixed(
          2,
        )})`,
      );

      await executeWeatherHaptic(experience.pattern, experience.intensity);
    },
    [enableWeatherContext, createWeatherExperience, executeWeatherHaptic],
  );

  // Temperature change haptic
  const triggerTemperatureChange = useCallback(
    async (oldTemp: number, newTemp: number) => {
      if (!enableProgressiveFeedback) return;

      const tempDiff = Math.abs(newTemp - oldTemp);
      if (tempDiff < 2) return; // Only trigger for significant changes

      if (newTemp > oldTemp) {
        await executeWeatherHaptic(
          'temperature-rising',
          Math.min(1.0, tempDiff / 10),
        );
      } else {
        await executeWeatherHaptic(
          'temperature-falling',
          Math.min(1.0, tempDiff / 10),
        );
      }
    },
    [enableProgressiveFeedback, executeWeatherHaptic],
  );

  // Pressure change haptic
  const triggerPressureChange = useCallback(
    async (pressureChange: number) => {
      if (!enableProgressiveFeedback) return;

      const intensity = Math.min(1.0, Math.abs(pressureChange) / 20);
      await executeWeatherHaptic('pressure-building', intensity);
    },
    [enableProgressiveFeedback, executeWeatherHaptic],
  );

  // Wind intensity haptic
  const triggerWindGust = useCallback(
    async (windSpeed: number) => {
      if (!enableAtmosphericPatterns) return;

      const intensity = Math.min(1.0, windSpeed / 50); // Scale by wind speed
      await executeWeatherHaptic('wind-gusting', intensity);
    },
    [enableAtmosphericPatterns, executeWeatherHaptic],
  );

  // Weather transition haptic (between different conditions)
  const triggerWeatherTransition = useCallback(
    async (fromCondition: WeatherCondition, toCondition: WeatherCondition) => {
      if (!enableWeatherContext) return;

      // Create a transitional haptic experience
      const fromExperience = createWeatherExperience(fromCondition);
      const toExperience = createWeatherExperience(toCondition);

      // Blend the two experiences
      const blendedIntensity =
        (fromExperience.intensity + toExperience.intensity) / 2;

      // Custom transition pattern
      const transitionPattern = [
        ...WEATHER_HAPTIC_PATTERNS[fromExperience.pattern].slice(0, 3),
        50, // Pause
        ...WEATHER_HAPTIC_PATTERNS[toExperience.pattern].slice(0, 3),
      ];

      logWeatherTransition(
        `${fromExperience.description} → ${toExperience.description}`,
      );

      try {
        if (navigator.vibrate) {
          const scaledPattern = transitionPattern.map(duration =>
            Math.round(duration * blendedIntensity),
          );
          navigator.vibrate(scaledPattern);
        }
      } catch (error) {
        logger.warn('Weather transition haptic failed:', error);
      }
    },
    [enableWeatherContext, createWeatherExperience],
  );

  // Enhanced weather loading with progressive feedback
  const triggerWeatherLoading = useCallback(async () => {
    if (!enableProgressiveFeedback) return;

    // Progressive loading pattern
    haptic.dataLoad();

    // Add a subtle ongoing pattern for long loads
    setTimeout(() => executeWeatherHaptic('gentle-pulse', 0.3), 1000);
    setTimeout(() => executeWeatherHaptic('gentle-pulse', 0.4), 2000);
  }, [enableProgressiveFeedback, haptic, executeWeatherHaptic]);

  // Weather refresh with contextual feedback
  const triggerWeatherRefresh = useCallback(
    async (condition?: WeatherCondition) => {
      haptic.weatherRefresh();

      if (condition && enableWeatherContext) {
        // Add weather-specific refresh feedback
        setTimeout(() => triggerWeatherHaptic(condition), 500);
      }
    },
    [haptic, enableWeatherContext, triggerWeatherHaptic],
  );

  return {
    // Weather-contextual haptics
    triggerWeatherHaptic,
    triggerWeatherTransition,
    triggerTemperatureChange,
    triggerPressureChange,
    triggerWindGust,

    // Enhanced standard haptics
    triggerWeatherLoading,
    triggerWeatherRefresh,

    // Current state
    currentExperience: currentExperience.current,

    // Configuration
    config: {
      enableWeatherContext,
      enableTemperatureMapping,
      enableTimeOfDayVariation,
      enableProgressiveFeedback,
      enableAtmosphericPatterns,
      intensityMultiplier,
    },
  };
};

export default useWeatherHapticExperience;
