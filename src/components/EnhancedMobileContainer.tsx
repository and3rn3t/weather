/**
 * Enhanced Mobile Container Component
 *
 * Provides better mobile UX patterns including:
 * - Improved touch targets
 * - Better responsive layout
 * - Enhanced animations
 * - Gesture support
 * - Safe area handling
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDash0Telemetry } from '../dash0/hooks/useDash0Telemetry';
import '../styles/mobileEnhancements.css';
import { useTheme } from '../utils/useTheme';

interface EnhancedMobileContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  enableSwipeGestures?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const EnhancedMobileContainer: React.FC<EnhancedMobileContainerProps> = ({
  children,
  className = '',
  style = {},
  enablePullToRefresh = false,
  onRefresh,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { theme } = useTheme();
  const telemetry = useDash0Telemetry();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  // Touch state for gestures
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Pull to refresh logic
  useEffect(() => {
    if (!enablePullToRefresh || !containerRef.current) return;

    const container = containerRef.current;
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;

        // Track pull-to-refresh initiation
        telemetry.trackUserInteraction({
          action: 'pull_to_refresh_started',
          component: 'EnhancedMobileContainer',
          metadata: {
            scrollPosition: container.scrollTop,
            startY: Math.round(startY),
            hasRefreshHandler: !!onRefresh,
          },
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY - startY);
      const maxPull = 120;
      const progress = Math.min(pullDistance / maxPull, 1);

      setPullProgress(progress);

      if (pullDistance > 0) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(
          pullDistance * 0.5,
          60
        )}px)`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      const pullTriggered = pullProgress >= 0.6;

      // Track pull-to-refresh completion
      telemetry.trackUserInteraction({
        action: 'pull_to_refresh_completed',
        component: 'EnhancedMobileContainer',
        metadata: {
          pullProgress: Math.round(pullProgress * 100),
          triggered: pullTriggered,
          hasRefreshHandler: !!onRefresh,
          wasRefreshing: isRefreshing,
        },
      });

      if (pullTriggered) {
        telemetry.trackMetric({
          name: 'pull_to_refresh_trigger',
          value: 1,
          tags: {
            progress: String(Math.round(pullProgress * 100)),
            has_handler: String(!!onRefresh),
          },
        });
      }

      isPulling = false;
      container.style.transform = '';

      if (pullTriggered && onRefresh && !isRefreshing) {
        setIsRefreshing(true);
        const refreshStartTime = performance.now();

        try {
          await onRefresh();

          // Track successful refresh
          const refreshDuration = performance.now() - refreshStartTime;
          telemetry.trackMetric({
            name: 'pull_to_refresh_success',
            value: 1,
            tags: {
              duration_ms: String(Math.round(refreshDuration)),
              method: 'pull_gesture',
            },
          });
        } catch (error) {
          // Track refresh error
          telemetry.trackError(error as Error, {
            context: 'pull_to_refresh_error',
            metadata: { method: 'pull_gesture' },
          });
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullProgress(0);
    };

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
  }, [enablePullToRefresh, onRefresh, pullProgress, isRefreshing]);

  // Swipe gesture logic
  useEffect(() => {
    if (!enableSwipeGestures || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      lastTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !lastTouchRef.current) return;

      const deltaX = lastTouchRef.current.x - touchStartRef.current.x;
      const deltaY = Math.abs(lastTouchRef.current.y - touchStartRef.current.y);
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Swipe detection thresholds
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;
      const maxVerticalMovement = 100;

      const isValidSwipe =
        Math.abs(deltaX) > minSwipeDistance &&
        deltaY < maxVerticalMovement &&
        deltaTime < maxSwipeTime;

      // Track swipe attempt
      telemetry.trackUserInteraction({
        action: 'swipe_gesture_attempt',
        component: 'EnhancedMobileContainer',
        metadata: {
          deltaX: Math.round(deltaX),
          deltaY: Math.round(deltaY),
          deltaTime,
          isValidSwipe,
          direction: deltaX > 0 ? 'right' : 'left',
          hasHandlers: { left: !!onSwipeLeft, right: !!onSwipeRight },
        },
      });

      if (isValidSwipe) {
        const direction = deltaX > 0 ? 'right' : 'left';
        const hasHandler =
          direction === 'right' ? !!onSwipeRight : !!onSwipeLeft;

        // Track successful swipe
        telemetry.trackUserInteraction({
          action: 'swipe_gesture_success',
          component: 'EnhancedMobileContainer',
          metadata: {
            direction,
            distance: Math.round(Math.abs(deltaX)),
            speed: Math.round((Math.abs(deltaX) / deltaTime) * 1000), // pixels per second
            hasHandler,
          },
        });

        telemetry.trackMetric({
          name: 'swipe_gesture',
          value: 1,
          tags: {
            direction,
            distance_bucket: Math.abs(deltaX) > 100 ? 'long' : 'short',
            speed_bucket:
              (Math.abs(deltaX) / deltaTime) * 1000 > 500 ? 'fast' : 'slow',
          },
        });

        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Track failed swipe attempt
        let failureReason = 'unknown';
        if (Math.abs(deltaX) <= minSwipeDistance)
          failureReason = 'insufficient_distance';
        else if (deltaY >= maxVerticalMovement) failureReason = 'too_vertical';
        else if (deltaTime >= maxSwipeTime) failureReason = 'too_slow';

        telemetry.trackUserInteraction({
          action: 'swipe_gesture_failed',
          component: 'EnhancedMobileContainer',
          metadata: {
            reason: failureReason,
            deltaX: Math.round(deltaX),
            deltaY: Math.round(deltaY),
            deltaTime,
          },
        });
      }

      touchStartRef.current = null;
      lastTouchRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableSwipeGestures, onSwipeLeft, onSwipeRight]);

  const containerStyle: React.CSSProperties = {
    background: theme.appBackground,
    color: theme.primaryText,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`mobile-app-container ${className}`}
      style={containerStyle}
    >
      {/* Pull to refresh indicator */}
      {enablePullToRefresh && pullProgress > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: pullProgress,
            transition: 'opacity 0.1s ease',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: `2px solid ${theme.secondaryText}`,
              borderTop: `2px solid ${theme.primaryText}`,
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              transform: `rotate(${pullProgress * 360}deg)`,
              marginBottom: '8px',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              color: theme.secondaryText,
              fontWeight: '500',
            }}
          >
            {(() => {
              if (isRefreshing) return 'Refreshing...';
              if (pullProgress >= 0.6) return 'Release to refresh';
              return 'Pull to refresh';
            })()}
          </span>
        </div>
      )}

      <div className="mobile-content-area">{children}</div>
    </div>
  );
};

export default EnhancedMobileContainer;
