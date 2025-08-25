/**
 * Location Performance Monitor
 *
 * Tracks and displays location request performance for user feedback
 */

import { useCallback, useState } from 'react';
import { logInfo } from './logger';

interface PerformanceMetrics {
  requestStartTime: number;
  locationAcquiredTime?: number;
  reverseGeocodingTime?: number;
  totalTime?: number;
  accuracy?: number;
  fromCache?: boolean;
}

export function useLocationPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    const startTime = Date.now();
    setIsMonitoring(true);
    setMetrics({
      requestStartTime: startTime,
    });
    logInfo('📊 Location performance monitoring started');
    return startTime;
  }, []);

  const recordLocationAcquired = useCallback(
    (accuracy: number, fromCache = false) => {
      const now = Date.now();
      setMetrics(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          locationAcquiredTime: now,
          accuracy,
          fromCache,
        };
        logInfo(`📍 Location acquired in ${now - prev.requestStartTime}ms`, {
          accuracy,
          fromCache,
        });
        return updated;
      });
    },
    [],
  );

  const recordReverseGeocoding = useCallback(() => {
    const now = Date.now();
    setMetrics(prev => {
      if (!prev) return null;
      return {
        ...prev,
        reverseGeocodingTime: now,
      };
    });
  }, []);

  const finishMonitoring = useCallback(() => {
    const now = Date.now();
    setMetrics(prev => {
      if (!prev) return null;
      const final = {
        ...prev,
        totalTime: now - prev.requestStartTime,
      };

      logInfo(`✅ Location request completed in ${final.totalTime}ms`, {
        locationTime: final.locationAcquiredTime
          ? final.locationAcquiredTime - prev.requestStartTime
          : 'N/A',
        geocodingTime:
          final.reverseGeocodingTime && final.locationAcquiredTime
            ? final.reverseGeocodingTime - final.locationAcquiredTime
            : 'N/A',
        totalTime: final.totalTime,
        accuracy: final.accuracy,
        fromCache: final.fromCache,
      });

      return final;
    });
    setIsMonitoring(false);
  }, []);

  const reset = useCallback(() => {
    setMetrics(null);
    setIsMonitoring(false);
  }, []);

  const getPerformanceFeedback = useCallback(() => {
    if (!metrics?.totalTime) return null;

    const { totalTime, fromCache } = metrics;

    if (fromCache) {
      return {
        message: '⚡ Instant location (cached)',
        level: 'excellent' as const,
        time: totalTime,
      };
    }

    if (totalTime < 3000) {
      return {
        message: '🚀 Super fast location',
        level: 'excellent' as const,
        time: totalTime,
      };
    } else if (totalTime < 5000) {
      return {
        message: '⚡ Fast location',
        level: 'good' as const,
        time: totalTime,
      };
    } else if (totalTime < 8000) {
      return {
        message: '📍 Location found',
        level: 'acceptable' as const,
        time: totalTime,
      };
    } else {
      return {
        message: '⏳ Slow location response',
        level: 'slow' as const,
        time: totalTime,
      };
    }
  }, [metrics]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    recordLocationAcquired,
    recordReverseGeocoding,
    finishMonitoring,
    reset,
    getPerformanceFeedback,
  };
}
