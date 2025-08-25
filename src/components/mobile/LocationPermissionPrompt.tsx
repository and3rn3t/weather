/**
 * Location Permission Prompt Component
 *
 * User-friendly interface for requesting location permissions with:
 * - Clear explanation of benefits
 * - Permission status indicators
 * - Manual fallback options
 * - Settings guidance for denied permissions
 */

import React, { useEffect, useState } from 'react';
import type { PermissionState } from '../../services/mobile/LocationPermissionManager';
import { useLocationPermission } from '../../services/mobile/LocationPermissionManager';
import './LocationPermissionPrompt.css';

interface LocationPermissionPromptProps {
  onPermissionGranted?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onPermissionDenied?: () => void;
  onFallbackRequested?: () => void;
  showCompact?: boolean;
  className?: string;
}

export const LocationPermissionPrompt: React.FC<
  LocationPermissionPromptProps
> = ({
  onPermissionGranted,
  onPermissionDenied,
  onFallbackRequested,
  showCompact = false,
  className = '',
}) => {
  const [permissionState, setPermissionState] =
    useState<PermissionState | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    checkPermission,
    requestPermission,
    shouldShowPrompt,
    getRecommendations,
  } = useLocationPermission();

  // Check initial permission state
  useEffect(() => {
    const checkInitialPermission = async () => {
      try {
        const state = await checkPermission();
        setPermissionState(state);

        // Show prompt if we should ask for permission
        const shouldShow = await shouldShowPrompt();
        setShowPrompt(shouldShow && !state.granted);
      } catch {
        setError('Unable to check location permission status');
      }
    };

    checkInitialPermission();
  }, [checkPermission, shouldShowPrompt]);

  const handleRequestPermission = async () => {
    if (!permissionState) return;

    setIsRequesting(true);
    setError(null);

    try {
      const result = await requestPermission({
        enableHighAccuracy: true,
        showPermissionRationale: true,
        allowFallbackToIP: true,
        cachePermissionState: true,
      });

      setPermissionState(result.permission);

      if (result.success) {
        setShowPrompt(false);

        // Get current location to pass to parent
        if (onPermissionGranted) {
          // This would integrate with the existing location service
          // For now, we'll simulate getting coordinates
          const mockLocation = { latitude: 40.7128, longitude: -74.006 }; // NYC
          onPermissionGranted(mockLocation);
        }
      } else {
        setError(result.message || 'Permission request failed');

        if (result.needsManualEnable) {
          // Show settings guidance
          setError('Please enable location access in your browser settings');
        }

        if (onPermissionDenied) {
          onPermissionDenied();
        }
      }
    } catch {
      setError('Failed to request location permission');
      if (onPermissionDenied) {
        onPermissionDenied();
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onPermissionDenied) {
      onPermissionDenied();
    }
  };

  const handleFallback = () => {
    setShowPrompt(false);
    if (onFallbackRequested) {
      onFallbackRequested();
    }
  };

  const getStatusIcon = () => {
    if (!permissionState) return '❓';
    if (permissionState.granted) return '✅';
    if (permissionState.denied) return '❌';
    if (permissionState.unavailable) return '🚫';
    return '❓';
  };

  const getStatusText = () => {
    if (!permissionState) return 'Checking...';
    if (permissionState.granted) return 'Location access granted';
    if (permissionState.denied) return 'Location access denied';
    if (permissionState.unavailable) return 'Location not available';
    return 'Location permission needed';
  };

  // Don't show if permission already granted or if this is not the right time
  if (!showPrompt || permissionState?.granted) {
    return null;
  }

  // Compact version for mobile
  if (showCompact) {
    return (
      <div className={`location-permission-compact ${className}`}>
        <div className="permission-status">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {permissionState?.prompt && (
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="btn-request-compact"
          >
            {isRequesting ? '📍 Requesting...' : '📍 Enable Location'}
          </button>
        )}

        {error && <div className="error-compact">{error}</div>}
      </div>
    );
  }

  // Full permission prompt
  return (
    <div className={`location-permission-prompt ${className}`}>
      <div className="prompt-header">
        <h3>🌍 Enable Location for Better Weather</h3>
        <button
          onClick={handleDismiss}
          className="close-button"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="prompt-content">
        <div className="benefits-list">
          <div className="benefit">
            <span className="benefit-icon">⚡</span>
            <span>Automatic weather for your current location</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔄</span>
            <span>Background updates when you change locations</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔒</span>
            <span>Your location stays private and secure</span>
          </div>
        </div>

        <div className="current-status">
          <span className="status-icon-large">{getStatusIcon()}</span>
          <span className="status-text-large">{getStatusText()}</span>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {permissionState?.denied && (
          <div className="settings-guidance">
            <h4>To enable location access:</h4>
            <ol>
              {getRecommendations().map((step, stepIndex) => (
                <li key={`step-${stepIndex}-${step.slice(0, 10)}`}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="prompt-actions">
        {permissionState?.prompt && (
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="btn-primary btn-request"
          >
            {isRequesting ? (
              <>
                <span className="spinner">⏳</span> Requesting Permission...
              </>
            ) : (
              <>
                <span className="icon">📍</span> Enable Location Access
              </>
            )}
          </button>
        )}

        <button onClick={handleFallback} className="btn-secondary btn-fallback">
          <span className="icon">🔍</span> Search for City Instead
        </button>

        <button onClick={handleDismiss} className="btn-text btn-dismiss">
          Maybe Later
        </button>
      </div>

      <div className="privacy-note">
        <span className="privacy-icon">🔒</span>
        <small>
          We only use your location to provide accurate weather information.
          Your location is never shared with third parties.
        </small>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt;
