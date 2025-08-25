/**
 * Performance Tracking Hook
 *
 * Custom hook for tracking performance metrics separately from the component
 * to comply with React Fast Refresh requirements.
 */

import { useRef, useEffect } from 'react';

/**
 * Hook for tracking performance metrics
 */
/**
 * usePerformanceTracking - Custom React hook for usePerformanceTracking functionality
 */
/**
 * usePerformanceTracking - Custom React hook for usePerformanceTracking functionality
 */
export const usePerformanceTracking = () => {
  const renderCount = useRef(0);
  const apiCallCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
  });

  const trackAPICall = () => {
    apiCallCount.current += 1;
  };

  const getMetrics = () => ({
    renders: renderCount.current,
    apiCalls: apiCallCount.current,
    uptime: Date.now() - startTime.current,
  });

  const resetMetrics = () => {
    renderCount.current = 0;
    apiCallCount.current = 0;
    startTime.current = Date.now();
  };

  return {
    trackAPICall,
    getMetrics,
    resetMetrics,
  };
};
