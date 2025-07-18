/**
 * Haptic Feedback Hooks
 * 
 * Separate file for hooks to maintain Fast Refresh compatibility
 */

import { useContext } from 'react';
import { HapticFeedbackContext, type HapticFeedbackContextType } from './hapticContext';

// ============================================================================
// CONTEXT HOOK
// ============================================================================

export const useHapticContext = (): HapticFeedbackContextType => {
  const context = useContext(HapticFeedbackContext);
  
  if (context === undefined) {
    throw new Error('useHapticContext must be used within a HapticFeedbackProvider');
  }
  
  return context;
};

// ============================================================================
// ENHANCED HAPTIC HOOK
// ============================================================================

/**
 * Enhanced haptic feedback hook that integrates with the app context
 * Provides additional convenience methods and smart defaults
 */
export const useHaptic = () => {
  const context = useHapticContext();
  const { haptic: hapticCore, isSupported, isEnabled } = context;

  // Enhanced convenience methods with better UX patterns
  const buttonPress = () => hapticCore.light();
  const buttonConfirm = () => hapticCore.medium();
  const weatherRefresh = () => hapticCore.refresh();
  const searchSuccess = () => hapticCore.success();
  const searchError = () => hapticCore.error();
  const navigationSwipe = () => hapticCore.navigation();
  const settingsChange = () => hapticCore.selection();
  const dataLoad = () => hapticCore.light();
  const criticalAlert = () => hapticCore.heavy();

  return {
    // Core haptic functions
    ...hapticCore,
    
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
    isEnabled
  };
};

// Re-export for convenience
export { useHapticFeedback } from './useHapticFeedback';
