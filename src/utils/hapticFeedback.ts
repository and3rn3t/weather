/**
 * Haptic Feedback Utility for Mobile Weather App
 * Provides native haptic feedback for enhanced mobile UX
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

class HapticFeedbackManager {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      // Check if running in Capacitor environment
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        this.isAvailable = true;
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticType = 'light'): Promise<void> {
    if (!this.isAvailable) {
      // Fallback for web - subtle visual feedback
      this.webFallback(type);
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionStart();
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
      this.webFallback(type);
    }
  }

  /**
   * Web fallback using vibration API
   */
  private webFallback(type: HapticType): void {
    if ('vibrate' in navigator) {
      const patterns: Record<HapticType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 50,
        success: [10, 50, 10],
        warning: [20, 100, 20],
        error: [50, 100, 50, 100, 50],
        selection: 5,
      };
      
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * Button press feedback
   */
  async buttonPress(): Promise<void> {
    return this.trigger('light');
  }

  /**
   * Success action feedback
   */
  async success(): Promise<void> {
    return this.trigger('success');
  }

  /**
   * Error feedback
   */
  async error(): Promise<void> {
    return this.trigger('error');
  }

  /**
   * Selection feedback
   */
  async selection(): Promise<void> {
    return this.trigger('selection');
  }

  /**
   * Pull to refresh feedback
   */
  async pullToRefresh(): Promise<void> {
    return this.trigger('medium');
  }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedbackManager();

// React hook for haptic feedback
export const useHapticFeedback = () => {
  return {
    trigger: hapticFeedback.trigger.bind(hapticFeedback),
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    selection: hapticFeedback.selection.bind(hapticFeedback),
    pullToRefresh: hapticFeedback.pullToRefresh.bind(hapticFeedback),
  };
};
