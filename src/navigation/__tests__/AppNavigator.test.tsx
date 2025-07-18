/**
 * AppNavigator Component Test Suite
 * 
 * Comprehensive tests for the main weather application component
 * Testing navigation, weather API integration, error handling, and UI interactions
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AppNavigator from '../AppNavigator';

// Mock fetch for API testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AppNavigator Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockFetch.mockReset();
    
    // Console spy to suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  // ========================================================================
  // INITIAL RENDERING TESTS
  // ========================================================================

  describe('Initial Rendering', () => {
    test('renders home screen by default', () => {
      render(<AppNavigator />);
      
      expect(screen.getByText('Weather App')).toBeInTheDocument();
      expect(screen.getByText('Get real-time weather information for any city around the world')).toBeInTheDocument();
      expect(screen.getByText('Check Weather →')).toBeInTheDocument();
    });

    test('displays weather emoji icon on home screen', () => {
      render(<AppNavigator />);
      
      // Check for emoji in the app icon container
      const iconContainer = screen.getByText('🌤️');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  // ========================================================================
  // NAVIGATION TESTS
  // ========================================================================

  describe('Navigation', () => {
    test('navigates to weather details screen when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      expect(screen.getByText('🌍 Weather Forecast')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter city name...')).toBeInTheDocument();
    });

    test('navigates back to home screen when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      // Navigate back to home
      const backButton = screen.getByText('← Back to Home');
      await user.click(backButton);
      
      expect(screen.getByText('Weather App')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // WEATHER SEARCH FUNCTIONALITY TESTS
  // ========================================================================

  describe('Weather Search Input', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
    });

    test('accepts user input in city search field', async () => {
      const user = userEvent.setup();
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      
      await user.type(cityInput, 'New York');
      
      expect(cityInput).toHaveValue('New York');
    });

    test('triggers search on Enter key press', async () => {
      const user = userEvent.setup();
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            current_weather: {
              temperature: 72,
              weathercode: 0,
              windspeed: 5,
              winddirection: 180
            },
            hourly: {
              apparent_temperature: [72],
              relative_humidity_2m: [65],
              surface_pressure: [1013],
              uv_index: [5],
              visibility: [10000]
            }
          })
        });
      
      await user.type(cityInput, 'New York');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('displays error for empty city input', async () => {
      const user = userEvent.setup();
      const searchButton = screen.getByText('🔍 Search');
      
      await user.click(searchButton);
      
      expect(screen.getByText('⚠️ Please enter a city name')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // API INTEGRATION TESTS
  // ========================================================================

  describe('Weather API Integration', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
    });

    test('successfully fetches and displays weather data', async () => {
      const user = userEvent.setup();
      
      // Mock successful geocoding response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
      });
      
      // Mock successful weather response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current_weather: {
            temperature: 72,
            weathercode: 0,
            windspeed: 5,
            winddirection: 180
          },
          hourly: {
            apparent_temperature: [70],
            relative_humidity_2m: [65],
            surface_pressure: [1013],
            uv_index: [5],
            visibility: [10000]
          }
        })
      });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'New York');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('📍 New York')).toBeInTheDocument();
        expect(screen.getByText('72°F')).toBeInTheDocument();
        expect(screen.getByText('Feels like 70°F')).toBeInTheDocument();
        expect(screen.getByText('clear sky')).toBeInTheDocument();
      });
    });

    test('displays loading state during API requests', async () => {
      const user = userEvent.setup();
      
      // Mock delayed responses
      mockFetch
        .mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
          }), 100);
        }))
        .mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              current_weather: { temperature: 72, weathercode: 0, windspeed: 5, winddirection: 180 },
              hourly: { apparent_temperature: [70], relative_humidity_2m: [65], surface_pressure: [1013], uv_index: [5], visibility: [10000] }
            })
          }), 100);
        }));
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'New York');
      await user.click(searchButton);
      
      // Check loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('handles geocoding API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed geocoding response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'InvalidCity');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch weather data/)).toBeInTheDocument();
      });
    });

    test('handles city not found error', async () => {
      const user = userEvent.setup();
      
      // Mock empty geocoding response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'NonexistentCity');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/City not found/)).toBeInTheDocument();
      });
    });

    test('handles weather API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock successful geocoding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
      });
      
      // Mock failed weather API
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'New York');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Weather API failed/)).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // WEATHER ICON MAPPING TESTS
  // ========================================================================

  describe('Weather Icon Mapping', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
    });

    test.each([
      [0, '☀️'],     // Clear sky
      [1, '🌤️'],    // Mainly clear
      [2, '☁️'],     // Partly cloudy
      [45, '🌫️'],   // Fog
      [61, '🌧️'],   // Rain
      [71, '❄️'],    // Snow
      [95, '⛈️']     // Thunderstorm
    ])('displays correct weather icon for code %i', async (weatherCode, expectedIcon) => {
      const user = userEvent.setup();
      
      // Mock API responses with specific weather code
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            current_weather: {
              temperature: 72,
              weathercode: weatherCode,
              windspeed: 5,
              winddirection: 180
            },
            hourly: {
              apparent_temperature: [70],
              relative_humidity_2m: [65],
              surface_pressure: [1013],
              uv_index: [5],
              visibility: [10000]
            }
          })
        });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'Test City');
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // WEATHER DETAILS DISPLAY TESTS
  // ========================================================================

  describe('Weather Details Display', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
    });

    test('displays comprehensive weather information', async () => {
      const user = userEvent.setup();
      
      // Mock detailed weather response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            current_weather: {
              temperature: 75.5,
              weathercode: 1,
              windspeed: 8.2,
              winddirection: 225
            },
            hourly: {
              apparent_temperature: [73.1],
              relative_humidity_2m: [68],
              surface_pressure: [1015.3],
              uv_index: [7.2],
              visibility: [15000]
            }
          })
        });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'Miami');
      await user.click(searchButton);
      
      await waitFor(() => {
        // Temperature display
        expect(screen.getByText('76°F')).toBeInTheDocument();
        expect(screen.getByText('Feels like 73°F')).toBeInTheDocument();
        
        // Weather condition
        expect(screen.getByText('mainly clear')).toBeInTheDocument();
        
        // Detailed metrics
        expect(screen.getByText('68%')).toBeInTheDocument(); // Humidity
        expect(screen.getByText('8 mph')).toBeInTheDocument(); // Wind speed
        expect(screen.getByText('225° direction')).toBeInTheDocument(); // Wind direction
        expect(screen.getByText('1015 hPa')).toBeInTheDocument(); // Pressure
        expect(screen.getByText('7')).toBeInTheDocument(); // UV index
        expect(screen.getByText('15 km')).toBeInTheDocument(); // Visibility
      });
    });

    test('handles missing optional weather data gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock response with minimal data
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            current_weather: {
              temperature: 70,
              weathercode: 0,
              windspeed: 3,
              winddirection: 90
            },
            hourly: {
              apparent_temperature: [68],
              relative_humidity_2m: [null],
              surface_pressure: [null],
              uv_index: [0],
              visibility: [0]
            }
          })
        });
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'Test City');
      await user.click(searchButton);
      
      await waitFor(() => {
        // Should display available data with defaults for missing values
        expect(screen.getByText('70°F')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument(); // Default humidity
        expect(screen.getByText('1013 hPa')).toBeInTheDocument(); // Default pressure
      });
    });
  });

  // ========================================================================
  // UI INTERACTION TESTS
  // ========================================================================

  describe('UI Interactions', () => {
    test('search button is disabled during loading', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      // Mock delayed API response
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
        }), 1000);
      }));
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'New York');
      await user.click(searchButton);
      
      // Button should be disabled during loading
      expect(searchButton).toBeDisabled();
      expect(searchButton).toHaveStyle('cursor: not-allowed');
    });

    test('error message disappears when starting new search', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      const searchButton = screen.getByText('🔍 Search');
      
      // Trigger error with empty input
      await user.click(searchButton);
      expect(screen.getByText('⚠️ Please enter a city name')).toBeInTheDocument();
      
      // Start new search
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      await user.type(cityInput, 'New York');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: '40.7128', lon: '-74.0060' }]
      });
      
      await user.click(searchButton);
      
      // Error should be cleared
      expect(screen.queryByText('⚠️ Please enter a city name')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    test('has proper form labels and structure', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details screen
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      expect(cityInput).toHaveAttribute('type', 'text');
      expect(cityInput).toHaveAttribute('placeholder', 'Enter city name...');
    });

    test('buttons have proper cursor styles', () => {
      render(<AppNavigator />);
      
      const checkWeatherButton = screen.getByText('Check Weather →');
      expect(checkWeatherButton).toHaveStyle('cursor: pointer');
    });
  });
});
