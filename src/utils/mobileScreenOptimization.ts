/**
 * Mobile Screen Optimization Utilities
 * 
 * Comprehensive utilities for optimizing the app display on various mobile screen sizes,
 * including small screens, notched displays, and different orientations.
 */

import type { ThemeColors } from './themeConfig';

// ============================================================================
// SCREEN SIZE DETECTION
// ============================================================================

export interface ScreenInfo {
  width: number;
  height: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  isLandscape: boolean;
  hasNotch: boolean;
  pixelRatio: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

/**
 * Get comprehensive screen information for mobile optimization
 */
export const getScreenInfo = (): ScreenInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Screen size categories
  const isVerySmallScreen = width < 360 || height < 640; // Very small phones
  const isSmallScreen = width < 414 || height < 736; // Small to medium phones
  const isLandscape = width > height;
  
  // Detect notch/safe areas (iOS, Android with cutouts)
  const hasNotch = typeof window !== 'undefined' && 'CSS' in window && 
    window.CSS && typeof window.CSS.supports === 'function' && 
    window.CSS.supports('padding-top: env(safe-area-inset-top)');
  
  // Estimate safe areas
  let safeAreaTop = 0;
  let safeAreaBottom = 0;
  
  if (hasNotch) {
    // Try to get actual safe area values
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.top = '0';
    testElement.style.paddingTop = 'env(safe-area-inset-top)';
    document.body.appendChild(testElement);
    
    const computedTop = getComputedStyle(testElement).paddingTop;
    safeAreaTop = parseInt(computedTop) || 44; // Fallback to common iOS status bar height
    
    testElement.style.paddingTop = 'env(safe-area-inset-bottom)';
    const computedBottom = getComputedStyle(testElement).paddingTop;
    safeAreaBottom = parseInt(computedBottom) || 34; // Fallback to iOS home indicator height
    
    document.body.removeChild(testElement);
  }
  
  return {
    width,
    height,
    isSmallScreen,
    isVerySmallScreen,
    isLandscape,
    hasNotch,
    pixelRatio,
    safeAreaTop,
    safeAreaBottom
  };
};

// ============================================================================
// RESPONSIVE SIZING UTILITIES
// ============================================================================

/**
 * Get adaptive font sizes based on screen size
 */
export const getAdaptiveFontSizes = (screenInfo: ScreenInfo) => ({
  // Main title sizes
  heroTitle: screenInfo.isVerySmallScreen ? '20px' : screenInfo.isSmallScreen ? '24px' : '32px',
  pageTitle: screenInfo.isVerySmallScreen ? '22px' : screenInfo.isSmallScreen ? '26px' : '28px',
  sectionTitle: screenInfo.isVerySmallScreen ? '16px' : screenInfo.isSmallScreen ? '18px' : '20px',
  
  // Body text sizes
  bodyLarge: screenInfo.isVerySmallScreen ? '14px' : '16px',
  bodyMedium: screenInfo.isVerySmallScreen ? '13px' : '14px',
  bodySmall: screenInfo.isVerySmallScreen ? '11px' : '12px',
  
  // Weather display sizes
  temperature: screenInfo.isVerySmallScreen ? '28px' : screenInfo.isSmallScreen ? '36px' : '48px',
  weatherLabel: screenInfo.isVerySmallScreen ? '14px' : '16px',
  
  // Button text
  buttonText: screenInfo.isVerySmallScreen ? '14px' : '16px'
});

/**
 * Get adaptive spacing based on screen size
 */
export const getAdaptiveSpacing = (screenInfo: ScreenInfo) => ({
  // Container padding
  containerPadding: screenInfo.isVerySmallScreen ? '12px' : screenInfo.isSmallScreen ? '16px' : '20px',
  
  // Card padding
  cardPadding: screenInfo.isVerySmallScreen ? '16px' : screenInfo.isSmallScreen ? '24px' : '32px',
  
  // Element spacing
  elementGap: screenInfo.isVerySmallScreen ? '8px' : screenInfo.isSmallScreen ? '12px' : '16px',
  sectionGap: screenInfo.isVerySmallScreen ? '16px' : screenInfo.isSmallScreen ? '24px' : '32px',
  
  // Button spacing
  buttonPadding: screenInfo.isVerySmallScreen ? '10px 16px' : screenInfo.isSmallScreen ? '12px 20px' : '14px 24px',
  
  // Top/bottom margins with safe area consideration
  topMargin: Math.max(screenInfo.safeAreaTop, screenInfo.isVerySmallScreen ? 8 : 12),
  bottomMargin: Math.max(screenInfo.safeAreaBottom, screenInfo.isVerySmallScreen ? 8 : 12),
});

/**
 * Get adaptive border radius based on screen size
 */
export const getAdaptiveBorderRadius = (screenInfo: ScreenInfo) => ({
  small: screenInfo.isVerySmallScreen ? '8px' : '12px',
  medium: screenInfo.isVerySmallScreen ? '12px' : '16px',
  large: screenInfo.isVerySmallScreen ? '16px' : '20px',
  xlarge: screenInfo.isVerySmallScreen ? '20px' : '24px'
});

// ============================================================================
// TOUCH OPTIMIZATION
// ============================================================================

/**
 * Get touch-optimized button styles
 */
export const getTouchOptimizedButton = (
  theme: ThemeColors,
  screenInfo: ScreenInfo,
  variant: 'primary' | 'secondary' = 'primary',
  size: 'small' | 'medium' | 'large' = 'medium'
): React.CSSProperties => {
  const spacing = getAdaptiveSpacing(screenInfo);
  const borderRadius = getAdaptiveBorderRadius(screenInfo);
  const fontSize = getAdaptiveFontSizes(screenInfo);
  
  // Ensure minimum touch target size (44px iOS, 48px Android)
  const minTouchTarget = 44;
  
  let buttonHeight: string;
  let padding: string;
  let textSize: string;
  
  switch (size) {
    case 'small':
      buttonHeight = `${Math.max(minTouchTarget - 8, 36)}px`;
      padding = screenInfo.isVerySmallScreen ? '8px 12px' : '10px 16px';
      textSize = '14px';
      break;
    case 'large':
      buttonHeight = `${Math.max(minTouchTarget + 8, 52)}px`;
      padding = screenInfo.isVerySmallScreen ? '14px 20px' : '16px 24px';
      textSize = fontSize.buttonText;
      break;
    default: // medium
      buttonHeight = `${minTouchTarget}px`;
      padding = spacing.buttonPadding;
      textSize = fontSize.buttonText;
  }
  
  return {
    minHeight: buttonHeight,
    padding,
    fontSize: textSize,
    fontWeight: '600',
    borderRadius: borderRadius.medium,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    textDecoration: 'none',
    outline: 'none',
    userSelect: 'none' as const,
    touchAction: 'manipulation' as const,
    WebkitTapHighlightColor: 'transparent',
    
    // Variant-specific styles
    background: variant === 'primary' ? theme.primaryGradient : 'rgba(255, 255, 255, 0.2)',
    color: variant === 'primary' ? theme.inverseText : theme.primaryText,
    boxShadow: variant === 'primary' ? theme.buttonShadow : 'none',
    
    // Ensure accessibility on small screens
    minWidth: screenInfo.isVerySmallScreen ? '80px' : '100px'
  };
};

// ============================================================================
// GRID SYSTEM FOR MOBILE
// ============================================================================

/**
 * Get responsive grid configuration
 */
export const getResponsiveGrid = (screenInfo: ScreenInfo, itemMinWidth: number = 120) => {
  const spacing = getAdaptiveSpacing(screenInfo);
  const availableWidth = screenInfo.width - (parseInt(spacing.containerPadding) * 2);
  
  // Calculate optimal columns
  const maxColumns = Math.floor(availableWidth / itemMinWidth);
  const optimalColumns = Math.max(1, Math.min(maxColumns, screenInfo.isVerySmallScreen ? 2 : 3));
  
  return {
    gridTemplateColumns: `repeat(${optimalColumns}, 1fr)`,
    gap: spacing.elementGap,
    width: '100%'
  };
};

// ============================================================================
// LAYOUT HELPERS
// ============================================================================

/**
 * Get safe area styles for notched devices
 */
export const getSafeAreaStyles = (screenInfo: ScreenInfo): React.CSSProperties => ({
  paddingTop: screenInfo.hasNotch ? 'env(safe-area-inset-top)' : `${screenInfo.safeAreaTop}px`,
  paddingBottom: screenInfo.hasNotch ? 'env(safe-area-inset-bottom)' : `${screenInfo.safeAreaBottom}px`,
  paddingLeft: screenInfo.hasNotch ? 'env(safe-area-inset-left)' : '0',
  paddingRight: screenInfo.hasNotch ? 'env(safe-area-inset-right)' : '0'
});

/**
 * Get container styles optimized for mobile screens
 */
export const getMobileOptimizedContainer = (
  theme: ThemeColors,
  screenInfo: ScreenInfo
): React.CSSProperties => {
  const spacing = getAdaptiveSpacing(screenInfo);
  const safeArea = getSafeAreaStyles(screenInfo);
  
  return {
    minHeight: '100vh',
    background: theme.appBackground,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'background 0.6s ease',
    overflow: 'hidden', // Prevent pull-to-refresh bounce on some browsers
    position: 'relative' as const,
    
    // Apply safe area padding
    ...safeArea,
    
    // Additional padding for content
    padding: `${safeArea.paddingTop || spacing.topMargin}px ${spacing.containerPadding} ${safeArea.paddingBottom || spacing.bottomMargin}px`,
    
    // Optimize for touch scrolling
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'none' // Prevent pull-to-refresh on unsupported browsers
  };
};

/**
 * Get card styles optimized for mobile screens
 */
export const getMobileOptimizedCard = (
  theme: ThemeColors,
  screenInfo: ScreenInfo
): React.CSSProperties => {
  const spacing = getAdaptiveSpacing(screenInfo);
  const borderRadius = getAdaptiveBorderRadius(screenInfo);
  
  return {
    backgroundColor: theme.cardBackground,
    backdropFilter: 'blur(20px)',
    borderRadius: borderRadius.large,
    padding: spacing.cardPadding,
    boxShadow: theme.cardShadow,
    border: `1px solid ${theme.cardBorder}`,
    transition: 'all 0.6s ease',
    width: '100%',
    maxWidth: screenInfo.isVerySmallScreen ? '100%' : screenInfo.isSmallScreen ? '380px' : '500px',
    margin: '0 auto',
    
    // Prevent horizontal overflow
    overflowX: 'hidden',
    wordWrap: 'break-word'
  };
};

// ============================================================================
// SCREEN ORIENTATION UTILITIES
// ============================================================================

/**
 * Handle orientation changes and adapt layout
 */
export const handleOrientationChange = (callback: (screenInfo: ScreenInfo) => void) => {
  const handleChange = () => {
    // Small delay to ensure viewport dimensions are updated
    setTimeout(() => {
      const newScreenInfo = getScreenInfo();
      callback(newScreenInfo);
    }, 100);
  };
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', handleChange);
  window.addEventListener('resize', handleChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleChange);
    window.removeEventListener('resize', handleChange);
  };
};

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Optimize images for mobile screens
 */
export const getOptimizedImageProps = (screenInfo: ScreenInfo) => ({
  loading: 'lazy' as const,
  decoding: 'async' as const,
  style: {
    maxWidth: '100%',
    height: 'auto',
    // Use crisp rendering on high DPI screens
    imageRendering: screenInfo.pixelRatio > 1 ? 'crisp-edges' as const : 'auto' as const
  }
});

/**
 * Get viewport meta tag content for optimal mobile display
 */
export const getOptimalViewportContent = (allowZoom: boolean = true): string => {
  const baseContent = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
  
  if (!allowZoom) {
    return `${baseContent}, maximum-scale=1.0, user-scalable=no`;
  }
  
  return `${baseContent}, maximum-scale=2.0, user-scalable=yes`;
};

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Get styles that improve accessibility on mobile devices
 */
export const getAccessibilityStyles = (screenInfo: ScreenInfo): React.CSSProperties => ({
  // Ensure readable text sizes
  fontSize: screenInfo.isVerySmallScreen ? '16px' : '18px', // Prevent zoom on iOS
  lineHeight: '1.5',
  
  // High contrast for readability
  textShadow: 'none',
  
  // Focus indicators for keyboard navigation
  outline: 'none',
  
  // Ensure touch targets are accessible
  minHeight: '44px',
  minWidth: '44px'
});
