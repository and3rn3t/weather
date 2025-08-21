/**
 * Performance Monitor Component
 *
 * Tracks and displays real-time performance metrics for the weather app.
 * Useful for development and debugging performance issues.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { ThemeColors } from './themeConfig';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
  cacheHitRate: number;
  apiCallCount: number;
  lastApiCallTime: number;
}

interface PerformanceMonitorProps {
  theme: ThemeColors;
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  theme,
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    cacheHitRate: 0,
    apiCallCount: 0,
    lastApiCallTime: 0,
  });

  const [isVisible, setIsVisible] = useState(false);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const measureRender = () => {
      const now = performance.now();
      renderTimes.current.push(now);

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }

      const averageTime =
        renderTimes.current.reduce((a, b) => a + b, 0) /
        renderTimes.current.length;

      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastRenderTime: now,
        averageRenderTime: averageTime,
      }));
    };

    measureRender();
  });

  useEffect(() => {
    if (!enabled) return;

    const updateMemoryUsage = () => {
      // @ts-expect-error performance.memory is Chrome-specific API not in standard types
      if (typeof performance !== 'undefined' && performance.memory) {
        // @ts-expect-error performance.memory API typing not available
        const memoryInfo = performance.memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: theme.cardBackground,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '8px',
      padding: '8px',
      fontSize: '10px',
      color: theme.primaryText,
      fontFamily: 'monospace',
      backdropFilter: 'blur(10px)',
      opacity: isVisible ? 0.9 : 0.3,
      transition: 'opacity 0.3s ease',
      cursor: 'pointer',
      minWidth: '120px',
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '10px', right: '10px' };
    }
  };

  const formatTime = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatMemory = (mb: number) => `${mb}MB`;

  return (
    <button
      style={{
        ...getPositionStyles(),
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
      }}
      onClick={() => setIsVisible(!isVisible)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsVisible(!isVisible);
        }
      }}
      aria-label="Toggle performance monitor details"
      title="Click to toggle performance details"
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '9px' }}>
        ⚡ Performance
      </div>

      {isVisible ? (
        <div style={{ lineHeight: '1.3' }}>
          <div>Renders: {metrics.renderCount}</div>
          <div>Avg Time: {formatTime(metrics.averageRenderTime)}</div>
          <div>Last: {formatTime(metrics.lastRenderTime)}</div>
          {metrics.memoryUsage && (
            <div>Memory: {formatMemory(metrics.memoryUsage)}</div>
          )}
          <div>Cache: {(metrics.cacheHitRate * 100).toFixed(1)}%</div>
          <div>API Calls: {metrics.apiCallCount}</div>
          <div style={{ fontSize: '8px', opacity: 0.7, marginTop: '2px' }}>
            Uptime: {Math.round((Date.now() - startTime.current) / 1000)}s
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '8px' }}>{metrics.renderCount} renders</div>
      )}
    </button>
  );
};

export default PerformanceMonitor;
