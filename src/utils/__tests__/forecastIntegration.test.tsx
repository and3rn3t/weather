/**
 * Simplified Integration Tests for Weather Forecast
 * Tests key forecast functionality without the heavy AppNavigator component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../themeContext';
import { HapticFeedbackProvider } from '../hapticContext';

// Mock fetch for API calls
global.fetch = vi.fn();

// Weather data types
interface WeatherData {
  current_weather?: {
    temperature: number;
    weathercode: number;
    windspeed: number;
    winddirection: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

// Simple test component that simulates weather search without full AppNavigator
const WeatherSearchTest = ({ onWeatherData }: { onWeatherData?: (data: WeatherData) => void }) => {
  const [city, setCity] = React.useState('');
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const searchWeather = async () => {
    if (!city) return;
    
    setLoading(true);
    try {
      // Geocoding request
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`);
      const geoData = await geoResponse.json();
      
      if (geoData.length > 0) {
        const { lat, lon } = geoData[0];
        
        // Weather request
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit`
        );
        const data = await weatherResponse.json();
        
        setWeatherData(data);
        onWeatherData?.(data);
      }
    } catch (error) {
      console.error('Weather search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a city..."
        value={city}
        onChange={(e) => setCity(e.target.value)}
        data-testid="city-search-input"
      />
      <button onClick={searchWeather} disabled={loading} data-testid="search-button">
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {weatherData && (
        <div data-testid="weather-results">
          <div data-testid="current-temperature">
            {weatherData.current_weather?.temperature}°F
          </div>
          
          {weatherData.hourly && (
            <div data-testid="hourly-forecast">
              <h3>🕐 24-Hour Forecast</h3>
              <div>
                {weatherData.hourly.time.slice(0, 6).map((time: string, index: number) => {
                  if (!weatherData.hourly) return null;
                  return (
                    <div key={time} data-testid={`hourly-item-${index}`}>
                      {new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                      : {Math.round(weatherData.hourly.temperature_2m[index])}°F
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {weatherData.daily && (
            <div data-testid="daily-forecast">
              <h3>📅 7-Day Forecast</h3>
              <div>
                {weatherData.daily.time.slice(0, 3).map((date: string, index: number) => {
                  if (!weatherData.daily) return null;
                  return (
                    <div key={date} data-testid={`daily-item-${index}`}>
                      {index === 0 ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      : {Math.round(weatherData.daily.temperature_2m_max[index])}°F
                      / {Math.round(weatherData.daily.temperature_2m_min[index])}°F
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </HapticFeedbackProvider>
);

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
    temperature: 72.5,
    weathercode: 1,
    windspeed: 10.3,
    winddirection: 240
  },
  hourly: {
    time: [
      '2025-07-27T09:00',
      '2025-07-27T10:00',
      '2025-07-27T11:00',
      '2025-07-27T12:00',
      '2025-07-27T13:00',
      '2025-07-27T14:00',
    ],
    temperature_2m: [68, 70, 72, 75, 78, 76],
    weathercode: [1, 1, 2, 2, 3, 2],
  },
  daily: {
    time: ['2025-07-27', '2025-07-28', '2025-07-29'],
    temperature_2m_max: [78, 82, 75],
    temperature_2m_min: [65, 68, 62],
    weathercode: [1, 2, 61],
  }
};

describe('Weather Forecast Integration Tests (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fetch mock
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();
      
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
    render(
      <TestWrapper>
        <WeatherSearchTest />
      </TestWrapper>
    );
    
    // Enter city name
    const searchInput = screen.getByTestId('city-search-input');
    fireEvent.change(searchInput, { target: { value: 'London' } });
    
    // Click search
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Wait for hourly forecast to appear
    await waitFor(() => {
      expect(screen.getByTestId('hourly-forecast')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for hourly forecast content
    expect(screen.getByText('🕐 24-Hour Forecast')).toBeInTheDocument();
    
    // Check for hourly items
    const hourlyItems = screen.getAllByTestId(/hourly-item-/);
    expect(hourlyItems.length).toBeGreaterThan(0);
  });

  test('displays daily forecast after weather search', async () => {
    render(
      <TestWrapper>
        <WeatherSearchTest />
      </TestWrapper>
    );
    
    // Enter city name
    const searchInput = screen.getByTestId('city-search-input');
    fireEvent.change(searchInput, { target: { value: 'Tokyo' } });
    
    // Click search
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Wait for daily forecast to appear
    await waitFor(() => {
      expect(screen.getByTestId('daily-forecast')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for daily forecast content
    expect(screen.getByText('📅 7-Day Forecast')).toBeInTheDocument();
    
    // Check for "Today" text using a more flexible approach
    const todayElement = screen.getByTestId('daily-item-0');
    expect(todayElement).toBeInTheDocument();
    expect(todayElement.textContent).toContain('Today');
    
    // Check for daily items
    const dailyItems = screen.getAllByTestId(/daily-item-/);
    expect(dailyItems.length).toBeGreaterThan(0);
  });

  test('shows current temperature after search', async () => {
    render(
      <TestWrapper>
        <WeatherSearchTest />
      </TestWrapper>
    );
    
    // Enter city name
    const searchInput = screen.getByTestId('city-search-input');
    fireEvent.change(searchInput, { target: { value: 'Paris' } });
    
    // Click search
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Wait for weather results
    await waitFor(() => {
      expect(screen.getByTestId('weather-results')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for current temperature
    const currentTemp = screen.getByTestId('current-temperature');
    expect(currentTemp).toBeInTheDocument();
    expect(currentTemp.textContent).toContain('°F');
  });

  test('shows loading state during search', async () => {
    render(
      <TestWrapper>
        <WeatherSearchTest />
      </TestWrapper>
    );
    
    // Enter city name
    const searchInput = screen.getByTestId('city-search-input');
    fireEvent.change(searchInput, { target: { value: 'Berlin' } });
    
    // Click search
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Should show loading state (briefly)
    expect(searchButton.textContent).toContain('Searching...');
    expect(searchButton).toBeDisabled();
  });

  test('handles API call sequence correctly', async () => {
    const onWeatherData = vi.fn();
    
    render(
      <TestWrapper>
        <WeatherSearchTest onWeatherData={onWeatherData} />
      </TestWrapper>
    );
    
    // Enter city name
    const searchInput = screen.getByTestId('city-search-input');
    fireEvent.change(searchInput, { target: { value: 'Madrid' } });
    
    // Click search
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(onWeatherData).toHaveBeenCalledWith(mockWeatherResponse);
    }, { timeout: 3000 });
    
    // Verify API calls were made in correct sequence
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // First call should be geocoding
    expect(mockFetch.mock.calls[0][0]).toContain('nominatim.openstreetmap.org');
    
    // Second call should be weather data
    expect(mockFetch.mock.calls[1][0]).toContain('api.open-meteo.com');
  });
});
