import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { logInfo } from './logger';
import type { ThemeColors, ThemeName } from './themeConfig';
import { themes } from './themeConfig';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export the context for use in custom hook
export { ThemeContext };

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider - Theme management functionality for weather app
 */
/**
 * ThemeProvider - Theme management functionality for weather app
 */
export const ThemeProvider = ({
  children,
}: ThemeProviderProps): JSX.Element => {
  // Initialize theme from localStorage or default to light
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('weather-app-theme') as ThemeName;
      // Accept only light/dark; map any other to 'dark' for simplicity
      const valid =
        savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
      return valid;
    }
    return 'light';
  });

  const theme = themes[themeName];
  const isDark = themeName === 'dark';

  const toggleTheme = useCallback(() => {
    logInfo('🎨 Theme toggle triggered');
    const newTheme: ThemeName = themeName === 'light' ? 'dark' : 'light';
    setThemeName(newTheme);
    localStorage.setItem('weather-app-theme', newTheme);
  }, [themeName]);

  // Apply theme to document body for global effects
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // NUCLEAR FIX: Completely disable automatic background changes
      // Let the nuclear system in index.html handle all background changes
      logInfo(
        '🚫 React theme context disabled - nuclear system handling background'
      );

      // Remove all theme classes first, then apply only light/dark class
      document.body.classList.remove('dark-theme');
      if (themeName === 'dark') {
        document.body.classList.add('dark-theme');
      }

      // Store theme info for nuclear system but don't apply background
      document.body.setAttribute('data-theme', themeName);
      document.body.setAttribute('data-theme-bg', theme.appBackground);

      // Ensure any legacy overlay classes are cleared
      document.body.classList.remove('film-grain-overlay');

      // Expose theme colors as CSS variables for class-based styling
      const root = document.documentElement;
      root.style.setProperty('--primary-text', theme.primaryText);
      root.style.setProperty('--secondary-text', theme.secondaryText);
      root.style.setProperty('--card-bg', theme.cardBackground);
      root.style.setProperty('--weather-card-bg', theme.weatherCardBackground);
      root.style.setProperty('--weather-card-border', theme.weatherCardBorder);
      root.style.setProperty('--card-border', theme.cardBorder);
      root.style.setProperty('--app-bg', theme.appBackground);
    }
  }, [
    themeName,
    theme.appBackground,
    theme.primaryText,
    theme.secondaryText,
    theme.cardBackground,
    theme.cardBorder,
    theme.weatherCardBackground,
    theme.weatherCardBorder,
  ]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeName,
      toggleTheme,
      isDark,
    }),
    [theme, themeName, toggleTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
