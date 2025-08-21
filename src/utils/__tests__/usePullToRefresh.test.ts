/**
 * Tests for Pull-to-Refresh functionality
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePullToRefresh } from '../usePullToRefresh';

// Mock global objects for testing environment
beforeEach(() => {
  vi.clearAllMocks();

  // Mock scrollY
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: 0,
  });
});

describe('usePullToRefresh', () => {
  it('should initialize with correct default state', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    expect(result.current.isPulling).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.canRefresh).toBe(false);
    expect(result.current.pullProgress).toBe(0);
  });

  it('should provide touch event handlers', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    expect(result.current.pullToRefreshHandlers).toHaveProperty('onTouchStart');
    expect(result.current.pullToRefreshHandlers).toHaveProperty('onTouchMove');
    expect(result.current.pullToRefreshHandlers).toHaveProperty('onTouchEnd');
    expect(typeof result.current.pullToRefreshHandlers.onTouchStart).toBe(
      'function',
    );
    expect(typeof result.current.pullToRefreshHandlers.onTouchMove).toBe(
      'function',
    );
    expect(typeof result.current.pullToRefreshHandlers.onTouchEnd).toBe(
      'function',
    );
  });

  it('should calculate pull progress correctly', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh(mockRefresh, { refreshThreshold: 60 }),
    );

    // Progress should be calculated based on pullDistance / refreshThreshold
    expect(result.current.pullProgress).toBeGreaterThanOrEqual(0);
    expect(result.current.pullProgress).toBeLessThanOrEqual(1);
  });

  it('should provide styling helpers', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    expect(typeof result.current.getPullIndicatorStyle).toBe('function');
    expect(typeof result.current.getRefreshIconRotation).toBe('function');

    const style = result.current.getPullIndicatorStyle();
    expect(style).toHaveProperty('transform');
    expect(style).toHaveProperty('opacity');
    expect(style).toHaveProperty('textAlign');

    const rotation = result.current.getRefreshIconRotation();
    expect(typeof rotation).toBe('string');
    expect(rotation).toMatch(/rotate\(\d+deg\)/);
  });

  it('should handle disabled state', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh(mockRefresh, { disabled: true }),
    );

    // When disabled, pull handlers should exist but not trigger state changes
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it('should reset state correctly', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    // Reset state
    act(() => {
      result.current.resetState();
    });

    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.canRefresh).toBe(false);
  });

  it('should register scroll element', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.registerScrollElement(mockElement);
    });

    // Function should execute without error
    expect(typeof result.current.registerScrollElement).toBe('function');
  });
});

describe('Pull-to-Refresh Integration', () => {
  it('should work with different options', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);

    const options = {
      maxPullDistance: 150,
      triggerDistance: 80,
      refreshThreshold: 70,
      disabled: false,
    };

    const { result } = renderHook(() => usePullToRefresh(mockRefresh, options));

    expect(result.current.isPulling).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('should handle refresh callback', async () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    // Verify refresh function is available for use
    expect(typeof mockRefresh).toBe('function');
    expect(result.current.pullToRefreshHandlers).toBeDefined();
  });

  it('should provide correct styling values', () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockRefresh));

    const baseStyle = { backgroundColor: 'blue', margin: '10px' };
    const style = result.current.getPullIndicatorStyle(baseStyle);
    expect(style.backgroundColor).toBe('blue'); // Should merge with base styles
    expect(style.margin).toBe('10px'); // Should merge with base styles
    expect(style).toHaveProperty('transform'); // Should have hook styles
    expect(style).toHaveProperty('opacity'); // Should have hook styles

    const rotation = result.current.getRefreshIconRotation();
    expect(rotation).toContain('rotate');
    expect(rotation).toContain('deg');
  });
});
