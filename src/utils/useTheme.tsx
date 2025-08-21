import { useContext } from 'react';
import { ThemeContext } from './themeContext';

/**
 * useTheme - Custom hook to access theme context
 * @returns Theme context value including theme, themeName, toggleTheme, isDark, isHorror
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
