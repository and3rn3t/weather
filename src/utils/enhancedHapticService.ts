/**
 * Enhanced Haptic Feedback Service
 * 
 * Integrates both web Vibration API and Capacitor native haptics
 * with smart fallbacks, advanced patterns, and progressive feedback.
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// ============================================================================
// HAPTIC PATTERNS & CONFIGURATION
// ============================================================================

export const HapticPattern = {
  // Basic patterns
  LIGHT: 'light',
  MEDIUM: 'medium', 
  HEAVY: 'heavy',
  
  // Success/Error patterns
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  
  // Interactive patterns
  BUTTON_PRESS: 'buttonPress',
  BUTTON_CONFIRM: 'buttonConfirm',
  SELECTION: 'selection',
  REFRESH: 'refresh',
  NAVIGATION: 'navigation',
  LONG_PRESS: 'longPress',
  
  // Weather-specific patterns
  WEATHER_LOAD: 'weatherLoad',
  WEATHER_REFRESH: 'weatherRefresh',
  SEARCH_SUCCESS: 'searchSuccess',
  SEARCH_ERROR: 'searchError',
  LOCATION_FOUND: 'locationFound',
  LOCATION_ERROR: 'locationError',
  
  // Gesture patterns
  SWIPE_START: 'swipeStart',
  SWIPE_PROGRESS: 'swipeProgress',
  SWIPE_COMPLETE: 'swipeComplete',
  PULL_TO_REFRESH: 'pullToRefresh',
  
  // Progressive patterns
  PROGRESSIVE_LIGHT: 'progressiveLight',
  PROGRESSIVE_MEDIUM: 'progressiveMedium',
  PROGRESSIVE_HEAVY: 'progressiveHeavy'
} as const;

export type HapticPatternType = typeof HapticPattern[keyof typeof HapticPattern];

// Web Vibration API patterns (fallback)
const WEB_VIBRATION_PATTERNS: Record<HapticPatternType, number | number[]> = {
  [HapticPattern.LIGHT]: 10,
  [HapticPattern.MEDIUM]: 20,
  [HapticPattern.HEAVY]: 50,
  [HapticPattern.SUCCESS]: [20, 50, 20],
  [HapticPattern.ERROR]: [50, 50, 50],
  [HapticPattern.WARNING]: [30, 30, 30],
  [HapticPattern.BUTTON_PRESS]: 10,
  [HapticPattern.BUTTON_CONFIRM]: 20,
  [HapticPattern.SELECTION]: [10, 10],
  [HapticPattern.REFRESH]: [30, 30, 30],
  [HapticPattern.NAVIGATION]: 15,
  [HapticPattern.LONG_PRESS]: [50, 100, 50],
  [HapticPattern.WEATHER_LOAD]: 15,
  [HapticPattern.WEATHER_REFRESH]: [25, 25, 25],
  [HapticPattern.SEARCH_SUCCESS]: [20, 50, 20],
  [HapticPattern.SEARCH_ERROR]: [50, 50, 50],
  [HapticPattern.LOCATION_FOUND]: [15, 15],
  [HapticPattern.LOCATION_ERROR]: [50, 50, 50],
  [HapticPattern.SWIPE_START]: 5,
  [HapticPattern.SWIPE_PROGRESS]: 10,
  [HapticPattern.SWIPE_COMPLETE]: 20,
  [HapticPattern.PULL_TO_REFRESH]: [20, 20, 20],
  [HapticPattern.PROGRESSIVE_LIGHT]: 10,
  [HapticPattern.PROGRESSIVE_MEDIUM]: 20,
  [HapticPattern.PROGRESSIVE_HEAVY]: 50
};

// Capacitor native patterns
const NATIVE_PATTERNS: Record<HapticPatternType, { impact?: ImpactStyle; notification?: NotificationType }> = {
  [HapticPattern.LIGHT]: { impact: ImpactStyle.Light },
  [HapticPattern.MEDIUM]: { impact: ImpactStyle.Medium },
  [HapticPattern.HEAVY]: { impact: ImpactStyle.Heavy },
  [HapticPattern.SUCCESS]: { notification: NotificationType.Success },
  [HapticPattern.ERROR]: { notification: NotificationType.Error },
  [HapticPattern.WARNING]: { notification: NotificationType.Warning },
  [HapticPattern.BUTTON_PRESS]: { impact: ImpactStyle.Light },
  [HapticPattern.BUTTON_CONFIRM]: { impact: ImpactStyle.Medium },
  [HapticPattern.SELECTION]: { impact: ImpactStyle.Light },
  [HapticPattern.REFRESH]: { impact: ImpactStyle.Medium },
  [HapticPattern.NAVIGATION]: { impact: ImpactStyle.Light },
  [HapticPattern.LONG_PRESS]: { impact: ImpactStyle.Heavy },
  [HapticPattern.WEATHER_LOAD]: { impact: ImpactStyle.Light },
  [HapticPattern.WEATHER_REFRESH]: { impact: ImpactStyle.Medium },
  [HapticPattern.SEARCH_SUCCESS]: { notification: NotificationType.Success },
  [HapticPattern.SEARCH_ERROR]: { notification: NotificationType.Error },
  [HapticPattern.LOCATION_FOUND]: { notification: NotificationType.Success },
  [HapticPattern.LOCATION_ERROR]: { notification: NotificationType.Error },
  [HapticPattern.SWIPE_START]: { impact: ImpactStyle.Light },
  [HapticPattern.SWIPE_PROGRESS]: { impact: ImpactStyle.Light },
  [HapticPattern.SWIPE_COMPLETE]: { impact: ImpactStyle.Medium },
  [HapticPattern.PULL_TO_REFRESH]: { impact: ImpactStyle.Medium },
  [HapticPattern.PROGRESSIVE_LIGHT]: { impact: ImpactStyle.Light },
  [HapticPattern.PROGRESSIVE_MEDIUM]: { impact: ImpactStyle.Medium },
  [HapticPattern.PROGRESSIVE_HEAVY]: { impact: ImpactStyle.Heavy }
};

// ============================================================================
// HAPTIC SERVICE CONFIGURATION
// ============================================================================

export interface HapticConfig {
  enabled?: boolean;
  respectSystemSettings?: boolean;
  fallbackToWeb?: boolean;
  debugMode?: boolean;
  rateLimitMs?: number;
  progressiveFeedback?: boolean;
}

export interface HapticCapabilities {
  isSupported: boolean;
  isNative: boolean;
  isWeb: boolean;
  platform: string;
  canVibrate: boolean;
}

// ============================================================================
// ENHANCED HAPTIC SERVICE
// ============================================================================

export class EnhancedHapticService {
  private static instance: EnhancedHapticService;
  private config: HapticConfig;
  private lastVibrationTime: number = 0;
  private readonly isNative: boolean;
  private readonly isWeb: boolean;
  private readonly canVibrate: boolean;

  private constructor(config: HapticConfig = {}) {
    this.config = {
      enabled: true,
      respectSystemSettings: true,
      fallbackToWeb: true,
      debugMode: process.env.NODE_ENV === 'development',
      rateLimitMs: 50,
      progressiveFeedback: true,
      ...config
    };

    this.isNative = Capacitor.isNativePlatform();
    this.isWeb = 'vibrate' in navigator;
    this.canVibrate = this.isNative || this.isWeb;

    if (this.config.debugMode) {
      console.log('🔧 Enhanced Haptic Service initialized:', {
        isNative: this.isNative,
        isWeb: this.isWeb,
        canVibrate: this.canVibrate,
        config: this.config
      });
    }
  }

  static getInstance(config?: HapticConfig): EnhancedHapticService {
    if (!EnhancedHapticService.instance) {
      EnhancedHapticService.instance = new EnhancedHapticService(config);
    }
    return EnhancedHapticService.instance;
  }

  // Reset instance for testing purposes
  static resetInstance(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    EnhancedHapticService.instance = undefined as any;
  }

  // ============================================================================
  // CAPABILITY DETECTION
  // ============================================================================

  getCapabilities(): HapticCapabilities {
    return {
      isSupported: this.canVibrate,
      isNative: this.isNative,
      isWeb: this.isWeb,
      platform: this.isNative ? 'native' : 'web',
      canVibrate: this.canVibrate
    };
  }

  // ============================================================================
  // CORE HAPTIC EXECUTION
  // ============================================================================

  private async executeNativeHaptic(pattern: HapticPatternType): Promise<boolean> {
    if (!this.isNative || !this.config.enabled) {
      return false;
    }

    try {
      const nativePattern = NATIVE_PATTERNS[pattern];
      
      if (nativePattern.impact) {
        await Haptics.impact({ style: nativePattern.impact });
      } else if (nativePattern.notification) {
        await Haptics.notification({ type: nativePattern.notification });
      }

      if (this.config.debugMode) {
        console.log('📳 Native haptic executed:', pattern);
      }

      return true;
    } catch (error) {
      if (this.config.debugMode) {
        console.warn('❌ Native haptic failed:', error);
      }
      return false;
    }
  }

  private executeWebHaptic(pattern: HapticPatternType): boolean {
    if (!this.isWeb || !this.config.enabled) {
      return false;
    }

    try {
      const vibrationPattern = WEB_VIBRATION_PATTERNS[pattern];
      const result = navigator.vibrate(vibrationPattern);

      if (this.config.debugMode) {
        console.log('📳 Web haptic executed:', pattern, vibrationPattern);
      }

      return result;
    } catch (error) {
      if (this.config.debugMode) {
        console.warn('❌ Web haptic failed:', error);
      }
      return false;
    }
  }

  private checkRateLimit(): boolean {
    if (!this.config.respectSystemSettings) {
      return true;
    }

    const now = Date.now();
    const lastTime = this.lastVibrationTime || 0;
    const rateLimit = this.config.rateLimitMs || 50;
    if (now - lastTime < rateLimit) {
      if (this.config.debugMode) {
        console.log('🔇 Haptic rate limited');
      }
      return false;
    }

    this.lastVibrationTime = now;
    return true;
  }

  // ============================================================================
  // PUBLIC HAPTIC METHODS
  // ============================================================================

  async trigger(pattern: HapticPatternType): Promise<boolean> {
    if (!this.checkRateLimit()) {
      return false;
    }

    // Try native first, fallback to web
    if (this.isNative) {
      const success = await this.executeNativeHaptic(pattern);
      if (success) return true;
    }

    // Web fallback
    if (this.config.fallbackToWeb && this.isWeb) {
      return this.executeWebHaptic(pattern);
    }

    return false;
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  // Basic patterns
  async light(): Promise<boolean> {
    return this.trigger(HapticPattern.LIGHT);
  }

  async medium(): Promise<boolean> {
    return this.trigger(HapticPattern.MEDIUM);
  }

  async heavy(): Promise<boolean> {
    return this.trigger(HapticPattern.HEAVY);
  }

  // Success/Error patterns
  async success(): Promise<boolean> {
    return this.trigger(HapticPattern.SUCCESS);
  }

  async error(): Promise<boolean> {
    return this.trigger(HapticPattern.ERROR);
  }

  async warning(): Promise<boolean> {
    return this.trigger(HapticPattern.WARNING);
  }

  // Interactive patterns
  async buttonPress(): Promise<boolean> {
    return this.trigger(HapticPattern.BUTTON_PRESS);
  }

  async buttonConfirm(): Promise<boolean> {
    return this.trigger(HapticPattern.BUTTON_CONFIRM);
  }

  async selection(): Promise<boolean> {
    return this.trigger(HapticPattern.SELECTION);
  }

  async refresh(): Promise<boolean> {
    return this.trigger(HapticPattern.REFRESH);
  }

  async navigation(): Promise<boolean> {
    return this.trigger(HapticPattern.NAVIGATION);
  }

  async longPress(): Promise<boolean> {
    return this.trigger(HapticPattern.LONG_PRESS);
  }

  // Weather-specific patterns
  async weatherLoad(): Promise<boolean> {
    return this.trigger(HapticPattern.WEATHER_LOAD);
  }

  async weatherRefresh(): Promise<boolean> {
    return this.trigger(HapticPattern.WEATHER_REFRESH);
  }

  async searchSuccess(): Promise<boolean> {
    return this.trigger(HapticPattern.SEARCH_SUCCESS);
  }

  async searchError(): Promise<boolean> {
    return this.trigger(HapticPattern.SEARCH_ERROR);
  }

  async locationFound(): Promise<boolean> {
    return this.trigger(HapticPattern.LOCATION_FOUND);
  }

  async locationError(): Promise<boolean> {
    return this.trigger(HapticPattern.LOCATION_ERROR);
  }

  // Gesture patterns
  async swipeStart(): Promise<boolean> {
    return this.trigger(HapticPattern.SWIPE_START);
  }

  async swipeProgress(): Promise<boolean> {
    return this.trigger(HapticPattern.SWIPE_PROGRESS);
  }

  async swipeComplete(): Promise<boolean> {
    return this.trigger(HapticPattern.SWIPE_COMPLETE);
  }

  async pullToRefresh(): Promise<boolean> {
    return this.trigger(HapticPattern.PULL_TO_REFRESH);
  }

  // ============================================================================
  // PROGRESSIVE FEEDBACK
  // ============================================================================

  async progressiveFeedback(progress: number): Promise<boolean> {
    if (!this.config.progressiveFeedback || progress < 0 || progress > 1) {
      return false;
    }

    let pattern: HapticPatternType;
    
    if (progress < 0.3) {
      pattern = HapticPattern.PROGRESSIVE_LIGHT;
    } else if (progress < 0.7) {
      pattern = HapticPattern.PROGRESSIVE_MEDIUM;
    } else {
      pattern = HapticPattern.PROGRESSIVE_HEAVY;
    }

    return this.trigger(pattern);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  stopAllVibrations(): void {
    if (this.isWeb) {
      navigator.vibrate(0);
    }
  }

  updateConfig(newConfig: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debugMode) {
      console.log('🔧 Haptic config updated:', this.config);
    }
  }

  getConfig(): HapticConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const enhancedHaptics = EnhancedHapticService.getInstance();

// ============================================================================
// REACT HOOK FOR EASY INTEGRATION
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';

export const useEnhancedHaptics = (config?: HapticConfig) => {
  const hapticRef = useRef(EnhancedHapticService.getInstance(config));

  useEffect(() => {
    if (config) {
      hapticRef.current.updateConfig(config);
    }
  }, [config]);

  const trigger = useCallback(async (pattern: HapticPatternType) => {
    return hapticRef.current.trigger(pattern);
  }, []);

  const progressiveFeedback = useCallback(async (progress: number) => {
    return hapticRef.current.progressiveFeedback(progress);
  }, []);

  return {
    // Core methods
    trigger,
    progressiveFeedback,
    
    // Convenience methods
    light: () => hapticRef.current.light(),
    medium: () => hapticRef.current.medium(),
    heavy: () => hapticRef.current.heavy(),
    success: () => hapticRef.current.success(),
    error: () => hapticRef.current.error(),
    warning: () => hapticRef.current.warning(),
    
    // Interactive methods
    buttonPress: () => hapticRef.current.buttonPress(),
    buttonConfirm: () => hapticRef.current.buttonConfirm(),
    selection: () => hapticRef.current.selection(),
    refresh: () => hapticRef.current.refresh(),
    navigation: () => hapticRef.current.navigation(),
    longPress: () => hapticRef.current.longPress(),
    
    // Weather methods
    weatherLoad: () => hapticRef.current.weatherLoad(),
    weatherRefresh: () => hapticRef.current.weatherRefresh(),
    searchSuccess: () => hapticRef.current.searchSuccess(),
    searchError: () => hapticRef.current.searchError(),
    locationFound: () => hapticRef.current.locationFound(),
    locationError: () => hapticRef.current.locationError(),
    
    // Gesture methods
    swipeStart: () => hapticRef.current.swipeStart(),
    swipeProgress: () => hapticRef.current.swipeProgress(),
    swipeComplete: () => hapticRef.current.swipeComplete(),
    pullToRefresh: () => hapticRef.current.pullToRefresh(),
    
    // Utility methods
    stopAllVibrations: () => hapticRef.current.stopAllVibrations(),
    getCapabilities: () => hapticRef.current.getCapabilities(),
    getConfig: () => hapticRef.current.getConfig(),
    updateConfig: (newConfig: Partial<HapticConfig>) => hapticRef.current.updateConfig(newConfig)
  };
};

// Export patterns for external use
export { HapticPattern as default }; 