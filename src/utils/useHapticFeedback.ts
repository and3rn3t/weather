/**
 * Haptic Feedback Hook
 *
 * Provides tactile feedback for mobile interactions using the Web Vibration API.
 * Includes smart fallbacks and pattern-based vibrations for different interaction types.
 */

import { useCallback, useRef } from 'react';
import { logError, logInfo } from './logger';


// ============================================================================
// HAPTIC FEEDBACK PATTERNS
// ============================================================================

/**
 * HapticPattern - Haptic feedback system for mobile interactions
 */
/**
 * HapticPattern - Haptic feedback system for mobile interactions
 */
export const HapticPattern = {
  LIGHT: 'light', // 10ms - Light tap, button press
  MEDIUM: 'medium', // 20ms - Medium feedback, selection
  HEAVY: 'heavy', // 50ms - Strong feedback, success/error
  SUCCESS: 'success', // [20, 50, 20] - Success confirmation
  ERROR: 'error', // [50, 50, 50] - Error/warning
  NOTIFICATION: 'notification', // [20, 20, 20] - Notification alert
  SELECTION: 'selection', // [10, 10] - Item selection
  REFRESH: 'refresh', // [30, 30, 30] - Pull-to-refresh
  NAVIGATION: 'navigation', // 15ms - Navigation/swipe
  LONG_PRESS: 'longPress', // [50, 100, 50] - Long press activation
} as const;

export type HapticPatternType =
  (typeof HapticPattern)[keyof typeof HapticPattern];

const HAPTIC_PATTERNS: Record<HapticPatternType, number | number[]> = {
  [HapticPattern.LIGHT]: 10,
  [HapticPattern.MEDIUM]: 20,
  [HapticPattern.HEAVY]: 50,
  [HapticPattern.SUCCESS]: [20, 50, 20],
  [HapticPattern.ERROR]: [50, 50, 50],
  [HapticPattern.NOTIFICATION]: [20, 20, 20],
  [HapticPattern.SELECTION]: [10, 10],
  [HapticPattern.REFRESH]: [30, 30, 30],
  [HapticPattern.NAVIGATION]: 15,
  [HapticPattern.LONG_PRESS]: [50, 100, 50],
};

// ============================================================================
// HAPTIC FEEDBACK CONFIGURATION
// ============================================================================

export interface HapticConfig {
  enabled?: boolean;
  respectSystemSettings?: boolean;
  fallbackToAudio?: boolean;
  debugMode?: boolean;
}

interface HapticCapabilities {
  isSupported: boolean;
  isEnabled: boolean;
  userAgent: string;
  platform: string;
}

// ============================================================================
// HAPTIC FEEDBACK HOOK
// ============================================================================

/**
 * useHapticFeedback - Custom React hook for useHapticFeedback functionality
 */
/**
 * useHapticFeedback - Custom React hook for useHapticFeedback functionality
 */
export const useHapticFeedback = (config: HapticConfig = {}) => {
  const {
    enabled = true,
    respectSystemSettings = true,
    fallbackToAudio = false,
    debugMode = false,
  } = config;

  const lastVibrationTime = useRef<number>(0);
  const vibrationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // ============================================================================
  // CAPABILITY DETECTION
  // ============================================================================

  const getCapabilities = useCallback((): HapticCapabilities => {
    const hasVibrationAPI =
      typeof navigator !== 'undefined' && 'vibrate' in navigator;
    const userAgent =
      typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent.toLowerCase()
        : '';

    // Check if device likely supports haptics
    const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(
      userAgent
    );
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);

    let platform: string;
    if (isIOS) {
      platform = 'ios';
    } else if (isAndroid) {
      platform = 'android';
    } else {
      platform = 'unknown';
    }

    return {
      isSupported: hasVibrationAPI && isMobile,
      isEnabled: enabled && hasVibrationAPI,
      userAgent,
      platform,
    };
  }, [enabled]);

  // ============================================================================
  // VIBRATION CONTROL
  // ============================================================================

  const stopAllVibrations = useCallback(() => {
    // Stop current vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }

    // Clear pending vibration timeouts
    vibrationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    vibrationTimeouts.current = [];
  }, []);

  const executeVibration = useCallback(
    (pattern: number | number[]) => {
      const capabilities = getCapabilities();

      if (!capabilities.isSupported || !capabilities.isEnabled) {
        if (debugMode) {
          if (import.meta.env.DEV) {
            logInfo('🔇 Haptic feedback not available:', capabilities);
          }
        }
        return false;
      }

      // Respect rate limiting (minimum 50ms between vibrations)
      const now = Date.now();
      if (respectSystemSettings && now - lastVibrationTime.current < 50) {
        if (debugMode) {
          if (import.meta.env.DEV) {
            logInfo('🔇 Haptic feedback rate limited');
          }
        }
        return false;
      }

      try {
        // Execute vibration
        const result = navigator.vibrate(pattern);
        lastVibrationTime.current = now;

        if (debugMode) {
          if (import.meta.env.DEV) {
            logInfo('📳 Haptic feedback executed:', { pattern, result });
          }
        }

        return result;
      } catch (error) {
        if (debugMode) {
          logError('❌ Haptic feedback error:', error);
        }
        return false;
      }
    },
    [getCapabilities, respectSystemSettings, debugMode]
  );

  // ============================================================================
  // HAPTIC FEEDBACK FUNCTIONS
  // ============================================================================

  const triggerHaptic = useCallback(
    (pattern: HapticPatternType | number | number[]) => {
      let vibrationPattern: number | number[];

      if (typeof pattern === 'string' && pattern in HAPTIC_PATTERNS) {
        vibrationPattern = HAPTIC_PATTERNS[pattern as HapticPatternType];
      } else {
        vibrationPattern = pattern as number | number[];
      }

      return executeVibration(vibrationPattern);
    },
    [executeVibration]
  );

  // Convenience methods for common patterns
  const light = useCallback(
    () => triggerHaptic(HapticPattern.LIGHT),
    [triggerHaptic]
  );
  const medium = useCallback(
    () => triggerHaptic(HapticPattern.MEDIUM),
    [triggerHaptic]
  );
  const heavy = useCallback(
    () => triggerHaptic(HapticPattern.HEAVY),
    [triggerHaptic]
  );
  const success = useCallback(
    () => triggerHaptic(HapticPattern.SUCCESS),
    [triggerHaptic]
  );
  const error = useCallback(
    () => triggerHaptic(HapticPattern.ERROR),
    [triggerHaptic]
  );
  const notification = useCallback(
    () => triggerHaptic(HapticPattern.NOTIFICATION),
    [triggerHaptic]
  );
  const selection = useCallback(
    () => triggerHaptic(HapticPattern.SELECTION),
    [triggerHaptic]
  );
  const refresh = useCallback(
    () => triggerHaptic(HapticPattern.REFRESH),
    [triggerHaptic]
  );
  const navigation = useCallback(
    () => triggerHaptic(HapticPattern.NAVIGATION),
    [triggerHaptic]
  );
  const longPress = useCallback(
    () => triggerHaptic(HapticPattern.LONG_PRESS),
    [triggerHaptic]
  );

  // ============================================================================
  // AUDIO FALLBACK (Optional)
  // ============================================================================

  const playAudioFeedback = useCallback(
    (type: 'click' | 'success' | 'error' = 'click') => {
      if (!fallbackToAudio) return;

      try {
        // Create audio context for feedback sounds
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure sound based on feedback type
        switch (type) {
          case 'success':
            oscillator.frequency.value = 800;
            break;
          case 'error':
            oscillator.frequency.value = 300;
            break;
          default:
            oscillator.frequency.value = 1000;
        }

        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch {
        // Silently fail for audio fallback
      }
    },
    [fallbackToAudio]
  );

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Core functions
    triggerHaptic,
    stopAllVibrations,
    getCapabilities,

    // Convenience methods
    light,
    medium,
    heavy,
    success,
    error,
    notification,
    selection,
    refresh,
    navigation,
    longPress,

    // Audio fallback
    playAudioFeedback,

    // Utilities
    patterns: HAPTIC_PATTERNS,
    isSupported: getCapabilities().isSupported,
    isEnabled: getCapabilities().isEnabled,
  };
};

// ============================================================================
// HAPTIC FEEDBACK PROVIDER COMPONENT
// ============================================================================

export interface HapticFeedbackContextType {
  haptic: ReturnType<typeof useHapticFeedback>;
  config: HapticConfig;
}

// Export pattern enum for external use
export { HapticPattern as default };
