/**
 * Geolocation Verification Component
 * 
 * Shows a confirmation dialog when location is detected, allowing users to
 * verify the detected location before proceeding with weather fetch.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useHaptic } from './hapticHooks';
import type { ThemeColors } from './themeConfig';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: {
    city?: string;
    display?: string;
  };
}

interface GeolocationVerificationProps {
  theme: ThemeColors;
  isMobile: boolean;
  isOpen: boolean;
  locationData: LocationData | null;
  onConfirm: (cityName: string, latitude: number, longitude: number) => void;
  onCancel: () => void;
  onRetry?: () => void;
}

const GeolocationVerification: React.FC<GeolocationVerificationProps> = ({
  theme,
  isMobile,
  isOpen,
  locationData,
  onConfirm,
  onCancel,
  onRetry
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const haptic = useHaptic();

  // Trigger animation when opening
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      haptic.dataLoad(); // Use existing haptic for location detection
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, haptic]);

  // Handle confirm action
  const handleConfirm = () => {
    if (!locationData) return;
    
    haptic.buttonConfirm();
    const cityName = locationData.address?.city || 
                     locationData.address?.display || 
                     `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
    
    onConfirm(cityName, locationData.latitude, locationData.longitude);
  };

  // Handle cancel action
  const handleCancel = useCallback(() => {
    haptic.buttonPress();
    onCancel();
  }, [haptic, onCancel]);

  // Handle retry action
  const handleRetry = () => {
    if (onRetry) {
      haptic.buttonPress();
      onRetry();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen || !locationData) return null;

  // Format accuracy for display
  const formatAccuracy = (accuracy: number): string => {
    if (accuracy < 100) return 'High accuracy';
    if (accuracy < 1000) return 'Medium accuracy';
    return 'Low accuracy';
  };

  // Get accuracy color
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy < 100) return '#10b981'; // Green
    if (accuracy < 1000) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '20px' : '40px',
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.3s ease'
  };

  const modalStyle: React.CSSProperties = {
    background: theme.cardBackground,
    borderRadius: '20px',
    padding: isMobile ? '24px' : '32px',
    maxWidth: isMobile ? '100%' : '400px',
    width: '100%',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative'
  };

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): React.CSSProperties => {
    const baseStyle = {
      padding: isMobile ? '12px 24px' : '14px 28px',
      borderRadius: '12px',
      border: 'none',
      fontSize: isMobile ? '15px' : '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: isMobile ? '80px' : '100px'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: theme.buttonGradient,
          color: theme.inverseText,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        };
      case 'secondary':
        return {
          ...baseStyle,
          background: theme.toggleBackground,
          color: theme.primaryText,
          border: `1px solid ${theme.toggleBorder}`
        };
      case 'danger':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        };
    }
  };

  return (
    <div style={overlayStyle} onClick={handleCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '12px',
            animation: 'pulse 2s infinite'
          }}>
            📍
          </div>
          <h2 style={{
            color: theme.primaryText,
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Location Detected
          </h2>
          <p style={{
            color: theme.secondaryText,
            fontSize: '14px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            We found your location. Is this correct?
          </p>
        </div>

        {/* Location Details */}
        <div style={{
          background: theme.toggleBackground,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: `1px solid ${theme.toggleBorder}`
        }}>
          <div style={{
            color: theme.primaryText,
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            wordBreak: 'break-word'
          }}>
            {locationData.address?.display || 
             locationData.address?.city || 
             'Your Current Location'}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              color: theme.secondaryText,
              fontSize: '12px'
            }}>
              {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: getAccuracyColor(locationData.accuracy),
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '10px' }}>●</span>
              {formatAccuracy(locationData.accuracy)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <button
            onClick={handleCancel}
            style={buttonStyle('secondary')}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = theme.toggleBackground;
              target.style.transform = 'translateY(0)';
            }}
          >
            Cancel
          </button>

          {onRetry && (
            <button
              onClick={handleRetry}
              style={buttonStyle('danger')}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-1px)';
                target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              Retry
            </button>
          )}

          <button
            onClick={handleConfirm}
            style={buttonStyle('primary')}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            Use This Location
          </button>
        </div>

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GeolocationVerification;
