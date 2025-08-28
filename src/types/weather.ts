/**
 * Weather Type Definitions
 * Unified types for weather data across the application
 *
 * Compatible with:
 * - AppNavigator.tsx weather data structure
 * - OptimizedMobileWeatherDisplay.tsx component props
 * - EnhancedWeatherVisualization.tsx component props
 * - OpenMeteo API response format
 */

// Main weather data interface - unified for all components
export interface WeatherData {
  main: {
    temp: number; // Current temperature in Fahrenheit
    feels_like: number; // Apparent temperature in Fahrenheit
    humidity: number; // Relative humidity percentage
    pressure: number; // Atmospheric pressure in hPa
  };
  weather: Array<{
    description: string; // Human-readable weather condition
    main: string; // Weather category (e.g., "Rain", "Clear", "Clouds")
  }>;
  wind: {
    speed: number; // Wind speed in mph
    deg: number; // Wind direction in degrees
  };
  uv_index: number; // UV index (0-11+ scale)
  visibility: number; // Visibility in meters
}

// Hourly forecast data structure
export interface HourlyForecast {
  time: string; // ISO timestamp
  temperature: number; // Temperature in Fahrenheit
  weatherCode: number; // OpenMeteo weather code
  humidity: number; // Relative humidity percentage
  feelsLike: number; // Apparent temperature
}

// Daily forecast data structure
export interface DailyForecast {
  date: string; // ISO date
  weatherCode: number; // OpenMeteo weather code
  tempMax: number; // Maximum temperature in Fahrenheit
  tempMin: number; // Minimum temperature in Fahrenheit
  precipitation: number; // Precipitation amount in mm
  windSpeed: number; // Maximum wind speed in mph
}

// Weather context for smart content prioritization
export interface WeatherContext {
  temperature?: number;
  weatherCode: number;
  isExtreme: boolean;
  hasAlerts: boolean;
  timeOfDay: 'night' | 'morning' | 'afternoon' | 'evening';
}

// Content priority levels for smart display
export interface ContentPriority {
  id: string;
  component: string;
  priority: number;
  shouldShow: boolean;
  reason: string;
}

// Progressive loading stages
export interface LoadingStage {
  stage: 'current' | 'hourly' | 'daily' | 'metrics';
  completed: boolean;
  progress: number;
  error?: string;
}

// Enhanced visualization component props
export interface VisualizationProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export interface TemperatureTrendData {
  time: string;
  temperature: number;
}

export interface PrecipitationData {
  time: string;
  probability: number; // 0-100
}

export interface WindData {
  speed: number; // mph
  direction: number; // degrees
  gusts?: number; // mph
}

export interface UVIndexData {
  current: number; // 0-11+ scale
  max: number; // Daily maximum
  category: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
}
