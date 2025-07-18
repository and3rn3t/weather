/**
 * WeatherDetailsScreen Component Test Suite
 * 
 * Tests for the legacy WeatherDetailsScreen component (Note: This component is deprecated)
 * These tests ensure backward compatibility but the inline weather screen in AppNavigator is preferred
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import WeatherDetailsScreen from '../WeatherDetailsScreen';

// Mock the weather service
jest.mock('../services/weatherService', () => ({
  fetchWeather: jest.fn()
}));

import { fetchWeather } from '../services/weatherService';
const mockFetchWeather = fetchWeather as jest.MockedFunction<typeof fetchWeather>;

// Define proper navigation type
type NavigationProp = {
  navigate: (screenName: string) => void;
};

// Mock navigation prop
const mockNavigate = jest.fn();
const mockNavigation: NavigationProp = { navigate: mockNavigate };

describe('WeatherDetailsScreen Component (Legacy)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockFetchWeather.mockReset();
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Component Rendering', () => {
    test('renders weather details screen with input and button', () => {
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument();
      expect(screen.getByText('Get Weather')).toBeInTheDocument();
    });

    test('renders back button for navigation', () => {
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      expect(screen.getByText('← Back')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // USER INPUT TESTS
  // ========================================================================

  describe('User Input', () => {
    test('accepts user input in city field', async () => {
      const user = userEvent.setup();
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      await user.type(cityInput, 'New York');
      
      expect(cityInput).toHaveValue('New York');
    });

    test('clears input after successful weather fetch', async () => {
      const user = userEvent.setup();
      
      // Mock successful weather response
      mockFetchWeather.mockResolvedValueOnce({
        main: { temp: 72 },
        weather: [{ description: 'clear sky' }]
      });
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'New York');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        expect(cityInput).toHaveValue('');
      });
    });
  });

  // ========================================================================
  // WEATHER FETCHING TESTS
  // ========================================================================

  describe('Weather Fetching', () => {
    test('fetches and displays weather data successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful weather response
      mockFetchWeather.mockResolvedValueOnce({
        main: { temp: 75 },
        weather: [{ description: 'partly cloudy' }]
      });
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'Miami');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        expect(screen.getByText('75°')).toBeInTheDocument();
        expect(screen.getByText('partly cloudy')).toBeInTheDocument();
      });
      
      expect(mockFetchWeather).toHaveBeenCalledWith('Miami');
    });

    test('displays loading state during fetch', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      mockFetchWeather.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            main: { temp: 70 },
            weather: [{ description: 'sunny' }]
          }), 100);
        })
      );
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'London');
      await user.click(getWeatherButton);
      
      // Check for loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('handles weather fetch errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock error response
      mockFetchWeather.mockRejectedValueOnce(new Error('City not found'));
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'InvalidCity');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error: City not found')).toBeInTheDocument();
      });
    });

    test('prevents fetch with empty city name', async () => {
      const user = userEvent.setup();
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const getWeatherButton = screen.getByText('Get Weather');
      await user.click(getWeatherButton);
      
      // Should not call fetch with empty input
      expect(mockFetchWeather).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // NAVIGATION TESTS
  // ========================================================================

  describe('Navigation', () => {
    test('navigates back when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const backButton = screen.getByText('← Back');
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  // ========================================================================
  // UI STATE TESTS
  // ========================================================================

  describe('UI State Management', () => {
    test('button is disabled during loading', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      mockFetchWeather.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            main: { temp: 68 },
            weather: [{ description: 'cloudy' }]
          }), 100);
        })
      );
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'Paris');
      await user.click(getWeatherButton);
      
      // Button should be disabled during loading
      expect(getWeatherButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(getWeatherButton).not.toBeDisabled();
      });
    });

    test('clears error state on new search', async () => {
      const user = userEvent.setup();
      
      // Mock error first, then success
      mockFetchWeather
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          main: { temp: 80 },
          weather: [{ description: 'hot' }]
        });
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      // First search - error
      await user.type(cityInput, 'BadCity');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
      
      // Second search - success
      await user.clear(cityInput);
      await user.type(cityInput, 'Phoenix');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Error: Network error')).not.toBeInTheDocument();
        expect(screen.getByText('80°')).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================

  describe('Component Styling', () => {
    test('has proper container styling', () => {
      const { container } = render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveStyle('padding: 20px');
    });

    test('weather info has proper styling when displayed', async () => {
      const user = userEvent.setup();
      
      mockFetchWeather.mockResolvedValueOnce({
        main: { temp: 85 },
        weather: [{ description: 'sunny' }]
      });
      
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      const getWeatherButton = screen.getByText('Get Weather');
      
      await user.type(cityInput, 'Los Angeles');
      await user.click(getWeatherButton);
      
      await waitFor(() => {
        const tempElement = screen.getByText('85°');
        expect(tempElement).toHaveStyle('font-size: 48px');
        expect(tempElement).toHaveStyle('font-weight: bold');
      });
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    test('has proper form structure', () => {
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const cityInput = screen.getByPlaceholderText('Enter city name');
      expect(cityInput).toHaveAttribute('type', 'text');
      
      const button = screen.getByRole('button', { name: 'Get Weather' });
      expect(button).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      const getWeatherButton = screen.getByRole('button', { name: 'Get Weather' });
      const backButton = screen.getByRole('button', { name: '← Back' });
      
      expect(getWeatherButton).not.toHaveAttribute('disabled');
      expect(backButton).not.toHaveAttribute('disabled');
    });
  });

  // ========================================================================
  // DEPRECATION NOTICE TEST
  // ========================================================================

  describe('Deprecation Notice', () => {
    test('component exists for backward compatibility', () => {
      // This test serves as documentation that this component is deprecated
      render(<WeatherDetailsScreen navigation={mockNavigation} />);
      
      expect(screen.getByPlaceholderText('Enter city name')).toBeInTheDocument();
    });
  });
});
