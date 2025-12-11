/**
 * Theme Configuration System for Weather App
 * Provides comprehensive color schemes for light and dark modes
 */

export interface ThemeColors {
  // Primary gradients
  primaryGradient: string;
  secondaryGradient: string;

  // Background colors
  appBackground: string;
  cardBackground: string;
  cardBorder: string;

  // Text colors
  primaryText: string;
  secondaryText: string;
  inverseText: string;

  // Interactive elements
  buttonGradient: string;
  buttonGradientHover: string;
  buttonGradientDisabled: string;

  // Weather card specific
  weatherCardBackground: string;
  weatherCardBorder: string;
  weatherCardBadge: string;

  // Error states
  errorBackground: string;
  errorText: string;
  errorBorder: string;

  // Forecast elements
  forecastCardBackground: string;
  forecastCardBorder: string;

  // Loading and disabled states
  loadingBackground: string;
  disabledText: string;

  // Shadows and effects
  cardShadow: string;
  buttonShadow: string;

  // Theme toggle button
  toggleBackground: string;
  toggleBorder: string;
  toggleIcon: string;
}

export const lightTheme: ThemeColors = {
  // Primary gradients - Purple to blue
  primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondaryGradient: 'linear-gradient(135deg, #667eea, #764ba2)',

  // Background colors
  appBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBackground: 'rgba(255, 255, 255, 0.95)',
  cardBorder: 'rgba(255, 255, 255, 0.2)',

  // Text colors
  primaryText: '#1f2937', // Dark gray-blue
  secondaryText: '#6b7280', // Medium gray
  inverseText: '#ffffff', // White for buttons/badges

  // Interactive elements
  buttonGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  buttonGradientHover: 'linear-gradient(135deg, #5b6fd8, #6a4190)',
  buttonGradientDisabled: 'linear-gradient(135deg, #a0a0a0, #808080)',

  // Weather card specific
  weatherCardBackground: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
  weatherCardBorder: '#0ea5e9',
  weatherCardBadge: 'linear-gradient(135deg, #0ea5e9, #0284c7)',

  // Error states
  errorBackground: 'linear-gradient(135deg, #fee2e2, #fecaca)',
  errorText: '#dc2626',
  errorBorder: '#fca5a5',

  // Forecast elements
  forecastCardBackground: 'rgba(255, 255, 255, 0.9)',
  forecastCardBorder: 'rgba(14, 165, 233, 0.2)',

  // Loading and disabled states
  loadingBackground: 'linear-gradient(135deg, #a0a0a0, #808080)',
  disabledText: '#9ca3af',

  // Shadows and effects
  cardShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
  buttonShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',

  // Theme toggle button
  toggleBackground: 'rgba(255, 255, 255, 0.2)',
  toggleBorder: 'rgba(255, 255, 255, 0.3)',
  toggleIcon: '#ffffff',
};

export const darkTheme: ThemeColors = {
  // Primary gradients - Dark purple to blue
  primaryGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  secondaryGradient: 'linear-gradient(135deg, #1e1b4b, #312e81)',

  // Background colors
  appBackground: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  cardBackground: 'rgba(30, 27, 75, 0.95)',
  cardBorder: 'rgba(139, 92, 246, 0.3)',

  // Text colors
  primaryText: '#f8fafc', // Light gray
  secondaryText: '#cbd5e1', // Medium light gray
  inverseText: '#ffffff', // White for buttons/badges

  // Interactive elements
  buttonGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  buttonGradientHover: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  buttonGradientDisabled: 'linear-gradient(135deg, #4b5563, #374151)',

  // Weather card specific
  weatherCardBackground: 'linear-gradient(135deg, #1e293b, #334155)',
  weatherCardBorder: '#8b5cf6',
  weatherCardBadge: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',

  // Error states
  errorBackground: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
  errorText: '#fca5a5',
  errorBorder: '#dc2626',

  // Forecast elements
  forecastCardBackground: 'rgba(30, 27, 75, 0.8)',
  forecastCardBorder: 'rgba(139, 92, 246, 0.3)',

  // Loading and disabled states
  loadingBackground: 'linear-gradient(135deg, #4b5563, #374151)',
  disabledText: '#6b7280',

  // Shadows and effects
  cardShadow: '0 20px 40px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)',
  buttonShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',

  // Theme toggle button
  toggleBackground: 'rgba(139, 92, 246, 0.2)',
  toggleBorder: 'rgba(139, 92, 246, 0.4)',
  toggleIcon: '#cbd5e1',
};

export const horrorTheme: ThemeColors = {
  // Primary gradients - Dark, eerie Crystal Lake atmosphere
  primaryGradient:
    'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0d0d0d 100%)',
  secondaryGradient: 'linear-gradient(135deg, #1a3a1a, #0a1a0a)',

  // Background colors - Dark forest/Crystal Lake
  appBackground:
    'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0d0d0d 100%)',
  cardBackground: 'rgba(10, 26, 10, 0.95)',
  cardBorder: 'rgba(139, 0, 0, 0.3)',

  // Text colors - Eerie but readable
  primaryText: '#e8f5e9', // Light green tint
  secondaryText: '#a5d6a7', // Medium green
  inverseText: '#ffffff', // White for contrast

  // Interactive elements - Blood red accents
  buttonGradient: 'linear-gradient(135deg, #8b0000 0%, #5a0000 100%)',
  buttonGradientHover: 'linear-gradient(135deg, #a00000, #6a0000)',
  buttonGradientDisabled: 'linear-gradient(135deg, #3a3a3a, #2a2a2a)',

  // Weather card specific - Dark with red accents
  weatherCardBackground: 'linear-gradient(135deg, #1a2a1a, #0f1f0f)',
  weatherCardBorder: '#8b0000',
  weatherCardBadge: 'linear-gradient(135deg, #8b0000, #5a0000)',

  // Error states - Blood red
  errorBackground: 'linear-gradient(135deg, #5a0000, #3a0000)',
  errorText: '#ff6b6b',
  errorBorder: '#8b0000',

  // Forecast elements - Dark with subtle red
  forecastCardBackground: 'rgba(10, 26, 10, 0.9)',
  forecastCardBorder: 'rgba(139, 0, 0, 0.3)',

  // Loading and disabled states
  loadingBackground: 'linear-gradient(135deg, #3a3a3a, #2a2a2a)',
  disabledText: '#6b7280',

  // Shadows and effects - Darker, more dramatic
  cardShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(139, 0, 0, 0.3)',
  buttonShadow: '0 10px 30px rgba(139, 0, 0, 0.5)',

  // Theme toggle button
  toggleBackground: 'rgba(139, 0, 0, 0.2)',
  toggleBorder: 'rgba(139, 0, 0, 0.4)',
  toggleIcon: '#a5d6a7',
};

export type ThemeName = 'light' | 'dark' | 'horror';

/**
 * themes - Core themeConfig functionality
 */
/**
 * themes - Core themeConfig functionality
 */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  horror: horrorTheme,
} as const;
