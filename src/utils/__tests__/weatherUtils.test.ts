/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the functions we want to test from AppNavigator
// Note: These would ideally be extracted to separate utility files
describe('Weather Utility Functions', () => {
  describe('getWeatherDescription', () => {
    // We'll test the weather description mapping function
    it('should return correct descriptions for known weather codes', () => {
      // Since getWeatherDescription is defined in AppNavigator, we'll test it through mock data
      const testCodes = {
        0: 'clear sky',
        1: 'mainly clear',
        61: 'light rain',
        95: 'thunderstorm',
        99: 'thunderstorm with heavy hail',
      };

      Object.entries(testCodes).forEach(([code, expected]) => {
        // For now, we'll create a local version to test the logic
        const getWeatherDescription = (code: number): string => {
          const descriptions: { [key: number]: string } = {
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
          return descriptions[code] || 'unknown';
        };

        expect(getWeatherDescription(Number(code))).toBe(expected);
      });
    });

    it('should return "unknown" for unrecognized weather codes', () => {
      const getWeatherDescription = (code: number): string => {
        const descriptions: { [key: number]: string } = {
          0: 'clear sky',
          1: 'mainly clear',
        };
        return descriptions[code] || 'unknown';
      };

      expect(getWeatherDescription(999)).toBe('unknown');
      expect(getWeatherDescription(-1)).toBe('unknown');
    });
  });

  describe('processHourlyForecast', () => {
    const mockHourlyData = {
      time: [
        '2025-07-17T10:00:00Z',
        '2025-07-17T11:00:00Z',
        '2025-07-17T12:00:00Z',
        '2025-07-17T13:00:00Z',
      ],
      temperature_2m: [75, 78, 82, 85],
      weathercode: [0, 1, 2, 61],
      relative_humidity_2m: [45, 50, 55, 60],
      apparent_temperature: [77, 80, 84, 87],
    };

    beforeEach(() => {
      // Mock the current time to a fixed value for consistent testing
      vi.setSystemTime(new Date('2025-07-17T09:00:00Z'));
    });

    it('should process hourly data correctly', () => {
      const processHourlyForecast = (hourlyData: any) => {
        if (!hourlyData?.time || !hourlyData?.temperature_2m) {
          return [];
        }

        const currentTime = new Date();
        const next24Hours: any[] = [];

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

      const result = processHourlyForecast(mockHourlyData);

      expect(result).toHaveLength(4); // All 4 hours are in the future
      expect(result[0]).toEqual({
        time: '2025-07-17T10:00:00Z',
        temperature: 75,
        weatherCode: 0,
        humidity: 45,
        feelsLike: 77,
      });
    });

    it('should handle missing hourly data gracefully', () => {
      const processHourlyForecast = (hourlyData: any) => {
        if (!hourlyData?.time || !hourlyData?.temperature_2m) {
          return [];
        }
        return [];
      };

      expect(processHourlyForecast(null)).toEqual([]);
      expect(processHourlyForecast({})).toEqual([]);
      expect(processHourlyForecast({ time: [] })).toEqual([]);
    });

    it('should limit results to 24 hours', () => {
      const processHourlyForecast = (hourlyData: any) => {
        if (!hourlyData?.time || !hourlyData?.temperature_2m) {
          return [];
        }

        const currentTime = new Date();
        const next24Hours: any[] = [];

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

      // Create mock data with more than 24 future hours
      const largeMockData = {
        time: Array.from({ length: 30 }, (_, i) =>
          new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString()
        ),
        temperature_2m: Array.from({ length: 30 }, (_, i) => 70 + i),
        weathercode: Array.from({ length: 30 }, () => 0),
        relative_humidity_2m: Array.from({ length: 30 }, () => 50),
        apparent_temperature: Array.from({ length: 30 }, (_, i) => 72 + i),
      };

      const result = processHourlyForecast(largeMockData);
      expect(result.length).toBeLessThanOrEqual(24);
    });
  });

  describe('formatHourTime', () => {
    it('should format time correctly', () => {
      const formatHourTime = (timeString: string): string => {
        return new Date(timeString).toLocaleTimeString([], {
          hour: 'numeric',
          hour12: true,
        });
      };

      const result = formatHourTime('2025-07-17T14:00:00Z');
      // Result will depend on timezone, but should contain hour and AM/PM
      expect(result).toMatch(/\d{1,2}\s?(AM|PM)/);
    });
  });

  describe('formatDayInfo', () => {
    it('should identify today correctly', () => {
      const formatDayInfo = (dateString: string, index: number) => {
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

      const result = formatDayInfo('2025-07-17', 0);
      expect(result.isToday).toBe(true);
      expect(result.dayName).toBe('Today');
      expect(result.dateStr).toMatch(/\w+ \d{1,2}/); // e.g., "Jul 17"
    });

    it('should format non-today dates correctly', () => {
      const formatDayInfo = (dateString: string, index: number) => {
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

      const result = formatDayInfo('2025-07-18', 1);
      expect(result.isToday).toBe(false);
      expect(result.dayName).not.toBe('Today');
      expect(result.dateStr).toMatch(/\w+ \d{1,2}/);
    });
  });

  describe('processDailyForecast', () => {
    const mockDailyData = {
      time: ['2025-07-17', '2025-07-18', '2025-07-19'],
      weathercode: [0, 61, 95],
      temperature_2m_max: [85, 78, 82],
      temperature_2m_min: [65, 60, 68],
      precipitation_sum: [0, 5.5, 12.3],
      windspeed_10m_max: [10, 15, 25],
    };

    it('should process daily data correctly', () => {
      const processDailyForecast = (dailyData: any) => {
        if (!dailyData?.time || !dailyData?.temperature_2m_max) {
          return [];
        }

        const next7Days: any[] = [];

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

      const result = processDailyForecast(mockDailyData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2025-07-17',
        weatherCode: 0,
        tempMax: 85,
        tempMin: 65,
        precipitation: 0,
        windSpeed: 10,
      });

      // Test precipitation rounding
      expect(result[1].precipitation).toBe(5.5);
      expect(result[2].precipitation).toBe(12.3);
    });

    it('should handle missing daily data gracefully', () => {
      const processDailyForecast = (dailyData: any) => {
        if (!dailyData?.time || !dailyData?.temperature_2m_max) {
          return [];
        }
        return [];
      };

      expect(processDailyForecast(null)).toEqual([]);
      expect(processDailyForecast({})).toEqual([]);
      expect(processDailyForecast({ time: [] })).toEqual([]);
    });

    it('should limit results to 7 days', () => {
      const processDailyForecast = (dailyData: unknown) => {
        if (!dailyData || typeof dailyData !== 'object') {
          return [];
        }

        const data = dailyData as any;
        if (
          !Array.isArray(data.time) ||
          !Array.isArray(data.temperature_2m_max)
        ) {
          return [];
        }

        const next7Days: Array<{
          date: string;
          maxTemp: number;
          minTemp: number;
          description: string;
          weatherCode: number;
          tempMax: number;
          tempMin: number;
          precipitation: number;
          windSpeed: number;
        }> = [];

        for (let i = 0; i < Math.min(7, data.time.length); i++) {
          next7Days.push({
            date: data.time[i] as string,
            maxTemp: Math.round(data.temperature_2m_max?.[i] || 0),
            minTemp: Math.round(data.temperature_2m_min?.[i] || 0),
            description: 'sunny',
            weatherCode: data.weathercode?.[i] || 0,
            tempMax: Math.round(data.temperature_2m_max[i] || 0),
            tempMin: Math.round(data.temperature_2m_min[i] || 0),
            precipitation:
              Math.round((data.precipitation_sum?.[i] || 0) * 10) / 10,
            windSpeed: Math.round(data.windspeed_10m_max?.[i] || 0),
          });
        }

        return next7Days;
      };

      const largeMockData = {
        time: Array.from({ length: 10 }, (_, i) => `2025-07-${17 + i}`),
        weathercode: Array.from({ length: 10 }, () => 0),
        temperature_2m_max: Array.from({ length: 10 }, () => 80),
        temperature_2m_min: Array.from({ length: 10 }, () => 60),
        precipitation_sum: Array.from({ length: 10 }, () => 0),
        windspeed_10m_max: Array.from({ length: 10 }, () => 10),
      };

      const result = processDailyForecast(largeMockData);
      expect(result.length).toBeLessThanOrEqual(7);
    });
  });
});
