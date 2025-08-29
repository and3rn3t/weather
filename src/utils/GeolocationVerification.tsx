/**
 * Geolocation Verification Component
 *
 * Shows a confirmation dialog when location is detected, allowing users to
 * verify the detected location before proceeding with weather fetch.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavigationIcons } from '../components/modernWeatherUI/NavigationIcons';
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
  theme: _theme,
  isMobile,
  isOpen,
  locationData,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const haptic = useHaptic();
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      haptic.dataLoad();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, haptic]);

  // Focus management: trap focus inside dialog and restore on close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement) || null;
    dialog.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableSelectors = [
        'button',
        '[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter(el => !el.hasAttribute('disabled'));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (!locationData) return;
    haptic.buttonConfirm();
    const cityName =
      locationData.address?.city ||
      locationData.address?.display ||
      `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
    onConfirm(cityName, locationData.latitude, locationData.longitude);
  };

  const handleCancel = useCallback(() => {
    haptic.buttonPress();
    onCancel();
  }, [haptic, onCancel]);

  const handleRetry = () => {
    if (onRetry) {
      haptic.buttonPress();
      onRetry();
    }
  };

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

  const formatAccuracy = (accuracy: number): string => {
    if (accuracy < 100) return 'High accuracy';
    if (accuracy < 1000) return 'Medium accuracy';
    return 'Low accuracy';
  };

  // placeholder to satisfy diff context; moved to explicit if/else below

  const overlayClass = `geo-verify-overlay ${isAnimating ? 'is-open' : ''} ${isMobile ? 'is-mobile' : ''}`;
  const modalClass = `geo-verify-modal ${isAnimating ? 'is-open' : ''} ${isMobile ? 'is-mobile' : ''}`;

  let accuracyClass: 'acc-high' | 'acc-medium' | 'acc-low';
  if (locationData.accuracy < 100) accuracyClass = 'acc-high';
  else if (locationData.accuracy < 1000) accuracyClass = 'acc-medium';
  else accuracyClass = 'acc-low';

  const onOverlayClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    if (e.target === e.currentTarget) handleCancel();
  };

  return (
    <button
      type="button"
      className={overlayClass}
      onClick={onOverlayClick}
      onKeyDown={e => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')
          handleCancel();
      }}
      aria-label="Close location verification"
    >
      <div className={overlayClass}>
        <button
          type="button"
          className="geo-verify-overlay-bg"
          onClick={handleCancel}
          aria-label="Close location verification"
        />
        <dialog
          ref={dialogRef}
          className={modalClass}
          aria-labelledby="location-dialog-title"
          aria-modal="true"
          role="dialog"
          open
        >
          <div className="geo-verify-header">
            <div className="geo-verify-icon" aria-hidden="true">
              <NavigationIcons.Location />
            </div>
            <h2 id="location-dialog-title" className="geo-verify-title">
              Use this location?
            </h2>
            <div className="geo-verify-subtitle">
              We detected your approximate position.
            </div>
          </div>

          <div className="geo-verify-details">
            <div className="geo-verify-place">
              {locationData.address?.display ||
                locationData.address?.city ||
                'Your Current Location'}
            </div>

            <div className="geo-verify-row">
              <div className="geo-verify-coords">
                {locationData.latitude.toFixed(4)},{' '}
                {locationData.longitude.toFixed(4)}
              </div>
              <div className={`geo-verify-accuracy ${accuracyClass}`}>
                <span className="geo-verify-dot">●</span>
                {formatAccuracy(locationData.accuracy)}
              </div>
            </div>
          </div>

          <div
            className={`geo-verify-actions ${isMobile ? 'is-mobile-wrap' : ''}`}
          >
            <button
              className="mobile-button-glass btn-inline-icon"
              onClick={handleCancel}
              aria-label="Cancel"
            >
              <span className="icon-inline">
                <NavigationIcons.Close />
              </span>
              <span>Cancel</span>
            </button>

            {onRetry && (
              <button
                className="mobile-button mobile-button-small btn-danger btn-inline-icon"
                onClick={handleRetry}
                aria-label="Retry"
              >
                <span className="icon-inline">
                  <NavigationIcons.Refresh />
                </span>
                <span>Retry</span>
              </button>
            )}

            <button
              className="mobile-button btn-inline-icon"
              onClick={handleConfirm}
              aria-label="Use This Location"
            >
              <span className="icon-inline">
                <NavigationIcons.Location />
              </span>
              <span>Use This Location</span>
            </button>
          </div>
        </dialog>
      </div>
    </button>
  );
};

export default GeolocationVerification;
