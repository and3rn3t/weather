import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to light
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('weather-app-theme') as ThemeName;
      // Validate the saved theme and fallback to 'light' if invalid
      return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
    }
    return 'light';
  });

  const theme = themes[themeName];
  const isDark = themeName === 'dark';

  const toggleTheme = useCallback(() => {
    const newTheme: ThemeName = themeName === 'light' ? 'dark' : 'light';
    setThemeName(newTheme);
    localStorage.setItem('weather-app-theme', newTheme);
  }, [themeName]);

  // Apply theme to document body for global effects
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.transition = 'background 0.6s ease';
      document.body.style.background = theme.appBackground;
    }
  }, [theme.appBackground]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(() => ({
    theme,
    themeName,
    toggleTheme,
    isDark
  }), [theme, themeName, toggleTheme, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
