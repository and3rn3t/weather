/**
 * Horror-Themed Weather Icons
 * Inspired by classic horror movies and spooky atmosphere
 * Features blood effects, gothic designs, and eerie animations
 */

import React from 'react';

// Simple horror weather icon component using FontAwesome-style approach
export const HorrorWeatherIcon: React.FC<{
  code: number;
  size?: number;
  isDay?: boolean;
  animated?: boolean;
}> = ({ code, size = 48, isDay = true, animated = true }) => {
  const getHorrorIcon = () => {
    const baseStyle: React.CSSProperties = {
      fontSize: `${size}px`,
      color: '#ff6b6b',
      textShadow: '0 0 10px rgba(139, 0, 0, 0.8)',
      filter: animated ? 'drop-shadow(0 0 10px rgba(139, 0, 0, 0.6))' : 'none',
      transition: 'all 0.3s ease',
    };

    // Map weather codes to horror-themed emoji/symbols
    if (code === 0 && isDay) {
      return <span style={baseStyle}>☠️</span>; // Evil sun
    }
    if (code === 0 && !isDay) {
      return <span style={baseStyle}>🌙</span>; // Blood moon
    }
    if (code >= 1 && code <= 3) {
      return <span style={baseStyle}>☁️</span>; // Ominous clouds
    }
    if (code >= 45 && code <= 48) {
      return <span style={baseStyle}>👻</span>; // Ghostly fog
    }
    if (code >= 51 && code <= 67) {
      return <span style={baseStyle}>🩸</span>; // Blood rain
    }
    if (code >= 71 && code <= 77) {
      return <span style={baseStyle}>❄️</span>; // Deadly snow
    }
    if (code >= 95 && code <= 99) {
      return <span style={baseStyle}>⚡</span>; // Evil lightning
    }

    // Default
    return <span style={baseStyle}>☁️</span>;
  };

  return (
    <div
      className={animated ? 'horror-icon-animated' : ''}
      style={{ display: 'inline-block' }}
    >
      {getHorrorIcon()}
    </div>
  );
};

// Helper function was previously exported but is unused; removed to satisfy
// react-refresh/only-export-components.

// Horror weather icon CSS animations
export const horrorIconStyles = `
.horror-icon-animated {
  animation: horrorFloat 3s ease-in-out infinite;
}

.horror-lightning {
  animation: horrorFlicker 0.5s infinite;
}

.blood-rain-drop {
  animation: bloodDrop 1s ease-in infinite;
  animation-delay: calc(var(--i) * 0.2s);
}

.ash-flake {
  animation: ashFall 3s ease-in infinite;
  animation-delay: calc(var(--i) * 0.3s);
}

.horror-fog-layer {
  animation: fogDrift 4s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.5s);
}

@keyframes horrorFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

@keyframes horrorFlicker {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
}

@keyframes bloodDrop {
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(20px); opacity: 0; }
}

@keyframes ashFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  50% { opacity: 0.7; }
  100% { transform: translateY(30px) rotate(180deg); opacity: 0; }
}

@keyframes fogDrift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}
`;
