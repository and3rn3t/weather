/**
 * Enhanced Swipe Gestures Test Suite
 *
 * Comprehensive tests for the new enhanced swipe gesture system
 */

import { renderHook, act } from '@testing-library/react';
import { useSwipeGestures } from '../useSwipeGestures';
import { useScreenSwipeConfig } from '../useScreenSwipeConfig';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock haptic feedback
vi.mock('../hapticHooks', () => ({
  useHaptic: () => ({
    selectionChange: vi.fn(),
    impactLight: vi.fn(),
    navigationSwipe: vi.fn(),
  }),
  useGestureHaptics: () => ({
    triggerSwipeHaptic: vi.fn(),
    triggerSelectionHaptic: vi.fn(),
    triggerNavigationHaptic: vi.fn(),
  }),
}));

// Helper to create mock touch events
const createMockTouchEvent = (clientX: number, clientY: number) =>
  ({
    preventDefault: vi.fn(),
    touches: [{ clientX, clientY }],
    changedTouches: [{ clientX, clientY }],
  }) as unknown as React.TouchEvent;

describe('Enhanced Swipe Gestures', () => {
  describe('useSwipeGestures', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initialize with default swipe state', () => {
      const { result } = renderHook(() => useSwipeGestures());

      expect(result.current.swipeState).toEqual({
        isDragging: false,
        dragOffset: 0,
        dragDirection: null,
        canSwipeLeft: false,
        canSwipeRight: false,
        dragProgress: 0,
      });
    });

    it('should create swipe handlers with proper event handling', () => {
      const { result } = renderHook(() => useSwipeGestures());
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const handlers = result.current.createSwipeHandler(
        onSwipeLeft,
        onSwipeRight,
        true,
        true
      );

      expect(handlers).toHaveProperty('onTouchStart');
      expect(handlers).toHaveProperty('onTouchMove');
      expect(handlers).toHaveProperty('onTouchEnd');
      expect(handlers).toHaveProperty('onMouseDown');
      expect(handlers).toHaveProperty('onMouseMove');
      expect(handlers).toHaveProperty('onMouseUp');
    });

    it('should handle swipe left gesture correctly', () => {
      const { result } = renderHook(() =>
        useSwipeGestures({
          threshold: 50,
          enableHaptic: false,
        })
      );

      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const handlers = result.current.createSwipeHandler(
        onSwipeLeft,
        onSwipeRight,
        true,
        true
      );

      act(() => {
        handlers.onTouchStart(createMockTouchEvent(100, 100));
        handlers.onTouchMove(createMockTouchEvent(40, 100));
        handlers.onTouchEnd(createMockTouchEvent(40, 100));
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should handle swipe right gesture correctly', () => {
      const { result } = renderHook(() =>
        useSwipeGestures({
          threshold: 50,
          enableHaptic: false,
        })
      );

      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const handlers = result.current.createSwipeHandler(
        onSwipeLeft,
        onSwipeRight,
        true,
        true
      );

      act(() => {
        handlers.onTouchStart(createMockTouchEvent(100, 100));
        handlers.onTouchMove(createMockTouchEvent(160, 100));
        handlers.onTouchEnd(createMockTouchEvent(160, 100));
      });

      expect(onSwipeRight).toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should not trigger swipe if threshold is not met', () => {
      const { result } = renderHook(() =>
        useSwipeGestures({
          threshold: 100,
          enableHaptic: false,
        })
      );

      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const handlers = result.current.createSwipeHandler(
        onSwipeLeft,
        onSwipeRight,
        true,
        true
      );

      act(() => {
        handlers.onTouchStart(createMockTouchEvent(100, 100));
        handlers.onTouchMove(createMockTouchEvent(120, 100));
        handlers.onTouchEnd(createMockTouchEvent(120, 100));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should respect swipe direction permissions', () => {
      const { result } = renderHook(() =>
        useSwipeGestures({
          threshold: 50,
          enableHaptic: false,
        })
      );

      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      // Only allow right swipe
      const handlers = result.current.createSwipeHandler(
        onSwipeLeft,
        onSwipeRight,
        false, // canSwipeLeft = false
        true // canSwipeRight = true
      );

      // Try left swipe (should be blocked)
      act(() => {
        handlers.onTouchStart(createMockTouchEvent(100, 100));
        handlers.onTouchMove(createMockTouchEvent(40, 100));
        handlers.onTouchEnd(createMockTouchEvent(40, 100));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();

      // Try right swipe (should work)
      act(() => {
        handlers.onTouchStart(createMockTouchEvent(100, 100));
        handlers.onTouchMove(createMockTouchEvent(160, 100));
        handlers.onTouchEnd(createMockTouchEvent(160, 100));
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });
  });

  describe('useScreenSwipeConfig', () => {
    it('should return correct config for Home screen', () => {
      const { result } = renderHook(() => useScreenSwipeConfig('Home'));

      expect(result.current).toEqual({
        canSwipeLeft: true,
        canSwipeRight: false,
        leftHint: 'Weather Details',
        rightHint: null,
      });
    });

    it('should return correct config for WeatherDetails screen', () => {
      const { result } = renderHook(() =>
        useScreenSwipeConfig('WeatherDetails')
      );

      expect(result.current).toEqual({
        canSwipeLeft: false,
        canSwipeRight: true,
        leftHint: null,
        rightHint: 'Home',
      });
    });

    it('should return disabled config for unknown screen', () => {
      const { result } = renderHook(() =>
        useScreenSwipeConfig('UnknownScreen')
      );

      expect(result.current).toEqual({
        canSwipeLeft: false,
        canSwipeRight: false,
        leftHint: null,
        rightHint: null,
      });
    });
  });
});
