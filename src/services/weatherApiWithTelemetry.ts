/**
 * Enhanced Weather API Service with Dash0 Telemetry
 * This integrates Dash0 observability into the core weather API calls
 */

import { useWeatherTelemetry } from '../hooks/useDash0Telemetry';
import { optimizedFetchJson } from '../utils/optimizedFetch';
import { reverseGeocodeCached } from '../utils/reverseGeocodingCache';

// TypeScript interfaces for API responses
interface GeocodingResult {
  lat: string;
  lon: string;
  display_name?: string;
}

interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weathercode?: number;
    surface_pressure?: number;
    windspeed_10m?: number;
    winddirection_10m?: number;
    uv_index?: number;
    visibility?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weathercode?: number[];
    relative_humidity_2m?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weathercode?: number[];
    precipitation_sum?: number[];
    windspeed_10m_max?: number[];
    uv_index_max?: number[];
  };
}

// Enhanced API service with telemetry
export function useWeatherApiWithTelemetry() {
  const telemetry = useWeatherTelemetry();

  /**
   * Search for weather by city name with full telemetry tracking
   */
  const searchWeatherByCity = async (city: string) => {
    // Track the overall weather search operation
    return telemetry.trackOperation(
      'weather_search_complete',
      async () => {
        // Step 1: Geocoding with telemetry
        const geocodingResult: GeocodingResult[] = await telemetry.trackApiCall(
          'geocoding',
          city,
          async () => {
            return optimizedFetchJson<GeocodingResult[]>(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                city
              )}&format=json&limit=1`,
              {},
              `telemetry:geocode:${city}`
            );
          }
        );

        if (!geocodingResult || geocodingResult.length === 0) {
          throw new Error(
            'City not found. Please check the spelling and try again.'
          );
        }

        const { lat, lon } = geocodingResult[0];
        const cityName = geocodingResult[0].display_name || city;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        // Track successful geocoding
        telemetry.trackUserInteraction({
          action: 'geocoding_success',
          component: 'WeatherAPI',
        });

        // Step 2: Weather data with telemetry
        const weatherData: WeatherResponse = await telemetry.trackApiCall(
          'weather',
          cityName,
          async () => {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`;

            return optimizedFetchJson<WeatherResponse>(
              weatherUrl,
              {},
              `telemetry:weather:${cityName}`
            );
          }
        );

        // Track successful weather data retrieval
        telemetry.trackUserInteraction({
          action: 'weather_data_retrieved',
          component: 'WeatherAPI',
        });

        // Transform and return data
        const transformedData = transformWeatherData(
          weatherData,
          cityName,
          latitude,
          longitude
        );

        // Track data transformation performance
        telemetry.trackPerformance({
          name: 'weather_data_transformation',
          value: transformedData.current?.temp || 0,
          unit: 'fahrenheit',
        });

        return transformedData;
      },
      {
        city,
        coordinates: 'pending_geocoding',
      }
    );
  };

  /**
   * Get weather by coordinates (for geolocation)
   */
  const getWeatherByCoordinates = async (lat: number, lon: number) => {
    return telemetry.trackOperation(
      'weather_by_coordinates',
      async () => {
        // Track geolocation usage
        telemetry.trackLocationRequest({ method: 'geolocation' });

        // Get weather data
        const weatherData = await telemetry.trackApiCall(
          'weather',
          `${lat},${lon}`,
          async () => {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,surface_pressure,windspeed_10m,winddirection_10m,uv_index,visibility&hourly=temperature_2m,weathercode,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,uv_index_max&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`;

            return optimizedFetchJson<WeatherResponse>(
              weatherUrl,
              {},
              `telemetry:weather:${lat},${lon}`
            );
          }
        );

        // Get city name from coordinates (skip in dev to reduce requests)
        const cityName = import.meta.env?.DEV
          ? 'Current Location'
          : await getReverseGeocodingWithTelemetry(lat, lon);

        return transformWeatherData(weatherData, cityName, lat, lon);
      },
      { latitude: lat, longitude: lon }
    );
  };

  /**
   * Reverse geocoding with telemetry
   */
  const getReverseGeocodingWithTelemetry = async (lat: number, lon: number) => {
    return telemetry.trackOperation(
      'reverse_geocoding',
      async () => {
        const data = await reverseGeocodeCached(lat, lon);
        return data.city || 'Unknown Location';
      },
      { latitude: lat, longitude: lon }
    );
  };

  return {
    searchWeatherByCity,
    getWeatherByCoordinates,
    getReverseGeocodingWithTelemetry,
  };
}

/**
 * Transform OpenMeteo data to app format
 */
function transformWeatherData(
  weatherData: WeatherResponse,
  cityName: string,
  lat: number,
  lon: number
) {
  return {
    current: {
      temp: Math.round(weatherData.current?.temperature_2m || 0),
      feels_like: Math.round(weatherData.current?.apparent_temperature || 0),
      humidity: weatherData.current?.relative_humidity_2m || 0,
      pressure: weatherData.current?.surface_pressure || 0,
      wind_speed: weatherData.current?.windspeed_10m || 0,
      wind_deg: weatherData.current?.winddirection_10m || 0,
      visibility: weatherData.current?.visibility || 0,
      uv_index: weatherData.current?.uv_index || 0,
      description: getWeatherDescription(weatherData.current?.weathercode || 0),
      weathercode: weatherData.current?.weathercode || 0,
    },
    location: {
      name: cityName,
      lat,
      lon,
    },
    hourly: weatherData.hourly ? transformHourlyData(weatherData.hourly) : [],
    daily: weatherData.daily ? transformDailyData(weatherData.daily) : [],
    timestamp: Date.now(),
  };
}

/**
 * Transform hourly forecast data
 */
function transformHourlyData(
  hourlyData: NonNullable<WeatherResponse['hourly']>
) {
  return (
    hourlyData.time?.slice(0, 24).map((time: string, index: number) => ({
      time,
      temp: Math.round(hourlyData.temperature_2m?.[index] || 0),
      humidity: hourlyData.relative_humidity_2m?.[index] || 0,
      weathercode: hourlyData.weathercode?.[index] || 0,
      description: getWeatherDescription(hourlyData.weathercode?.[index] || 0),
    })) || []
  );
}

/**
 * Transform daily forecast data
 */
function transformDailyData(dailyData: NonNullable<WeatherResponse['daily']>) {
  return (
    dailyData.time?.slice(0, 7).map((time: string, index: number) => ({
      date: time,
      temp_max: Math.round(dailyData.temperature_2m_max?.[index] || 0),
      temp_min: Math.round(dailyData.temperature_2m_min?.[index] || 0),
      precipitation: dailyData.precipitation_sum?.[index] || 0,
      wind_speed: dailyData.windspeed_10m_max?.[index] || 0,
      uv_index: dailyData.uv_index_max?.[index] || 0,
      weathercode: dailyData.weathercode?.[index] || 0,
      description: getWeatherDescription(dailyData.weathercode?.[index] || 0),
    })) || []
  );
}

/**
 * Get weather description from code
 */
function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Light rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}
