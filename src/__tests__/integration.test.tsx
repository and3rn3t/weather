/**
 * Integration Tests
 * 
 * End-to-end integration tests for the complete weather app workflow
 * Tests the full user journey from home screen to weather display
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AppNavigator from '../navigation/AppNavigator';
import { 
  setupSuccessfulApiFetch, 
  setupFailedApiFetch, 
  setupCityNotFoundFetch,
  createMockOpenMeteoResponse,
  TEST_CITIES,
  TEST_WEATHER_CONDITIONS
} from '../utils/testUtils';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Weather App Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // COMPLETE USER JOURNEY TESTS
  // ========================================================================

  describe('Complete User Journey', () => {
    test('user can navigate from home to weather details and get weather info', async () => {
      const user = userEvent.setup();
      
      // Setup successful API responses
      setupSuccessfulApiFetch(
        TEST_CITIES.NEW_YORK.name,
        createMockOpenMeteoResponse({
          current_weather: {
            temperature: 75,
            weathercode: TEST_WEATHER_CONDITIONS.CLEAR.code,
            windspeed: 8,
            winddirection: 180
          }
        })
      );
      
      render(<AppNavigator />);
      
      // 1. Verify home screen
      expect(screen.getByText('Weather App')).toBeInTheDocument();
      expect(screen.getByText('Get real-time weather information for any city around the world')).toBeInTheDocument();
      
      // 2. Navigate to weather details
      const checkWeatherButton = screen.getByText('Check Weather →');
      await user.click(checkWeatherButton);
      
      // 3. Verify weather details screen
      expect(screen.getByText('🌍 Weather Forecast')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter city name...')).toBeInTheDocument();
      
      // 4. Enter city and search
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, TEST_CITIES.NEW_YORK.name);
      await user.click(searchButton);
      
      // 5. Verify weather data is displayed
      await waitFor(() => {
        expect(screen.getByText(`📍 ${TEST_CITIES.NEW_YORK.name}`)).toBeInTheDocument();
        expect(screen.getByText('75°F')).toBeInTheDocument();
        expect(screen.getByText('clear sky')).toBeInTheDocument();
        expect(screen.getByText(TEST_WEATHER_CONDITIONS.CLEAR.icon)).toBeInTheDocument();
      });
      
      // 6. Verify detailed weather information
      expect(screen.getByText('70%')).toBeInTheDocument(); // Default humidity
      expect(screen.getByText('8 mph')).toBeInTheDocument(); // Wind speed
      expect(screen.getByText('1013 hPa')).toBeInTheDocument(); // Default pressure
      
      // 7. Navigate back to home
      const backButton = screen.getByText('← Back to Home');
      await user.click(backButton);
      
      // 8. Verify back on home screen
      expect(screen.getByText('Weather App')).toBeInTheDocument();
    });

    test('user can search for multiple cities consecutively', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      await user.click(screen.getByText('Check Weather →'));
      
      // Test multiple cities
      const citiesToTest = [
        { city: TEST_CITIES.LONDON, temp: 60, condition: TEST_WEATHER_CONDITIONS.CLOUDY },
        { city: TEST_CITIES.TOKYO, temp: 78, condition: TEST_WEATHER_CONDITIONS.RAINY },
        { city: TEST_CITIES.SYDNEY, temp: 85, condition: TEST_WEATHER_CONDITIONS.CLEAR }
      ];
      
      for (const { city, temp, condition } of citiesToTest) {
        // Setup API response for this city
        setupSuccessfulApiFetch(
          city.name,
          createMockOpenMeteoResponse({
            current_weather: {
              temperature: temp,
              weathercode: condition.code,
              windspeed: 5,
              winddirection: 90
            }
          })
        );
        
        const cityInput = screen.getByPlaceholderText('Enter city name...');
        const searchButton = screen.getByText('🔍 Search');
        
        // Clear previous input and enter new city
        await user.clear(cityInput);
        await user.type(cityInput, city.name);
        await user.click(searchButton);
        
        // Verify results
        await waitFor(() => {
          expect(screen.getByText(`📍 ${city.name}`)).toBeInTheDocument();
          expect(screen.getByText(`${temp}°F`)).toBeInTheDocument();
          expect(screen.getByText(condition.description)).toBeInTheDocument();
        });
      }
    });
  });

  // ========================================================================
  // ERROR HANDLING INTEGRATION TESTS
  // ========================================================================

  describe('Error Handling Integration', () => {
    test('handles complete flow with city not found error', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      await user.click(screen.getByText('Check Weather →'));
      
      // Setup city not found response
      setupCityNotFoundFetch();
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'NonexistentCity');
      await user.click(searchButton);
      
      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/City not found/)).toBeInTheDocument();
      });
      
      // Verify user can still navigate back
      const backButton = screen.getByText('← Back to Home');
      await user.click(backButton);
      expect(screen.getByText('Weather App')).toBeInTheDocument();
    });

    test('handles network error and recovery', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      await user.click(screen.getByText('Check Weather →'));
      
      // First attempt - network error
      setupFailedApiFetch(false, 'Network error');
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'TestCity');
      await user.click(searchButton);
      
      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/Weather API failed/)).toBeInTheDocument();
      });
      
      // Second attempt - success
      setupSuccessfulApiFetch('TestCity');
      
      await user.clear(cityInput);
      await user.type(cityInput, 'TestCity');
      await user.click(searchButton);
      
      // Verify success
      await waitFor(() => {
        expect(screen.queryByText(/Weather API failed/)).not.toBeInTheDocument();
        expect(screen.getByText('📍 TestCity')).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // LOADING STATE INTEGRATION TESTS
  // ========================================================================

  describe('Loading State Integration', () => {
    test('shows loading state during API calls', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      await user.click(screen.getByText('Check Weather →'));
      
      // Setup delayed response
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
            json: async () => createMockOpenMeteoResponse()
          }), 100);
        }));
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      await user.type(cityInput, 'TestCity');
      await user.click(searchButton);
      
      // Verify loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(searchButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(searchButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  // ========================================================================
  // KEYBOARD NAVIGATION INTEGRATION TESTS
  // ========================================================================

  describe('Keyboard Navigation Integration', () => {
    test('supports Enter key for weather search', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Navigate to weather details
      await user.click(screen.getByText('Check Weather →'));
      
      // Setup successful response
      setupSuccessfulApiFetch();
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      
      await user.type(cityInput, 'New York');
      await user.keyboard('{Enter}');
      
      // Verify API was called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('maintains focus flow during navigation', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      // Tab navigation on home screen
      await user.tab();
      expect(screen.getByText('Check Weather →')).toHaveFocus();
      
      // Navigate to weather details
      await user.keyboard('{Enter}');
      
      // Verify focus on weather details screen
      expect(screen.getByText('← Back to Home')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // RESPONSIVE DESIGN INTEGRATION TESTS
  // ========================================================================

  describe('Responsive Design Integration', () => {
    test('maintains functionality across different screen sizes', async () => {
      const user = userEvent.setup();
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<AppNavigator />);
      
      // Navigate and test functionality on mobile
      await user.click(screen.getByText('Check Weather →'));
      
      setupSuccessfulApiFetch();
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      await user.type(cityInput, 'Mobile Test');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('📍 Mobile Test')).toBeInTheDocument();
      });
      
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      // Functionality should still work
      expect(screen.getByText('📍 Mobile Test')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // WEATHER CONDITION INTEGRATION TESTS
  // ========================================================================

  describe('Weather Condition Integration', () => {
    test('displays appropriate icons for different weather conditions', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      await user.click(screen.getByText('Check Weather →'));
      
      // Test each weather condition
      const conditionsToTest = Object.values(TEST_WEATHER_CONDITIONS);
      
      for (const condition of conditionsToTest) {
        setupSuccessfulApiFetch(
          'TestCity',
          createMockOpenMeteoResponse({
            current_weather: {
              temperature: 70,
              weathercode: condition.code,
              windspeed: 5,
              winddirection: 180
            }
          })
        );
        
        const cityInput = screen.getByPlaceholderText('Enter city name...');
        const searchButton = screen.getByText('🔍 Search');
        
        await user.clear(cityInput);
        await user.type(cityInput, 'TestCity');
        await user.click(searchButton);
        
        await waitFor(() => {
          expect(screen.getByText(condition.icon)).toBeInTheDocument();
          expect(screen.getByText(condition.description)).toBeInTheDocument();
        });
      }
    });
  });

  // ========================================================================
  // PERFORMANCE INTEGRATION TESTS
  // ========================================================================

  describe('Performance Integration', () => {
    test('handles rapid successive searches without errors', async () => {
      const user = userEvent.setup();
      render(<AppNavigator />);
      
      await user.click(screen.getByText('Check Weather →'));
      
      const cityInput = screen.getByPlaceholderText('Enter city name...');
      const searchButton = screen.getByText('🔍 Search');
      
      // Perform rapid searches
      for (let i = 0; i < 5; i++) {
        setupSuccessfulApiFetch(`City${i}`);
        
        await user.clear(cityInput);
        await user.type(cityInput, `City${i}`);
        await user.click(searchButton);
        
        // Don't wait for each to complete before starting the next
      }
      
      // Wait for the last one to complete
      await waitFor(() => {
        expect(screen.getByText('📍 City4')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
