/**
 * Horror Theme Feature Module
 * Lazy-loaded feature for horror theme functionality
 * Implements Friday the 13th inspired horror effects
 */

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../utils/useTheme';
import {
  initializeHorrorEffects,
  type HorrorEffectsConfig,
} from '../utils/horrorEffects';
import { HorrorQuoteDisplay } from '../components/horror/HorrorQuoteDisplay';
import '../styles/horror-theme.css';

export interface HorrorModeFeatureProps {
  enabled?: boolean;
  effectsConfig?: Partial<HorrorEffectsConfig>;
  showQuotes?: boolean;
}

/**
 * Horror Mode Feature Component
 * Encapsulates all horror theme related functionality
 */
export const HorrorModeFeature: React.FC<HorrorModeFeatureProps> = ({
  enabled = true,
  effectsConfig = {},
  showQuotes = true,
}) => {
  const { themeName } = useTheme();
  const effectsRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const isHorrorTheme = themeName === 'horror';

  useEffect(() => {
    if (!isHorrorTheme || !enabled) {
      // Cleanup effects when not in horror theme
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Initialize effects on app container
    const appElement = document.querySelector('.weather-app') as HTMLElement;
    if (appElement) {
      effectsRef.current = appElement;
      cleanupRef.current = initializeHorrorEffects(appElement, {
        flickerEnabled: true,
        flickerIntensity: 0.15,
        flickerFrequency: 3000,
        staticEnabled: false,
        staticIntensity: 0.1,
        colorShiftEnabled: true,
        ...effectsConfig,
      });
    }

    // Cleanup on unmount or theme change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isHorrorTheme, enabled, effectsConfig]);

  if (!isHorrorTheme || !enabled) {
    return null;
  }

  return (
    <>
      {showQuotes && (
        <HorrorQuoteDisplay
          autoRotate={true}
          rotateInterval={15000}
          className="horror-quote-feature"
        />
      )}
    </>
  );
};

export default HorrorModeFeature;
