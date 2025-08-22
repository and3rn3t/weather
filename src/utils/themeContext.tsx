import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadThemeCSS } from './cssOptimization';
import { logInfo } from './logger';
import type { ThemeColors, ThemeName } from './themeConfig';
import { themes } from './themeConfig';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  toggleTheme: () => void;
  isDark: boolean;
  isHorror: boolean;
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
      // Validate the saved theme and fallback to 'light' if invalid
      return savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'horror'
        ? savedTheme
        : 'light';
    }
    return 'light';
  });

  const theme = themes[themeName];
  const isDark = themeName === 'dark';
  const isHorror = themeName === 'horror';

  const toggleTheme = useCallback(() => {
    logInfo('🎨 Theme toggle triggered - legitimate theme change');
    let newTheme: ThemeName;

    // Cycle through: light -> dark -> horror -> light
    switch (themeName) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'horror';
        break;
      case 'horror':
        newTheme = 'light';
        break;
      default:
        newTheme = 'light';
    }

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

      // Remove all theme classes first
      document.body.classList.remove('dark-theme', 'horror-theme');

      // Apply appropriate theme class
      if (themeName === 'dark') {
        document.body.classList.add('dark-theme');
      } else if (themeName === 'horror') {
        document.body.classList.add('horror-theme');
        // Load horror theme CSS dynamically
        loadThemeCSS('horror').catch(error => {
          // eslint-disable-next-line no-console
          console.error('Failed to load horror theme CSS:', error);
        });
      }

      // Store theme info for nuclear system but don't apply background
      document.body.setAttribute('data-theme', themeName);
      document.body.setAttribute('data-theme-bg', theme.appBackground);
    }
  }, [theme.appBackground, themeName]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeName,
      toggleTheme,
      isDark,
      isHorror,
    }),
    [theme, themeName, toggleTheme, isDark, isHorror]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
