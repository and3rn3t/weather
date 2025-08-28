/**
 * Horror Theme Feature Module
 * Lazy-loaded feature for horror theme functionality
 */

import React from 'react';
import HorrorThemeActivator from '../components/HorrorThemeActivator';
// Horror CSS is loaded dynamically via ThemeProvider when the theme is set

export interface HorrorModeFeatureProps {
  enabled?: boolean;
}

/**
 * Horror Mode Feature Component
 * Encapsulates all horror theme related functionality
 */
export const HorrorModeFeature: React.FC<HorrorModeFeatureProps> = ({
  enabled = true,
}) => {
  // Do not render activator by default on localhost/dev to keep dev clean
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDevHost =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!enabled || isDevHost) {
    return null;
  }

  return <HorrorThemeActivator />;
};

export default HorrorModeFeature;
