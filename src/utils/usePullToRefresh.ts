/**
 * Pull-to-Refresh Hook
 * 
 * Implements native mobile pull-to-refresh behavior for React components.
 * Provides smooth animations and haptic-like feedback for enhanced UX.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface PullToRefreshOptions {
  maxPullDistance?: number;
  triggerDistance?: number;
  refreshThreshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  options: PullToRefreshOptions = {}
) => {
  const {
    maxPullDistance = 120,
    triggerDistance = 70,
    refreshThreshold = 60,
    disabled = false
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const touchStartY = useRef<number>(0);
  const lastTouchY = useRef<number>(0);
  const scrollElement = useRef<HTMLElement | null>(null);

  // Reset state helper
  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPulling: false,
      pullDistance: 0,
      canRefresh: false
    }));
    touchStartY.current = 0;
    lastTouchY.current = 0;
  }, []);

  // Check if element is at top and can be pulled
  const canPull = useCallback(() => {
    if (disabled) return false;
    
    // Check if we're at the top of the scroll container
    const scrollTop = scrollElement.current?.scrollTop ?? window.scrollY;
    return scrollTop <= 0;
  }, [disabled]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    if (canPull()) {
      touchStartY.current = e.touches[0].clientY;
      lastTouchY.current = e.touches[0].clientY;
      setState(prev => ({ ...prev, isPulling: true }));
    }
  }, [disabled, state.isRefreshing, canPull]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || state.isRefreshing || !state.isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    
    // Only proceed if pulling down and still at top
    if (deltaY > 0 && canPull()) {
      // Apply resistance curve for natural feel
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, maxPullDistance);
      
      setState(prev => ({
        ...prev,
        pullDistance: distance,
        canRefresh: distance >= refreshThreshold
      }));
      
      // Prevent scrolling when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      resetState();
    }
    
    lastTouchY.current = currentY;
  }, [disabled, state.isRefreshing, state.isPulling, canPull, maxPullDistance, refreshThreshold, resetState]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || state.isRefreshing || !state.isPulling) return;
    
    if (state.canRefresh && state.pullDistance >= refreshThreshold) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: triggerDistance // Snap to trigger position
      }));
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      resetState();
    }
  }, [disabled, state.isRefreshing, state.isPulling, state.canRefresh, state.pullDistance, refreshThreshold, triggerDistance, onRefresh, resetState]);

  // Touch event handlers
  const pullToRefreshHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  // Register scroll element for better pull detection
  const registerScrollElement = useCallback((element: HTMLElement | null) => {
    scrollElement.current = element;
  }, []);

  // Get pull indicator props for styling
  const getPullIndicatorStyle = useCallback((baseStyle: React.CSSProperties = {}) => {
    const { pullDistance, isRefreshing, canRefresh } = state;
    
    return {
      ...baseStyle,
      transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
      opacity: Math.min(pullDistance / refreshThreshold, 1),
      transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
      color: canRefresh ? '#10b981' : '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center' as const,
      padding: '8px',
      pointerEvents: 'none' as const,
    };
  }, [state, refreshThreshold]);

  // Get refresh icon rotation
  const getRefreshIconRotation = useCallback(() => {
    const { pullDistance, isRefreshing, canRefresh } = state;
    
    if (isRefreshing) {
      return 'rotate(360deg)';
    }
    
    if (canRefresh) {
      return 'rotate(180deg)';
    }
    
    return `rotate(${Math.min((pullDistance / refreshThreshold) * 180, 180)}deg)`;
  }, [state, refreshThreshold]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  return {
    // State
    ...state,
    
    // Handlers
    pullToRefreshHandlers,
    registerScrollElement,
    
    // Styling helpers
    getPullIndicatorStyle,
    getRefreshIconRotation,
    
    // Progress calculation
    pullProgress: Math.min(state.pullDistance / refreshThreshold, 1),
    
    // Manual controls
    resetState,
  };
};

export default usePullToRefresh;
