/**
 * Mobile Optimization Hooks
 *
 * Custom hooks for mobile-specific functionality including:
 * - Device detection and capabilities
 * - Touch gesture handling
 * - Viewport utilities
 * - Performance optimizations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// MOBILE DEVICE DETECTION
// ============================================================================

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasNotch: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        isIOS: false,
        isAndroid: false,
        hasNotch: false,
        screenSize: 'large',
        orientation: 'landscape',
        pixelRatio: 1,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();

    return {
      isMobile: width <= 768,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024,
      isTouchDevice: 'ontouchstart' in window,
      isIOS: /iphone|ipad|ipod/.test(userAgent),
      isAndroid: /android/.test(userAgent),
      hasNotch: CSS.supports('padding-top: env(safe-area-inset-top)'),
      screenSize:
        width <= 375
          ? 'small'
          : width <= 768
            ? 'medium'
            : width <= 1024
              ? 'large'
              : 'xlarge',
      orientation: height > width ? 'portrait' : 'landscape',
      pixelRatio: window.devicePixelRatio || 1,
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();

      setDeviceInfo({
        isMobile: width <= 768,
        isTablet: width > 768 && width <= 1024,
        isDesktop: width > 1024,
        isTouchDevice: 'ontouchstart' in window,
        isIOS: /iphone|ipad|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        hasNotch: CSS.supports('padding-top: env(safe-area-inset-top)'),
        screenSize:
          width <= 375
            ? 'small'
            : width <= 768
              ? 'medium'
              : width <= 1024
                ? 'large'
                : 'xlarge',
        orientation: height > width ? 'portrait' : 'landscape',
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

interface ViewportInfo {
  width: number;
  height: number;
  scrollY: number;
  isScrolling: boolean;
}

export const useViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    isScrolling: false,
  }));

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const updateViewport = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
        isScrolling: true,
      }));

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setViewport(prev => ({ ...prev, isScrolling: false }));
      }, 150);
    };

    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport, { passive: true });

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', updateViewport);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return viewport;
};

// ============================================================================
// TOUCH GESTURE HANDLING
// ============================================================================

interface TouchGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

export const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  config: TouchGestureConfig
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
  } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStart: { x: number; y: number; time: number } | null = null;
    let lastTap = 0;
    let initialDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && onPinch && initialDistance > 0) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scale = currentDistance / initialDistance;

        if (Math.abs(scale - 1) > pinchThreshold) {
          onPinch(scale);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      // Check for swipe gestures
      if (
        Math.abs(deltaX) > swipeThreshold ||
        Math.abs(deltaY) > swipeThreshold
      ) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      } else if (
        deltaTime < 300 &&
        Math.abs(deltaX) < 10 &&
        Math.abs(deltaY) < 10
      ) {
        // Tap gesture
        const now = Date.now();
        if (now - lastTap < 300 && onDoubleTap) {
          onDoubleTap();
        } else if (onTap) {
          onTap();
        }
        lastTap = now;
      }

      touchStart = null;
      initialDistance = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    swipeThreshold,
    pinchThreshold,
  ]);
};

// ============================================================================
// MOBILE PERFORMANCE OPTIMIZATIONS
// ============================================================================

export const useMobilePerformance = () => {
  const deviceInfo = useDeviceDetection();

  const optimizedSettings = useMemo(
    () => ({
      // Reduce animations on low-end devices
      reduceAnimations: deviceInfo.isMobile && deviceInfo.pixelRatio < 2,

      // Optimize images for mobile
      imageQuality: deviceInfo.isMobile
        ? deviceInfo.screenSize === 'small'
          ? 'low'
          : 'medium'
        : 'high',

      // Lazy loading threshold
      lazyLoadThreshold: deviceInfo.isMobile ? '100px' : '200px',

      // Touch delay optimization
      touchDelay: deviceInfo.isTouchDevice ? 0 : 300,

      // Memory optimization
      maxCachedItems: deviceInfo.isMobile ? 5 : 20,
    }),
    [deviceInfo]
  );

  const optimizeForMobile = useCallback(
    (element: HTMLElement) => {
      if (deviceInfo.isMobile) {
        // Optimize touch handling
        element.style.touchAction = 'manipulation';
        element.style.setProperty('-webkit-tap-highlight-color', 'transparent');

        // Optimize scrolling
        element.style.setProperty('-webkit-overflow-scrolling', 'touch');
        element.style.overscrollBehavior = 'contain';
      }
    },
    [deviceInfo.isMobile]
  );

  return {
    deviceInfo,
    optimizedSettings,
    optimizeForMobile,
  };
};

// ============================================================================
// MOBILE-FIRST RESPONSIVE UTILITIES
// ============================================================================

export const useMobileBreakpoints = () => {
  const viewport = useViewport();

  return useMemo(
    () => ({
      isXSmall: viewport.width < 375,
      isSmall: viewport.width >= 375 && viewport.width < 768,
      isMedium: viewport.width >= 768 && viewport.width < 1024,
      isLarge: viewport.width >= 1024,

      // Helper functions
      isMobileSize: viewport.width < 768,
      isTabletSize: viewport.width >= 768 && viewport.width < 1024,
      isDesktopSize: viewport.width >= 1024,

      // Responsive values
      getResponsiveValue: <T>(values: {
        mobile: T;
        tablet?: T;
        desktop?: T;
      }): T => {
        if (viewport.width >= 1024 && values.desktop !== undefined) {
          return values.desktop;
        }
        if (viewport.width >= 768 && values.tablet !== undefined) {
          return values.tablet;
        }
        return values.mobile;
      },
    }),
    [viewport.width]
  );
};
