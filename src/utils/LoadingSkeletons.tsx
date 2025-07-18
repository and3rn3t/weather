/**
 * Loading Skeleton Components for Mobile-Optimized UX
 * 
 * Provides shimmer loading states for weather cards and content
 * while data is being fetched, improving perceived performance.
 */

import React from 'react';
import { useTheme } from './useTheme';
import type { ThemeColors } from './themeConfig';

// ============================================================================
// SKELETON ANIMATION STYLES
// ============================================================================

const createSkeletonStyles = (theme: ThemeColors) => ({
  skeleton: {
    background: `linear-gradient(90deg, ${theme.cardBackground} 25%, ${theme.toggleBackground} 50%, ${theme.cardBackground} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  },
  
  // Shimmer keyframes (injected into document head)
  shimmerKeyframes: `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `
});

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Weather Card Loading Skeleton
 */
export const WeatherCardSkeleton: React.FC = () => {
  const { theme, isMobile, isTablet } = useTheme();
  const styles = createSkeletonStyles(theme);
  
  // Get responsive padding
  const getCardPadding = () => {
    if (isMobile) return '20px';
    if (isTablet) return '24px';
    return '30px';
  };
  
  // Inject shimmer animation
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles.shimmerKeyframes;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [styles.shimmerKeyframes]);
  
  return (
    <div style={{
      backgroundColor: theme.weatherCardBackground,
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: getCardPadding(),
      border: `1px solid ${theme.weatherCardBorder}`,
      boxShadow: theme.cardShadow,
      maxWidth: isMobile ? '340px' : '500px',
      width: '100%',
      margin: '20px auto'
    }}>
      {/* Location Skeleton */}
      <div style={{
        ...styles.skeleton,
        height: '20px',
        width: '60%',
        marginBottom: '16px'
      }} />
      
      {/* Temperature Skeleton */}
      <div style={{
        ...styles.skeleton,
        height: isMobile ? '36px' : '48px',
        width: '40%',
        marginBottom: '12px'
      }} />
      
      {/* Description Skeleton */}
      <div style={{
        ...styles.skeleton,
        height: '16px',
        width: '80%',
        marginBottom: '20px'
      }} />
      
      {/* Weather Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: '12px'
      }}>
        {Array.from({ length: isMobile ? 4 : 6 }, (_, index) => (
          <div key={`skeleton-${index}`} style={{
            ...styles.skeleton,
            height: '40px',
            borderRadius: '6px'
          }} />
        ))}
      </div>
    </div>
  );
};

/**
 * Forecast List Loading Skeleton
 */
export const ForecastListSkeleton: React.FC<{ items?: number }> = ({ 
  items = 7 
}) => {
  const { theme, isMobile } = useTheme();
  const styles = createSkeletonStyles(theme);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '12px',
      padding: '16px',
      overflowX: isMobile ? 'visible' : 'auto'
    }}>
      {Array.from({ length: items }, (_, index) => (
        <div key={`forecast-${index}`} style={{
          backgroundColor: theme.forecastCardBackground,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${theme.forecastCardBorder}`,
          minWidth: isMobile ? 'auto' : '120px',
          flex: isMobile ? 'none' : '0 0 auto'
        }}>
          {/* Day/Time */}
          <div style={{
            ...styles.skeleton,
            height: '14px',
            width: '60%',
            marginBottom: '8px'
          }} />
          
          {/* Weather Icon */}
          <div style={{
            ...styles.skeleton,
            height: '32px',
            width: '32px',
            margin: '8px auto',
            borderRadius: '50%'
          }} />
          
          {/* Temperature */}
          <div style={{
            ...styles.skeleton,
            height: '16px',
            width: '80%',
            margin: '8px auto 0'
          }} />
        </div>
      ))}
    </div>
  );
};

/**
 * Hourly Forecast Skeleton (Horizontal Scroll)
 */
export const HourlyForecastSkeleton: React.FC = () => {
  const { theme, isMobile } = useTheme();
  const styles = createSkeletonStyles(theme);
  
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px',
      overflowX: 'auto',
      scrollbarWidth: 'thin'
    }}>
      {Array.from({ length: 24 }, (_, index) => (
        <div key={`hourly-${index}`} style={{
          backgroundColor: theme.forecastCardBackground,
          borderRadius: '12px',
          padding: '12px',
          border: `1px solid ${theme.forecastCardBorder}`,
          minWidth: '80px',
          flex: '0 0 auto',
          textAlign: 'center'
        }}>
          {/* Hour */}
          <div style={{
            ...styles.skeleton,
            height: '12px',
            width: '100%',
            marginBottom: '8px'
          }} />
          
          {/* Weather Icon */}
          <div style={{
            ...styles.skeleton,
            height: '24px',
            width: '24px',
            margin: '6px auto',
            borderRadius: '50%'
          }} />
          
          {/* Temperature */}
          <div style={{
            ...styles.skeleton,
            height: '14px',
            width: '100%',
            marginTop: '6px'
          }} />
        </div>
      ))}
    </div>
  );
};

/**
 * Search Input Skeleton
 */
export const SearchInputSkeleton: React.FC = () => {
  const { theme, isMobile } = useTheme();
  const styles = createSkeletonStyles(theme);
  
  return (
    <div style={{
      ...styles.skeleton,
      height: isMobile ? '44px' : '48px', // Using isMobile here
      width: '100%',
      maxWidth: '400px',
      margin: '16px auto',
      borderRadius: '24px'
    }} />
  );
};

/**
 * App Title Skeleton
 */
export const AppTitleSkeleton: React.FC = () => {
  const { theme, isMobile } = useTheme();
  const styles = createSkeletonStyles(theme);
  
  return (
    <div style={{
      textAlign: 'center',
      marginBottom: '24px'
    }}>
      {/* Main Title */}
      <div style={{
        ...styles.skeleton,
        height: isMobile ? '28px' : '32px',
        width: '60%',
        margin: '0 auto 12px'
      }} />
      
      {/* Subtitle */}
      <div style={{
        ...styles.skeleton,
        height: isMobile ? '16px' : '18px',
        width: '80%',
        margin: '0 auto'
      }} />
    </div>
  );
};

export default {
  WeatherCardSkeleton,
  ForecastListSkeleton,
  HourlyForecastSkeleton,
  SearchInputSkeleton,
  AppTitleSkeleton
};
