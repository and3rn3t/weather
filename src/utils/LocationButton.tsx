/**
 * Location Button Component
 *
 * A glassmorphism-styled button for requesting user location with visual feedback states.
 * Integrates with the theme system and provides comprehensive UX for location services.
 */

import React from 'react';
import { NavigationIcons } from '../components/modernWeatherUI/NavigationIcons';
import type { ThemeColors } from './themeConfig';
import { useLocationServices } from './useLocationServices';

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
  theme: _theme,
  isMobile: _isMobile,
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

  // Bubble up errors as user-friendly strings
  React.useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  // Handle location button click with optimized settings
  const handleLocationRequest = async () => {
    if (disabled || isLoading || !isSupported) return;

    try {
      const locationData = await getCurrentLocation({
        enableHighAccuracy: false,
        timeout: 8000,
        includeAddress: true,
      });

      if (locationData?.city) {
        onLocationReceived(
          locationData.city,
          locationData.latitude,
          locationData.longitude
        );
      } else if (locationData) {
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

  // Icon based on state
  let sizeClass = 'btn-size-md';
  let iconSizeClass = 'btn-icon-md';
  let spinnerSizeClass = 'btn-spinner-md';
  if (size === 'small') {
    sizeClass = 'btn-size-sm';
    iconSizeClass = 'btn-icon-sm';
    spinnerSizeClass = 'btn-spinner-sm';
  } else if (size === 'large') {
    sizeClass = 'btn-size-lg';
    iconSizeClass = 'btn-icon-lg';
    spinnerSizeClass = 'btn-spinner-lg';
  }
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const disabledClass = disabled || isLoading ? 'is-disabled' : '';
  const unsupportedClass = !isSupported ? 'btn-unsupported' : '';

  const getIcon = () => {
    if (!isSupported) return <NavigationIcons.Close />;
    if (isLoading)
      return <span className={`btn-spinner ${spinnerSizeClass}`} />;
    if (error) return <NavigationIcons.Warning />;
    if (location) return <NavigationIcons.Location />;
    return <NavigationIcons.Location />;
  };

  // Label based on state
  const getLabel = () => {
    if (!isSupported) return 'Not Available';
    if (isLoading) return 'Getting Location...';
    if (error) return 'Try Again';
    if (location) return 'Use Current Location';
    return 'Use My Location';
  };

  // Spinner now uses CSS classes (.btn-spinner) defined in index.css

  return (
    <>
      <button
        onClick={handleLocationRequest}
        disabled={disabled || isLoading || !isSupported}
        className={[
          'btn-inline-icon',
          sizeClass,
          variantClass,
          disabledClass,
          unsupportedClass,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        title={
          !isSupported
            ? 'Location services not supported in this browser'
            : error?.userFriendlyMessage ||
              'Get weather for your current location'
        }
      >
        {/* Icon */}
        <span className={['btn-icon', iconSizeClass].join(' ')}>
          {getIcon()}
        </span>

        {/* Label */}
        {showLabel && <span className="btn-label">{getLabel()}</span>}
      </button>

      {/* Spinner animation provided by global CSS (.btn-spinner) */}
    </>
  );
};

export default LocationButton;
