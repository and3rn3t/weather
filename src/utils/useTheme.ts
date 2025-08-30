import { useContext } from 'react';
import { createResponsiveTheme } from './responsiveUtils';
import { ThemeContext } from './themeContext';
import { useBreakpoint, useMobilePerformance } from './useMobileOptimization';

/**
 * useTheme - Custom React hook for useTheme functionality
 */
/**
 * useTheme - Custom React hook for useTheme functionality
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const breakpointInfo = useBreakpoint();
  const performanceSettings = useMobilePerformance();

  // Create responsive theme with mobile optimizations
  const responsiveTheme = createResponsiveTheme(context.theme);

  return {
    ...context,
    theme: responsiveTheme,
    // Add responsive information
    ...breakpointInfo,
    // Add performance settings
    performance: performanceSettings,
    // Helper functions for responsive styling
    createResponsiveStyle: (
      property: string,
      values: {
        mobile: string;
        tablet?: string;
        desktop?: string;
      }
    ) => responsiveTheme.responsive.createResponsiveProperty(property, values),

    // Mobile-optimized component creators
    createMobileButton: (
      isPrimary = true,
      size: 'small' | 'medium' | 'large' = 'medium'
    ) => responsiveTheme.responsive.createMobileButton(isPrimary, size),

    createMobileCard: (isWeatherCard = false) =>
      responsiveTheme.responsive.createMobileCard(isWeatherCard),

    createMobileGrid: (columns: {
      mobile: number;
      tablet?: number;
      desktop?: number;
    }) => responsiveTheme.createGrid(columns),

    // Accessibility controls
    accessibilityMode: context.accessibilityMode,
    setAccessibilityMode: context.setAccessibilityMode,

    // Density controls
    compactMode: context.compactMode,
    setCompactMode: context.setCompactMode,
    compactDesktopOnly: context.compactDesktopOnly,
    setCompactDesktopOnly: context.setCompactDesktopOnly,

    // Temperature colorization preference
    colorizeTemps: context.colorizeTemps,
    setColorizeTemps: context.setColorizeTemps,

    // Temperature color profile
    tempColorProfile: context.tempColorProfile,
    setTempColorProfile: context.setTempColorProfile,
    tempThresholdsEnabled: context.tempThresholdsEnabled,
    tempThresholds: context.tempThresholds,
    setTempThresholdsEnabled: context.setTempThresholdsEnabled,
    setTempThresholds: context.setTempThresholds,
  };
};
