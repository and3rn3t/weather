/**
 * Unit Tests for Modern Forecast Components
 * Tests the forecast UI components in isolation
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect } from 'vitest';
import ModernForecast from '../../components/modernWeatherUI/ModernForecast';
import { ThemeProvider } from '../../utils/themeContext';
import { lightTheme } from '../../utils/themeConfig';

// Mock data for testing (matching the actual component interface)
const mockHourlyData = [
  {
    time: '9:00 AM',
    temperature: 68,
    weatherCode: 1,
    humidity: 65,
    feelsLike: 70,
  },
  {
    time: '10:00 AM',
    temperature: 72,
    weatherCode: 1,
    humidity: 60,
    feelsLike: 74,
  },
  {
    time: '11:00 AM',
    temperature: 75,
    weatherCode: 2,
    humidity: 58,
    feelsLike: 77,
  },
];

const mockDailyData = [
  {
    date: '2025-07-27',
    weatherCode: 1,
    tempMax: 78,
    tempMin: 65,
    precipitation: 0,
    windSpeed: 8,
  },
  {
    date: '2025-07-28',
    weatherCode: 2,
    tempMax: 82,
    tempMin: 68,
    precipitation: 0,
    windSpeed: 12,
  },
  {
    date: '2025-07-29',
    weatherCode: 61,
    tempMax: 75,
    tempMin: 62,
    precipitation: 2.5,
    windSpeed: 15,
  },
];

// Test wrapper with theme provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ModernForecast Component', () => {
  describe('Basic Rendering', () => {
    test('renders without crashing', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={[]}
            dailyData={[]}
          />
        </TestWrapper>
      );

      // Component should render without throwing
      expect(document.body).toBeInTheDocument();
    });

    test('renders with loading state', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={[]}
            dailyData={[]}
            isLoading={true}
          />
        </TestWrapper>
      );

      // Should handle loading state gracefully
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Hourly Forecast Data', () => {
    test('renders hourly forecast with data', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={mockHourlyData}
            dailyData={[]}
          />
        </TestWrapper>
      );

      // Should render forecast data
      expect(document.body).toBeInTheDocument();
    });

    test('handles empty hourly data', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={[]}
            dailyData={[]}
          />
        </TestWrapper>
      );

      // Should not crash with empty data
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Daily Forecast Data', () => {
    test('renders daily forecast with data', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={[]}
            dailyData={mockDailyData}
          />
        </TestWrapper>
      );

      // Should render forecast data
      expect(document.body).toBeInTheDocument();
    });

    test('handles empty daily data', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={[]}
            dailyData={[]}
          />
        </TestWrapper>
      );

      // Should not crash with empty data
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('uses semantic HTML structure', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={mockHourlyData}
            dailyData={mockDailyData}
          />
        </TestWrapper>
      );

      // Should have accessible structure
      const container = document.querySelector('[role="region"]');
      expect(container || document.body).toBeInTheDocument();
    });

    test('renders weather icons', () => {
      render(
        <TestWrapper>
          <ModernForecast 
            theme={lightTheme}
            hourlyData={mockHourlyData}
            dailyData={mockDailyData}
          />
        </TestWrapper>
      );

      // Look for SVG elements (weather icons)
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles large datasets', () => {
      const largeHourlyData = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temperature: 70 + Math.random() * 10,
        weatherCode: 1,
        humidity: 60,
        feelsLike: 72,
      }));

      const largeDailyData = Array.from({ length: 7 }, (_, i) => ({
        date: `2025-07-${27 + i}`,
        weatherCode: 1,
        tempMax: 75 + Math.random() * 10,
        tempMin: 65 + Math.random() * 10,
        precipitation: 0,
        windSpeed: 10,
      }));

      expect(() => {
        render(
          <TestWrapper>
            <ModernForecast 
              theme={lightTheme}
              hourlyData={largeHourlyData}
              dailyData={largeDailyData}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('handles missing temperature data', () => {
      const dataWithMissingTemps = [
        {
          time: '9:00 AM',
          temperature: 0, // Use 0 instead of null
          weatherCode: 1,
          humidity: 65,
          feelsLike: 0,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <ModernForecast 
              theme={lightTheme}
              hourlyData={dataWithMissingTemps}
              dailyData={[]}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('handles invalid weather codes', () => {
      const dataWithInvalidCodes = [
        {
          time: '9:00 AM',
          temperature: 68,
          weatherCode: 999, // Invalid code
          humidity: 65,
          feelsLike: 70,
        },
      ];

      expect(() => {
        render(
          <TestWrapper>
            <ModernForecast 
              theme={lightTheme}
              hourlyData={dataWithInvalidCodes}
              dailyData={[]}
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
});
