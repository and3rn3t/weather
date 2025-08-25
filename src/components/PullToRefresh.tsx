/**
 * Pull to Refresh Component
 * Modern mobile pull-to-refresh with haptic feedback and smooth animations
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';
import { logError } from '../utils/logger';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  className = '',
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const { pullToRefresh, success } = useHapticFeedback();

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    },
    [disabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      if (distance > 0) {
        e.preventDefault();
        const dampedDistance = Math.min(distance * 0.6, threshold * 1.5);
        setPullDistance(dampedDistance);

        const newCanRefresh = dampedDistance >= threshold;
        if (newCanRefresh !== canRefresh) {
          setCanRefresh(newCanRefresh);
          if (newCanRefresh) {
            pullToRefresh();
          }
        }
      }
    },
    [isPulling, disabled, isRefreshing, threshold, canRefresh, pullToRefresh],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        success();
      } catch (error) {
        logError('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setCanRefresh(false);
  }, [isPulling, disabled, canRefresh, isRefreshing, onRefresh, success]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    container.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const refreshIndicatorStyle: React.CSSProperties = {
    transform: `translateY(${Math.min(pullDistance - 60, 20)}px)`,
    opacity: pullDistance > 20 ? Math.min(pullDistance / threshold, 1) : 0,
    transition: isPulling
      ? 'none'
      : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const containerStyle: React.CSSProperties = {
    transform: `translateY(${isPulling ? Math.min(pullDistance * 0.3, 30) : 0}px)`,
    transition: isPulling
      ? 'none'
      : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className="pull-to-refresh-indicator"
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: 16,
          ...refreshIndicatorStyle,
        }}
      >
        <div
          className={`refresh-icon ${isRefreshing ? 'spinning' : canRefresh ? 'ready' : ''}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--primary-color, #667eea)',
            borderTopColor: 'transparent',
            animation: isRefreshing
              ? 'spin 1s linear infinite'
              : canRefresh
                ? 'pulse 0.5s ease-in-out'
                : 'none',
            transform: canRefresh && !isRefreshing ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: 'var(--secondary-text)',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {isRefreshing
            ? 'Refreshing...'
            : canRefresh
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </span>
      </div>

      {/* Content */}
      <div style={containerStyle}>{children}</div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .pull-to-refresh-container {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
