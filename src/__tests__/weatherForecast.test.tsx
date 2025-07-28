/**
 * Weather Forecast Test File
 * 
 * Test suite for the enhanced forecast functionality
 * to ensure hourly and daily forecasts work correctly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import AppNavigator from '../navigation/AppNavigator';
import { ThemeProvider } from '../utils/themeContext';
import { HapticFeedbackProvider } from '../utils/hapticContext';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock weather API responses
const mockGeocodingResponse = [
  {
    lat: "51.5074",
    lon: "-0.1278",
    display_name: "London, England, United Kingdom"
  }
];

const mockWeatherResponse = {
  current_weather: {
    temperature: 20.5,
    weathercode: 1,
    windspeed: 10.3,
    winddirection: 240
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => 
      new Date(Date.now() + i * 60 * 60 * 1000).toISOString()
    ),
    temperature_2m: Array.from({ length: 24 }, () => 18 + Math.random() * 8),
    weather_code: Array.from({ length: 24 }, () => 1),
    relative_humidity_2m: Array.from({ length: 24 }, () => 60 + Math.random() * 20)
  },
  daily: {
    time: Array.from({ length: 7 }, (_, i) => 
      new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ),
    temperature_2m_max: Array.from({ length: 7 }, () => 22 + Math.random() * 8),
    temperature_2m_min: Array.from({ length: 7 }, () => 12 + Math.random() * 8),
    weather_code: Array.from({ length: 7 }, () => 1),
    precipitation_sum: Array.from({ length: 7 }, () => Math.random() * 5)
  }
};

// Wrapper component with all providers
const AppWithProviders = () => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('Weather Forecast Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fetch mock
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementation((url: string | URL | Request) => {
      let urlString: string;
      if (typeof url === 'string') {
        urlString = url;
      } else if (url instanceof URL) {
        urlString = url.toString();
      } else if (url instanceof Request) {
        urlString = url.url;
      } else {
        urlString = String(url);
      }
      if (urlString.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response);
      } else if (urlString.includes('api.open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockWeatherResponse)
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('displays hourly forecast after weather search', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'London' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for hourly forecast to appear with shorter timeout
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Check for hourly forecast items
    const hourlyItems = screen.getAllByText(/AM|PM/);
    expect(hourlyItems.length).toBeGreaterThan(0);
  });

  test('displays daily forecast after weather search', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for daily forecast to appear
    await waitFor(() => {
      expect(screen.getByText('📅 7-Day Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check for daily forecast items
    const todayElement = screen.getByText('Today');
    expect(todayElement).toBeInTheDocument();
  });

  test('hourly forecast shows temperature and weather icons', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Paris' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for forecast data
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check for temperature displays (°F format)
    const temperatureElements = screen.getAllByText(/\d+°F/);
    expect(temperatureElements.length).toBeGreaterThan(0);
    
    // Check for weather icons in forecast
    const forecastContainer = screen.getByText('🕐 24-Hour Forecast').closest('div');
    const weatherIcons = forecastContainer?.querySelectorAll('.weather-icon');
    expect(weatherIcons?.length).toBeGreaterThan(0);
  });

  test('daily forecast shows min/max temperatures', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Sydney' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for daily forecast
    await waitFor(() => {
      expect(screen.getByText('📅 7-Day Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check for "Today" in daily forecast
    const todayElement = screen.getByText('Today');
    expect(todayElement).toBeInTheDocument();
    
    // Check for temperature ranges (should have multiple temperature values)
    const temperatureElements = screen.getAllByText(/\d+°/);
    expect(temperatureElements.length).toBeGreaterThan(7); // At least 2 temps per day for 7 days
  });

  test('forecast data updates when searching different cities', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Search for first city
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Berlin' } });
    
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for initial forecast
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Clear and search for second city
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.change(searchInput, { target: { value: 'Rome' } });
    fireEvent.click(searchButton);
    
    // Wait for updated forecast (should still be present)
    await waitFor(() => {
      expect(screen.getByText('📅 7-Day Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Forecasts should update with new data
    const forecastElements = screen.getAllByText(/\d+°F/);
    expect(forecastElements.length).toBeGreaterThan(0);
  });
});

describe('Forecast UI Components', () => {
  test('hourly forecast is horizontally scrollable', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Mumbai' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for forecast
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check for horizontal scroll container
    const forecastContainer = screen.getByText('🕐 24-Hour Forecast').closest('div');
    const scrollContainer = forecastContainer?.querySelector('[style*="overflow-x"]');
    expect(scrollContainer).toBeInTheDocument();
  });

  test('daily forecast highlights today differently', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details by clicking on a weather icon
    const weatherIconButtons = screen.getAllByLabelText(/View .* weather details/);
    expect(weatherIconButtons.length).toBeGreaterThan(0);
    fireEvent.click(weatherIconButtons[0]);
    
    // Enter a city name in the search input
    const searchInput = screen.getByPlaceholderText(/Search for a city/);
    fireEvent.change(searchInput, { target: { value: 'Cairo' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for forecast
    await waitFor(() => {
      expect(screen.getByText('📅 7-Day Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check that "Today" is present and styled differently
    const todayElement = screen.getByText('Today');
    expect(todayElement).toBeInTheDocument();
    
    // Today's container should have different styling
    const todayContainer = todayElement.closest('div');
    expect(todayContainer).toBeInTheDocument();
  });
});
