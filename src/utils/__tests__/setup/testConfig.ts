/**
 * Test Configuration
 *
 * Shared configuration and utilities for testing haptic and other mobile features
 */

import { vi } from 'vitest';

// Mock Vibration API
export const mockVibrate = vi.fn(() => true);

// Mock Geolocation API
export const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Mock Permissions API
export const mockPermissions = {
  query: vi.fn(),
};

// Setup global mocks
export const setupGlobalMocks = () => {
  // Mock navigator with vibration API
  Object.defineProperty(navigator, 'vibrate', {
    value: mockVibrate,
    writable: true,
    configurable: true,
  });

  // Mock user agent for mobile detection
  Object.defineProperty(navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    writable: true,
    configurable: true,
  });

  // Mock geolocation
  Object.defineProperty(global, 'navigator', {
    value: {
      ...global.navigator,
      geolocation: mockGeolocation,
      permissions: mockPermissions,
      vibrate: mockVibrate,
    },
    writable: true,
    configurable: true,
  });

  // Mock global fetch for API calls
  global.fetch = vi.fn();

  // Mock capacitor haptics
  const globalWithCapacitor = global as unknown as {
    Capacitor: unknown;
    Haptics: unknown;
  };
  globalWithCapacitor.Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  };

  // Mock capacitor plugins
  globalWithCapacitor.Haptics = {
    selectionStart: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
    selectionEnd: vi.fn().mockResolvedValue(undefined),
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    vibrate: vi.fn().mockResolvedValue(undefined),
  };
};

// Reset mocks between tests
export const resetMocks = () => {
  mockVibrate.mockClear();
  mockGeolocation.getCurrentPosition.mockClear();
  mockGeolocation.watchPosition.mockClear();
  mockGeolocation.clearWatch.mockClear();
  mockPermissions.query.mockClear();

  const globalFetch = global.fetch as unknown as { mockClear?: () => void };
  if (globalFetch?.mockClear) {
    globalFetch.mockClear();
  }

  const globalHaptics = (
    global as unknown as { Haptics?: Record<string, unknown> }
  ).Haptics;
  if (globalHaptics) {
    Object.values(globalHaptics).forEach(fn => {
      const mockFn = fn as { mockClear?: () => void };
      if (typeof mockFn?.mockClear === 'function') {
        mockFn.mockClear();
      }
    });
  }

  vi.clearAllMocks();
};

// Test configuration for haptic services with rate limiting disabled
export const getHapticTestConfig = () => ({
  enabled: true,
  respectSystemSettings: false,
  rateLimitMs: 0,
  debugMode: false,
});

// Test wrapper utilities
export const advanceTime = (ms: number = 100) => {
  vi.advanceTimersByTime(ms);
};

export const setupTimers = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2023-01-01'));
};

export const cleanupTimers = () => {
  vi.useRealTimers();
};
