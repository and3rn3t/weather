import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../themeContext';
import { useTheme } from '../useTheme';
import { lightTheme, type ThemeColors } from '../themeConfig';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to test the theme hook
const TestComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div>
      <div data-testid="theme-mode">{isDark ? 'dark' : 'light'}</div>
      <div data-testid="primary-text" style={{ color: theme.primaryText }}>
        Test Text
      </div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('Theme Context and Hook - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  test('provides light theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    const primaryTextElement = screen.getByTestId('primary-text');
    expect(primaryTextElement).toHaveStyle({ color: lightTheme.primaryText });
  });

  test('can toggle between light and dark themes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Start with light theme
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');

    // Toggle to dark theme
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');

    // Toggle back to light theme
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  test('saves theme preference to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Toggle to dark theme
    fireEvent.click(screen.getByTestId('toggle-theme'));

    // Check that localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'weather-app-theme',
      'dark'
    );
  });

  test('loads theme preference from localStorage', () => {
    // Set up localStorage to return 'dark'
    vi.mocked(localStorageMock.getItem).mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should start with dark theme
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  test('theme provides all necessary properties', () => {
    let capturedTheme: ThemeColors | null = null;

    const ThemeCapture = () => {
      const { theme } = useTheme();
      capturedTheme = theme;
      return null;
    };

    render(
      <ThemeProvider>
        <ThemeCapture />
      </ThemeProvider>
    );

    // Check that theme has key properties
    expect(capturedTheme).toHaveProperty('primaryText');
    expect(capturedTheme).toHaveProperty('cardBackground');
    expect(capturedTheme).toHaveProperty('buttonGradient');
    expect(capturedTheme).toHaveProperty('weatherCardBackground');
  });
});
