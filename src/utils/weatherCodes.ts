/**
 * Shared weather code utilities for Open-Meteo weather codes.
 * Centralizes mappings to avoid duplication across App and Navigator.
 */

/** Human-readable descriptions for Open-Meteo weather codes */
export const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'clear sky',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  61: 'light rain',
  63: 'moderate rain',
  65: 'heavy rain',
  71: 'light snow',
  73: 'moderate snow',
  75: 'heavy snow',
  80: 'light rain showers',
  81: 'moderate rain showers',
  82: 'violent rain showers',
  95: 'thunderstorm',
  96: 'thunderstorm with slight hail',
  99: 'thunderstorm with heavy hail',
};

/**
 * Get a human-friendly description for an Open-Meteo weather code.
 */
export function getWeatherDescription(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? 'unknown';
}

/**
 * High-level weather category for a given Open-Meteo code.
 */
export function getWeatherMainCategory(code: number): string {
  if (code === 0 || code === 1) return 'Clear';
  if (code >= 2 && code <= 3) return 'Clouds';
  if (code >= 45 && code <= 48) return 'Mist';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clear';
}
