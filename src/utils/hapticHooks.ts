/**
 * Enhanced Haptic Feedback Hooks
 *
 * Integrates with the enhanced haptic service for both web and native haptics
 */

import { useContext } from 'react';
import { useEnhancedHaptics, type HapticConfig } from './enhancedHapticService';
import {
  HapticFeedbackContext,
  type HapticFeedbackContextType,
} from './hapticContext';

// ============================================================================
// CONTEXT HOOK
// ============================================================================

/**
 * useHapticContext - Custom React hook for hapticHooks functionality
 */
/**
 * useHapticContext - Custom React hook for hapticHooks functionality
 */
export const useHapticContext = (): HapticFeedbackContextType => {
  const context = useContext(HapticFeedbackContext);

  if (context === undefined) {
    throw new Error(
      'useHapticContext must be used within a HapticFeedbackProvider'
    );
  }

  return context;
};

// ============================================================================
// ENHANCED HAPTIC HOOK
// ============================================================================

/**
 * Enhanced haptic feedback hook that integrates both web and native haptics
 * Provides additional convenience methods and smart defaults
 */
/**
 * useHaptic - Custom React hook for hapticHooks functionality
 */
/**
 * useHaptic - Custom React hook for hapticHooks functionality
 */
export const useHaptic = (config?: HapticConfig) => {
  // Read provider with a safe fallback in dev so UI can render without provider
  let hapticCore: ReturnType<typeof useEnhancedHaptics> | undefined;
  let isSupported = false;
  let isEnabled = false;

  try {
    const ctx = useHapticContext();
    hapticCore = ctx.haptic as unknown as ReturnType<typeof useEnhancedHaptics>;
    isSupported = ctx.isSupported;
    isEnabled = ctx.isEnabled;
  } catch {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[useHaptic] provider missing, using local fallback');
    }
  }

  // Get enhanced haptics service
  const enhancedHaptics = useEnhancedHaptics(config);

  // Enhanced convenience methods with better UX patterns
  const buttonPress = () => enhancedHaptics.buttonPress();
  const buttonConfirm = () => enhancedHaptics.buttonConfirm();
  const weatherRefresh = () => enhancedHaptics.weatherRefresh();
  const searchSuccess = () => enhancedHaptics.searchSuccess();
  const searchError = () => enhancedHaptics.searchError();
  const navigationSwipe = () => enhancedHaptics.navigation();
  const settingsChange = () => enhancedHaptics.selection();
  const dataLoad = () => enhancedHaptics.weatherLoad();
  const criticalAlert = () => enhancedHaptics.heavy();

  return {
    // Core haptic functions (legacy support)
    ...(hapticCore ?? ({} as ReturnType<typeof useEnhancedHaptics>)),

    // Enhanced haptic functions
    ...enhancedHaptics,

    // App-specific convenience methods
    buttonPress,
    buttonConfirm,
    weatherRefresh,
    searchSuccess,
    searchError,
    navigationSwipe,
    settingsChange,
    dataLoad,
    criticalAlert,

    // Status information
    isSupported,
    isEnabled,

    // Enhanced capabilities
    capabilities: enhancedHaptics.getCapabilities(),
  };
};

// ============================================================================
// SPECIALIZED HAPTIC HOOKS
// ============================================================================

/**
 * Hook for weather-specific haptic feedback
 */
/**
 * useWeatherHaptics - Custom React hook for hapticHooks functionality
 */
/**
 * useWeatherHaptics - Custom React hook for hapticHooks functionality
 */
export const useWeatherHaptics = (config?: HapticConfig) => {
  const haptics = useEnhancedHaptics(config);

  return {
    weatherLoad: haptics.weatherLoad,
    weatherRefresh: haptics.weatherRefresh,
    locationFound: haptics.locationFound,
    locationError: haptics.locationError,
    searchSuccess: haptics.searchSuccess,
    searchError: haptics.searchError,
    criticalAlert: haptics.heavy,
    dataLoad: haptics.weatherLoad,
  };
};

/**
 * Hook for gesture-specific haptic feedback
 */
/**
 * useGestureHaptics - Custom React hook for hapticHooks functionality
 */
/**
 * useGestureHaptics - Custom React hook for hapticHooks functionality
 */
export const useGestureHaptics = (config?: HapticConfig) => {
  const haptics = useEnhancedHaptics(config);

  return {
    swipeStart: haptics.swipeStart,
    swipeProgress: haptics.swipeProgress,
    swipeComplete: haptics.swipeComplete,
    pullToRefresh: haptics.pullToRefresh,
    progressiveFeedback: haptics.progressiveFeedback,
    longPress: haptics.longPress,
  };
};

/**
 * Hook for UI interaction haptic feedback
 */
/**
 * useUIHaptics - Custom React hook for hapticHooks functionality
 */
/**
 * useUIHaptics - Custom React hook for hapticHooks functionality
 */
export const useUIHaptics = (config?: HapticConfig) => {
  const haptics = useEnhancedHaptics(config);

  return {
    buttonPress: haptics.buttonPress,
    buttonConfirm: haptics.buttonConfirm,
    selection: haptics.selection,
    navigation: haptics.navigation,
    success: haptics.success,
    error: haptics.error,
    warning: haptics.warning,
  };
};

// Re-export for convenience
export { useEnhancedHaptics } from './enhancedHapticService';
export { useHapticFeedback } from './useHapticFeedback';
