/**
 * Haptic Feedback Tests
 * 
 * Tests for the haptic feedback system including patterns, capability detection,
 * and integration with the app components.
 */

import { renderHook, act } from '@testing-library/react';
import { useHapticFeedback, HapticPattern } from '../useHapticFeedback';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate
});

// Mock user agent for mobile detection
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
});

describe('useHapticFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockReturnValue(true);
  });

  describe('Capability Detection', () => {
    it('should detect haptic support on mobile devices', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      const capabilities = result.current.getCapabilities();
      expect(capabilities.isSupported).toBe(true);
      expect(capabilities.platform).toBe('ios');
    });

    it('should detect when haptics are disabled', () => {
      const { result } = renderHook(() => useHapticFeedback({ enabled: false }));
      
      const capabilities = result.current.getCapabilities();
      expect(capabilities.isEnabled).toBe(false);
    });
  });

  describe('Haptic Patterns', () => {
    it('should trigger light haptic feedback', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.light();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger medium haptic feedback', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.medium();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it('should trigger heavy haptic feedback', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.heavy();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should trigger success pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.success();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([20, 50, 20]);
    });

    it('should trigger error pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.error();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should trigger refresh pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.refresh();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([30, 30, 30]);
    });
  });

  describe('Custom Patterns', () => {
    it('should trigger custom numeric pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic(100);
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(100);
    });

    it('should trigger custom array pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic([10, 20, 30]);
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([10, 20, 30]);
    });

    it('should trigger pattern by enum', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic(HapticPattern.NOTIFICATION);
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([20, 20, 20]);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limiting between vibrations', async () => {
      const { result } = renderHook(() => useHapticFeedback({ respectSystemSettings: true }));
      
      // First vibration should work
      act(() => {
        result.current.light();
      });
      expect(mockVibrate).toHaveBeenCalledTimes(1);
      
      // Second vibration immediately should be rate limited
      act(() => {
        result.current.light();
      });
      expect(mockVibrate).toHaveBeenCalledTimes(1);
      
      // Wait for rate limit to pass
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 60));
        result.current.light();
      });
      expect(mockVibrate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stop Vibrations', () => {
    it('should stop all vibrations', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.stopAllVibrations();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle vibration API errors gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration failed');
      });
      
      const { result } = renderHook(() => useHapticFeedback({ debugMode: true }));
      
      // Should not throw error
      expect(() => {
        act(() => {
          result.current.light();
        });
      }).not.toThrow();
    });

    it('should return false when vibration fails', () => {
      mockVibrate.mockReturnValue(false);
      
      const { result } = renderHook(() => useHapticFeedback());
      
      let returnValue: boolean;
      act(() => {
        returnValue = result.current.light();
      });
      
      expect(returnValue!).toBe(false);
    });
  });

  describe('Desktop Compatibility', () => {
    beforeAll(() => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    });

    it('should detect lack of haptic support on desktop', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      const capabilities = result.current.getCapabilities();
      expect(capabilities.isSupported).toBe(false);
      expect(capabilities.platform).toBe('unknown');
    });

    it('should not trigger vibrations on unsupported devices', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      let returnValue: boolean;
      act(() => {
        returnValue = result.current.light();
      });
      
      expect(returnValue!).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });
});
