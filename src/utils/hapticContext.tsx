/**
 * Haptic Feedback Context
 *
 * Provides global haptic feedback configuration and access throughout the app.
 * Integrates with theme system and user preferences.
 */
import React, { createContext, useMemo, type ReactNode } from 'react';
import {
  HapticPattern,
  useHapticFeedback,
  type HapticConfig,
  type HapticPatternType,
} from './useHapticFeedback';

// (dev instrumentation removed)

// ============================================================================
// HAPTIC FEEDBACK CONTEXT
// ============================================================================

interface HapticFeedbackContextType {
  haptic: ReturnType<typeof useHapticFeedback>;
  config: HapticConfig;
  isSupported: boolean;
  isEnabled: boolean;
}

// In rare cases (broken chunk on dev CDN), React might not resolve. Provide a safe fallback.
const HapticFeedbackContext = createContext<
  HapticFeedbackContextType | undefined
>(undefined);

// ============================================================================
// HAPTIC FEEDBACK PROVIDER
// ============================================================================

interface HapticFeedbackProviderProps {
  children: ReactNode;
  config?: HapticConfig;
}

export const HapticFeedbackProvider: React.FC<HapticFeedbackProviderProps> = ({
  children,
  config = {},
}) => {
  const defaultConfig: HapticConfig = useMemo(
    () => ({
      enabled: true,
      respectSystemSettings: true,
      fallbackToAudio: false,
      debugMode: process.env.NODE_ENV === 'development',
      ...config,
    }),
    [config]
  );

  const haptic = useHapticFeedback(defaultConfig);

  const contextValue = useMemo(
    () => ({
      haptic,
      config: defaultConfig,
      isSupported: haptic.isSupported,
      isEnabled: haptic.isEnabled,
    }),
    [haptic, defaultConfig]
  );

  return (
    <HapticFeedbackContext.Provider value={contextValue}>
      {children}
    </HapticFeedbackContext.Provider>
  );
};

// ============================================================================
// HAPTIC COMPONENT WRAPPER
// ============================================================================

interface HapticWrapperProps {
  children: ReactNode;
  onPress?: () => void;
  hapticPattern?: HapticPatternType;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper component that adds haptic feedback to any child element
 */
export const HapticWrapper: React.FC<HapticWrapperProps> = ({
  children,
  onPress,
  hapticPattern = HapticPattern.LIGHT,
  disabled = false,
  className,
  style,
}) => {
  // This will be used via hook in the actual implementation
  const handlePress = () => {
    if (!disabled) {
      // Execute callback
      onPress?.();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePress();
    }
  };

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={handlePress}
      onKeyDown={handleKeyPress}
      disabled={disabled}
      data-haptic-pattern={hapticPattern}
    >
      {children}
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { HapticFeedbackContext };
export type { HapticConfig, HapticFeedbackContextType };
