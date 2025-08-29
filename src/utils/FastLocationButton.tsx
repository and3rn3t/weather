/**
 * Fast Location Button Component
 *
 * Optimized location button that uses the FastLocationService for 3-5 second responses
 * instead of the traditional 10+ second waits. Features progressive loading states
 * and smart caching.
 */

import React, { useCallback, useState } from 'react';
import { NavigationIcons } from '../components/modernWeatherUI/NavigationIcons';
import { useFastLocation } from './fastLocationService';
import { logInfo } from './logger';
import type { ThemeColors } from './themeConfig';

interface FastLocationButtonProps {
  theme: ThemeColors;
  isMobile: boolean;
  onLocationReceived: (
    city: string,
    latitude: number,
    longitude: number
  ) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  showLabel?: boolean;
  className?: string;
  prioritizeSpeed?: boolean;
}

type LoadingState = 'idle' | 'getting-gps' | 'getting-city' | 'completed';

const FastLocationButton: React.FC<FastLocationButtonProps> = ({
  theme,
  isMobile,
  onLocationReceived,
  onError,
  disabled = false,
  size = 'medium',
  variant = 'secondary',
  showLabel = true,
  className = '',
  prioritizeSpeed = true,
}) => {
  const { getFastLocation, getCacheStats } = useFastLocation();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isSupported] = useState(() => {
    return !!(navigator && navigator.geolocation);
  });

  // Handle fast location request
  const handleLocationRequest = useCallback(async () => {
    if (disabled || loadingState !== 'idle' || !isSupported) return;

    try {
      setLoadingState('getting-gps');
      logInfo('🚀 FastLocationButton: Starting optimized location request');

      const startTime = Date.now();
      const locationData = await getFastLocation({
        prioritizeSpeed,
        includeCityName: true,
        useCache: true,
      });

      if (locationData) {
        const processingTime = Date.now() - startTime;
        logInfo(
          `✅ FastLocationButton: Location acquired in ${processingTime}ms`,
          {
            city: locationData.city,
            accuracy: locationData.accuracy,
            fromCache: locationData.fromCache,
          }
        );

        setLoadingState('completed');

        const cityName =
          locationData.city ||
          `${locationData.latitude.toFixed(
            4
          )}, ${locationData.longitude.toFixed(4)}`;

        onLocationReceived(
          cityName,
          locationData.latitude,
          locationData.longitude
        );

        // Brief success state before reset
        setTimeout(() => setLoadingState('idle'), 1000);
      } else {
        throw new Error('Location data unavailable');
      }
    } catch (err) {
      logInfo('❌ FastLocationButton: Location request failed', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Location request failed';
      onError?.(errorMessage);
      setLoadingState('idle');
    }
  }, [
    disabled,
    loadingState,
    isSupported,
    getFastLocation,
    prioritizeSpeed,
    onLocationReceived,
    onError,
  ]);

  // Size configurations optimized for mobile
  const sizeConfig = {
    small: {
      iconSize: '16px',
      padding: isMobile ? '10px 14px' : '8px 12px',
      fontSize: '14px',
      minHeight: '40px',
      borderRadius: '12px',
    },
    medium: {
      iconSize: '18px',
      padding: isMobile ? '14px 18px' : '12px 16px',
      fontSize: '16px',
      minHeight: '48px',
      borderRadius: '16px',
    },
    large: {
      iconSize: '20px',
      padding: isMobile ? '18px 22px' : '16px 20px',
      fontSize: '18px',
      minHeight: '56px',
      borderRadius: '18px',
    },
  };

  const config = sizeConfig[size];

  // Dynamic button styling based on state
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: showLabel ? '10px' : '0',
      padding: config.padding,
      fontSize: config.fontSize,
      fontWeight: '600',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: 'none',
      borderRadius: config.borderRadius,
      minHeight: config.minHeight,
      cursor:
        disabled || loadingState !== 'idle' || !isSupported
          ? 'not-allowed'
          : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
      transform: 'translateZ(0)', // GPU acceleration
    };

    if (!isSupported) {
      return {
        ...baseStyle,
        backgroundColor: theme.errorBackground,
        color: theme.errorText,
        opacity: 0.7,
      };
    }

    if (disabled || loadingState !== 'idle') {
      const progressOpacity =
        loadingState === 'getting-gps'
          ? 0.8
          : loadingState === 'getting-city'
            ? 0.9
            : 0.6;
      return {
        ...baseStyle,
        backgroundColor:
          variant === 'primary'
            ? theme.loadingBackground
            : theme.toggleBackground,
        color: theme.secondaryText,
        opacity: progressOpacity,
      };
    }

    if (variant === 'primary') {
      return {
        ...baseStyle,
        background: theme.buttonGradient,
        color: theme.inverseText,
        boxShadow: theme.buttonShadow,
      };
    }

    // Secondary variant with enhanced glassmorphism
    return {
      ...baseStyle,
      backgroundColor: theme.toggleBackground,
      color: theme.primaryText,
      border: `1.5px solid ${theme.toggleBorder}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    };
  };

  // Progressive icons based on loading state
  const getIcon = () => {
    if (!isSupported) return <NavigationIcons.Warning />;

    switch (loadingState) {
      case 'getting-gps':
        return <NavigationIcons.Location />; // GPS acquisition
      case 'getting-city':
        return <NavigationIcons.Search />; // City lookup
      case 'completed':
        return <NavigationIcons.Favorites />; // Success indicator
      default:
        return <NavigationIcons.Location />; // Ready
    }
  };

  // Progressive labels based on loading state
  const getLabel = () => {
    if (!isSupported) return 'Not Available';

    switch (loadingState) {
      case 'getting-gps':
        return 'Getting GPS...';
      case 'getting-city':
        return 'Finding City...';
      case 'completed':
        return 'Location Found!';
      default:
        return 'Use My Location';
    }
  };

  // Loading spinner with optimized animation
  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: config.iconSize,
    height: config.iconSize,
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: `2px solid ${
      variant === 'primary' ? theme.inverseText : theme.primaryText
    }`,
    borderRadius: '50%',
    animation: 'fastSpin 0.8s linear infinite',
  };

  // Cache info for debugging (only in development)
  const cacheStats =
    process.env.NODE_ENV === 'development' ? getCacheStats() : null;

  return (
    <>
      <button
        onClick={handleLocationRequest}
        disabled={disabled || loadingState !== 'idle' || !isSupported}
        style={getButtonStyle()}
        className={className}
        title={
          !isSupported
            ? 'Location services not supported in this browser'
            : loadingState !== 'idle'
              ? 'Getting your location...'
              : 'Get weather for your current location (optimized for speed)'
        }
        onMouseEnter={e => {
          if (!disabled && loadingState === 'idle' && isSupported) {
            const target = e.target as HTMLButtonElement;
            if (variant === 'primary') {
              target.style.transform = 'translateY(-2px) translateZ(0)';
              target.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.5)';
            } else {
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
              target.style.borderColor = theme.weatherCardBorder;
              target.style.transform = 'translateY(-1px) translateZ(0)';
            }
          }
        }}
        onMouseLeave={e => {
          if (!disabled && loadingState === 'idle' && isSupported) {
            const target = e.target as HTMLButtonElement;
            if (variant === 'primary') {
              target.style.transform = 'translateY(0) translateZ(0)';
              target.style.boxShadow = theme.buttonShadow;
            } else {
              target.style.backgroundColor = theme.toggleBackground;
              target.style.borderColor = theme.toggleBorder;
              target.style.transform = 'translateY(0) translateZ(0)';
            }
          }
        }}
      >
        {/* Icon/Spinner */}
        <span
          style={{
            fontSize: config.iconSize,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadingState === 'getting-gps' ? (
            <span style={spinnerStyle}></span>
          ) : (
            getIcon()
          )}
        </span>

        {/* Label */}
        {showLabel && (
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: loadingState === 'completed' ? 1 : 0.95,
              fontWeight: loadingState === 'completed' ? '700' : '600',
            }}
          >
            {getLabel()}
          </span>
        )}

        {/* Progress indicator */}
        {loadingState !== 'idle' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              backgroundColor:
                variant === 'primary' ? theme.inverseText : theme.primaryText,
              opacity: 0.6,
              width:
                loadingState === 'getting-gps'
                  ? '40%'
                  : loadingState === 'getting-city'
                    ? '70%'
                    : '100%',
              transition: 'width 0.3s ease',
            }}
          />
        )}
      </button>

      {/* Development cache info */}
      {process.env.NODE_ENV === 'development' && cacheStats && (
        <div
          style={{
            fontSize: '10px',
            color: theme.secondaryText,
            marginTop: '4px',
          }}
        >
          Cache: {cacheStats.entries} entries
        </div>
      )}

      {/* CSS for optimized animations */}
      <style>{`
        @keyframes fastSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default FastLocationButton;
