/**
 * Mobile-First Responsive Design Utilities
 *
 * This module provides a comprehensive set of utilities for mobile optimization,
 * including breakpoints, touch targets, and responsive helpers.
 */

import type { ThemeColors } from './themeConfig';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ButtonSize = 'small' | 'medium' | 'large';
export type GridColumns = { mobile: number; tablet?: number; desktop?: number };

// ============================================================================
// RESPONSIVE BREAKPOINTS (Mobile-First Approach)
// ============================================================================

/**
 * breakpoints - Core responsiveUtils functionality
 */
/**
 * breakpoints - Core responsiveUtils functionality
 */
export const breakpoints = {
  // Mobile devices (default, no media query needed)
  mobile: '320px',

  // Small tablets and large phones
  mobileLarge: '480px',

  // Tablets portrait
  tablet: '768px',

  // Tablets landscape and small laptops
  tabletLarge: '1024px',

  // Desktop and larger screens
  desktop: '1200px',

  // Large desktop screens
  desktopLarge: '1440px',
} as const;

// ============================================================================
// MEDIA QUERY HELPERS
// ============================================================================

/**
 * mediaQueries - Core responsiveUtils functionality
 */
/**
 * mediaQueries - Core responsiveUtils functionality
 */
export const mediaQueries = {
  mobileLarge: `@media (min-width: ${breakpoints.mobileLarge})`,
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  tabletLarge: `@media (min-width: ${breakpoints.tabletLarge})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  desktopLarge: `@media (min-width: ${breakpoints.desktopLarge})`,

  // Orientation queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',

  // High DPI screens
  retina:
    '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

  // Hover capability detection
  hover: '@media (hover: hover)',
  noHover: '@media (hover: none)',

  // Motion preferences
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
  allowMotion: '@media (prefers-reduced-motion: no-preference)',
} as const;

// ============================================================================
// RESPONSIVE SPACING SYSTEM
// ============================================================================

/**
 * spacing - Core responsiveUtils functionality
 */
/**
 * spacing - Core responsiveUtils functionality
 */
export const spacing = {
  // Base spacing values (mobile-first)
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',

  // Responsive padding/margin helpers
  responsive: {
    // Mobile: 16px, Tablet: 24px, Desktop: 32px
    container: {
      mobile: '16px',
      tablet: '24px',
      desktop: '32px',
    },

    // Mobile: 12px, Tablet: 16px, Desktop: 20px
    component: {
      mobile: '12px',
      tablet: '16px',
      desktop: '20px',
    },

    // Mobile: 8px, Tablet: 12px, Desktop: 16px
    element: {
      mobile: '8px',
      tablet: '12px',
      desktop: '16px',
    },
  },
} as const;

// ============================================================================
// TOUCH TARGET STANDARDS
// ============================================================================

/**
 * touchTargets - Core responsiveUtils functionality
 */
/**
 * touchTargets - Core responsiveUtils functionality
 */
export const touchTargets = {
  // Minimum touch target sizes (following Apple and Material Design guidelines)
  minimum: '44px',
  recommended: '48px',
  comfortable: '56px',
  large: '64px',

  // Touch target padding
  padding: {
    small: '8px 12px',
    medium: '12px 16px',
    large: '16px 24px',
    extraLarge: '20px 32px',
  },

  // Touch-friendly border radius
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    extraLarge: '24px',
  },
} as const;

// ============================================================================
// RESPONSIVE TYPOGRAPHY SCALE
// ============================================================================

/**
 * typography - Core responsiveUtils functionality
 */
/**
 * typography - Core responsiveUtils functionality
 */
export const typography = {
  fontSize: {
    // Mobile-first font sizes
    xs: {
      mobile: '12px',
      tablet: '13px',
      desktop: '14px',
    },
    sm: {
      mobile: '14px',
      tablet: '15px',
      desktop: '16px',
    },
    base: {
      mobile: '16px',
      tablet: '17px',
      desktop: '18px',
    },
    lg: {
      mobile: '18px',
      tablet: '20px',
      desktop: '22px',
    },
    xl: {
      mobile: '20px',
      tablet: '24px',
      desktop: '28px',
    },
    '2xl': {
      mobile: '24px',
      tablet: '30px',
      desktop: '36px',
    },
    '3xl': {
      mobile: '30px',
      tablet: '36px',
      desktop: '48px',
    },
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// ============================================================================
// MOBILE-OPTIMIZED COMPONENT STYLES
// ============================================================================

/**
 * mobileStyles - Core responsiveUtils functionality
 */
/**
 * mobileStyles - Core responsiveUtils functionality
 */
export const mobileStyles = {
  // Container with responsive padding
  container: (maxWidth = '600px') => ({
    width: '100%',
    maxWidth,
    margin: '0 auto',
    padding: `0 ${spacing.responsive.container.mobile}`,

    [mediaQueries.tablet]: {
      padding: `0 ${spacing.responsive.container.tablet}`,
    },

    [mediaQueries.desktop]: {
      padding: `0 ${spacing.responsive.container.desktop}`,
    },
  }),

  // Touch-friendly button
  touchButton: (size: ButtonSize = 'medium') => {
    const sizeMap = {
      small: {
        minHeight: touchTargets.minimum,
        padding: touchTargets.padding.small,
        fontSize: typography.fontSize.sm.mobile,
        borderRadius: touchTargets.borderRadius.small,
      },
      medium: {
        minHeight: touchTargets.recommended,
        padding: touchTargets.padding.medium,
        fontSize: typography.fontSize.base.mobile,
        borderRadius: touchTargets.borderRadius.medium,
      },
      large: {
        minHeight: touchTargets.comfortable,
        padding: touchTargets.padding.large,
        fontSize: typography.fontSize.lg.mobile,
        borderRadius: touchTargets.borderRadius.large,
      },
    };

    return {
      ...sizeMap[size],
      cursor: 'pointer',
      userSelect: 'none' as const,
      WebkitTapHighlightColor: 'transparent',
      tapHighlightColor: 'transparent',
      touchAction: 'manipulation', // Critical for mobile touch
      pointerEvents: 'auto' as const, // Ensure pointer events work
      position: 'relative' as const,
      display: 'inline-block',
      textAlign: 'center' as const,
      textDecoration: 'none',
      border: 'none',
      outline: 'none',
      transition: 'all 0.2s ease',
      zIndex: 1, // Ensure button is above other elements

      // Enhanced touch feedback
      ':active': {
        transform: 'scale(0.98)',
        opacity: '0.8',
      },

      // Focus for accessibility
      ':focus': {
        outline: '2px solid #667eea',
        outlineOffset: '2px',
      },

      [mediaQueries.tablet]: {
        fontSize: typography.fontSize.base.tablet,
      },

      [mediaQueries.desktop]: {
        fontSize: typography.fontSize.base.desktop,

        // Hover effects only on devices that support it
        [mediaQueries.hover]: {
          ':hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    };
  },

  // Responsive card layout
  card: (theme?: ThemeColors) => ({
    backgroundColor: theme?.cardBackground || 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: touchTargets.borderRadius.large,
    padding: spacing.responsive.component.mobile,
    border: `1px solid ${theme?.cardBorder || 'rgba(255, 255, 255, 0.2)'}`,
    boxShadow: theme?.cardShadow || '0 8px 32px rgba(0, 0, 0, 0.12)',
    transition: 'all 0.3s ease',

    [mediaQueries.tablet]: {
      padding: spacing.responsive.component.tablet,
      borderRadius: touchTargets.borderRadius.extraLarge,
    },

    [mediaQueries.desktop]: {
      padding: spacing.responsive.component.desktop,
    },
  }),

  // Responsive grid system
  grid: (columns: { mobile: number; tablet?: number; desktop?: number }) => ({
    display: 'grid',
    gap: spacing.responsive.element.mobile,
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,

    [mediaQueries.tablet]: {
      gap: spacing.responsive.element.tablet,
      gridTemplateColumns: `repeat(${columns.tablet || columns.mobile}, 1fr)`,
    },

    [mediaQueries.desktop]: {
      gap: spacing.responsive.element.desktop,
      gridTemplateColumns: `repeat(${columns.desktop || columns.tablet || columns.mobile}, 1fr)`,
    },
  }),

  // Responsive text
  responsiveText: (size: keyof typeof typography.fontSize) => ({
    fontSize: typography.fontSize[size].mobile,
    lineHeight: typography.lineHeight.normal,

    [mediaQueries.tablet]: {
      fontSize: typography.fontSize[size].tablet,
    },

    [mediaQueries.desktop]: {
      fontSize: typography.fontSize[size].desktop,
    },
  }),

  // Scroll container with touch optimization
  scrollContainer: {
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin' as const,
    paddingBottom: spacing.sm,

    // Custom scrollbar for webkit browsers
    '::-webkit-scrollbar': {
      height: '6px',
    },

    '::-webkit-scrollbar-track': {
      background: 'rgba(14, 165, 233, 0.1)',
      borderRadius: '3px',
    },

    '::-webkit-scrollbar-thumb': {
      background: 'rgba(14, 165, 233, 0.3)',
      borderRadius: '3px',
    },

    '::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(14, 165, 233, 0.5)',
    },
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate responsive CSS for a property across breakpoints
 */
/**
 * createResponsiveProperty - Creates and configures responsiveproperty
 */
/**
 * createResponsiveProperty - Creates and configures responsiveproperty
 */
export const createResponsiveProperty = (
  property: string,
  values: {
    mobile: string;
    tablet?: string;
    desktop?: string;
  }
) => ({
  [property]: values.mobile,

  ...(values.tablet && {
    [mediaQueries.tablet]: {
      [property]: values.tablet,
    },
  }),

  ...(values.desktop && {
    [mediaQueries.desktop]: {
      [property]: values.desktop,
    },
  }),
});

/**
 * Check if device supports hover (desktop vs mobile)
 */
/**
 * supportsHover - Core responsiveUtils functionality
 */
/**
 * supportsHover - Core responsiveUtils functionality
 */
export const supportsHover = () => {
  // Handle test environment
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(hover: hover)').matches;
};

/**
 * Check if user prefers reduced motion
 */
/**
 * prefersReducedMotion - Core responsiveUtils functionality
 */
/**
 * prefersReducedMotion - Core responsiveUtils functionality
 */
export const prefersReducedMotion = () => {
  // Handle test environment
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get current breakpoint
 */
/**
 * getCurrentBreakpoint - Retrieves currentbreakpoint data
 */
/**
 * getCurrentBreakpoint - Retrieves currentbreakpoint data
 */
export const getCurrentBreakpoint = (): keyof typeof breakpoints => {
  // Handle test environment
  if (typeof window === 'undefined') {
    return 'mobile';
  }

  const width = window.innerWidth;

  if (width >= parseInt(breakpoints.desktopLarge)) return 'desktopLarge';
  if (width >= parseInt(breakpoints.desktop)) return 'desktop';
  if (width >= parseInt(breakpoints.tabletLarge)) return 'tabletLarge';
  if (width >= parseInt(breakpoints.tablet)) return 'tablet';
  if (width >= parseInt(breakpoints.mobileLarge)) return 'mobileLarge';

  return 'mobile';
};

/**
 * Debounced resize handler for responsive updates
 */
/**
 * createResizeHandler - Creates and configures resizehandler
 */
/**
 * createResizeHandler - Creates and configures resizehandler
 */
export const createResizeHandler = (callback: () => void, delay = 150) => {
  let timeoutId: NodeJS.Timeout;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// ============================================================================
// RESPONSIVE THEME INTEGRATION
// ============================================================================

/**
 * Enhance theme with responsive utilities
 */
/**
 * createResponsiveTheme - Creates and configures responsivetheme
 */
/**
 * createResponsiveTheme - Creates and configures responsivetheme
 */
export const createResponsiveTheme = (baseTheme: ThemeColors) => ({
  ...baseTheme,

  // Add responsive utilities to theme
  responsive: {
    breakpoints,
    mediaQueries,
    spacing,
    touchTargets,
    typography,
    mobileStyles,
    createResponsiveProperty,
    createMobileButton: (isPrimary = true, size: ButtonSize = 'medium') => ({
      ...mobileStyles.touchButton(size),
      background: isPrimary
        ? baseTheme.buttonGradient
        : baseTheme.toggleBackground,
      color: baseTheme.inverseText,
      border: isPrimary ? 'none' : `1px solid ${baseTheme.toggleBorder}`,
      minHeight: '44px', // Enhanced touch target
      minWidth: '44px',
      tapHighlightColor: 'transparent', // Remove iOS tap highlight
      WebkitTapHighlightColor: 'transparent',
    }),
    createMobileCard: (isWeatherCard = false) => ({
      ...mobileStyles.card(baseTheme),
      backgroundColor: isWeatherCard
        ? baseTheme.weatherCardBackground
        : baseTheme.forecastCardBackground,
      border: `1px solid ${isWeatherCard ? baseTheme.weatherCardBorder : baseTheme.forecastCardBorder}`,
      borderRadius: '16px', // More mobile-friendly radius
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', // Enhanced mobile shadow
    }),
  },

  // Enhanced component creation helpers
  createButton: (isPrimary = true, size: ButtonSize = 'medium') => ({
    ...mobileStyles.touchButton(size),
    background: isPrimary
      ? baseTheme.buttonGradient
      : baseTheme.toggleBackground,
    color: baseTheme.inverseText,
    border: isPrimary ? 'none' : `1px solid ${baseTheme.toggleBorder}`,
  }),

  createMobileButton: (isPrimary = true, size: ButtonSize = 'medium') => ({
    ...mobileStyles.touchButton(size),
    background: isPrimary
      ? baseTheme.buttonGradient
      : baseTheme.toggleBackground,
    color: baseTheme.inverseText,
    border: isPrimary ? 'none' : `1px solid ${baseTheme.toggleBorder}`,
    minHeight: '44px', // Enhanced touch target
    minWidth: '44px',
    tapHighlightColor: 'transparent', // Remove iOS tap highlight
    WebkitTapHighlightColor: 'transparent',
  }),

  createCard: (isWeatherCard = false) => ({
    ...mobileStyles.card(baseTheme),
    backgroundColor: isWeatherCard
      ? baseTheme.weatherCardBackground
      : baseTheme.forecastCardBackground,
    border: `1px solid ${isWeatherCard ? baseTheme.weatherCardBorder : baseTheme.forecastCardBorder}`,
  }),

  createMobileCard: (isWeatherCard = false) => ({
    ...mobileStyles.card(baseTheme),
    backgroundColor: isWeatherCard
      ? baseTheme.weatherCardBackground
      : baseTheme.forecastCardBackground,
    border: `1px solid ${isWeatherCard ? baseTheme.weatherCardBorder : baseTheme.forecastCardBorder}`,
    borderRadius: '16px', // More mobile-friendly radius
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', // Enhanced mobile shadow
  }),

  createGrid: (columns: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  }) => mobileStyles.grid(columns),
});

export default {
  breakpoints,
  mediaQueries,
  spacing,
  touchTargets,
  typography,
  mobileStyles,
  createResponsiveProperty,
  createResponsiveTheme,
  supportsHover,
  prefersReducedMotion,
  getCurrentBreakpoint,
  createResizeHandler,
};
