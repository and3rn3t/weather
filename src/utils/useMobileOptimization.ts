/**
 * Mobile Optimization Hook
 *
 * Custom React hook for managing mobile-responsive behavior,
 * including breakpoint detection, touch support, and performance optimization.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentBreakpoint,
  createResizeHandler,
  supportsHover,
  prefersReducedMotion,
} from './responsiveUtils';

// ============================================================================
// MOBILE DETECTION AND RESPONSIVE BEHAVIOR
// ============================================================================

/**
 * Hook for responsive breakpoint detection
 */
/**
 * useBreakpoint - Custom React hook for useMobileOptimization functionality
 */
/**
 * useBreakpoint - Custom React hook for useMobileOptimization functionality
 */
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState(() =>
    getCurrentBreakpoint()
  );
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = createResizeHandler(() => {
      const newBreakpoint = getCurrentBreakpoint();
      setCurrentBreakpoint(newBreakpoint);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    currentBreakpoint,
    windowSize,
    isMobile: currentBreakpoint === 'mobile',
    isMobileLarge: currentBreakpoint === 'mobileLarge',
    isTablet: currentBreakpoint === 'tablet',
    isTabletLarge: currentBreakpoint === 'tabletLarge',
    isDesktop:
      currentBreakpoint === 'desktop' || currentBreakpoint === 'desktopLarge',
    isSmallScreen: ['mobile', 'mobileLarge'].includes(currentBreakpoint),
    isMediumScreen: ['tablet', 'tabletLarge'].includes(currentBreakpoint),
    isLargeScreen: ['desktop', 'desktopLarge'].includes(currentBreakpoint),
  };
};

/**
 * Hook for touch and interaction capabilities
 */
/**
 * useInteractionCapabilities - Custom React hook for useMobileOptimization functionality
 */
/**
 * useInteractionCapabilities - Custom React hook for useMobileOptimization functionality
 */
export const useInteractionCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasHover: supportsHover(),
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    reducedMotion: prefersReducedMotion(),
    isRetina: window.devicePixelRatio > 1.5,
  });

  useEffect(() => {
    const updateCapabilities = () => {
      setCapabilities({
        hasHover: supportsHover(),
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        reducedMotion: prefersReducedMotion(),
        isRetina: window.devicePixelRatio > 1.5,
      });
    };

    // Listen for orientation changes that might affect capabilities
    window.addEventListener('orientationchange', updateCapabilities);

    return () => {
      window.removeEventListener('orientationchange', updateCapabilities);
    };
  }, []);

  return capabilities;
};

/**
 * Hook for optimized scroll behavior on mobile
 */
/**
 * useOptimizedScroll - Custom React hook for useMobileOptimization functionality
 */
/**
 * useOptimizedScroll - Custom React hook for useMobileOptimization functionality
 */
export const useOptimizedScroll = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(
    null
  );
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }

      setLastScrollY(currentScrollY);
      setIsScrolling(true);

      // Clear existing timeout
      clearTimeout(timeoutId);

      // Set scrolling to false after scroll ends
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
        setScrollDirection(null);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);
  return {
    isScrolling,
    scrollDirection,
    lastScrollY,
  };
};

/**
 * Hook for network-aware loading
 */
/**
 * useNetworkAwareLoading - Custom React hook for useMobileOptimization functionality
 */
/**
 * useNetworkAwareLoading - Custom React hook for useMobileOptimization functionality
 */
export const useNetworkAwareLoading = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
  });

  useEffect(() => {
    // Check if Network Information API is available
    interface NavigatorConnection {
      effectiveType?: string;
      downlink?: number;
      saveData?: boolean;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    }

    interface NavigatorWithConnection extends Navigator {
      connection?: NavigatorConnection;
      mozConnection?: NavigatorConnection;
      webkitConnection?: NavigatorConnection;
    }

    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          saveData: connection.saveData || false,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return {
    ...networkInfo,
    isSlowConnection:
      networkInfo.effectiveType === 'slow-2g' ||
      networkInfo.effectiveType === '2g',
    isFastConnection:
      networkInfo.effectiveType === '4g' || networkInfo.downlink > 1.5,
    shouldOptimizeImages:
      networkInfo.saveData ||
      networkInfo.effectiveType === 'slow-2g' ||
      networkInfo.effectiveType === '2g',
  };
};

/**
 * Hook for mobile performance optimization
 */
/**
 * useMobilePerformance - Custom React hook for useMobileOptimization functionality
 */
/**
 * useMobilePerformance - Custom React hook for useMobileOptimization functionality
 */
export const useMobilePerformance = () => {
  const { isSmallScreen } = useBreakpoint();
  const { hasTouch, reducedMotion } = useInteractionCapabilities();
  const { isSlowConnection, shouldOptimizeImages } = useNetworkAwareLoading();

  const performanceSettings = {
    // Reduce animations on slow devices or when user prefers reduced motion
    enableAnimations: !reducedMotion && !isSlowConnection,

    // Use smaller images on mobile and slow connections
    imageQuality: shouldOptimizeImages || isSmallScreen ? 'low' : 'high',

    // Lazy load non-critical content on mobile
    enableLazyLoading: isSmallScreen || isSlowConnection,

    // Reduce API polling frequency on slow connections
    apiPollingInterval: isSlowConnection ? 60000 : 30000, // ms

    // Enable touch optimizations
    enableTouchOptimizations: hasTouch,

    // Preload critical resources
    enablePreloading: !isSlowConnection && !shouldOptimizeImages,
  };

  return performanceSettings;
};

/**
 * Hook for responsive container queries
 */
/**
 * useContainerSize - Custom React hook for useMobileOptimization functionality
 */
/**
 * useContainerSize - Custom React hook for useMobileOptimization functionality
 */
export const useContainerSize = (ref: React.RefObject<HTMLElement>) => {
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return {
    ...containerSize,
    isNarrow: containerSize.width < 400,
    isMedium: containerSize.width >= 400 && containerSize.width < 768,
    isWide: containerSize.width >= 768,
  };
};

/**
 * Hook for mobile-optimized API requests
 */
/**
 * useMobileOptimizedAPI - Custom React hook for useMobileOptimization functionality
 */
/**
 * useMobileOptimizedAPI - Custom React hook for useMobileOptimization functionality
 */
export const useMobileOptimizedAPI = () => {
  const { isSlowConnection } = useNetworkAwareLoading();
  const { enablePreloading } = useMobilePerformance();

  const optimizedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      // Add request optimizations for mobile
      const optimizedOptions: RequestInit = {
        ...options,
        // Add timeout for slow connections
        signal: AbortSignal.timeout(isSlowConnection ? 15000 : 8000),
        headers: {
          ...options.headers,
          // Request compressed responses
          'Accept-Encoding': 'gzip, deflate, br',
          // Indicate mobile client
          'User-Agent': 'WeatherApp/1.0 Mobile',
          // Request lightweight responses when possible
          ...(isSlowConnection && { 'X-Requested-With': 'mobile-optimized' }),
        },
      };

      try {
        const response = await fetch(url, optimizedOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        // Enhanced error handling for mobile scenarios
        if (error instanceof Error) {
          if (error.name === 'TimeoutError') {
            throw new Error('Request timeout - please check your connection');
          }
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(
              'Network error - please check your internet connection'
            );
          }
        }
        throw error;
      }
    },
    [isSlowConnection]
  );

  return {
    optimizedFetch,
    enablePreloading,
    isSlowConnection,
  };
};

/**
 * Hook for touch gesture support
 */
/**
 * useTouchGestures - Custom React hook for useMobileOptimization functionality
 */
/**
 * useTouchGestures - Custom React hook for useMobileOptimization functionality
 */
export const useTouchGestures = () => {
  const [touchState, setTouchState] = useState({
    isTouching: false,
    touchCount: 0,
    lastTap: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchState({
      isTouching: true,
      touchCount: e.touches.length,
      lastTap: Date.now(),
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isTouching: false,
      touchCount: 0,
    }));
  }, []);

  const handleDoubleTap = useCallback(
    (callback: () => void) => {
      return () => {
        const now = Date.now();
        const timeSinceLastTap = now - touchState.lastTap;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          callback();
        }

        setTouchState(prev => ({
          ...prev,
          lastTap: now,
        }));
      };
    },
    [touchState.lastTap]
  );

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return {
    ...touchState,
    handleDoubleTap,
    createSwipeHandler: (
      onSwipeLeft?: () => void,
      onSwipeRight?: () => void
    ) => {
      let startX = 0;
      let startY = 0;

      return {
        onTouchStart: (e: React.TouchEvent) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        },
        onTouchEnd: (e: React.TouchEvent) => {
          if (!startX || !startY) return;

          const endX = e.changedTouches[0].clientX;
          const endY = e.changedTouches[0].clientY;

          const deltaX = endX - startX;
          const deltaY = endY - startY;

          // Only trigger swipe if horizontal movement is greater than vertical
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
          }

          startX = 0;
          startY = 0;
        },
      };
    },
  };
};

export default {
  useBreakpoint,
  useInteractionCapabilities,
  useOptimizedScroll,
  useNetworkAwareLoading,
  useMobilePerformance,
  useContainerSize,
  useMobileOptimizedAPI,
  useTouchGestures,
};
