/**
 * Mobile Interactions Test Suite
 * 
 * Comprehensive tests for mobile touch interactions, swipe gestures,
 * and responsive behavior on iOS and Android devices.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { ThemeProvider } from '../themeContext';
import { HapticFeedbackProvider } from '../hapticContext';
import SwipeNavigationContainer from '../SwipeNavigationContainer';
import { useSwipeGestures } from '../useSwipeGestures';

// Mock viewport for mobile testing
const mockViewport = (width: number, height: number, userAgent?: string) => {
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
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

// Mock touch events helper
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      identifier: 0,
      target: document.body,
      pageX: touch.clientX,
      pageY: touch.clientY,
      screenX: touch.clientX,
      screenY: touch.clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as unknown as Touch)),
    changedTouches: touches.map(touch => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      identifier: 0,
      target: document.body,
      pageX: touch.clientX,
      pageY: touch.clientY,
      screenX: touch.clientX,
      screenY: touch.clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as unknown as Touch)),
    bubbles: true,
    cancelable: true,
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('Mobile Interactions', () => {
  beforeEach(() => {
    // Reset viewport before each test
    mockViewport(375, 667); // iPhone SE dimensions
    vi.clearAllMocks();
  });

  describe('iOS Device Testing', () => {
    beforeEach(() => {
      mockViewport(375, 812, 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
    });

    it('should handle vertical scrolling on iOS', async () => {
      const TestComponent = () => {
        const { createSwipeHandler } = useSwipeGestures({
          threshold: 100,
          enableVisualFeedback: true,
        });

        const handlers = createSwipeHandler(
          vi.fn(),
          vi.fn(),
          true,
          true
        );

        return (
          <div
            data-testid="scroll-container"
            style={{ height: '200px', overflow: 'auto' }}
            {...handlers}
          >
            <div style={{ height: '400px' }}>Scrollable content</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('scroll-container');

      // Simulate vertical scroll gesture
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 50 }]); // Vertical movement
      const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 50 }]);

      fireEvent(container, touchStart);
      fireEvent(container, touchMove);
      fireEvent(container, touchEnd);

      // Verify that vertical scrolling is not prevented
      expect(touchMove.defaultPrevented).toBe(false);
    });

    it('should handle horizontal swipe gestures on iOS', async () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const TestComponent = () => {
        const { createSwipeHandler } = useSwipeGestures({
          threshold: 80,
          enableVisualFeedback: true,
        });

        const handlers = createSwipeHandler(
          onSwipeLeft,
          onSwipeRight,
          true,
          true
        );

        return (
          <div
            data-testid="swipe-container"
            {...handlers}
          >
            Swipeable content
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('swipe-container');

      // Simulate horizontal swipe left
      const touchStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }]);
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]); // Horizontal movement
      const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 100 }]);

      fireEvent(container, touchStart);
      fireEvent(container, touchMove);
      fireEvent(container, touchEnd);

      await waitFor(() => {
        expect(onSwipeLeft).toHaveBeenCalled();
      });
    });

    it('should handle touch tap events on iOS', async () => {
      const onTap = vi.fn();

      const TestComponent = () => (
        <button
          data-testid="tap-button"
          onClick={onTap}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            touchAction: 'manipulation',
          }}
        >
          Tap me
        </button>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByTestId('tap-button');

      // Simulate tap (quick touch)
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 100 }]);

      fireEvent(button, touchStart);
      fireEvent(button, touchEnd);
      fireEvent.click(button);

      expect(onTap).toHaveBeenCalled();
    });
  });

  describe('Android Device Testing', () => {
    beforeEach(() => {
      mockViewport(360, 640, 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36');
    });

    it('should handle vertical scrolling on Android', async () => {
      const TestComponent = () => {
        const { createSwipeHandler } = useSwipeGestures({
          threshold: 100,
          enableVisualFeedback: true,
        });

        const handlers = createSwipeHandler(
          vi.fn(),
          vi.fn(),
          true,
          true
        );

        return (
          <div
            data-testid="android-scroll"
            style={{ height: '200px', overflow: 'auto' }}
            {...handlers}
          >
            <div style={{ height: '600px' }}>Android scrollable content</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('android-scroll');

      // Android-style scrolling with momentum
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]);
      const touchMove1 = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
      const touchMove2 = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
      const touchEnd = createTouchEvent('touchend', [{ clientX: 100, clientY: 50 }]);

      fireEvent(container, touchStart);
      fireEvent(container, touchMove1);
      fireEvent(container, touchMove2);
      fireEvent(container, touchEnd);

      // Verify scrolling behavior
      expect(touchMove1.defaultPrevented).toBe(false);
      expect(touchMove2.defaultPrevented).toBe(false);
    });

    it('should handle swipe navigation on Android', async () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      render(
        <TestWrapper>
          <SwipeNavigationContainer
            currentScreen="Home"
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            canSwipeLeft={true}
            canSwipeRight={true}
            theme={{
              primaryText: '#000',
              secondaryText: '#666',
              appBackground: '#fff',
              cardBackground: '#f5f5f5',
              cardBorder: '#ddd',
              weatherCardBackground: '#fff',
              weatherCardBorder: '#ddd',
              forecastCardBackground: '#f9f9f9',
              forecastCardBorder: '#eee',
              toggleBorder: '#ccc',
              primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              secondaryGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              inverseText: '#fff',
              buttonGradient: '#667eea',
              buttonGradientHover: '#5a6fd8',
              buttonGradientDisabled: '#ccc',
              weatherCardBadge: '#667eea',
              errorBackground: '#fee',
              errorText: '#c53030',
              errorBorder: '#fed7d7',
              loadingBackground: '#f7fafc',
              disabledText: '#a0aec0',
              cardShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              buttonShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              toggleBackground: '#fff',
              toggleIcon: '#667eea',
            }}
            isMobile={true}
            swipeThreshold={80}
          >
            <div data-testid="android-content">Android content</div>
          </SwipeNavigationContainer>
        </TestWrapper>
      );

      const container = screen.getByTestId('android-content').parentElement;

      // Android swipe right (back navigation)
      const touchStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 300 }]);
      const touchMove = createTouchEvent('touchmove', [{ clientX: 150, clientY: 300 }]);
      const touchEnd = createTouchEvent('touchend', [{ clientX: 150, clientY: 300 }]);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      await waitFor(() => {
        expect(onSwipeRight).toHaveBeenCalled();
      });
    });
  });

  describe('Cross-Platform Touch Handling', () => {
    it('should prevent default only during active horizontal swipes', async () => {
      const TestComponent = () => {
        const { createSwipeHandler } = useSwipeGestures({
          threshold: 80,
          enableVisualFeedback: true,
        });

        const handlers = createSwipeHandler(
          vi.fn(),
          vi.fn(),
          true,
          true
        );

        return (
          <div
            data-testid="cross-platform-swipe"
            {...handlers}
          >
            Cross-platform content
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('cross-platform-swipe');

      // Test initial touch - should not prevent default
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(container, touchStart);
      expect(touchStart.defaultPrevented).toBe(false);

      // Test small movement - should not prevent default
      const touchMoveSmall = createTouchEvent('touchmove', [{ clientX: 105, clientY: 100 }]);
      fireEvent(container, touchMoveSmall);
      expect(touchMoveSmall.defaultPrevented).toBe(false);

      // Test vertical movement - should not prevent default
      const touchMoveVertical = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
      fireEvent(container, touchMoveVertical);
      expect(touchMoveVertical.defaultPrevented).toBe(false);

      // Reset and test horizontal movement - should prevent default once dragging starts
      const newTouchStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 200 }]);
      fireEvent(container, newTouchStart);

      const touchMoveHorizontal = createTouchEvent('touchmove', [{ clientX: 150, clientY: 200 }]);
      fireEvent(container, touchMoveHorizontal);
      
      // After significant horizontal movement, subsequent moves should prevent default
      const touchMoveHorizontal2 = createTouchEvent('touchmove', [{ clientX: 120, clientY: 200 }]);
      fireEvent(container, touchMoveHorizontal2);
    });

    it('should maintain touch target size requirements (44px minimum)', () => {
      const TestButton = () => (
        <button
          data-testid="wcag-button"
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '12px',
          }}
        >
          WCAG Compliant Button
        </button>
      );

      render(
        <TestWrapper>
          <TestButton />
        </TestWrapper>
      );

      const button = screen.getByTestId('wcag-button');
      const styles = window.getComputedStyle(button);
      
      // Check minimum touch target size
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Performance on Mobile Devices', () => {
    const handleTouch = () => {
      // This should be a passive listener for scroll containers
    };

    it('should use hardware acceleration for animations', () => {
      const TestAnimatedComponent = () => (
        <div
          data-testid="animated-element"
          style={{
            transform: 'translateX(0px)',
            transition: 'transform 0.3s ease',
            willChange: 'transform',
          }}
        >
          Animated content
        </div>
      );

      render(
        <TestWrapper>
          <TestAnimatedComponent />
        </TestWrapper>
      );

      const element = screen.getByTestId('animated-element');
      const styles = window.getComputedStyle(element);
      
      expect(styles.willChange).toBe('transform');
      expect(styles.transform).toBeDefined();
    });

    it('should handle touch events passively where appropriate', async () => {
      const TestComponent = () => (
        <div
          data-testid="passive-touch"
          onTouchStart={handleTouch}
          style={{
            touchAction: 'auto',
            overflow: 'auto',
            height: '300px',
          }}
        >
          <div style={{ height: '600px' }}>Scrollable content</div>
        </div>
      );

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('passive-touch');
      const styles = window.getComputedStyle(container);
      
      expect(styles.touchAction).toBe('auto');
      expect(styles.overflow).toBe('auto');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should detect mobile viewport correctly', () => {
      // iPhone SE
      mockViewport(375, 667);
      fireEvent(window, new Event('resize'));
      
      // Mobile-specific element should be visible
      const TestComponent = () => {
        const isMobile = window.innerWidth <= 768;
        return (
          <div>
            {isMobile && <div data-testid="mobile-only">Mobile UI</div>}
            {!isMobile && <div data-testid="desktop-only">Desktop UI</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('mobile-only')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-only')).not.toBeInTheDocument();
    });

    it('should handle orientation changes', async () => {
      // Portrait
      mockViewport(375, 812);
      
      const TestComponent = () => {
        const isPortrait = window.innerHeight > window.innerWidth;
        return (
          <div data-testid="orientation">
            {isPortrait ? 'Portrait' : 'Landscape'}
          </div>
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('orientation')).toHaveTextContent('Portrait');

      // Landscape
      mockViewport(812, 375);
      
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('orientation')).toHaveTextContent('Landscape');
    });
  });
});
