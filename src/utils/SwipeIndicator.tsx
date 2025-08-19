/**
 * Swipe Indicator Component
 *
 * Visual feedback component for swipe gestures
 */

import React from 'react';

export interface SwipeIndicatorProps {
  dragProgress: number;
  direction: 'left' | 'right' | null;
  theme: {
    secondaryText: string;
  };
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  dragProgress,
  direction,
  theme,
}) => {
  if (!direction || dragProgress === 0) return null;

  const opacity = Math.min(dragProgress * 2, 0.7);
  const scale = 0.8 + dragProgress * 0.2;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        [direction === 'left' ? 'right' : 'left']: '20px',
        transform: `translateY(-50%) scale(${scale})`,
        opacity,
        color: theme.secondaryText,
        fontSize: '24px',
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {direction === 'left' ? '◀' : '▶'}
    </div>
  );
};

export default SwipeIndicator;
