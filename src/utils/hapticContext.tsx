/**
 * Haptic Feedback Context
 *
 * Provides global haptic feedback configuration and access throughout the app.
 * Integrates with theme system and user preferences.
 */
import type { ReactNode } from 'react';
import { createContext, useMemo } from 'react';
import {
  HapticPattern,
  useHapticFeedback,
  type HapticConfig,
  type HapticPatternType,
} from './useHapticFeedback';

// Dev instrumentation to verify React imports at runtime
if (import.meta?.env?.DEV) {
  // eslint-disable-next-line no-console
  console.log('[hapticContext] typeof createContext =', typeof createContext);
}

// ============================================================================
// HAPTIC FEEDBACK CONTEXT
// ============================================================================

interface HapticFeedbackContextType {
  haptic: ReturnType<typeof useHapticFeedback>;
  config: HapticConfig;
  isSupported: boolean;
  isEnabled: boolean;
}

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
