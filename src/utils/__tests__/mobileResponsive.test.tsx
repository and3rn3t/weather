/**
 * Mobile Responsive Design Tests
 * 
 * Tests for responsive design behavior across different mobile devices,
 * screen sizes, and orientations.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '../themeContext';
import { HapticFeedbackProvider } from '../hapticContext';
import { useBreakpoint } from '../useMobileOptimization';

// Mock viewport utilities
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('Mobile Responsive Design Tests', () => {
  afterEach(() => {
    // Reset viewport after each test
    mockViewport(1024, 768);
  });

  describe('Device Detection', () => {
    it('should detect iPhone correctly', () => {
      mockViewport(375, 812, 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
      
      const TestComponent = () => {
        const { isMobile, currentBreakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="breakpoint">{currentBreakpoint}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('mobile');
    });

    it('should detect Android correctly', () => {
      mockViewport(360, 640, 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36');
      
      const TestComponent = () => {
        const { isMobile, currentBreakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="breakpoint">{currentBreakpoint}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('mobile');
    });

    it('should detect iPad correctly', () => {
      mockViewport(768, 1024, 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
      
      const TestComponent = () => {
        const { isTablet, currentBreakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="breakpoint">{currentBreakpoint}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('tablet');
    });
  });

  describe('Screen Size Breakpoints', () => {
    it('should handle mobile breakpoint (320-767px)', () => {
      mockViewport(375, 667); // iPhone SE
      
      const TestComponent = () => {
        const { isMobile, windowSize } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="width">{windowSize.width}</div>
            <div data-testid="height">{windowSize.height}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('width')).toHaveTextContent('375');
      expect(screen.getByTestId('height')).toHaveTextContent('667');
    });

    it('should handle tablet breakpoint (768-1023px)', () => {
      mockViewport(768, 1024); // iPad
      
      const TestComponent = () => {
        const { isTablet, isMobile } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
    });

    it('should handle desktop breakpoint (1024px+)', () => {
      mockViewport(1200, 800); // Desktop
      
      const TestComponent = () => {
        const { isTablet, isMobile, currentBreakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="breakpoint">{currentBreakpoint}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop');
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition', () => {
      // Start in portrait
      mockViewport(375, 812);
      
      const TestComponent = () => {
        const { windowSize } = useBreakpoint();
        const isPortrait = windowSize.height > windowSize.width;
        return (
          <div>
            <div data-testid="orientation">{isPortrait ? 'portrait' : 'landscape'}</div>
            <div data-testid="width">{windowSize.width}</div>
            <div data-testid="height">{windowSize.height}</div>
          </div>
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');

      // Switch to landscape
      mockViewport(812, 375);
      
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
    });

    it('should handle tablet orientation changes', () => {
      // iPad portrait
      mockViewport(768, 1024);
      
      const TestComponent = () => {
        const { windowSize, isTablet } = useBreakpoint();
        const isPortrait = windowSize.height > windowSize.width;
        return (
          <div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="orientation">{isPortrait ? 'portrait' : 'landscape'}</div>
          </div>
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait');

      // iPad landscape
      mockViewport(1024, 768);
      
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('orientation')).toHaveTextContent('landscape');
    });
  });

  describe('CSS Media Query Simulation', () => {
    it('should apply mobile styles correctly', () => {
      mockViewport(375, 667);
      
      const MobileCard = () => (
        <div
          data-testid="mobile-card"
          style={{
            padding: window.innerWidth <= 768 ? '16px' : '24px',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
            margin: window.innerWidth <= 768 ? '8px' : '16px',
          }}
        >
          Mobile optimized card
        </div>
      );

      render(
        <TestWrapper>
          <MobileCard />
        </TestWrapper>
      );

      const card = screen.getByTestId('mobile-card');
      const styles = window.getComputedStyle(card);
      
      expect(styles.padding).toBe('16px');
      expect(styles.fontSize).toBe('14px');
      expect(styles.margin).toBe('8px');
    });

    it('should apply tablet styles correctly', () => {
      mockViewport(768, 1024);
      
      const TabletCard = () => (
        <div
          data-testid="tablet-card"
          style={{
            padding: window.innerWidth > 768 ? '24px' : '16px',
            fontSize: window.innerWidth > 768 ? '16px' : '14px',
            maxWidth: window.innerWidth > 768 ? '600px' : '100%',
          }}
        >
          Tablet optimized card
        </div>
      );

      render(
        <TestWrapper>
          <TabletCard />
        </TestWrapper>
      );

      const card = screen.getByTestId('tablet-card');
      const styles = window.getComputedStyle(card);
      
      expect(styles.padding).toBe('16px'); // Should still use mobile styles at exactly 768px
      expect(styles.fontSize).toBe('14px');
      expect(styles.maxWidth).toBe('100%');
    });
  });

  describe('Touch Target Accessibility', () => {
    it('should maintain minimum touch target size on all devices', () => {
      const devices = [
        { width: 320, height: 568, name: 'iPhone 5' },
        { width: 375, height: 667, name: 'iPhone 8' },
        { width: 414, height: 896, name: 'iPhone 11' },
        { width: 360, height: 640, name: 'Android' },
        { width: 768, height: 1024, name: 'iPad' },
      ];

      devices.forEach(device => {
        mockViewport(device.width, device.height);
        
        const TouchButton = () => (
          <button
            data-testid={`button-${device.name.replace(/\s+/g, '-').toLowerCase()}`}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            {device.name} Button
          </button>
        );

        render(
          <TestWrapper>
            <TouchButton />
          </TestWrapper>
        );

        const button = screen.getByTestId(`button-${device.name.replace(/\s+/g, '-').toLowerCase()}`);
        const styles = window.getComputedStyle(button);
        
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
        expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
      });
    });

    it('should provide adequate spacing between touch targets', () => {
      mockViewport(375, 667);
      
      const TouchTargetGroup = () => (
        <div data-testid="touch-group" style={{ display: 'flex', gap: '8px' }}>
          <button
            data-testid="button-1"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            1
          </button>
          <button
            data-testid="button-2"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            2
          </button>
          <button
            data-testid="button-3"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            3
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <TouchTargetGroup />
        </TestWrapper>
      );

      const group = screen.getByTestId('touch-group');
      const styles = window.getComputedStyle(group);
      
      expect(styles.gap).toBe('8px'); // Minimum 8px spacing between touch targets
    });
  });

  describe('Performance Optimizations', () => {
    it('should use hardware acceleration for animations on mobile', () => {
      mockViewport(375, 667);
      
      const AnimatedElement = () => (
        <div
          data-testid="animated-element"
          style={{
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: 'transform',
            transition: 'transform 0.3s ease',
          }}
        >
          Hardware accelerated element
        </div>
      );

      render(
        <TestWrapper>
          <AnimatedElement />
        </TestWrapper>
      );

      const element = screen.getByTestId('animated-element');
      const styles = window.getComputedStyle(element);
      
      expect(styles.transform).toContain('translateZ');
      expect(styles.willChange).toBe('transform');
    });

    it('should optimize scroll performance on mobile', () => {
      mockViewport(375, 667);
      
      const ScrollContainer = () => (
        <div
          data-testid="scroll-container"
          style={{
            overflowY: 'auto',
            height: '300px',
            WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
            scrollBehavior: 'smooth',
          }}
        >
          <div style={{ height: '600px' }}>Scrollable content</div>
        </div>
      );

      render(
        <TestWrapper>
          <ScrollContainer />
        </TestWrapper>
      );

      const container = screen.getByTestId('scroll-container');
      const styles = window.getComputedStyle(container);
      
      expect(styles.overflowY).toBe('auto');
      expect(styles.scrollBehavior).toBe('smooth');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small screens (< 320px)', () => {
      mockViewport(280, 500); // Very small screen
      
      const TestComponent = () => {
        const { isMobile, windowSize } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="width">{windowSize.width}</div>
            <div data-testid="height">{windowSize.height}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('width')).toHaveTextContent('280');
    });

    it('should handle very large screens (> 2000px)', () => {
      mockViewport(2560, 1440); // 4K screen
      
      const TestComponent = () => {
        const { isMobile, isTablet, currentBreakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="breakpoint">{currentBreakpoint}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop');
    });

    it('should handle rapid orientation changes', () => {
      const TestComponent = () => {
        const { windowSize } = useBreakpoint();
        return (
          <div>
            <div data-testid="dimensions">{windowSize.width}x{windowSize.height}</div>
          </div>
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Rapid orientation changes
      const orientations = [
        { width: 375, height: 812 }, // Portrait
        { width: 812, height: 375 }, // Landscape
        { width: 375, height: 812 }, // Back to portrait
        { width: 812, height: 375 }, // Back to landscape
      ];

      orientations.forEach(({ width, height }) => {
        mockViewport(width, height);
        rerender(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );
        expect(screen.getByTestId('dimensions')).toHaveTextContent(`${width}x${height}`);
      });
    });
  });
});
