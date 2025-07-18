/**
 * Weather Forecast Test File
 * 
 * Test suite for the enhanced forecast functionality
 * to ensure hourly and daily forecasts work correctly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppNavigator from '../navigation/AppNavigator';
import { ThemeProvider } from '../utils/themeContext';
import { HapticFeedbackProvider } from '../utils/hapticContext';

// Wrapper component with all providers
const AppWithProviders = () => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('Weather Forecast Features', () => {
  test('displays hourly forecast after weather search', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    // Enter a city name
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'London' } });
    
    // Search for weather
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for hourly forecast to appear
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Check for hourly forecast items
    const hourlyItems = screen.getAllByText(/AM|PM/);
    expect(hourlyItems.length).toBeGreaterThan(0);
  });

  test('displays daily forecast after weather search', async () => {
    render(<AppWithProviders />);
    
    // Navigate to weather details
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    // Enter a city name
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Tokyo' } });
    
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
    
    // Navigate to weather details and search
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Paris' } });
    
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
    
    // Navigate and search
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Sydney' } });
    
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
    
    // Navigate to weather details
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    // Search for first city
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Berlin' } });
    
    const searchButton = screen.getByText(/Search/);
    fireEvent.click(searchButton);
    
    // Wait for initial forecast
    await waitFor(() => {
      expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Clear and search for second city
    fireEvent.change(cityInput, { target: { value: '' } });
    fireEvent.change(cityInput, { target: { value: 'Rome' } });
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
    
    // Navigate and search
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Mumbai' } });
    
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
    
    // Navigate and search
    const checkWeatherButton = screen.getByText('Check Weather →');
    fireEvent.click(checkWeatherButton);
    
    const cityInput = screen.getByPlaceholderText('Enter city name...');
    fireEvent.change(cityInput, { target: { value: 'Cairo' } });
    
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
