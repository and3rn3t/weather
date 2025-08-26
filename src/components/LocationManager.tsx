/**
 * Enhanced Location Manager Component
 *
 * Provides automatic location detection and management for the weather app.
 * Integrates with auto location services for seamless user experience.
 */

import React, { useEffect } from 'react';
import { useAutoLocationServices } from '../utils/useAutoLocationServices';

interface LocationManagerProps {
  onLocationReceived: (
    city: string,
    latitude: number,
    longitude: number
  ) => void;
  onError?: (error: string) => void;
  enableAutoDetection?: boolean;
  enableBackgroundUpdates?: boolean;
  children?: React.ReactNode;
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  onLocationReceived,
  onError,
  enableAutoDetection = true,
  enableBackgroundUpdates = false,
  children,
}) => {
  const { currentLocation, error } = useAutoLocationServices({
    enableAutoDetection,
    enableBackgroundUpdates,
    updateInterval: 30, // 30 minutes
    cacheExpiration: 60, // 1 hour
    enableHighAccuracy: false, // Battery optimization
    enableBatteryOptimization: true,
  });

  // Handle location updates
  useEffect(() => {
    if (currentLocation) {
      const city = currentLocation.city || 'Current Location';
      onLocationReceived(
        city,
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
  }, [currentLocation, onLocationReceived]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error.userFriendlyMessage || error.message);
    }
  }, [error, onError]);

  // If children are provided, just render them
  if (children) {
    return <>{children}</>;
  }

  // Default render - invisible manager
  return null;
};

export default LocationManager;
