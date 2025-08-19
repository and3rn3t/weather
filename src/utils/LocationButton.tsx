/**
 * Location Button Component
 *
 * A glassmorphism-styled button for requesting user location with visual feedback states.
 * Integrates with the theme system and provides comprehensive UX for location services.
 */

import React from 'react';
import { useLocationServices } from './useLocationServices';
import type { ThemeColors } from './themeConfig';

interface LocationButtonProps {
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
}

const LocationButton: React.FC<LocationButtonProps> = ({
  theme,
  isMobile,
  onLocationReceived,
  onError,
  disabled = false,
  size = 'medium',
  variant = 'secondary',
  showLabel = true,
  className = '',
}) => {
  const { isLoading, isSupported, error, getCurrentLocation, location } =
    useLocationServices();

  // Call onError when hook error state changes
  React.useEffect(() => {
    if (error && onError) {
      // Use the original error message for backwards compatibility
      onError(error.message);
    }
  }, [error, onError]);

  // Handle location button click
  const handleLocationRequest = async () => {
    if (disabled || isLoading || !isSupported) return;

    try {
      const locationData = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        includeAddress: true,
      });

      if (locationData && locationData.city) {
        onLocationReceived(
          locationData.city,
          locationData.latitude,
          locationData.longitude
        );
      } else if (locationData) {
        // Fallback to coordinates if city name unavailable
        onLocationReceived(
          `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`,
          locationData.latitude,
          locationData.longitude
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Location request failed';
      onError?.(errorMessage);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: '16px',
      padding: isMobile ? '8px 12px' : '6px 10px',
      fontSize: '14px',
      minHeight: '36px',
      borderRadius: '12px',
    },
    medium: {
      iconSize: '18px',
      padding: isMobile ? '12px 16px' : '10px 14px',
      fontSize: '16px',
      minHeight: '44px',
      borderRadius: '14px',
    },
    large: {
      iconSize: '20px',
      padding: isMobile ? '16px 20px' : '14px 18px',
      fontSize: '18px',
      minHeight: '52px',
      borderRadius: '16px',
    },
  };

  const config = sizeConfig[size];

  // Button style based on variant and state
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: showLabel ? '8px' : '0',
      padding: config.padding,
      fontSize: config.fontSize,
      fontWeight: '500',
      fontFamily: 'inherit',
      border: 'none',
      borderRadius: config.borderRadius,
      minHeight: config.minHeight,
      cursor: disabled || isLoading || !isSupported ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
    };

    if (!isSupported) {
      return {
        ...baseStyle,
        backgroundColor: theme.errorBackground,
        color: theme.errorText,
        opacity: 0.6,
      };
    }

    if (disabled || isLoading) {
      return {
        ...baseStyle,
        backgroundColor:
          variant === 'primary'
            ? theme.loadingBackground
            : theme.toggleBackground,
        color: theme.secondaryText,
        opacity: 0.6,
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

    // Secondary variant (default)
    return {
      ...baseStyle,
      backgroundColor: theme.toggleBackground,
      color: theme.primaryText,
      border: `1px solid ${theme.toggleBorder}`,
      backdropFilter: 'blur(10px)',
    };
  };

  // Icon based on state
  const getIcon = () => {
    if (!isSupported) return '❌';
    if (isLoading) return '🔄';
    if (error) return '⚠️';
    if (location) return '📍';
    return '📍';
  };

  // Label based on state
  const getLabel = () => {
    if (!isSupported) return 'Not Available';
    if (isLoading) return 'Getting Location...';
    if (error) return 'Try Again';
    if (location) return 'Use Current Location';
    return 'Use My Location';
  };

  // Loading spinner style
  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: config.iconSize,
    height: config.iconSize,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: `2px solid ${variant === 'primary' ? theme.inverseText : theme.primaryText}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <>
      <button
        onClick={handleLocationRequest}
        disabled={disabled || isLoading || !isSupported}
        style={getButtonStyle()}
        className={className}
        title={
          !isSupported
            ? 'Location services not supported in this browser'
            : error?.userFriendlyMessage ||
              'Get weather for your current location'
        }
        onMouseEnter={e => {
          if (!disabled && !isLoading && isSupported) {
            const target = e.target as HTMLButtonElement;
            if (variant === 'primary') {
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.4)';
            } else {
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              target.style.borderColor = theme.weatherCardBorder;
            }
          }
        }}
        onMouseLeave={e => {
          if (!disabled && !isLoading && isSupported) {
            const target = e.target as HTMLButtonElement;
            if (variant === 'primary') {
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = theme.buttonShadow;
            } else {
              target.style.backgroundColor = theme.toggleBackground;
              target.style.borderColor = theme.toggleBorder;
            }
          }
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: config.iconSize,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? <span style={spinnerStyle}></span> : getIcon()}
        </span>

        {/* Label */}
        {showLabel && (
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {getLabel()}
          </span>
        )}
      </button>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default LocationButton;
