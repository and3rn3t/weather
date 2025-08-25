/**
 * Progressive Weather Data Loader
 *
 * Implements progressive loading strategy:
 * 1. Load current weather first (fastest)
 * 2. Load today's hourly forecast
 * 3. Load extended forecasts
 * 4. Load detailed metrics
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../types/weather';

interface ProgressiveWeatherData {
  current: WeatherData | null;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  metrics: {
    uvIndex?: number;
    visibility?: number;
    dewPoint?: number;
    pressure?: number;
  } | null;
  loadingStages: {
    current: boolean;
    hourly: boolean;
    daily: boolean;
    metrics: boolean;
  };
  progress: number; // 0-100
}

export const useProgressiveWeatherLoading = (
  latitude: number,
  longitude: number,
) => {
  const [weatherData, setWeatherData] = useState<ProgressiveWeatherData>({
    current: null,
    hourly: [],
    daily: [],
    metrics: null,
    loadingStages: {
      current: false,
      hourly: false,
      daily: false,
      metrics: false,
    },
    progress: 0,
  });

  const [error, setError] = useState<string>('');

  // Stage 1: Load current weather (highest priority)
  const loadCurrentWeather = useCallback(async () => {
    setWeatherData(prev => ({
      ...prev,
      loadingStages: { ...prev.loadingStages, current: true },
      progress: 10,
    }));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`,
      );

      if (!response.ok) throw new Error('Current weather fetch failed');

      const data = await response.json();

      setWeatherData(prev => ({
        ...prev,
        current: {
          main: {
            temp: data.current_weather.temperature,
            feels_like: data.current_weather.temperature, // Approximation
            humidity: 50, // Will be updated in metrics stage
            pressure: 1013, // Will be updated in metrics stage
          },
          weather: [
            {
              description: getWeatherDescription(
                data.current_weather.weathercode,
              ),
              main: getWeatherMain(data.current_weather.weathercode),
            },
          ],
          wind: {
            speed: data.current_weather.windspeed,
            deg: data.current_weather.winddirection,
          },
          visibility: 10000, // Default, will be updated
        } as WeatherData,
        loadingStages: { ...prev.loadingStages, current: false },
        progress: 25,
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Stage 1 error:', err);
      setError('Failed to load current weather');
      setWeatherData(prev => ({
        ...prev,
        loadingStages: { ...prev.loadingStages, current: false },
      }));
    }
  }, [latitude, longitude]);

  // Stage 2: Load hourly forecast (next 24 hours)
  const loadHourlyForecast = useCallback(async () => {
    setWeatherData(prev => ({
      ...prev,
      loadingStages: { ...prev.loadingStages, hourly: true },
      progress: 35,
    }));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode,relative_humidity_2m,apparent_temperature&temperature_unit=fahrenheit&forecast_days=1`,
      );

      if (!response.ok) throw new Error('Hourly forecast fetch failed');

      const data = await response.json();
      const hourlyData = data.hourly;

      const next24Hours: HourlyForecast[] = [];
      const currentHour = new Date().getHours();

      for (let i = 0; i < Math.min(24, hourlyData.time.length); i++) {
        if (i >= currentHour) {
          next24Hours.push({
            time: hourlyData.time[i],
            temperature: Math.round(hourlyData.temperature_2m[i] || 0),
            weatherCode: hourlyData.weathercode?.[i] || 0,
            humidity: Math.round(hourlyData.relative_humidity_2m?.[i] || 0),
            feelsLike: Math.round(hourlyData.apparent_temperature?.[i] || 0),
          });
        }
      }

      setWeatherData(prev => ({
        ...prev,
        hourly: next24Hours,
        loadingStages: { ...prev.loadingStages, hourly: false },
        progress: 60,
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Stage 2 error:', err);
      setWeatherData(prev => ({
        ...prev,
        loadingStages: { ...prev.loadingStages, hourly: false },
      }));
    }
  }, [latitude, longitude]);

  // Stage 3: Load daily forecast (7 days)
  const loadDailyForecast = useCallback(async () => {
    setWeatherData(prev => ({
      ...prev,
      loadingStages: { ...prev.loadingStages, daily: true },
      progress: 70,
    }));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&forecast_days=7`,
      );

      if (!response.ok) throw new Error('Daily forecast fetch failed');

      const data = await response.json();
      const dailyData = data.daily;

      const next7Days: DailyForecast[] = [];
      for (let i = 0; i < Math.min(7, dailyData.time.length); i++) {
        next7Days.push({
          date: dailyData.time[i],
          weatherCode: dailyData.weathercode?.[i] || 0,
          tempMax: Math.round(dailyData.temperature_2m_max[i] || 0),
          tempMin: Math.round(dailyData.temperature_2m_min[i] || 0),
          precipitation:
            Math.round((dailyData.precipitation_sum?.[i] || 0) * 10) / 10,
          windSpeed: Math.round(dailyData.windspeed_10m_max?.[i] || 0),
        });
      }

      setWeatherData(prev => ({
        ...prev,
        daily: next7Days,
        loadingStages: { ...prev.loadingStages, daily: false },
        progress: 85,
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Stage 3 error:', err);
      setWeatherData(prev => ({
        ...prev,
        loadingStages: { ...prev.loadingStages, daily: false },
      }));
    }
  }, [latitude, longitude]);

  // Stage 4: Load detailed metrics (lowest priority)
  const loadDetailedMetrics = useCallback(async () => {
    setWeatherData(prev => ({
      ...prev,
      loadingStages: { ...prev.loadingStages, metrics: true },
      progress: 90,
    }));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=relative_humidity_2m,surface_pressure,dew_point_2m&hourly=uv_index,visibility&temperature_unit=fahrenheit&forecast_days=1`,
      );

      if (!response.ok) throw new Error('Metrics fetch failed');

      const data = await response.json();

      const metrics = {
        uvIndex: data.hourly?.uv_index?.[0] || 0,
        visibility: data.hourly?.visibility?.[0] || 10000,
        dewPoint: data.current?.dew_point_2m || 0,
        pressure: data.current?.surface_pressure || 1013,
      };

      // Update current weather with accurate data
      setWeatherData(prev => ({
        ...prev,
        current: prev.current
          ? {
              ...prev.current,
              main: {
                ...prev.current.main,
                humidity:
                  data.current?.relative_humidity_2m ||
                  prev.current.main.humidity,
                pressure: metrics.pressure,
              },
              visibility: metrics.visibility,
              uv_index: metrics.uvIndex,
            }
          : null,
        metrics,
        loadingStages: { ...prev.loadingStages, metrics: false },
        progress: 100,
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Stage 4 error:', err);
      setWeatherData(prev => ({
        ...prev,
        loadingStages: { ...prev.loadingStages, metrics: false },
        progress: 100,
      }));
    }
  }, [latitude, longitude]);

  // Execute progressive loading
  useEffect(() => {
    if (!latitude || !longitude) return;

    const loadWeatherData = async () => {
      setError('');

      // Stage 1: Current weather (immediate display)
      await loadCurrentWeather();

      // Stage 2: Today's forecast (quick follow-up)
      setTimeout(() => loadHourlyForecast(), 100);

      // Stage 3: Extended forecast (can wait)
      setTimeout(() => loadDailyForecast(), 500);

      // Stage 4: Detailed metrics (lowest priority)
      setTimeout(() => loadDetailedMetrics(), 1000);
    };

    loadWeatherData();
  }, [
    latitude,
    longitude,
    loadCurrentWeather,
    loadHourlyForecast,
    loadDailyForecast,
    loadDetailedMetrics,
  ]);

  const refresh = useCallback(async () => {
    setWeatherData({
      current: null,
      hourly: [],
      daily: [],
      metrics: null,
      loadingStages: {
        current: false,
        hourly: false,
        daily: false,
        metrics: false,
      },
      progress: 0,
    });

    // Reload all stages
    await loadCurrentWeather();
    setTimeout(() => loadHourlyForecast(), 100);
    setTimeout(() => loadDailyForecast(), 500);
    setTimeout(() => loadDetailedMetrics(), 1000);
  }, [
    loadCurrentWeather,
    loadHourlyForecast,
    loadDailyForecast,
    loadDetailedMetrics,
  ]);

  return {
    ...weatherData,
    error,
    refresh,
    isLoading: Object.values(weatherData.loadingStages).some(Boolean),
  };
};

// Helper functions
const getWeatherDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
};

const getWeatherMain = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Clouds';
  if (code <= 48) return 'Mist';
  if (code <= 67) return 'Rain';
  if (code <= 82) return 'Rain';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
};

export default useProgressiveWeatherLoading;
