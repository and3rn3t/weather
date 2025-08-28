import { describe, expect, it } from 'vitest';
import {
  formatDayInfo,
  mapOpenMeteoToWeatherData,
  processDailyForecast,
  processHourlyForecast,
  type RawDailyData,
  type RawHourlyData,
} from '../weatherTransformers';

// Helper: build ISO hourly times starting at next hour
function buildHourlyTimes(hours = 24) {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  base.setHours(base.getHours() + 1); // start from next hour so it's in the future
  const arr: string[] = [];
  for (let i = 0; i < hours; i++) {
    const d = new Date(base);
    d.setHours(base.getHours() + i);
    arr.push(d.toISOString());
  }
  return arr;
}

// Helper: build ISO daily times starting at today
function buildDailyTimes(days = 7) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const arr: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    arr.push(d.toISOString());
  }
  return arr;
}

describe('weatherTransformers', () => {
  it('processHourlyForecast maps next 24 hours correctly', () => {
    const times = buildHourlyTimes(30);
    const hourly: RawHourlyData = {
      time: times,
      temperature_2m: Array(times.length)
        .fill(70)
        .map((v, i) => v + i * 0.1),
      weathercode: Array(times.length).fill(1),
      relative_humidity_2m: Array(times.length).fill(40),
      apparent_temperature: Array(times.length).fill(68),
    };

    const result = processHourlyForecast(hourly);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(24);
    expect(result[0]).toHaveProperty('time');
    expect(result[0]).toHaveProperty('temperature');
    expect(typeof result[0].temperature).toBe('number');
  });

  it('processDailyForecast maps 7 days correctly', () => {
    const times = buildDailyTimes(7);
    const daily: RawDailyData = {
      time: times,
      weathercode: Array(times.length).fill(2),
      temperature_2m_max: Array(times.length).fill(80),
      temperature_2m_min: Array(times.length).fill(60),
      precipitation_sum: Array(times.length).fill(1.5),
      windspeed_10m_max: Array(times.length).fill(15),
    };

    const result = processDailyForecast(daily);
    expect(result).toHaveLength(7);
    expect(result[0].tempMax).toBe(80);
    expect(result[0].tempMin).toBe(60);
    expect(typeof result[0].weatherCode).toBe('number');
  });

  it('formatDayInfo returns Today for index 0 and weekday otherwise', () => {
    const d = new Date();
    const iso = d.toISOString();
    const todayInfo = formatDayInfo(iso, 0);
    expect(todayInfo.isToday).toBe(true);
    expect(todayInfo.dayName).toBe('Today');

    const tomorrow = new Date(d);
    tomorrow.setDate(d.getDate() + 1);
    const tmrInfo = formatDayInfo(tomorrow.toISOString(), 1);
    expect(tmrInfo.isToday).toBe(false);
    expect(typeof tmrInfo.dayName).toBe('string');
    expect(tmrInfo.dayName).not.toBe('');
  });

  it('mapOpenMeteoToWeatherData maps current weather and pulls hourly fields at current hour', () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Build 24-hour arrays with known value at currentHour
    const size = Math.max(currentHour + 1, 24);
    const times: string[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < size; i++) {
      const d = new Date(start);
      d.setHours(i);
      times.push(d.toISOString());
    }

    const hourly: RawHourlyData = {
      time: times,
      temperature_2m: Array(size).fill(70),
      weathercode: Array(size).fill(1),
      relative_humidity_2m: Array(size)
        .fill(0)
        .map((v, i) => (i === currentHour ? 42 : 35)),
      apparent_temperature: Array(size)
        .fill(0)
        .map((v, i) => (i === currentHour ? 67 : 65)),
      surface_pressure: Array(size)
        .fill(0)
        .map((v, i) => (i === currentHour ? 1002 : 1005)),
      uv_index: Array(size)
        .fill(0)
        .map((v, i) => (i === currentHour ? 6 : 3)),
      visibility: Array(size)
        .fill(0)
        .map((v, i) => (i === currentHour ? 10000 : 9000)),
    };

    const payload = {
      current_weather: {
        temperature: 70,
        weathercode: 1,
        windspeed: 5,
        winddirection: 180,
      },
      hourly,
    };

    const mapped = mapOpenMeteoToWeatherData(payload);
    expect(mapped.weatherCode).toBe(1);
    expect(mapped.weatherData.main.temp).toBe(70);
    expect(mapped.weatherData.main.feels_like).toBe(67);
    expect(mapped.weatherData.main.humidity).toBe(42);
    expect(mapped.weatherData.main.pressure).toBe(1002);
    expect(mapped.weatherData.wind.speed).toBe(5);
    expect(mapped.weatherData.wind.deg).toBe(180);
    expect(typeof mapped.weatherData.weather[0].description).toBe('string');
    expect(typeof mapped.weatherData.weather[0].main).toBe('string');
    expect(mapped.weatherData.uv_index).toBe(6);
    expect(mapped.weatherData.visibility).toBe(10000);
  });

  it('processHourlyForecast returns empty array for null/undefined input or missing fields', () => {
    expect(processHourlyForecast(null as any)).toEqual([]);
    expect(processHourlyForecast(undefined as any)).toEqual([]);
    const incomplete: Partial<RawHourlyData> = { time: [], weathercode: [] };
    // @ts-expect-error partial on purpose
    expect(processHourlyForecast(incomplete)).toEqual([]);
  });

  it('processDailyForecast returns empty array for null/undefined input or missing fields', () => {
    expect(processDailyForecast(null as any)).toEqual([]);
    expect(processDailyForecast(undefined as any)).toEqual([]);
    const incomplete: Partial<RawDailyData> = { time: [], weathercode: [] };
    // @ts-expect-error partial on purpose
    expect(processDailyForecast(incomplete)).toEqual([]);
  });

  it('mapOpenMeteoToWeatherData uses safe defaults when hourly slice is missing', () => {
    const payload = {
      current_weather: {
        temperature: 72,
        weathercode: 0,
        windspeed: 3,
        winddirection: 90,
      },
      // hourly omitted on purpose
    };

    const mapped = mapOpenMeteoToWeatherData(payload as any);
    expect(mapped.weatherCode).toBe(0);
    expect(mapped.weatherData.main.temp).toBe(72);
    // falls back to current temp when no apparent_temperature
    expect(mapped.weatherData.main.feels_like).toBe(72);
    // defaults when hourly missing
    expect(mapped.weatherData.main.humidity).toBe(50);
    expect(mapped.weatherData.main.pressure).toBe(1013);
    expect(mapped.weatherData.uv_index).toBe(0);
    expect(mapped.weatherData.visibility).toBe(0);
    expect(mapped.weatherData.wind.speed).toBe(3);
    expect(mapped.weatherData.wind.deg).toBe(90);
  });
});
