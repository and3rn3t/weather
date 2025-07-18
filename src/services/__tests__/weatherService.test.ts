/**
 * Weather Service Test Suite
 * 
 * Tests for the legacy weatherService module (Note: This service is deprecated)
 * These tests ensure the legacy OpenWeatherMap integration still works for backward compatibility
 * Current implementation uses OpenMeteo API directly in AppNavigator component
 */
import axios from 'axios';
import { fetchWeather } from '../weatherService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Weather Service (Legacy)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockedAxios.get.mockReset();
    
    // Mock environment variable
    process.env.VITE_API_KEY = 'test-api-key';
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.VITE_API_KEY;
  });

  // ========================================================================
  // SUCCESSFUL WEATHER FETCH TESTS
  // ========================================================================

  describe('Successful Weather Fetching', () => {
    test('fetches weather data successfully with valid city', async () => {
      // Mock geocoding API response
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            lat: 40.7128,
            lon: -74.0060
          }
        ]
      });

      // Mock weather API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 72.5,
            weather: [
              {
                main: 'Clear',
                description: 'clear sky'
              }
            ]
          }
        }
      });

      const result = await fetchWeather('New York');

      expect(result).toEqual({
        main: {
          temp: 72.5
        },
        weather: [
          {
            main: 'Clear',
            description: 'clear sky'
          }
        ]
      });

      // Verify API calls
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      
      // Verify geocoding call
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 
        'https://api.openweathermap.org/geo/1.0/direct',
        {
          params: {
            q: 'New York',
            limit: 1,
            appid: 'test-api-key'
          }
        }
      );

      // Verify weather call
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        'https://api.openweathermap.org/data/3.0/onecall',
        {
          params: {
            lat: 40.7128,
            lon: -74.0060,
            exclude: 'minutely,hourly,daily,alerts',
            units: 'imperial',
            appid: 'test-api-key'
          }
        }
      );
    });

    test('handles different weather conditions correctly', async () => {
      // Mock responses for rainy weather
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 51.5074, lon: -0.1278 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 58.3,
            weather: [
              {
                main: 'Rain',
                description: 'light rain'
              }
            ]
          }
        }
      });

      const result = await fetchWeather('London');

      expect(result.main.temp).toBe(58.3);
      expect(result.weather[0].description).toBe('light rain');
    });

    test('handles cities with special characters', async () => {
      // Mock response for city with special characters
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 48.8566, lon: 2.3522 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 65.2,
            weather: [
              {
                main: 'Clouds',
                description: 'scattered clouds'
              }
            ]
          }
        }
      });

      const result = await fetchWeather('Paris, FR');

      expect(result.main.temp).toBe(65.2);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Paris, FR'
          })
        })
      );
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    test('throws error when city is not found', async () => {
      // Mock empty geocoding response
      mockedAxios.get.mockResolvedValueOnce({
        data: []
      });

      await expect(fetchWeather('NonexistentCity')).rejects.toThrow(
        'City not found. Please check the spelling and try again.'
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    test('throws error when geocoding API returns null', async () => {
      // Mock null geocoding response
      mockedAxios.get.mockResolvedValueOnce({
        data: null
      });

      await expect(fetchWeather('InvalidCity')).rejects.toThrow(
        'City not found. Please check the spelling and try again.'
      );
    });

    test('handles geocoding API network errors', async () => {
      // Mock network error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(fetchWeather('New York')).rejects.toThrow('Network Error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    test('handles weather API network errors', async () => {
      // Mock successful geocoding but failed weather API
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockRejectedValueOnce(new Error('Weather API Error'));

      await expect(fetchWeather('New York')).rejects.toThrow('Weather API Error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    test('handles API key errors', async () => {
      // Mock 401 Unauthorized response
      const error = new Error('Request failed with status code 401') as Error & {
        response?: { status: number };
      };
      error.response = { status: 401 };
      
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(fetchWeather('New York')).rejects.toThrow(
        'Request failed with status code 401'
      );
    });

    test('handles malformed API responses', async () => {
      // Mock successful geocoding
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      // Mock malformed weather response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          // Missing current property
          timezone: 'America/New_York'
        }
      });

      // Should handle gracefully (may throw TypeError)
      await expect(fetchWeather('New York')).rejects.toThrow();
    });
  });

  // ========================================================================
  // API PARAMETER TESTS
  // ========================================================================

  describe('API Parameters', () => {
    test('uses correct API endpoints', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 70,
            weather: [{ main: 'Clear', description: 'clear sky' }]
          }
        }
      });

      await fetchWeather('Test City');

      // Check geocoding endpoint
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1,
        'https://api.openweathermap.org/geo/1.0/direct',
        expect.any(Object)
      );

      // Check weather endpoint
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        'https://api.openweathermap.org/data/3.0/onecall',
        expect.any(Object)
      );
    });

    test('uses imperial units for weather API', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 70,
            weather: [{ main: 'Clear', description: 'clear sky' }]
          }
        }
      });

      await fetchWeather('Test City');

      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            units: 'imperial'
          })
        })
      );
    });

    test('excludes unnecessary data from weather API', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 70,
            weather: [{ main: 'Clear', description: 'clear sky' }]
          }
        }
      });

      await fetchWeather('Test City');

      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            exclude: 'minutely,hourly,daily,alerts'
          })
        })
      );
    });

    test('includes API key in all requests', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 70,
            weather: [{ main: 'Clear', description: 'clear sky' }]
          }
        }
      });

      await fetchWeather('Test City');

      // Both API calls should include the API key
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            appid: 'test-api-key'
          })
        })
      );

      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            appid: 'test-api-key'
          })
        })
      );
    });
  });

  // ========================================================================
  // EDGE CASE TESTS
  // ========================================================================

  describe('Edge Cases', () => {
    test('handles empty city string', async () => {
      // Should still make API call with empty string
      mockedAxios.get.mockResolvedValueOnce({
        data: []
      });

      await expect(fetchWeather('')).rejects.toThrow(
        'City not found. Please check the spelling and try again.'
      );
    });

    test('handles very long city names', async () => {
      const longCityName = 'A'.repeat(100);
      
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 0, lon: 0 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 75,
            weather: [{ main: 'Clear', description: 'clear' }]
          }
        }
      });

      const result = await fetchWeather(longCityName);
      expect(result.main.temp).toBe(75);
    });

    test('handles extreme temperature values', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 90, lon: 0 }] // North Pole
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: -40,
            weather: [{ main: 'Snow', description: 'heavy snow' }]
          }
        }
      });

      const result = await fetchWeather('North Pole');
      expect(result.main.temp).toBe(-40);
    });
  });

  // ========================================================================
  // DEPRECATION NOTICE TEST
  // ========================================================================

  describe('Deprecation Notice', () => {
    test('service exists for backward compatibility', async () => {
      // This test serves as documentation that this service is deprecated
      // Current implementation uses OpenMeteo API directly in AppNavigator
      
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ lat: 40.7128, lon: -74.0060 }]
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          current: {
            temp: 70,
            weather: [{ main: 'Clear', description: 'clear sky' }]
          }
        }
      });

      const result = await fetchWeather('Test City');
      expect(result).toBeDefined();
      expect(result.main.temp).toBe(70);
    });
  });
});
