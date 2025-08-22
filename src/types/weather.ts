/**
 * Weather Type Definitions
 * Shared types for weather data across the application
 */

export interface WeatherData {
  main: {
    temp: number; // Current temperature in Fahrenheit
    feels_like: number; // Apparent temperature in Fahrenheit
    humidity: number; // Relative humidity percentage
    pressure: number; // Atmospheric pressure in hPa
  };
  weather: {
    description: string; // Human-readable weather condition
  }[];
  wind: {
    speed: number; // Wind speed in mph
    deg: number; // Wind direction in degrees
  };
  uv_index: number; // UV index (0-11+ scale)
  visibility: number; // Visibility in meters
}

export interface HourlyForecast {
  time: string; // ISO timestamp
  temperature: number; // Temperature in Fahrenheit
  weatherCode: number; // OpenMeteo weather code
  humidity: number; // Relative humidity percentage
  feelsLike: number; // Apparent temperature
}

export interface DailyForecast {
  date: string; // ISO date
  weatherCode: number; // OpenMeteo weather code
  tempMax: number; // Maximum temperature
  tempMin: number; // Minimum temperature
  precipitation: number; // Precipitation amount
  windSpeed: number; // Wind speed
}
