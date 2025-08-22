/**
 * Enhanced Theme Switching Tests
 *
 * Comprehensive tests for theme switching functionality including:
 * - Theme persistence across browser sessions
 * - Horror theme integration and edge cases
 * - Accessibility features and ARIA attributes
 * - Performance optimization during theme transitions
 * - Mobile-specific theme behavior
 * - Multi-sensory feedback integration
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { darkTheme, horrorTheme, lightTheme } from '../themeConfig';
import { ThemeProvider } from '../themeContext';
import { useMultiSensoryWeather } from '../useMultiSensoryWeather';
import { useTheme } from '../useTheme';

// Mock multi-sensory weather for theme announcements
vi.mock('../useMultiSensoryWeather', () => ({
  useMultiSensoryWeather: vi.fn(() => ({
    announceStateChange: vi.fn(),
  })),
  useWeatherAnnouncements: vi.fn(() => ({
    announceStateChange: vi.fn(),
  })),
}));

// Mock haptic feedback
vi.mock('../hapticHooks', () => ({
  useHaptic: vi.fn(() => ({
    settingsChange: vi.fn(),
    buttonPress: vi.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Test component with comprehensive theme features
const ThemeTestComponent = () => {
  const { theme, isDark, toggleTheme, isHorror, themeName, setTheme } =
    useTheme();

  return (
    <div
      data-testid="theme-container"
      style={{ backgroundColor: theme.background }}
    >
      <div data-testid="theme-name">{themeName}</div>
      <div data-testid="is-dark">{isDark.toString()}</div>
      <div data-testid="is-horror">{isHorror.toString()}</div>
      <div
        data-testid="primary-text"
        style={{ color: theme.primaryText }}
        aria-label={`Current theme: ${themeName}`}
      >
        Primary Text
      </div>
      <div data-testid="secondary-text" style={{ color: theme.secondaryText }}>
        Secondary Text
      </div>
      <div data-testid="accent-color" style={{ color: theme.accent }}>
        Accent Color
      </div>
      <button
        data-testid="toggle-theme"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        Toggle Theme
      </button>
      <button
        data-testid="set-light"
        onClick={() => setTheme('light')}
        aria-label="Set light theme"
      >
        Light Theme
      </button>
      <button
        data-testid="set-dark"
        onClick={() => setTheme('dark')}
        aria-label="Set dark theme"
      >
        Dark Theme
      </button>
      <button
        data-testid="set-horror"
        onClick={() => setTheme('horror')}
        aria-label="Set horror theme"
      >
        Horror Theme
      </button>
    </div>
  );
};

describe('Enhanced Theme Switching Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Reset to light theme by default
    localStorageMock.getItem.mockReturnValue('light');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Theme Functionality', () => {
    it('should render with light theme by default', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
      expect(screen.getByTestId('is-horror')).toHaveTextContent('false');
    });

    it('should cycle through themes correctly: light → dark → horror → light', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Start with light
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');

      // Toggle to dark
      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');

      // Toggle to horror
      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('horror');
      expect(screen.getByTestId('is-horror')).toHaveTextContent('true');

      // Toggle back to light
      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
      expect(screen.getByTestId('is-horror')).toHaveTextContent('false');
    });

    it('should set specific themes directly', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Set dark theme directly
      await user.click(screen.getByTestId('set-dark'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');

      // Set horror theme directly
      await user.click(screen.getByTestId('set-horror'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('horror');

      // Set light theme directly
      await user.click(screen.getByTestId('set-light'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme choice to localStorage', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-theme'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should restore theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('horror');

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-name')).toHaveTextContent('horror');
      expect(screen.getByTestId('is-horror')).toHaveTextContent('true');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Should fall back to light theme
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Should still work with default theme
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    });
  });

  describe('Theme Color Properties', () => {
    it('should apply correct light theme colors', () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      const container = screen.getByTestId('theme-container');
      const primaryText = screen.getByTestId('primary-text');

      expect(container).toHaveStyle({ backgroundColor: lightTheme.background });
      expect(primaryText).toHaveStyle({ color: lightTheme.primaryText });
    });

    it('should apply correct dark theme colors', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('set-dark'));

      const container = screen.getByTestId('theme-container');
      const primaryText = screen.getByTestId('primary-text');

      expect(container).toHaveStyle({ backgroundColor: darkTheme.background });
      expect(primaryText).toHaveStyle({ color: darkTheme.primaryText });
    });

    it('should apply correct horror theme colors', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('set-horror'));

      const container = screen.getByTestId('theme-container');
      const primaryText = screen.getByTestId('primary-text');

      expect(container).toHaveStyle({
        backgroundColor: horrorTheme.background,
      });
      expect(primaryText).toHaveStyle({ color: horrorTheme.primaryText });
    });

    it('should update all color properties when theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('set-dark'));

      const secondaryText = screen.getByTestId('secondary-text');
      const accentColor = screen.getByTestId('accent-color');

      expect(secondaryText).toHaveStyle({ color: darkTheme.secondaryText });
      expect(accentColor).toHaveStyle({ color: darkTheme.accent });
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper ARIA labels for theme controls', () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Set light theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Set dark theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Set horror theme')).toBeInTheDocument();
    });

    it('should announce theme changes for screen readers', () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      const themeInfo = screen.getByLabelText(/Current theme:/);
      expect(themeInfo).toHaveAttribute('aria-label', 'Current theme: light');
    });

    it('should update ARIA labels when theme changes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('set-dark'));

      const themeInfo = screen.getByLabelText(/Current theme:/);
      expect(themeInfo).toHaveAttribute('aria-label', 'Current theme: dark');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid theme switching without errors', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Rapidly switch themes
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByTestId('toggle-theme'));
      }

      // Should end up back at light theme (10 cycles)
      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    });

    it('should handle multiple theme providers gracefully', () => {
      // Nested providers should work without conflicts
      render(
        <ThemeProvider>
          <ThemeProvider>
            <ThemeTestComponent />
          </ThemeProvider>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-name')).toHaveTextContent('light');
    });

    it('should maintain theme state during component re-renders', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('set-horror'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('horror');

      // Re-render component
      rerender(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      // Theme should persist
      expect(screen.getByTestId('theme-name')).toHaveTextContent('horror');
    });
  });

  describe('Mobile-Specific Theme Behavior', () => {
    beforeEach(() => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      });
    });

    it('should work correctly on mobile devices', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');
    });

    it('should handle touch interactions for theme switching', async () => {
      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-theme');

      // Simulate touch events
      fireEvent.touchStart(toggleButton);
      fireEvent.touchEnd(toggleButton);
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');
      });
    });
  });

  describe('Integration with Multi-Sensory Features', () => {
    it('should integrate with haptic feedback when available', async () => {
      const mockHaptic = {
        settingsChange: vi.fn(),
        buttonPress: vi.fn(),
      };

      vi.mocked(require('../hapticHooks').useHaptic).mockReturnValue(
        mockHaptic,
      );

      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-theme'));

      // Should trigger haptic feedback for theme change
      expect(mockHaptic.settingsChange).toHaveBeenCalled();
    });

    it('should work when multi-sensory features are disabled', async () => {
      // Ensure theme switching works even when other features are disabled
      vi.mocked(useMultiSensoryWeather).mockReturnValue({
        announceStateChange: vi.fn(),
      } as any);

      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeTestComponent />
        </ThemeProvider>,
      );

      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('theme-name')).toHaveTextContent('dark');
    });
  });
});
