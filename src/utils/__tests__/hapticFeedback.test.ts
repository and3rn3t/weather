/**
 * Haptic Feedback Tests
 *
 * Tests for the haptic feedback system including patterns and core functionality
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useHapticFeedback, HapticPattern } from '../useHapticFeedback';

// Mock the Web Vibration API
const mockVibrate = vi.fn(() => true);
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock user agent for mobile detection
Object.defineProperty(navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  writable: true,
});

describe('Haptic Feedback System', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
    vi.clearAllMocks();
    // Reset any rate limiting by advancing time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useHapticFeedback Hook', () => {
    it('should initialize with correct capabilities', () => {
      const { result } = renderHook(() => useHapticFeedback());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isEnabled).toBe(true);
      expect(typeof result.current.triggerHaptic).toBe('function');
    });

    it('should trigger haptic feedback with light pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.light();
      });

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger haptic feedback with medium pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.medium();
      });

      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it('should trigger haptic feedback with success pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.success();
      });

      expect(mockVibrate).toHaveBeenCalledWith([20, 50, 20]);
    });

    it('should trigger haptic feedback with error pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.error();
      });

      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should respect rate limiting', async () => {
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: true })
      );

      act(() => {
        result.current.light();
        result.current.light(); // Should be rate limited
      });

      expect(mockVibrate).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled state', () => {
      const { result } = renderHook(() =>
        useHapticFeedback({ enabled: false })
      );

      act(() => {
        result.current.light();
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should support custom patterns', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.triggerHaptic([100, 200, 100]);
      });

      expect(mockVibrate).toHaveBeenCalledWith([100, 200, 100]);
    });

    it('should stop all vibrations', () => {
      const { result } = renderHook(() => useHapticFeedback());

      act(() => {
        result.current.stopAllVibrations();
      });

      expect(mockVibrate).toHaveBeenCalledWith(0);
    });

    it('should recognize all haptic patterns', () => {
      const { result } = renderHook(() => useHapticFeedback());

      const patterns = result.current.patterns;

      expect(patterns[HapticPattern.LIGHT]).toBe(10);
      expect(patterns[HapticPattern.MEDIUM]).toBe(20);
      expect(patterns[HapticPattern.HEAVY]).toBe(50);
      expect(patterns[HapticPattern.SUCCESS]).toEqual([20, 50, 20]);
      expect(patterns[HapticPattern.ERROR]).toEqual([50, 50, 50]);
      expect(patterns[HapticPattern.NOTIFICATION]).toEqual([20, 20, 20]);
      expect(patterns[HapticPattern.SELECTION]).toEqual([10, 10]);
      expect(patterns[HapticPattern.REFRESH]).toEqual([30, 30, 30]);
      expect(patterns[HapticPattern.NAVIGATION]).toBe(15);
      expect(patterns[HapticPattern.LONG_PRESS]).toEqual([50, 100, 50]);
    });

    it('should handle vibration API errors gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration API error');
      });

      const { result } = renderHook(() =>
        useHapticFeedback({ debugMode: true })
      );

      expect(() => {
        act(() => {
          result.current.light();
        });
      }).not.toThrow();
    });

    it('should detect mobile devices correctly', () => {
      const { result } = renderHook(() => useHapticFeedback());
      const capabilities = result.current.getCapabilities();

      expect(capabilities.platform).toBe('ios');
      expect(capabilities.isSupported).toBe(true);
    });

    it('should handle desktop environment', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });

      const { result } = renderHook(() => useHapticFeedback());
      const capabilities = result.current.getCapabilities();

      expect(capabilities.platform).toBe('unknown');
      expect(capabilities.isSupported).toBe(false);

      // Reset for other tests
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });
    });

    it('should handle missing vibration API', () => {
      const originalVibrate = navigator.vibrate;
      const originalUserAgent = navigator.userAgent;

      // Mock navigator without vibrate property and set to desktop user agent
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });

      const { result } = renderHook(() => useHapticFeedback());

      expect(result.current.isSupported).toBe(false);

      act(() => {
        result.current.light();
      });

      // Should not throw, should fail silently

      // Restore original values
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });
  });

  describe('Haptic Patterns', () => {
    it('should trigger navigation haptic correctly', () => {
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: false })
      );

      act(() => {
        result.current.navigation();
      });

      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('should trigger refresh haptic correctly', () => {
      vi.advanceTimersByTime(100); // Ensure rate limiting doesn't interfere
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: false })
      );

      act(() => {
        result.current.refresh();
      });

      expect(mockVibrate).toHaveBeenCalledWith([30, 30, 30]);
    });

    it('should trigger notification haptic correctly', () => {
      vi.advanceTimersByTime(100);
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: false })
      );

      act(() => {
        result.current.notification();
      });

      expect(mockVibrate).toHaveBeenCalledWith([20, 20, 20]);
    });

    it('should trigger selection haptic correctly', () => {
      vi.advanceTimersByTime(100);
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: false })
      );

      act(() => {
        result.current.selection();
      });

      expect(mockVibrate).toHaveBeenCalledWith([10, 10]);
    });

    it('should trigger long press haptic correctly', () => {
      vi.advanceTimersByTime(100);
      const { result } = renderHook(() =>
        useHapticFeedback({ respectSystemSettings: false })
      );

      act(() => {
        result.current.longPress();
      });

      expect(mockVibrate).toHaveBeenCalledWith([50, 100, 50]);
    });
  });
});
