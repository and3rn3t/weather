/**
 * Horror Theme Feature Module
 * Lazy-loaded feature for horror theme functionality
 */

import React from 'react';
import HorrorThemeActivator from '../components/HorrorThemeActivator';
import '../styles/horrorTheme.css';

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
  if (!enabled) {
    return null;
  }

  return (
    <>
      <HorrorThemeActivator />
    </>
  );
};

export default HorrorModeFeature;
