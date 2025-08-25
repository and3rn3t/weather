import React, { useEffect, useRef, useState } from 'react';
import type { ThemeColors } from '../utils/themeConfig';
import { useSwipeGestures } from '../utils/useSwipeGestures';

export type TransitionDirection =
  | 'slide-left'
  | 'slide-right'
  | 'fade'
  | 'none';

interface ScreenTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  direction?: TransitionDirection;
  duration?: number;
  className?: string;
  theme: ThemeColors;
}

/**
 * ScreenTransition - Smooth animated transitions between app screens
 *
 * Features:
 * - Multiple transition types (slide, fade)
 * - Hardware-accelerated CSS transforms
 * - Configurable duration and easing
 * - Proper cleanup and memory management
 * - Mobile-optimized performance
 */
const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isActive,
  direction = 'slide-left',
  duration = 300,
  className = '',
  theme,
}) => {
  const [shouldRender, setShouldRender] = useState(isActive);
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >(isActive ? 'entered' : 'exited');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !shouldRender) {
      // Screen is becoming active
      setShouldRender(true);
      setAnimationState('entering');

      // Trigger enter animation
      requestAnimationFrame(() => {
        setAnimationState('entered');
      });
    } else if (!isActive && shouldRender) {
      // Screen is becoming inactive
      setAnimationState('exiting');

      // Wait for animation to complete before unmounting
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimationState('exited');
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, shouldRender, duration]);

  const getTransformValue = () => {
    switch (direction) {
      case 'slide-left':
        if (animationState === 'entering') return 'translateX(100%)';
        if (animationState === 'entered') return 'translateX(0)';
        if (animationState === 'exiting') return 'translateX(-100%)';
        return 'translateX(100%)';

      case 'slide-right':
        if (animationState === 'entering') return 'translateX(-100%)';
        if (animationState === 'entered') return 'translateX(0)';
        if (animationState === 'exiting') return 'translateX(100%)';
        return 'translateX(-100%)';

      case 'fade':
        return 'translateX(0)';

      default:
        return 'translateX(0)';
    }
  };

  const getOpacity = () => {
    if (direction === 'fade') {
      if (animationState === 'entering') return 0;
      if (animationState === 'entered') return 1;
      if (animationState === 'exiting') return 0;
      return 0;
    }

    // For slide transitions, maintain opacity except during transitions
    if (animationState === 'entering') return 0.9;
    if (animationState === 'entered') return 1;
    if (animationState === 'exiting') return 0.9;
    return 0;
  };

  if (!shouldRender) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 'calc(100dvh - 80px)', // Account for navigation bar
    transform: getTransformValue(),
    opacity: getOpacity(),
    transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,

    // Performance optimizations
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    WebkitTransformStyle: 'preserve-3d',

    // Ensure content doesn't overflow during transitions
    overflow: 'hidden',

    // Z-index management
    zIndex: isActive ? 10 : 1,

    // Background for smooth transitions
    background: theme.appBackground,

    // Prevent interaction during transitions
    pointerEvents: animationState === 'entered' ? 'auto' : 'none',
  };

  return (
    <div
      className={`screen-transition ${className}`}
      style={containerStyle}
      data-transition-state={animationState}
      data-direction={direction}
    >
      {children}
    </div>
  );
};

interface ScreenContainerProps {
  currentScreen: string;
  screens: Record<string, React.ReactNode>;
  transitionDirection?: TransitionDirection;
  transitionDuration?: number;
  theme: ThemeColors;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableSwipeGestures?: boolean;
}

/**
 * ScreenContainer - Container for managing multiple screens with transitions
 *
 * Features:
 * - Manages multiple screens with smooth transitions
 * - Automatic direction detection based on screen order
 * - Memory efficient - only renders active and transitioning screens
 * - Proper cleanup of inactive screens
 * - Optional swipe gesture navigation for mobile
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  currentScreen,
  screens,
  transitionDirection = 'slide-left',
  transitionDuration = 300,
  theme,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  enableSwipeGestures = false,
}) => {
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);
  const screenOrder = Object.keys(screens);

  // Swipe gesture integration
  const { swipeState, createSwipeHandler } = useSwipeGestures({
    threshold: 50,
    maxDrag: 120,
    resistance: 0.4,
    enableVisualFeedback: true,
    enableHaptic: true,
  });

  const swipeHandlers =
    enableSwipeGestures && (onSwipeLeft || onSwipeRight)
      ? createSwipeHandler(
          onSwipeLeft || (() => {}),
          onSwipeRight || (() => {}),
          !!onSwipeLeft,
          !!onSwipeRight,
        )
      : {};

  useEffect(() => {
    setPreviousScreen(currentScreen);
  }, [currentScreen]);

  const getDirection = (
    from: string | null,
    to: string,
  ): TransitionDirection => {
    if (!from || transitionDirection !== 'slide-left') {
      return transitionDirection;
    }

    const fromIndex = screenOrder.indexOf(from);
    const toIndex = screenOrder.indexOf(to);

    if (fromIndex < toIndex) {
      return 'slide-left';
    } else if (fromIndex > toIndex) {
      return 'slide-right';
    }

    return 'slide-left';
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 'calc(100dvh - 80px)', // Account for navigation bar
    overflow: 'hidden',

    // Ensure container takes full space
    flex: 1,
    display: 'flex',
    flexDirection: 'column',

    // Performance optimization
    isolation: 'isolate',

    // Swipe gesture support
    touchAction: enableSwipeGestures ? 'pan-y' : 'auto',

    // Visual feedback during swipe
    transform:
      swipeState?.isDragging && enableSwipeGestures
        ? `translateX(${swipeState.dragOffset * 0.1}px)`
        : 'translateX(0px)',
    transition: swipeState?.isDragging ? 'none' : 'transform 0.3s ease',
  };

  return (
    <div
      className={`screen-container ${className}`}
      style={containerStyle}
      {...(enableSwipeGestures ? swipeHandlers : {})}
    >
      {Object.entries(screens).map(([screenId, screenContent]) => (
        <ScreenTransition
          key={screenId}
          isActive={currentScreen === screenId}
          direction={getDirection(previousScreen, screenId)}
          duration={transitionDuration}
          theme={theme}
        >
          {screenContent}
        </ScreenTransition>
      ))}
    </div>
  );
};

export default ScreenTransition;
