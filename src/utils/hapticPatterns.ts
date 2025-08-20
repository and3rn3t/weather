import { logWarn } from './logger';

/**
 * Centralized Haptic Patterns - Optimization
 *
 * Consolidates all haptic patterns into a single, reusable system
 * to eliminate redundancy and improve maintainability.
 */

// Common vibration patterns used throughout the app
export const HAPTIC_PATTERNS = {
  // Basic interaction patterns
  tap: [20],
  press: [40],
  confirm: [30, 20, 30],
  success: [25, 50, 25],
  error: [50, 30, 50, 30, 50],

  // Weather condition patterns
  clear: [15, 60, 15],
  cloudy: [20, 40, 20],
  rainy: [30, 20, 30, 20, 30],
  heavy_rain: [40, 30, 40, 30, 40],
  thunderstorm: [80, 40, 60],
  windy: [20, 40, 30, 60, 40],

  // Progressive feedback patterns
  loading: [15, 30, 15],
  loading_progress: [20, 40, 20],
  loading_complete: [25, 50, 25],

  // Location patterns
  location_found: [25, 50, 25, 50, 25],
  location_searching: [10, 20, 10, 20, 10],

  // Temperature patterns
  temperature_change: [15, 30, 15],
  pressure_change: [25, 50, 25],
  wind_gust: [20, 40, 30, 60, 40],
} as const;

/**
 * Centralized vibration executor with error handling and logging
 */
/**
 * executeVibration - Core hapticPatterns functionality
 */
/**
 * executeVibration - Core hapticPatterns functionality
 */
export const executeVibration = (
  pattern: number[] | keyof typeof HAPTIC_PATTERNS,
  intensity: number = 1.0
): boolean => {
  try {
    // Get pattern array
    const patternArray = Array.isArray(pattern)
      ? pattern
      : HAPTIC_PATTERNS[pattern];

    if (!patternArray) {
      logWarn(`Unknown haptic pattern: ${pattern}`);
      return false;
    }

    // Check if vibration is supported
    if (!navigator.vibrate) {
      return false;
    }

    // Apply intensity scaling
    const scaledPattern = patternArray.map(duration =>
      Math.round(duration * intensity)
    );

    // Execute vibration
    return navigator.vibrate(scaledPattern);
  } catch (error) {
    logWarn('Vibration execution failed:', error);
    return false;
  }
};

/**
 * Weather-specific vibration helper
 */
/**
 * executeWeatherVibration - Weather data processing and display
 */
/**
 * executeWeatherVibration - Weather data processing and display
 */
export const executeWeatherVibration = (
  weatherCode: number,
  intensity: number = 1.0
): boolean => {
  let patternKey: keyof typeof HAPTIC_PATTERNS;

  if (weatherCode >= 95) {
    patternKey = 'thunderstorm';
  } else if (weatherCode >= 80) {
    patternKey = 'heavy_rain';
  } else if (weatherCode >= 60) {
    patternKey = 'rainy';
  } else if (weatherCode >= 20) {
    patternKey = 'cloudy';
  } else {
    patternKey = 'clear';
  }

  return executeVibration(patternKey, intensity);
};

/**
 * Progressive loading vibration sequence
 */
/**
 * executeProgressiveLoading - Core hapticPatterns functionality
 */
/**
 * executeProgressiveLoading - Core hapticPatterns functionality
 */
export const executeProgressiveLoading = (): void => {
  executeVibration('loading');
  setTimeout(() => executeVibration('loading_progress'), 300);
  setTimeout(() => executeVibration('loading_complete'), 800);
};

export default {
  HAPTIC_PATTERNS,
  executeVibration,
  executeWeatherVibration,
  executeProgressiveLoading,
};
