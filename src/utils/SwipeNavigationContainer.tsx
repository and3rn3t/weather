/**
 * Swipe Navigation Container
 *
 * A container component that provides enhanced swipe navigation between screens
 * with visual feedback, smooth animations, and haptic integration.
 */

import React from 'react';
import { useSwipeGestures } from './useSwipeGestures';
import { SwipeIndicator } from './SwipeIndicator';
import type { ThemeColors } from './themeConfig';

export interface SwipeNavigationProps {
  children: React.ReactNode;
  currentScreen: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
  theme: ThemeColors;
  isMobile: boolean;
  className?: string;
  style?: React.CSSProperties;
  swipeThreshold?: number;
  enableDesktopSupport?: boolean;
}

/**
 * Enhanced swipe navigation container with visual feedback
 */
export const SwipeNavigationContainer: React.FC<SwipeNavigationProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft = true,
  canSwipeRight = true,
  theme,
  isMobile,
  className = '',
  style = {},
  swipeThreshold = 80,
  enableDesktopSupport = false,
}) => {
  const { swipeState, createSwipeHandler } = useSwipeGestures({
    threshold: swipeThreshold,
    maxDrag: 120,
    resistance: 0.4,
    enableVisualFeedback: true,
    enableHaptic: true,
  });

  const swipeHandlers = createSwipeHandler(
    onSwipeLeft,
    onSwipeRight,
    canSwipeLeft,
    canSwipeRight
  );

  // Calculate transform for drag feedback
  const getTransform = () => {
    if (!swipeState.isDragging || !isMobile) {
      return 'translateX(0px)';
    }

    // Reduce the visual movement to be more subtle
    const offset = swipeState.dragOffset * 0.3;
    return `translateX(${offset}px)`;
  };

  // Calculate background opacity for drag feedback
  const getBackgroundOpacity = () => {
    if (!swipeState.isDragging || !isMobile) {
      return 1;
    }

    // Slightly reduce opacity during drag
    return Math.max(0.85, 1 - swipeState.dragProgress * 0.15);
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    transform: getTransform(),
    opacity: getBackgroundOpacity(),
    transition: swipeState.isDragging
      ? 'none'
      : 'transform 0.3s ease, opacity 0.3s ease',
    touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal
    overflow: 'hidden',
    ...style,
  };

  const handlers = isMobile || enableDesktopSupport ? swipeHandlers : {};

  return (
    <div className={className} style={containerStyle} {...handlers}>
      {children}

      {/* Swipe Indicators */}
      {isMobile && swipeState.isDragging && (
        <SwipeIndicator
          dragProgress={swipeState.dragProgress}
          direction={swipeState.dragDirection}
          theme={theme}
        />
      )}

      {/* Screen Navigation Hints */}
      {isMobile && !swipeState.isDragging && (
        <SwipeNavigationHints
          canSwipeLeft={canSwipeLeft}
          canSwipeRight={canSwipeRight}
          theme={theme}
        />
      )}
    </div>
  );
};

/**
 * Subtle navigation hints for users
 */
interface SwipeNavigationHintsProps {
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  theme: ThemeColors;
}

const SwipeNavigationHints: React.FC<SwipeNavigationHintsProps> = ({
  canSwipeLeft,
  canSwipeRight,
  theme,
}) => {
  return (
    <>
      {/* Left swipe hint */}
      {canSwipeLeft && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            opacity: 0.3,
            color: theme.secondaryText,
            fontSize: '16px',
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
          title="Swipe left for next screen"
        >
          ◀
        </div>
      )}

      {/* Right swipe hint */}
      {canSwipeRight && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '10px',
            transform: 'translateY(-50%)',
            opacity: 0.3,
            color: theme.secondaryText,
            fontSize: '16px',
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
            zIndex: 1,
          }}
          title="Swipe right for previous screen"
        >
          ▶
        </div>
      )}
    </>
  );
};

export default SwipeNavigationContainer;
