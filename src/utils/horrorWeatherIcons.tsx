/**
 * Horror Weather Icons
 * Enhanced weather icons with Friday the 13th horror theme effects
 */

import React from 'react';

export interface HorrorWeatherIconProps {
  code: number;
  size?: number;
  className?: string;
}

/**
 * Get horror-themed icon class based on weather code
 */
export const getHorrorIconClass = (code: number): string => {
  const baseClass = 'horror-weather-icon';
  
  // Special horror effects for different weather conditions
  if (code >= 61 && code <= 67) {
    return `${baseClass} horror-rain`; // Rain - blood splatter effect
  }
  if (code >= 71 && code <= 77) {
    return `${baseClass} horror-snow`; // Snow - eerie effect
  }
  if (code >= 80 && code <= 82) {
    return `${baseClass} horror-showers`; // Showers - intense effect
  }
  if (code >= 95 && code <= 99) {
    return `${baseClass} horror-storm`; // Thunderstorm - dramatic effect
  }
  if (code === 45 || code === 48) {
    return `${baseClass} horror-fog`; // Fog - mysterious effect
  }
  
  return baseClass;
};

/**
 * Horror Weather Icon Component
 * Wraps regular weather icons with horror-themed effects
 */
export const HorrorWeatherIcon: React.FC<HorrorWeatherIconProps> = ({
  code,
  size = 64,
  className = '',
}) => {
  const horrorClass = getHorrorIconClass(code);
  const combinedClass = `${horrorClass} ${className}`.trim();

  // Return a wrapper div that applies horror effects via CSS
  return (
    <div
      className={combinedClass}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
      }}
      data-weather-code={code}
      aria-label={`Horror-themed weather icon for code ${code}`}
    />
  );
};

/**
 * Horror icon styles as CSS string (for dynamic injection if needed)
 */
export const horrorIconStyles = `
  .horror-weather-icon {
    filter: drop-shadow(0 2px 4px rgba(139, 0, 0, 0.3));
    transition: filter 0.3s ease;
  }

  .horror-weather-icon.horror-rain {
    filter: drop-shadow(0 2px 6px rgba(139, 0, 0, 0.5)) 
            hue-rotate(-10deg) 
            saturate(1.2)
            brightness(0.9);
    animation: horrorRainDrip 2s ease-in-out infinite;
  }

  .horror-weather-icon.horror-storm {
    filter: drop-shadow(0 4px 12px rgba(139, 0, 0, 0.6)) 
            brightness(0.85) 
            contrast(1.15)
            saturate(1.3);
    animation: horrorStormFlash 1.5s ease-in-out infinite;
  }

  .horror-weather-icon.horror-fog {
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4)) 
            blur(1px)
            brightness(0.8)
            contrast(0.9);
    animation: horrorFogDrift 3s ease-in-out infinite;
  }

  .horror-weather-icon.horror-snow {
    filter: drop-shadow(0 2px 4px rgba(139, 0, 0, 0.3)) 
            brightness(0.95)
            contrast(1.1);
  }

  .horror-weather-icon.horror-showers {
    filter: drop-shadow(0 3px 8px rgba(139, 0, 0, 0.5)) 
            hue-rotate(-15deg) 
            saturate(1.3)
            brightness(0.9);
  }

  @keyframes horrorRainDrip {
    0%, 100% {
      filter: drop-shadow(0 2px 6px rgba(139, 0, 0, 0.5)) 
              hue-rotate(-10deg) 
              saturate(1.2)
              brightness(0.9);
    }
    50% {
      filter: drop-shadow(0 3px 8px rgba(139, 0, 0, 0.6)) 
              hue-rotate(-12deg) 
              saturate(1.3)
              brightness(0.85);
    }
  }

  @keyframes horrorStormFlash {
    0%, 100% {
      filter: drop-shadow(0 4px 12px rgba(139, 0, 0, 0.6)) 
              brightness(0.85) 
              contrast(1.15)
              saturate(1.3);
    }
    25% {
      filter: drop-shadow(0 6px 16px rgba(139, 0, 0, 0.7)) 
              brightness(1) 
              contrast(1.2)
              saturate(1.4);
    }
    50% {
      filter: drop-shadow(0 4px 12px rgba(139, 0, 0, 0.6)) 
              brightness(0.8) 
              contrast(1.1)
              saturate(1.2);
    }
    75% {
      filter: drop-shadow(0 6px 16px rgba(139, 0, 0, 0.7)) 
              brightness(0.9) 
              contrast(1.15)
              saturate(1.3);
    }
  }

  @keyframes horrorFogDrift {
    0%, 100% {
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4)) 
              blur(1px)
              brightness(0.8)
              contrast(0.9);
      opacity: 0.9;
    }
    50% {
      filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.5)) 
              blur(1.5px)
              brightness(0.75)
              contrast(0.85);
      opacity: 0.85;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .horror-weather-icon,
    .horror-weather-icon.horror-rain,
    .horror-weather-icon.horror-storm,
    .horror-weather-icon.horror-fog {
      animation: none;
    }
  }
`;

export default HorrorWeatherIcon;
