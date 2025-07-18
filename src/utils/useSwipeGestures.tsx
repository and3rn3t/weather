/**
 * Enhanced Swipe Gesture Hook
 * 
 * Advanced swipe gesture implementation with visual feedback, 
 * haptic integration, and smooth animations for mobile navigation.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useHaptic } from './hapticHooks';

export interface SwipeState {
  isDragging: boolean;
  dragOffset: number;
  dragDirection: 'left' | 'right' | null;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  dragProgress: number; // 0-1 for animation progress
}

export interface SwipeGestureOptions {
  threshold?: number; // Minimum distance to trigger swipe (default: 100px)
  maxDrag?: number; // Maximum drag distance for visual feedback (default: 150px)
  resistance?: number; // Resistance factor for over-drag (default: 0.3)
  enableVisualFeedback?: boolean; // Show visual drag feedback (default: true)
  enableHaptic?: boolean; // Enable haptic feedback (default: true)
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
}

/**
 * Enhanced swipe gesture hook with visual feedback and haptic integration
 */
export const useSwipeGestures = (options: SwipeGestureOptions = {}) => {
  const {
    threshold = 100,
    maxDrag = 150,
    resistance = 0.3,
    enableVisualFeedback = true,
    enableHaptic = true
  } = options;

  const haptic = useHaptic();
  const startPos = useRef({ x: 0, y: 0 });
  const lastHapticFeedback = useRef(0);
  const isDragging = useRef(false);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragOffset: 0,
    dragDirection: null,
    canSwipeLeft: false,
    canSwipeRight: false,
    dragProgress: 0
  });

  const calculateDragOffset = useCallback((deltaX: number): number => {
    if (Math.abs(deltaX) <= maxDrag) {
      return deltaX;
    }
    
    // Apply resistance for over-drag
    const overDrag = Math.abs(deltaX) - maxDrag;
    const resistedOverDrag = overDrag * resistance;
    return deltaX > 0 
      ? maxDrag + resistedOverDrag 
      : -(maxDrag + resistedOverDrag);
  }, [maxDrag, resistance]);

  const triggerHapticFeedback = useCallback((progress: number) => {
    if (!enableHaptic) return;
    
    const now = Date.now();
    
    // Trigger haptic at 25%, 50%, 75% progress (with rate limiting)
    if (progress >= 0.25 && progress < 0.5 && now - lastHapticFeedback.current > 100) {
      haptic.settingsChange();
      lastHapticFeedback.current = now;
    } else if (progress >= 0.75 && now - lastHapticFeedback.current > 150) {
      haptic.light();
      lastHapticFeedback.current = now;
    }
  }, [enableHaptic, haptic]);

  const createSwipeHandler = useCallback((
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    canSwipeLeft: boolean = true,
    canSwipeRight: boolean = true
  ): SwipeHandlers => {
    
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    const handleStart = (clientX: number, clientY: number) => {
      startX = clientX;
      startY = clientY;
      startPos.current = { x: clientX, y: clientY };
      isDragging.current = false;
      
      setSwipeState(prev => ({
        ...prev,
        canSwipeLeft,
        canSwipeRight
      }));
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!startX) return;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      // Only start dragging if horizontal movement is dominant
      if (!isDragging.current) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          isDragging.current = true;
          if (enableHaptic) {
            haptic.settingsChange();
          }
        } else if (Math.abs(deltaY) > 10) {
          // Vertical scroll detected, cancel gesture
          startX = 0;
          startY = 0;
          return;
        } else {
          return;
        }
      }

      // Check if swipe direction is allowed
      const direction: 'left' | 'right' = deltaX > 0 ? 'right' : 'left';
      const isAllowed = (direction === 'left' && canSwipeLeft) || 
                       (direction === 'right' && canSwipeRight);
      
      if (!isAllowed) {
        setSwipeState(prev => ({ ...prev, dragOffset: 0, dragProgress: 0 }));
        return;
      }

      if (enableVisualFeedback) {
        const dragOffset = calculateDragOffset(deltaX);
        const progress = Math.min(Math.abs(deltaX) / threshold, 1);
        
        setSwipeState(prev => ({
          ...prev,
          isDragging: true,
          dragOffset,
          dragDirection: direction,
          dragProgress: progress
        }));

        triggerHapticFeedback(progress);
      }
    };

    const handleEnd = (clientX?: number, clientY?: number) => {
      if (!startX || !isDragging.current) {
        resetSwipeState();
        return;
      }

      // Use provided coordinates or fall back to the current position
      endX = clientX || endX;
      endY = clientY || endY;
      
      const deltaX = endX - startX;
      const direction = deltaX > 0 ? 'right' : 'left';
      const distance = Math.abs(deltaX);
      
      // Check if threshold is met and direction is allowed
      if (distance >= threshold) {
        if (direction === 'left' && canSwipeLeft && onSwipeLeft) {
          if (enableHaptic) haptic.navigationSwipe();
          onSwipeLeft();
        } else if (direction === 'right' && canSwipeRight && onSwipeRight) {
          if (enableHaptic) haptic.navigationSwipe();
          onSwipeRight();
        }
      }

      resetSwipeState();
    };

    const resetSwipeState = () => {
      startX = 0;
      startY = 0;
      endX = 0;
      endY = 0;
      startPos.current = { x: 0, y: 0 };
      isDragging.current = false;
      setSwipeState({
        isDragging: false,
        dragOffset: 0,
        dragDirection: null,
        canSwipeLeft: false,
        canSwipeRight: false,
        dragProgress: 0
      });
    };

    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      },
      onTouchMove: (e: React.TouchEvent) => {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        handleEnd(endX, endY);
      },
      // Desktop support for testing
      onMouseDown: (e: React.MouseEvent) => {
        handleStart(e.clientX, e.clientY);
      },
      onMouseMove: (e: React.MouseEvent) => {
        if (e.buttons === 1) { // Only if mouse is pressed
          handleMove(e.clientX, e.clientY);
        }
      },
      onMouseUp: (e: React.MouseEvent) => {
        endX = e.clientX;
        endY = e.clientY;
        handleEnd(endX, endY);
      }
    };
  }, [
    haptic, 
    threshold, 
    enableVisualFeedback, 
    enableHaptic,
    calculateDragOffset,
    triggerHapticFeedback
  ]);

  return {
    swipeState,
    createSwipeHandler
  };
};

/**
 * Swipe indicator component for visual feedback
 */
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
  theme 
}) => {
  if (!direction || dragProgress === 0) return null;

  const opacity = Math.min(dragProgress * 2, 0.7);
  const scale = 0.8 + (dragProgress * 0.2);

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
        zIndex: 10
      }}
    >
      {direction === 'left' ? '◀' : '▶'}
    </div>
  );
};
