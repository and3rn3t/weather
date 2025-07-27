/**
 * Test Utilities and Configuration
 * 
 * Centralized test setup and utilities for consistent test behavior
 */

import { vi } from 'vitest';

// ============================================================================
// GLOBAL MOCKS SETUP
// ============================================================================

// Complete Navigator Mock
export const createNavigatorMock = () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  const mockPermissions = {
    query: vi.fn(),
  };

  const navigatorMock = {
    geolocation: mockGeolocation,
    permissions: mockPermissions,
    userAgent: 'test-user-agent',
    vibrate: vi.fn(),
  };

  // Setup global navigator
  Object.defineProperty(global, 'navigator', {
    value: navigatorMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'navigator', {
    value: navigatorMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'navigator', {
    value: navigatorMock,
    writable: true,
    configurable: true,
  });

  return { mockGeolocation, mockPermissions, navigatorMock };
};

// Viewport Mock with Resize Events
export const mockViewport = (width: number, height: number, userAgent?: string) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  if (userAgent) {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: userAgent,
    });
  }
  
  // Return a function to trigger resize event
  return () => {
    window.dispatchEvent(new Event('resize'));
  };
};

// Touch Event Creator with Better Defaults
export const createTouchEvent = (
  type: string, 
  touches: Array<{ clientX?: number; clientY?: number }> | { clientX?: number; clientY?: number } | number
) => {
  let touchArray;
  
  if (typeof touches === 'number') {
    // Legacy support: single number for clientY
    touchArray = [{ clientX: 0, clientY: touches }];
  } else if (Array.isArray(touches)) {
    touchArray = touches;
  } else {
    touchArray = [touches];
  }

  const touchList = touchArray.map((touch, index) => ({
    identifier: index,
    target: document.body,
    clientX: touch.clientX ?? 0,
    clientY: touch.clientY ?? 0,
    pageX: touch.clientX ?? 0,
    pageY: touch.clientY ?? 0,
    screenX: touch.clientX ?? 0,
    screenY: touch.clientY ?? 0,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  }));

  return new TouchEvent(type, {
    touches: touchList,
    targetTouches: touchList,
    changedTouches: touchList,
    bubbles: true,
    cancelable: true,
  });
};

// Test timeout utilities
export const TEST_TIMEOUTS = {
  SHORT: 100,
  MEDIUM: 500,
  LONG: 2000,
} as const;

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

// Successful geolocation response
export const mockSuccessfulLocation = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

// Geolocation error responses
export const mockLocationErrors = {
  PERMISSION_DENIED: {
    code: 1,
    message: 'User denied the request for Geolocation.',
  },
  POSITION_UNAVAILABLE: {
    code: 2,
    message: 'Location information is unavailable.',
  },
  TIMEOUT: {
    code: 3,
    message: 'The request to get user location timed out.',
  },
};

// Device user agents for testing
export const USER_AGENTS = {
  IPHONE: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
  ANDROID: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
  IPAD: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)',
  DESKTOP: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

export const setupMobileTest = (userAgent: string = USER_AGENTS.IPHONE) => {
  createNavigatorMock();
  mockViewport(375, 812, userAgent);
  
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock fetch for reverse geocoding
  global.fetch = vi.fn();
};

export const setupDesktopTest = () => {
  createNavigatorMock();
  mockViewport(1920, 1080, USER_AGENTS.DESKTOP);
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export const waitForElement = async (
  callback: () => void,
  timeout: number = TEST_TIMEOUTS.MEDIUM
) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export {
  mockSuccessfulLocation as defaultLocation,
  mockLocationErrors as locationErrors,
};
