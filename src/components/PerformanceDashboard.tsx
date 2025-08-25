import React, { useEffect, useState } from 'react';
import { bundleSizeMonitor } from '../utils/bundleSizeMonitor';
import { offlineStorage } from '../utils/offlineWeatherStorage';
import { searchPerformanceMonitor } from '../utils/searchPerformanceMonitor';
import { useFeature4B } from '../utils/useFeature4B';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  enabled = false,
  position = 'bottom-left',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [bundleStats, setBundleStats] = useState(
    bundleSizeMonitor.getBundleStats(),
  );
  const [searchStats, setSearchStats] = useState(
    searchPerformanceMonitor.getStats(),
  );
  const [cacheStats, setCacheStats] = useState(offlineStorage.getCacheStats());

  // Feature 4B integration
  const {
    stats: _feature4BStats,
    getPerformanceRecommendations: _getPerformanceRecommendations,
    optimizeCache: _optimizeCache,
    processPendingSync: _processPendingSync,
    clearCache: _clearCache,
  } = useFeature4B();

  // Update stats periodically
  useEffect(() => {
    if (!enabled) return;

    const updateStats = () => {
      setBundleStats(bundleSizeMonitor.getBundleStats());
      setSearchStats(searchPerformanceMonitor.getStats());
      setCacheStats(offlineStorage.getCacheStats());
    };

    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const positionStyles = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
  };

  const recommendations = bundleSizeMonitor.getRecommendations();
  const isPerformanceDegrading =
    searchPerformanceMonitor.isPerformanceDegrading();

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9998,
        backgroundColor: 'rgba(16, 33, 62, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        minWidth: expanded ? '320px' : '200px',
        maxWidth: '400px',
        color: 'white',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: expanded ? '12px' : '0',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontWeight: '600' }}>📊 Performance Monitor</span>
        <span style={{ fontSize: '10px' }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <>
          {/* Performance Alerts */}
          {(isPerformanceDegrading || recommendations.length > 0) && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '12px',
                fontSize: '11px',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                ⚠️ Performance Alerts
              </div>
              {isPerformanceDegrading && (
                <div>• Search performance degrading</div>
              )}
              {recommendations.map((rec, idx) => (
                <div key={idx}>• {rec}</div>
              ))}
            </div>
          )}

          {/* Bundle Stats */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontWeight: '600',
                marginBottom: '6px',
                fontSize: '11px',
              }}
            >
              📦 Bundle Performance
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <div>
                Size:{' '}
                {bundleSizeMonitor.formatBundleSize(
                  bundleStats.averageBundleSize,
                )}
              </div>
              <div>Lazy Components: {bundleStats.totalLazyComponents}</div>
              <div>
                Avg Load Time: {bundleStats.averageLazyLoadTime.toFixed(0)}ms
              </div>
            </div>
          </div>

          {/* Search Stats */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontWeight: '600',
                marginBottom: '6px',
                fontSize: '11px',
              }}
            >
              🔍 Search Performance
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <div>Avg Latency: {searchStats.averageLatency.toFixed(0)}ms</div>
              <div>Total Searches: {searchStats.totalSearches}</div>
              <div>
                Types: {Object.keys(searchStats.searchTypes).join(', ')}
              </div>
            </div>
          </div>

          {/* Cache Stats */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontWeight: '600',
                marginBottom: '6px',
                fontSize: '11px',
              }}
            >
              🗄️ Offline Storage
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
              <div>Cached Cities: {cacheStats.cachedCities}</div>
              <div>Recent Cities: {cacheStats.recentCities}</div>
              <div>Storage Size: {cacheStats.totalSize}</div>
            </div>
          </div>

          {/* Memory Usage */}
          {bundleStats.memoryTrend.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontWeight: '600',
                  marginBottom: '6px',
                  fontSize: '11px',
                }}
              >
                🧠 Memory Usage
              </div>
              <div style={{ fontSize: '10px' }}>
                Current:{' '}
                {bundleSizeMonitor.formatBundleSize(
                  bundleStats.memoryTrend[bundleStats.memoryTrend.length - 1]
                    ?.memory || 0,
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => {
                searchPerformanceMonitor.clearMetrics();
                bundleSizeMonitor.clearMetrics();
                offlineStorage.clearAllCache();
                setCacheStats(offlineStorage.getCacheStats());
                setSearchStats(searchPerformanceMonitor.getStats());
                setBundleStats(bundleSizeMonitor.getBundleStats());
              }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
            <button
              onClick={() => offlineStorage.cleanupExpiredCache()}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Cleanup
            </button>
          </div>
        </>
      )}

      {/* Compact view */}
      {!expanded && (
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          <div>
            Bundle:{' '}
            {bundleSizeMonitor.formatBundleSize(bundleStats.averageBundleSize)}
          </div>
          <div>Search: {searchStats.averageLatency.toFixed(0)}ms</div>
          <div>Cache: {cacheStats.cachedCities} cities</div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
