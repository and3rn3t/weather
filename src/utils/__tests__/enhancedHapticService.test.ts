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
    
    // Reset singleton instance properly
    EnhancedHapticService.resetInstance();
    
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
      // Reset to allow custom configuration
      EnhancedHapticService.resetInstance();
      
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
    beforeEach(() => {
      // Disable rate limiting for pattern tests
      hapticService.updateConfig({ respectSystemSettings: false });
    });

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
      vi.clearAllMocks(); // Clear any previous calls
      
      const weatherLoad = await hapticService.weatherLoad();
      expect(weatherLoad).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(15);
      
      vi.clearAllMocks(); // Clear before next call
      const weatherRefresh = await hapticService.weatherRefresh();
      expect(weatherRefresh).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith([25, 25, 25]);
    });

    it('should trigger gesture patterns', async () => {
      vi.clearAllMocks(); // Clear any previous calls
      
      const swipeStart = await hapticService.swipeStart();
      expect(swipeStart).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(5);
      
      vi.clearAllMocks();
      const swipeProgress = await hapticService.swipeProgress();
      expect(swipeProgress).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(10);
      
      vi.clearAllMocks();
      const swipeComplete = await hapticService.swipeComplete();
      expect(swipeComplete).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(20);
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
    beforeEach(() => {
      // Disable rate limiting for progressive tests
      hapticService.updateConfig({ respectSystemSettings: false });
    });

    it('should provide progressive feedback based on progress', async () => {
      vi.clearAllMocks();
      
      const lightProgress = await hapticService.progressiveFeedback(0.2);
      expect(lightProgress).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(10); // light
      
      vi.clearAllMocks();
      const mediumProgress = await hapticService.progressiveFeedback(0.5);
      expect(mediumProgress).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(20); // medium
      
      vi.clearAllMocks();
      const heavyProgress = await hapticService.progressiveFeedback(0.8);
      expect(heavyProgress).toBe(true);
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

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock native platform
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    
    // Mock native haptics
    const { Haptics } = await import('@capacitor/haptics');
    vi.mocked(Haptics.impact).mockResolvedValue(undefined);
    vi.mocked(Haptics.notification).mockResolvedValue(undefined);
    
    // Reset singleton
    EnhancedHapticService.resetInstance();
    
    hapticService = EnhancedHapticService.getInstance();
    
    // Disable rate limiting for tests
    hapticService.updateConfig({ respectSystemSettings: false });
  });

  it('should detect native platform', () => {
    const capabilities = hapticService.getCapabilities();
    
    expect(capabilities.isNative).toBe(true);
    expect(capabilities.platform).toBe('native');
  });

  it('should use native haptics when available', async () => {
    const { Haptics } = await import('@capacitor/haptics');
    
    vi.clearAllMocks(); // Clear before the test calls
    
    await hapticService.light();
    expect(Haptics.impact).toHaveBeenCalledWith({ style: 'light' });
    
    vi.clearAllMocks(); // Clear between calls
    
    await hapticService.success();
    expect(Haptics.notification).toHaveBeenCalledWith({ type: 'success' });
  });

  it('should fallback to web haptics if native fails', async () => {
    const { Haptics } = await import('@capacitor/haptics');
    vi.mocked(Haptics.impact).mockRejectedValue(new Error('Native haptics failed'));
    
    // Ensure mockVibrate returns true for fallback
    mockVibrate.mockReturnValue(true);
    
    // Make sure fallback to web is enabled and rate limiting is disabled
    hapticService.updateConfig({ 
      fallbackToWeb: true, 
      respectSystemSettings: false 
    });
    
    const result = await hapticService.light();
    expect(result).toBe(true);
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });
}); 