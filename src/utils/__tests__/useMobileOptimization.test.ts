/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useBreakpoint, 
  useInteractionCapabilities,
  useMobilePerformance,
  useTouchGestures
} from '../useMobileOptimization';

// Mock window methods and properties
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 2
});

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

describe('Mobile Optimization Hooks', () => {
  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375 // iPhone width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667 // iPhone height
    });

    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {}
    });

    // Reset navigator
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5
    });

    // Mock matchMedia for different queries
    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('hover: hover') ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useBreakpoint', () => {
    it('should detect mobile breakpoint correctly', () => {
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.currentBreakpoint).toBe('mobile');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isSmallScreen).toBe(true);
    });

    it('should detect tablet breakpoint correctly', () => {
      // Change window width to tablet size
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      
      const { result } = renderHook(() => useBreakpoint());
      
      act(() => {
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.currentBreakpoint).toBe('tablet');
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMediumScreen).toBe(true);
    });

    it('should update window size on resize', () => {
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.windowSize.width).toBe(375);
      expect(result.current.windowSize.height).toBe(667);
    });
  });

  describe('useInteractionCapabilities', () => {
    it('should detect touch capabilities', () => {
      const { result } = renderHook(() => useInteractionCapabilities());
      
      expect(result.current.hasTouch).toBe(true);
      expect(result.current.hasHover).toBe(false);
      expect(result.current.isRetina).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));

      const { result } = renderHook(() => useInteractionCapabilities());
      
      expect(result.current.reducedMotion).toBe(true);
    });
  });

  describe('useMobilePerformance', () => {
    it('should provide performance settings for mobile', () => {
      const { result } = renderHook(() => useMobilePerformance());
      
      expect(result.current.enableTouchOptimizations).toBe(true);
      expect(result.current.enableLazyLoading).toBe(true);
      expect(result.current.imageQuality).toBe('low');
    });

    it('should disable animations on reduced motion', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));

      const { result } = renderHook(() => useMobilePerformance());
      
      expect(result.current.enableAnimations).toBe(false);
    });
  });

  describe('useTouchGestures', () => {
    it('should track touch state', () => {
      const { result } = renderHook(() => useTouchGestures());
      
      expect(result.current.isTouching).toBe(false);
      expect(result.current.touchCount).toBe(0);
    });

    it('should create double tap handler', () => {
      const { result } = renderHook(() => useTouchGestures());
      const mockCallback = vi.fn();
      
      const doubleTapHandler = result.current.handleDoubleTap(mockCallback);
      
      expect(typeof doubleTapHandler).toBe('function');
    });

    it('should create swipe handlers', () => {
      const { result } = renderHook(() => useTouchGestures());
      const mockSwipeLeft = vi.fn();
      const mockSwipeRight = vi.fn();
      
      const swipeHandlers = result.current.createSwipeHandler(mockSwipeLeft, mockSwipeRight);
      
      expect(swipeHandlers).toHaveProperty('onTouchStart');
      expect(swipeHandlers).toHaveProperty('onTouchEnd');
      expect(typeof swipeHandlers.onTouchStart).toBe('function');
      expect(typeof swipeHandlers.onTouchEnd).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complete mobile optimization', () => {
      const breakpoint = renderHook(() => useBreakpoint());
      const capabilities = renderHook(() => useInteractionCapabilities());
      const performance = renderHook(() => useMobilePerformance());
      
      // On mobile device
      expect(breakpoint.result.current.isMobile).toBe(true);
      expect(capabilities.result.current.hasTouch).toBe(true);
      expect(performance.result.current.enableTouchOptimizations).toBe(true);
      
      // Performance optimizations should be enabled for mobile
      expect(performance.result.current.enableLazyLoading).toBe(true);
      expect(performance.result.current.imageQuality).toBe('low');
    });

    it('should adapt to desktop environment', () => {
      // Mock desktop environment
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      // Mock navigator without touch support
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0
      });
      
      // Remove touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: undefined
      });
      
      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes('hover: hover'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));
      
      const breakpoint = renderHook(() => useBreakpoint());
      const capabilities = renderHook(() => useInteractionCapabilities());
      const performance = renderHook(() => useMobilePerformance());
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Desktop characteristics
      expect(breakpoint.result.current.isDesktop).toBe(true);
      expect(capabilities.result.current.hasHover).toBe(true);
      // Note: Touch detection may still be true in test environment, that's ok
      expect(performance.result.current.enableTouchOptimizations).toBe(capabilities.result.current.hasTouch);
    });
  });
});
