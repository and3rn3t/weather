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

type AccessibilityMode = 'default' | 'high-contrast' | 'reduced-transparency';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  toggleTheme: () => void;
  isDark: boolean;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  /** When true, compact density applies only on desktop (CSS scoped via data-density-scope) */
  compactDesktopOnly: boolean;
  setCompactDesktopOnly: (enabled: boolean) => void;
  /** When true, apply semantic colors to temperatures and precipitation */
  colorizeTemps: boolean;
  setColorizeTemps: (enabled: boolean) => void;
  /** Profile tuning for warm/cold thresholds */
  tempColorProfile: 'standard' | 'hot' | 'cold';
  setTempColorProfile: (profile: 'standard' | 'hot' | 'cold') => void;
  /** Optional custom thresholds override profiles */
  tempThresholdsEnabled: boolean;
  tempThresholds: {
    imperial: { warm: number; cold: number };
    metric: { warm: number; cold: number };
  };
  setTempThresholdsEnabled: (enabled: boolean) => void;
  setTempThresholds: (t: {
    imperial: { warm: number; cold: number };
    metric: { warm: number; cold: number };
  }) => void;
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
      // Accept light/dark/horror; map any other to 'dark' for simplicity
      const valid =
        savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'horror'
          ? savedTheme
          : 'dark';
      return valid;
    }
    return 'light';
  });

  const theme = themes[themeName];
  const isDark = themeName === 'dark';

  // Accessibility Mode: affects CSS via data-accessibility attribute
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>(
    () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('weather-accessibility-mode');
        if (
          saved === 'default' ||
          saved === 'high-contrast' ||
          saved === 'reduced-transparency'
        ) {
          return saved;
        }
      }
      return 'default';
    }
  );

  // Compact density mode (denser paddings/gaps)
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weather-compact-mode');
      if (saved === 'true' || saved === 'false') {
        return saved === 'true';
      }
    }
    return false;
  });

  // Scope for compact density: when true, apply only on desktop via CSS
  const [compactDesktopOnly, setCompactDesktopOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weather-compact-desktop-only');
      if (saved === 'true' || saved === 'false') {
        return saved === 'true';
      }
    }
    return false;
  });

  // Colorize temperatures (defaults to true to preserve current visuals)
  const [colorizeTemps, setColorizeTemps] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weather-colorize-temps');
      if (saved === 'true' || saved === 'false') {
        return saved === 'true';
      }
    }
    return true;
  });

  // Temperature color profile tuning
  const [tempColorProfile, setTempColorProfile] = useState<
    'standard' | 'hot' | 'cold'
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weather-temp-color-profile');
      if (saved === 'standard' || saved === 'hot' || saved === 'cold') {
        return saved;
      }
    }
    return 'standard';
  });

  // Custom temperature thresholds (override profile when enabled)
  const [tempThresholdsEnabled, setTempThresholdsEnabled] = useState<boolean>(
    () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('weather-temp-thresholds-enabled');
        if (saved === 'true' || saved === 'false') return saved === 'true';
      }
      return false;
    }
  );

  const [tempThresholds, setTempThresholds] = useState<{
    imperial: { warm: number; cold: number };
    metric: { warm: number; cold: number };
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('weather-temp-thresholds');
        if (saved) {
          const parsed = JSON.parse(saved) as {
            imperial: { warm: number; cold: number };
            metric: { warm: number; cold: number };
          };
          if (
            parsed &&
            parsed.imperial &&
            parsed.metric &&
            Number.isFinite(parsed.imperial.warm) &&
            Number.isFinite(parsed.imperial.cold) &&
            Number.isFinite(parsed.metric.warm) &&
            Number.isFinite(parsed.metric.cold)
          ) {
            return parsed;
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }
    // Defaults aligned to 'standard' profile
    return {
      imperial: { warm: 75, cold: 40 },
      metric: { warm: 24, cold: 5 },
    };
  });

  const toggleTheme = useCallback(() => {
    logInfo('🎨 Theme toggle triggered');
    // Cycle through: light -> dark -> horror -> light
    const themeCycle: ThemeName[] = ['light', 'dark', 'horror'];
    const currentIndex = themeCycle.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    const newTheme = themeCycle[nextIndex];
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

      // Remove all theme classes first, then apply appropriate class
      document.body.classList.remove('dark-theme', 'horror-theme');
      if (themeName === 'dark') {
        document.body.classList.add('dark-theme');
      } else if (themeName === 'horror') {
        document.body.classList.add('horror-theme');
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

      // Apply accessibility mode via attribute on <html>
      if (accessibilityMode === 'default') {
        root.removeAttribute('data-accessibility');
      } else {
        root.setAttribute('data-accessibility', accessibilityMode);
      }

      // Apply density attribute for compact mode
      root.setAttribute(
        'data-density',
        compactMode ? 'compact' : 'comfortable'
      );

      // Apply density scope attribute to control CSS behavior
      // Values: 'desktop-only' or 'global'
      root.setAttribute(
        'data-density-scope',
        compactDesktopOnly ? 'desktop-only' : 'global'
      );

      // Apply colorize temperatures attribute for conditional styling
      root.setAttribute('data-colorize-temps', String(colorizeTemps));
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
    accessibilityMode,
    compactMode,
    compactDesktopOnly,
    colorizeTemps,
  ]);

  // Memoize context value to prevent unnecessary re-renders
  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      themeName,
      toggleTheme,
      isDark,
      accessibilityMode,
      setAccessibilityMode: (mode: AccessibilityMode) => {
        setAccessibilityMode(mode);
        try {
          localStorage.setItem('weather-accessibility-mode', mode);
        } catch {
          /* ignore */
        }
      },
      compactMode,
      setCompactMode: (enabled: boolean) => {
        setCompactMode(enabled);
        try {
          localStorage.setItem('weather-compact-mode', String(enabled));
        } catch {
          /* ignore */
        }
      },
      compactDesktopOnly,
      setCompactDesktopOnly: (enabled: boolean) => {
        setCompactDesktopOnly(enabled);
        try {
          localStorage.setItem('weather-compact-desktop-only', String(enabled));
        } catch {
          /* ignore */
        }
      },
      colorizeTemps,
      setColorizeTemps: (enabled: boolean) => {
        setColorizeTemps(enabled);
        try {
          localStorage.setItem('weather-colorize-temps', String(enabled));
        } catch {
          /* ignore */
        }
      },
      tempColorProfile,
      setTempColorProfile: (profile: 'standard' | 'hot' | 'cold') => {
        setTempColorProfile(profile);
        try {
          localStorage.setItem('weather-temp-color-profile', profile);
        } catch {
          /* ignore */
        }
      },
      tempThresholdsEnabled,
      tempThresholds,
      setTempThresholdsEnabled: (enabled: boolean) => {
        setTempThresholdsEnabled(enabled);
        try {
          localStorage.setItem(
            'weather-temp-thresholds-enabled',
            String(enabled)
          );
        } catch {
          /* ignore */
        }
      },
      setTempThresholds: (t: {
        imperial: { warm: number; cold: number };
        metric: { warm: number; cold: number };
      }) => {
        setTempThresholds(t);
        try {
          localStorage.setItem('weather-temp-thresholds', JSON.stringify(t));
        } catch {
          /* ignore */
        }
      },
    }),
    [
      theme,
      themeName,
      toggleTheme,
      isDark,
      accessibilityMode,
      compactMode,
      compactDesktopOnly,
      colorizeTemps,
      tempColorProfile,
      tempThresholdsEnabled,
      tempThresholds,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
