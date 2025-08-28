/**
 * Pull-to-Refresh Component
 *
 * A reusable component that wraps content with pull-to-refresh functionality.
 * Provides visual feedback and smooth animations for mobile users.
 */

import React from 'react';
import { usePullToRefresh } from './usePullToRefresh';
import { useTheme } from './useTheme';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PullToRefreshIndicator: React.FC<{
  pullProgress: number;
  isRefreshing: boolean;
  canRefresh: boolean;
  style: React.CSSProperties;
  rotation: string;
}> = ({ pullProgress, isRefreshing, canRefresh, style, rotation }) => {
  const { theme } = useTheme();

  const getIndicatorText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (canRefresh) return 'Release to refresh';
    return 'Pull to refresh';
  };

  const getIndicatorIcon = () => {
    if (isRefreshing) {
      return (
        <div
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${theme.secondaryText}`,
            borderTop: `2px solid ${theme.primaryText}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '4px',
          }}
        />
      );
    }

    return (
      <div
        style={{
          fontSize: '20px',
          transform: rotation,
          transition: 'transform 0.2s ease',
          marginBottom: '4px',
          color: canRefresh ? '#10b981' : theme.secondaryText,
        }}
      >
        ↓
      </div>
    );
  };

  return (
    <div style={style}>
      {getIndicatorIcon()}
      <div
        style={{
          color: canRefresh ? '#10b981' : theme.secondaryText,
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        {getIndicatorText()}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '40px',
          height: '2px',
          backgroundColor: `${theme.secondaryText}30`,
          borderRadius: '1px',
          marginTop: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pullProgress * 100}%`,
            height: '100%',
            backgroundColor: canRefresh ? '#10b981' : theme.primaryText,
            transition: 'width 0.1s ease, background-color 0.2s ease',
            borderRadius: '1px',
          }}
        />
      </div>
    </div>
  );
};

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  disabled = false,
  children,
  className,
  style,
}) => {
  const {
    isPulling,
    isRefreshing,
    canRefresh,
    pullProgress,
    pullToRefreshHandlers,
    registerScrollElement,
    getPullIndicatorStyle,
    getRefreshIconRotation,
  } = usePullToRefresh(onRefresh, { disabled });

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    registerScrollElement(containerRef.current);
  }, [registerScrollElement]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
      {...pullToRefreshHandlers}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            zIndex: 5, // keep low so it doesn't hover above nav or buttons
            ...getPullIndicatorStyle({
              transform: 'translateX(-50%)',
            }),
          }}
        >
          <PullToRefreshIndicator
            pullProgress={pullProgress}
            isRefreshing={isRefreshing}
            canRefresh={canRefresh}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            rotation={getRefreshIconRotation()}
          />
        </div>
      )}

      {/* Content with padding to account for pull indicator */}
      <div
        style={{
          paddingTop: isRefreshing ? '60px' : '0',
          transition: 'padding-top 0.3s ease',
          minHeight: '100%',
        }}
      >
        {children}
      </div>

      {/* Add spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
