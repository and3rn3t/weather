import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
} from '../types/weather';
import { logWarn } from './logger';
import { formatTimeForHourly } from './timeUtils';
import { getWeatherDescription, getWeatherMainCategory } from './weatherCodes';

// Raw OpenMeteo response slices we care about
export interface RawHourlyData {
  time: string[];
  temperature_2m: number[];
  weathercode: number[];
  relative_humidity_2m?: number[];
  apparent_temperature?: number[];
  surface_pressure?: number[];
  uv_index?: number[];
  visibility?: number[];
}

export interface RawDailyData {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2_m_min?: never; // guard against typos
  temperature_2m_min: number[];
  precipitation_sum?: number[];
  windspeed_10m_max?: number[];
}

export const processHourlyForecast = (
  hourlyData: RawHourlyData | null | undefined
): HourlyForecast[] => {
  if (!hourlyData?.time || !hourlyData?.temperature_2m) {
    logWarn('⚠️ No hourly data available for forecast');
    return [];
  }

  const currentTime = new Date();
  const next24Hours: HourlyForecast[] = [];

  for (let i = 0; i < Math.min(24, hourlyData.time.length); i++) {
    const forecastTime = new Date(hourlyData.time[i]);

    if (forecastTime > currentTime) {
      next24Hours.push({
        time: hourlyData.time[i],
        temperature: Math.round(hourlyData.temperature_2m[i] || 0),
        weatherCode: hourlyData.weathercode?.[i] || 0,
        humidity: Math.round(hourlyData.relative_humidity_2m?.[i] || 0),
        feelsLike: Math.round(hourlyData.apparent_temperature?.[i] || 0),
      });
    }

    if (next24Hours.length >= 24) break;
  }

  return next24Hours;
};

export const processDailyForecast = (
  dailyData: RawDailyData | null | undefined
): DailyForecast[] => {
  if (!dailyData?.time || !dailyData?.temperature_2m_max) {
    logWarn('⚠️ No daily data available for forecast');
    return [];
  }

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

  return next7Days;
};

export const formatDayInfo = (dateString: string, index: number) => {
  const dayDate = new Date(dateString);
  const isToday = index === 0;
  const dayName = isToday
    ? 'Today'
    : dayDate.toLocaleDateString([], { weekday: 'short' });
  const dateStr = dayDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return { dayName, dateStr, isToday };
};

// Enhanced Visualization Data Transformers
export const transformHourlyDataForChart = (
  hourlyForecast: HourlyForecast[]
) => {
  return hourlyForecast.slice(0, 12).map(hour => ({
    time: formatTimeForHourly(hour.time),
    temperature: hour.temperature,
  }));
};

export const generatePrecipitationData = (hourlyForecast: HourlyForecast[]) => {
  // Mock placeholder for precipitation probability until API data is integrated
  return hourlyForecast.slice(0, 12).map(hour => ({
    time: formatTimeForHourly(hour.time),
    precipitation: Math.random() * 100,
  }));
};

export const calculateUVIndex = (weather: WeatherData) => {
  // Mock UV calculation based on temperature and time of day
  const hour = new Date().getHours();
  const baseUV =
    hour >= 6 && hour <= 18
      ? Math.min(10, Math.max(0, (weather.main.temp - 60) / 10))
      : 0;
  return Math.round(baseUV * 10) / 10;
};

export interface MappedWeatherResult {
  weatherData: WeatherData;
  weatherCode: number;
}

/** Map OpenMeteo API payload into app WeatherData */
export const mapOpenMeteoToWeatherData = (data: {
  current_weather?: {
    temperature?: number;
    weathercode?: number;
    windspeed?: number;
    winddirection?: number;
  };
  hourly?: RawHourlyData | null;
}): MappedWeatherResult => {
  const currentWeatherCode = data.current_weather?.weathercode || 0;
  const currentHour = new Date().getHours();
  const hourlyData = data.hourly || undefined;

  const mapped: WeatherData = {
    main: {
      temp: data.current_weather?.temperature || 0,
      feels_like:
        hourlyData?.apparent_temperature?.[currentHour] ||
        data.current_weather?.temperature ||
        0,
      humidity: hourlyData?.relative_humidity_2m?.[currentHour] || 50,
      pressure: hourlyData?.surface_pressure?.[currentHour] || 1013,
    },
    weather: [
      {
        description: getWeatherDescription(currentWeatherCode),
        main: getWeatherMainCategory(currentWeatherCode),
      },
    ],
    wind: {
      speed: data.current_weather?.windspeed || 0,
      deg: data.current_weather?.winddirection || 0,
    },
    uv_index: hourlyData?.uv_index?.[currentHour] || 0,
    visibility: hourlyData?.visibility?.[currentHour] || 0,
  } as WeatherData;

  return { weatherData: mapped, weatherCode: currentWeatherCode };
};
