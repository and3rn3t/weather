import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SmartCacheManager } from '../../services/mobile/SmartCacheManager';
import { logger } from '../../utils/logger';
import { offlineStorage } from '../../utils/offlineWeatherStorage';
import './OfflineStatusIndicator.css';

// Network connection interface for TypeScript
interface NetworkConnection extends EventTarget {
  type?: string;
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// Extend Navigator interface
interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
}

export interface OfflineStatusIndicatorProps {
  variant?: 'minimal' | 'detailed' | 'banner';
  position?: 'top' | 'bottom' | 'floating';
  autoHide?: boolean;
  autoHideDelay?: number;
  showCacheInfo?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  variant = 'minimal',
  position = 'top',
  autoHide = true,
  autoHideDelay = 3000,
  showCacheInfo = true,
  onStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [effectiveType, setEffectiveType] = useState<string>('unknown');
  const [ping, setPing] = useState<number | null>(null);
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    entries: 0,
    hitRate: 0,
  });
  const [isVisible, setIsVisible] = useState(true);

  // Smart cache manager instance (memoized to avoid recreating on every render)
  const smartCacheManager = useMemo(() => new SmartCacheManager(), []);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = smartCacheManager.getStats();
      const offlineStats = offlineStorage.getCacheStats();

      setCacheStats({
        size: stats.totalSize,
        entries: stats.totalEntries + offlineStats.cachedCities,
        hitRate: stats.hitRate,
      });
    } catch (error) {
      logger.error('Failed to update cache stats:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // smartCacheManager is memoized, so it's stable

  // Test network latency
  const testNetworkLatency = useCallback(async () => {
    if (!isOnline) {
      setPing(null);
      return;
    }

    try {
      const start = performance.now();
      await fetch('/vite.svg', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      const latency = Math.round(performance.now() - start);
      setPing(latency);
    } catch {
      setPing(null);
    }
  }, [isOnline]);

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    const extNavigator = navigator as ExtendedNavigator;
    const connection = extNavigator.connection;

    if (connection) {
      setEffectiveType(connection.effectiveType || 'unknown');
    }
  }, []);

  // Handle online/offline status changes
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setIsVisible(true);
    onStatusChange?.(true);
    testNetworkLatency();
    updateCacheStats();
    logger.info('Network connection restored');
  }, [onStatusChange, testNetworkLatency, updateCacheStats]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setIsVisible(true);
    onStatusChange?.(false);
    setPing(null);
    updateCacheStats();
    logger.info('Network connection lost');
  }, [onStatusChange, updateCacheStats]);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide || !isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, isVisible, isOnline]);

  // Set up event listeners
  useEffect(() => {
    const extNavigator = navigator as ExtendedNavigator;
    const connection = extNavigator.connection;

    // Network status listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Initial setup
    updateConnectionInfo();
    testNetworkLatency();
    updateCacheStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [
    handleOnline,
    handleOffline,
    updateConnectionInfo,
    testNetworkLatency,
    updateCacheStats,
  ]);

  // Don't render if hidden
  if (!isVisible) return null;

  const getConnectionQuality = () => {
    if (!isOnline) return null;
    if (ping === null) return 'unknown';
    if (ping < 100) return 'excellent';
    if (ping < 300) return 'good';
    return 'poor';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getConnectionText = () => {
    if (effectiveType !== 'unknown') {
      return `Connected via ${effectiveType.toUpperCase()}`;
    }
    return 'Connected';
  };

  const statusClasses = [
    'offline-indicator',
    variant,
    position,
    isOnline ? 'online' : 'offline',
  ].join(' ');

  if (variant === 'minimal') {
    return (
      <div className={statusClasses}>
        <div className="status-dot" />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        {!isOnline && showCacheInfo && cacheStats.entries > 0 && (
          <span className="cache-available">({cacheStats.entries} cached)</span>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={statusClasses}>
        <div className="banner-content">
          <div className="status-icon">{isOnline ? '🌐' : '📱'}</div>
          <div className="banner-text">
            {isOnline
              ? getConnectionText()
              : `Offline mode - ${cacheStats.entries} cities cached`}
          </div>
          <button
            className="close-button"
            onClick={() => setIsVisible(false)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={statusClasses}>
      <div className="status-header">
        <div className="status-dot" />
        <div className="status-info">
          <div className="status-title">
            {isOnline ? 'Connected' : 'Offline Mode'}
          </div>
          {isOnline && (
            <div className="connection-quality">
              {effectiveType !== 'unknown' && (
                <span className={`quality-indicator ${getConnectionQuality()}`}>
                  {effectiveType.toUpperCase()}
                </span>
              )}
              {ping !== null && <span className="ping">{ping}ms</span>}
            </div>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className="offline-message">
          <p>You're currently offline, but we've got you covered!</p>
          <div className="cache-info">
            <span>Cached data available</span>
            <span>•</span>
            <span>Limited functionality</span>
          </div>
        </div>
      )}

      {showCacheInfo && (
        <div className="cache-stats">
          <div className="stat">
            <div className="label">Cached Cities</div>
            <div className="value">{cacheStats.entries}</div>
          </div>
          <div className="stat">
            <div className="label">Cache Size</div>
            <div className="value">{formatSize(cacheStats.size)}</div>
          </div>
          <div className="stat">
            <div className="label">Hit Rate</div>
            <div className="value">{Math.round(cacheStats.hitRate * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
