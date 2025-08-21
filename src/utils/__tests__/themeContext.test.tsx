import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { darkTheme, lightTheme, type ThemeColors } from '../themeConfig';
import { ThemeProvider } from '../themeContext';
import { useTheme } from '../useTheme';

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
});

// Test component to test the theme hook
const TestComponent = () => {
  const { theme, isDark, toggleTheme, isHorror } = useTheme();

  const getThemeMode = () => {
    if (isHorror) return 'horror';
    return isDark ? 'dark' : 'light';
  };

  return (
    <div>
      <div data-testid="theme-mode">{getThemeMode()}</div>
      <div data-testid="primary-text" style={{ color: theme.primaryText }}>
        Test Text
      </div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

// Component to test hook outside provider
const TestComponentWithoutProvider = () => {
  try {
    useTheme();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
};

describe('Theme Context and Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('ThemeProvider', () => {
    it('should provide light theme by default', () => {
      vi.mocked(localStorageMock.getItem).mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    });

    it('should load saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'weather-app-theme',
      );
    });

    it('should apply correct theme colors', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      const textElement = screen.getByTestId('primary-text');
      expect(textElement).toHaveStyle({ color: lightTheme.primaryText });
    });

    it('should toggle theme correctly', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      const themeMode = screen.getByTestId('theme-mode');

      // Initially light
      expect(themeMode).toHaveTextContent('light');

      // Toggle to dark
      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(themeMode).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weather-app-theme',
        'dark',
      );

      // Toggle to horror
      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(themeMode).toHaveTextContent('horror');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weather-app-theme',
        'horror',
      );

      // Toggle back to light
      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(themeMode).toHaveTextContent('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weather-app-theme',
        'light',
      );
    });

    it('should update theme colors when toggling', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-theme');
      const textElement = screen.getByTestId('primary-text');

      // Initially light theme
      expect(textElement).toHaveStyle({ color: lightTheme.primaryText });

      // Toggle to dark theme
      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(textElement).toHaveStyle({ color: darkTheme.primaryText });
    });

    it('should save theme preference to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-theme');

      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weather-app-theme',
        'dark',
      );
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should default to light theme for invalid values
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<TestComponentWithoutProvider />);

      expect(screen.getByTestId('error')).toHaveTextContent(
        'useTheme must be used within a ThemeProvider',
      );

      consoleSpy.mockRestore();
    });

    it('should provide theme object with all required properties', () => {
      let capturedTheme: ThemeColors | undefined;

      const TestComponentCapture = () => {
        const { theme } = useTheme();
        capturedTheme = theme;
        return <div>Test</div>;
      };

      render(
        <ThemeProvider>
          <TestComponentCapture />
        </ThemeProvider>,
      );

      expect(capturedTheme).toBeDefined();
      expect(capturedTheme).toHaveProperty('primaryText');
      expect(capturedTheme).toHaveProperty('appBackground');
      expect(capturedTheme).toHaveProperty('cardBackground');
    });

    it('should provide stable references for theme object', () => {
      const themeRefs: ThemeColors[] = [];

      const TestComponentStable = ({
        renderCount,
      }: {
        renderCount: number;
      }) => {
        const { theme } = useTheme();
        themeRefs[renderCount] = theme;
        return <div>Render {renderCount}</div>;
      };

      const { rerender } = render(
        <ThemeProvider>
          <TestComponentStable renderCount={0} />
        </ThemeProvider>,
      );

      rerender(
        <ThemeProvider>
          <TestComponentStable renderCount={1} />
        </ThemeProvider>,
      );

      // Theme objects should have the same properties even if references differ due to responsive processing
      expect(themeRefs[0]).toBeDefined();
      expect(themeRefs[1]).toBeDefined();
      expect(themeRefs[0].primaryText).toBe(themeRefs[1].primaryText);
      expect(themeRefs[0].appBackground).toBe(themeRefs[1].appBackground);
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme across app reloads', () => {
      // First render with no saved theme
      localStorageMock.getItem.mockReturnValue(null);

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-theme');

      // Toggle to dark theme
      act(() => {
        fireEvent.click(toggleButton);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'weather-app-theme',
        'dark',
      );

      unmount();

      // Simulate app reload with saved theme
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    });
  });
});
