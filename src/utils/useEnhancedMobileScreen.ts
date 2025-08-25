/**
 * Enhanced Mobile Screen Hook - August 2025
 *
 * Advanced hook for better mobile screen optimization with:
 * - Improved font scaling for better readability
 * - Enhanced touch target calculations
 * - Better spacing algorithms for small screens
 * - Dynamic viewport-based adjustments
 * - Accessibility-aware optimizations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EnhancedScreenInfo {
  width: number;
  height: number;
  isVerySmallScreen: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isLandscape: boolean;
  hasNotch: boolean;
  pixelRatio: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  viewportUnits: {
    vw: number;
    vh: number;
    vmin: number;
    vmax: number;
  };
}

export interface EnhancedTypography {
  micro: string;
  tiny: string;
  small: string;
  base: string;
  medium: string;
  large: string;
  xlarge: string;
  xxlarge: string;
  hero: string;
  display: string;
}

export interface EnhancedSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  containerPadding: string;
  cardPadding: string;
  sectionGap: string;
  elementGap: string;
}

export interface EnhancedTouchTargets {
  minimum: string;
  comfortable: string;
  large: string;
  gesture: string;
  padding: {
    tight: string;
    normal: string;
    comfortable: string;
    spacious: string;
  };
}

export interface EnhancedBorderRadius {
  small: string;
  medium: string;
  large: string;
  xlarge: string;
  round: string;
}

// ============================================================================
// ENHANCED SCREEN DETECTION
// ============================================================================

const getEnhancedScreenInfo = (): EnhancedScreenInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  // Enhanced screen size categories
  const isVerySmallScreen = width < 360; // Very small phones (< 360px)
  const isSmallScreen = width >= 360 && width < 415; // Small phones (360-414px)
  const isMediumScreen = width >= 415 && width < 768; // Large phones/small tablets
  const isLargeScreen = width >= 768; // Tablets and larger
  const isLandscape = width > height;

  // Enhanced notch/safe area detection
  const hasNotch =
    typeof window !== 'undefined' &&
    'CSS' in window &&
    window.CSS &&
    typeof window.CSS.supports === 'function' &&
    window.CSS.supports('padding-top: env(safe-area-inset-top)');

  // Calculate viewport units for responsive calculations
  const viewportUnits = {
    vw: width / 100,
    vh: height / 100,
    vmin: Math.min(width, height) / 100,
    vmax: Math.max(width, height) / 100,
  };

  // Enhanced safe area calculation
  let safeAreaTop = 0;
  let safeAreaBottom = 0;
  let safeAreaLeft = 0;
  let safeAreaRight = 0;

  if (hasNotch) {
    // Estimate safe areas based on common device patterns
    if (height >= 812 && width >= 375) {
      // iPhone X and similar
      safeAreaTop = isLandscape ? 0 : 44;
      safeAreaBottom = isLandscape ? 21 : 34;
      safeAreaLeft = isLandscape ? 44 : 0;
      safeAreaRight = isLandscape ? 44 : 0;
    } else if (height >= 736) {
      // iPhone Plus models
      safeAreaTop = 20;
      safeAreaBottom = 0;
    } else {
      // Other notched devices
      safeAreaTop = 24;
      safeAreaBottom = 0;
    }
  }

  return {
    width,
    height,
    isVerySmallScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isLandscape,
    hasNotch,
    pixelRatio,
    safeAreaTop,
    safeAreaBottom,
    safeAreaLeft,
    safeAreaRight,
    viewportUnits,
  };
};

// ============================================================================
// ENHANCED TYPOGRAPHY CALCULATIONS
// ============================================================================

const getEnhancedTypography = (
  screenInfo: EnhancedScreenInfo,
): EnhancedTypography => {
  const { width, viewportUnits, isVerySmallScreen, isSmallScreen } = screenInfo;

  // Base font size calculations with improved readability
  const baseFontSize = isVerySmallScreen ? 14 : isSmallScreen ? 15 : 16;
  const scaleRatio = isVerySmallScreen ? 1.125 : isSmallScreen ? 1.2 : 1.25;

  // Viewport-based scaling with better constraints
  const clampFont = (min: number, preferred: number, max: number): string => {
    const minPx = Math.max(min, isVerySmallScreen ? min * 0.9 : min);
    const maxPx = Math.min(max, width * 0.1); // Prevent excessively large text
    const preferredVw = preferred / viewportUnits.vw;
    return `clamp(${minPx}px, ${preferredVw}vw, ${maxPx}px)`;
  };

  return {
    micro: clampFont(9, baseFontSize * 0.7, 11),
    tiny: clampFont(10, baseFontSize * 0.8, 12),
    small: clampFont(12, baseFontSize * 0.9, 14),
    base: clampFont(baseFontSize, baseFontSize, baseFontSize + 2),
    medium: clampFont(
      baseFontSize + 1,
      baseFontSize * scaleRatio,
      baseFontSize + 4,
    ),
    large: clampFont(
      baseFontSize + 2,
      baseFontSize * Math.pow(scaleRatio, 2),
      baseFontSize + 6,
    ),
    xlarge: clampFont(
      baseFontSize + 4,
      baseFontSize * Math.pow(scaleRatio, 3),
      baseFontSize + 10,
    ),
    xxlarge: clampFont(
      baseFontSize + 6,
      baseFontSize * Math.pow(scaleRatio, 4),
      baseFontSize + 14,
    ),
    hero: clampFont(
      baseFontSize + 12,
      baseFontSize * Math.pow(scaleRatio, 5),
      baseFontSize + 24,
    ),
    display: clampFont(
      baseFontSize + 16,
      baseFontSize * Math.pow(scaleRatio, 6),
      baseFontSize + 32,
    ),
  };
};

// ============================================================================
// ENHANCED SPACING CALCULATIONS
// ============================================================================

const getEnhancedSpacing = (
  screenInfo: EnhancedScreenInfo,
): EnhancedSpacing => {
  const { width, isVerySmallScreen, isSmallScreen, isLandscape } = screenInfo;

  // Base spacing unit with screen-aware scaling
  const baseUnit = isVerySmallScreen ? 4 : isSmallScreen ? 6 : 8;
  const landscapeMultiplier = isLandscape ? 0.8 : 1;

  // Adaptive spacing with viewport constraints
  const clampSpacing = (
    min: number,
    preferred: number,
    max: number,
  ): string => {
    const adjustedMin = min * landscapeMultiplier;
    const adjustedMax = Math.min(max, width * 0.08); // Prevent excessive spacing
    const preferredVw = (preferred / width) * 100;
    return `clamp(${adjustedMin}px, ${preferredVw}vw, ${adjustedMax}px)`;
  };

  return {
    xs: clampSpacing(baseUnit * 0.5, baseUnit * 0.75, baseUnit),
    sm: clampSpacing(baseUnit, baseUnit * 1.5, baseUnit * 2),
    md: clampSpacing(baseUnit * 2, baseUnit * 3, baseUnit * 4),
    lg: clampSpacing(baseUnit * 3, baseUnit * 4.5, baseUnit * 6),
    xl: clampSpacing(baseUnit * 4, baseUnit * 6, baseUnit * 8),
    xxl: clampSpacing(baseUnit * 6, baseUnit * 8, baseUnit * 12),
    containerPadding: clampSpacing(baseUnit * 2, baseUnit * 3, baseUnit * 4),
    cardPadding: clampSpacing(baseUnit * 2.5, baseUnit * 3.5, baseUnit * 5),
    sectionGap: clampSpacing(baseUnit * 4, baseUnit * 6, baseUnit * 8),
    elementGap: clampSpacing(baseUnit * 1.5, baseUnit * 2.5, baseUnit * 3.5),
  };
};

// ============================================================================
// ENHANCED TOUCH TARGET CALCULATIONS
// ============================================================================

const getEnhancedTouchTargets = (
  screenInfo: EnhancedScreenInfo,
): EnhancedTouchTargets => {
  const { isVerySmallScreen, isSmallScreen, pixelRatio } = screenInfo;

  // Touch target sizes adjusted for screen size and pixel density
  const baseTarget = isVerySmallScreen ? 42 : isSmallScreen ? 44 : 48;
  const densityAdjustment = pixelRatio > 2 ? 1.1 : 1;

  const calculateTarget = (multiplier: number): string => {
    return `${Math.round(baseTarget * multiplier * densityAdjustment)}px`;
  };

  return {
    minimum: calculateTarget(1),
    comfortable: calculateTarget(1.2),
    large: calculateTarget(1.4),
    gesture: calculateTarget(1.6),
    padding: {
      tight: `${Math.round(baseTarget * 0.2)}px ${Math.round(baseTarget * 0.3)}px`,
      normal: `${Math.round(baseTarget * 0.25)}px ${Math.round(baseTarget * 0.4)}px`,
      comfortable: `${Math.round(baseTarget * 0.3)}px ${Math.round(baseTarget * 0.5)}px`,
      spacious: `${Math.round(baseTarget * 0.4)}px ${Math.round(baseTarget * 0.6)}px`,
    },
  };
};

// ============================================================================
// ENHANCED BORDER RADIUS CALCULATIONS
// ============================================================================

const getEnhancedBorderRadius = (
  screenInfo: EnhancedScreenInfo,
): EnhancedBorderRadius => {
  const { width, isVerySmallScreen } = screenInfo;

  // Adaptive border radius with screen-aware scaling
  const baseRadius = isVerySmallScreen ? 8 : 12;
  const maxRadius = Math.min(24, width * 0.06);

  const clampRadius = (min: number, preferred: number, max: number): string => {
    const constrainedMax = Math.min(max, maxRadius);
    const preferredVw = (preferred / width) * 100;
    return `clamp(${min}px, ${preferredVw}vw, ${constrainedMax}px)`;
  };

  return {
    small: clampRadius(baseRadius * 0.5, baseRadius * 0.75, baseRadius),
    medium: clampRadius(baseRadius, baseRadius * 1.25, baseRadius * 1.5),
    large: clampRadius(baseRadius * 1.25, baseRadius * 1.75, baseRadius * 2),
    xlarge: clampRadius(baseRadius * 1.5, baseRadius * 2.25, baseRadius * 3),
    round: '50%',
  };
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useEnhancedMobileScreen - Custom React hook for useEnhancedMobileScreen functionality
 */
/**
 * useEnhancedMobileScreen - Custom React hook for useEnhancedMobileScreen functionality
 */
export const useEnhancedMobileScreen = () => {
  const [screenInfo, setScreenInfo] = useState<EnhancedScreenInfo>(
    getEnhancedScreenInfo,
  );

  // Handle screen changes with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenInfo(getEnhancedScreenInfo());
      }, 100); // Debounce resize events
    };

    const handleOrientationChange = () => {
      // Delay to allow for orientation change completion
      setTimeout(() => {
        setScreenInfo(getEnhancedScreenInfo());
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Memoized calculations for performance
  const typography = useMemo(
    () => getEnhancedTypography(screenInfo),
    [screenInfo],
  );
  const spacing = useMemo(() => getEnhancedSpacing(screenInfo), [screenInfo]);
  const touchTargets = useMemo(
    () => getEnhancedTouchTargets(screenInfo),
    [screenInfo],
  );
  const borderRadius = useMemo(
    () => getEnhancedBorderRadius(screenInfo),
    [screenInfo],
  );

  // Utility functions
  const getResponsiveFontSize = useCallback(
    (size: keyof EnhancedTypography) => {
      return typography[size];
    },
    [typography],
  );

  const getResponsiveSpacing = useCallback(
    (size: keyof EnhancedSpacing) => {
      return spacing[size];
    },
    [spacing],
  );

  const getOptimalTouchTarget = useCallback(
    (
      priority: 'minimum' | 'comfortable' | 'large' | 'gesture' = 'comfortable',
    ) => {
      return touchTargets[priority];
    },
    [touchTargets],
  );

  const getAdaptiveBorderRadius = useCallback(
    (size: keyof EnhancedBorderRadius) => {
      return borderRadius[size];
    },
    [borderRadius],
  );

  // CSS custom properties generator
  const generateCSSProperties = useCallback(() => {
    const properties: Record<string, string> = {};

    // Typography properties
    Object.entries(typography).forEach(([key, value]) => {
      properties[`--font-${key}`] = value;
    });

    // Spacing properties
    Object.entries(spacing).forEach(([key, value]) => {
      properties[`--space-${key}`] = value;
    });

    // Touch target properties
    Object.entries(touchTargets).forEach(([key, value]) => {
      if (typeof value === 'string') {
        properties[`--touch-${key}`] = value;
      }
    });

    // Border radius properties
    Object.entries(borderRadius).forEach(([key, value]) => {
      properties[`--radius-${key}`] = value;
    });

    return properties;
  }, [typography, spacing, touchTargets, borderRadius]);

  return {
    screenInfo,
    typography,
    spacing,
    touchTargets,
    borderRadius,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getOptimalTouchTarget,
    getAdaptiveBorderRadius,
    generateCSSProperties,
  };
};

export default useEnhancedMobileScreen;
