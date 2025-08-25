/**
 * Enhanced Pull-to-Refresh Hook with Haptic Feedback
 *
 * Extends the basic pull-to-refresh functionality with haptic feedback integration.
 * Provides tactile feedback at key interaction points for better UX.
 */

import { useCallback } from 'react';
import { usePullToRefresh } from './usePullToRefresh';
import { useHaptic } from './hapticHooks';

interface EnhancedPullToRefreshOptions {
  maxPullDistance?: number;
  triggerDistance?: number;
  refreshThreshold?: number;
  disabled?: boolean;
  enableHaptics?: boolean;
}

/**
 * useEnhancedPullToRefresh - Custom React hook for useEnhancedPullToRefresh functionality
 */
/**
 * useEnhancedPullToRefresh - Custom React hook for useEnhancedPullToRefresh functionality
 */
export const useEnhancedPullToRefresh = (
  onRefresh: () => Promise<void>,
  options: EnhancedPullToRefreshOptions = {},
) => {
  const { enableHaptics = true, ...pullOptions } = options;

  const haptic = useHaptic();

  // Enhanced refresh handler with haptic feedback
  const enhancedOnRefresh = useCallback(async () => {
    if (enableHaptics && haptic.isSupported) {
      haptic.weatherRefresh(); // Trigger haptic feedback when refresh starts
    }

    try {
      await onRefresh();

      if (enableHaptics && haptic.isSupported) {
        haptic.success(); // Success haptic feedback when refresh completes
      }
    } catch (error) {
      if (enableHaptics && haptic.isSupported) {
        haptic.error(); // Error haptic feedback on failure
      }
      throw error;
    }
  }, [onRefresh, enableHaptics, haptic]);

  // Use the base pull-to-refresh hook with enhanced refresh handler
  const pullToRefreshProps = usePullToRefresh(enhancedOnRefresh, pullOptions);

  return {
    ...pullToRefreshProps,
    hapticEnabled: enableHaptics && haptic.isSupported,
  };
};
