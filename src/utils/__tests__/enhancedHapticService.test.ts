/**
 * Enhanced Haptic Service Tests
 * 
 * Tests for the enhanced haptic feedback service that integrates
 * both web Vibration API and Capacitor native haptics.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedHapticService, HapticPattern, type HapticConfig } from '../enhancedHapticService';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false)
  }
}));

// Mock Capacitor Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn()
  },
  ImpactStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  },
  NotificationType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  }
}));

// Mock navigator.vibrate
const mockVibrate = vi.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true
});

describe('EnhancedHapticService', () => {
  let hapticService: EnhancedHapticService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockVibrate.mockReturnValue(true);
    
    // Reset singleton instance
    (EnhancedHapticService as any).instance = undefined;
    
    // Create new instance
    hapticService = EnhancedHapticService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const config = hapticService.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.respectSystemSettings).toBe(true);
      expect(config.fallbackToWeb).toBe(true);
      expect(config.debugMode).toBe(process.env.NODE_ENV === 'development');
      expect(config.rateLimitMs).toBe(50);
      expect(config.progressiveFeedback).toBe(true);
    });

    it('should detect capabilities correctly', () => {
      const capabilities = hapticService.getCapabilities();
      
      expect(capabilities.isSupported).toBe(true);
      expect(capabilities.isNative).toBe(false);
      expect(capabilities.isWeb).toBe(true);
      expect(capabilities.platform).toBe('web');
      expect(capabilities.canVibrate).toBe(true);
    });

    it('should allow custom config', () => {
      const customConfig: HapticConfig = {
        enabled: false,
        rateLimitMs: 100,
        debugMode: true
      };
      
      const customService = EnhancedHapticService.getInstance(customConfig);
      const config = customService.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.rateLimitMs).toBe(100);
      expect(config.debugMode).toBe(true);
    });
  });

  describe('Web Haptic Patterns', () => {
    it('should trigger light haptic', async () => {
      const result = await hapticService.light();
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger medium haptic', async () => {
      const result = await hapticService.medium();
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it('should trigger heavy haptic', async () => {
      const result = await hapticService.heavy();
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should trigger success pattern', async () => {
      const result = await hapticService.success();
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith([20, 50, 20]);
    });

    it('should trigger error pattern', async () => {
      const result = await hapticService.error();
      
      expect(result).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should trigger weather-specific patterns', async () => {
      const weatherLoad = await hapticService.weatherLoad();
      const weatherRefresh = await hapticService.weatherRefresh();
      
      expect(weatherLoad).toBe(true);
      expect(weatherRefresh).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(15); // weatherLoad
      expect(mockVibrate).toHaveBeenCalledWith([25, 25, 25]); // weatherRefresh
    });

    it('should trigger gesture patterns', async () => {
      const swipeStart = await hapticService.swipeStart();
      const swipeProgress = await hapticService.swipeProgress();
      const swipeComplete = await hapticService.swipeComplete();
      
      expect(swipeStart).toBe(true);
      expect(swipeProgress).toBe(true);
      expect(swipeComplete).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(5); // swipeStart
      expect(mockVibrate).toHaveBeenCalledWith(10); // swipeProgress
      expect(mockVibrate).toHaveBeenCalledWith(20); // swipeComplete
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting', async () => {
      // First call should work
      const result1 = await hapticService.light();
      expect(result1).toBe(true);
      
      // Second call within rate limit should be blocked
      const result2 = await hapticService.light();
      expect(result2).toBe(false);
      
      // Wait for rate limit to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Third call should work again
      const result3 = await hapticService.light();
      expect(result3).toBe(true);
    });

    it('should allow rate limiting to be disabled', async () => {
      hapticService.updateConfig({ respectSystemSettings: false });
      
      const result1 = await hapticService.light();
      const result2 = await hapticService.light();
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('Progressive Feedback', () => {
    it('should provide progressive feedback based on progress', async () => {
      const lightProgress = await hapticService.progressiveFeedback(0.2);
      const mediumProgress = await hapticService.progressiveFeedback(0.5);
      const heavyProgress = await hapticService.progressiveFeedback(0.8);
      
      expect(lightProgress).toBe(true);
      expect(mediumProgress).toBe(true);
      expect(heavyProgress).toBe(true);
      
      // Should call different patterns based on progress
      expect(mockVibrate).toHaveBeenCalledWith(10); // light
      expect(mockVibrate).toHaveBeenCalledWith(20); // medium
      expect(mockVibrate).toHaveBeenCalledWith(50); // heavy
    });

    it('should handle invalid progress values', async () => {
      const negativeProgress = await hapticService.progressiveFeedback(-0.1);
      const overProgress = await hapticService.progressiveFeedback(1.1);
      
      expect(negativeProgress).toBe(false);
      expect(overProgress).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newConfig: Partial<HapticConfig> = {
        enabled: false,
        rateLimitMs: 200
      };
      
      hapticService.updateConfig(newConfig);
      const config = hapticService.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.rateLimitMs).toBe(200);
    });

    it('should disable haptics when enabled is false', async () => {
      hapticService.updateConfig({ enabled: false });
      
      const result = await hapticService.light();
      expect(result).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should stop all vibrations', () => {
      hapticService.stopAllVibrations();
      
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });

    it('should get current capabilities', () => {
      const capabilities = hapticService.getCapabilities();
      
      expect(capabilities).toEqual({
        isSupported: true,
        isNative: false,
        isWeb: true,
        platform: 'web',
        canVibrate: true
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle vibration API errors gracefully', async () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration API not supported');
      });
      
      const result = await hapticService.light();
      expect(result).toBe(false);
    });

    it('should handle disabled vibration API', async () => {
      mockVibrate.mockReturnValue(false);
      
      const result = await hapticService.light();
      expect(result).toBe(false);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate haptic patterns', () => {
      expect(HapticPattern.LIGHT).toBe('light');
      expect(HapticPattern.MEDIUM).toBe('medium');
      expect(HapticPattern.HEAVY).toBe('heavy');
      expect(HapticPattern.SUCCESS).toBe('success');
      expect(HapticPattern.ERROR).toBe('error');
      expect(HapticPattern.WEATHER_LOAD).toBe('weatherLoad');
      expect(HapticPattern.SWIPE_START).toBe('swipeStart');
    });
  });
});

describe('Native Platform Integration', () => {
  let hapticService: EnhancedHapticService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock native platform
    const { Capacitor } = require('@capacitor/core');
    Capacitor.isNativePlatform.mockReturnValue(true);
    
    // Mock native haptics
    const { Haptics } = require('@capacitor/haptics');
    Haptics.impact.mockResolvedValue(undefined);
    Haptics.notification.mockResolvedValue(undefined);
    
    // Reset singleton
    (EnhancedHapticService as any).instance = undefined;
    
    hapticService = EnhancedHapticService.getInstance();
  });

  it('should detect native platform', () => {
    const capabilities = hapticService.getCapabilities();
    
    expect(capabilities.isNative).toBe(true);
    expect(capabilities.platform).toBe('native');
  });

  it('should use native haptics when available', async () => {
    const { Haptics } = require('@capacitor/haptics');
    
    await hapticService.light();
    expect(Haptics.impact).toHaveBeenCalledWith({ style: 'light' });
    
    await hapticService.success();
    expect(Haptics.notification).toHaveBeenCalledWith({ type: 'success' });
  });

  it('should fallback to web haptics if native fails', async () => {
    const { Haptics } = require('@capacitor/haptics');
    Haptics.impact.mockRejectedValue(new Error('Native haptics failed'));
    
    const result = await hapticService.light();
    expect(result).toBe(true);
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });
}); 