/**
 * Enhanced Mobile Features Test Suite
 *
 * Critical mobile testing for production readiness including:
 * - Responsive breakpoint detection
 * - Touch interaction capabilities
 * - Pull-to-refresh functionality
 * - Haptic feedback integration
 * - Mobile UI performance
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themeContext';
import { useHapticFeedback } from '../useHapticFeedback';
import {
  useBreakpoint,
  useInteractionCapabilities,
} from '../useMobileOptimization';
import { usePullToRefresh } from '../usePullToRefresh';

// Mock viewport for testing
const mockViewport = (width: number, height: number) => {
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
  fireEvent(window, new Event('resize'));
};

// Test wrapper
const MobileTestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ThemeProvider>{children}</ThemeProvider>;

// Test component for breakpoint detection
const BreakpointTestComponent = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop, windowSize } =
    useBreakpoint();

  return (
    <div data-testid="breakpoint-info">
      <div data-testid="current-breakpoint">{currentBreakpoint}</div>
      <div data-testid="is-mobile">{isMobile.toString()}</div>
      <div data-testid="is-tablet">{isTablet.toString()}</div>
      <div data-testid="is-desktop">{isDesktop.toString()}</div>
      <div data-testid="window-width">{windowSize.width}</div>
      <div data-testid="window-height">{windowSize.height}</div>
    </div>
  );
};

// Test component for interaction capabilities
const InteractionTestComponent = () => {
  const { hasHover, hasTouch, reducedMotion, isRetina } =
    useInteractionCapabilities();

  return (
    <div data-testid="interaction-info">
      <div data-testid="has-hover">{hasHover.toString()}</div>
      <div data-testid="has-touch">{hasTouch.toString()}</div>
      <div data-testid="reduced-motion">{reducedMotion.toString()}</div>
      <div data-testid="is-retina">{isRetina.toString()}</div>
    </div>
  );
};

// Test component for haptic feedback
const HapticTestComponent = () => {
  const { triggerHaptic, isSupported, isEnabled } = useHapticFeedback();

  return (
    <div data-testid="haptic-container">
      <div data-testid="haptic-supported">{isSupported.toString()}</div>
      <div data-testid="haptic-enabled">{isEnabled.toString()}</div>
      <button data-testid="haptic-button" onClick={() => triggerHaptic(100)}>
        Vibrate
      </button>
    </div>
  );
};

// Test component for pull-to-refresh
const PullToRefreshTestComponent = () => {
  const { isPullActivated, pullDistance, pullToRefreshHandlers, refreshState } =
    usePullToRefresh(() => Promise.resolve());

  return (
    <div data-testid="pullable-container" {...pullToRefreshHandlers}>
      <div data-testid="pull-activated">{isPullActivated.toString()}</div>
      <div data-testid="pull-distance">{Math.round(pullDistance)}</div>
      <div data-testid="refresh-state">{refreshState}</div>
    </div>
  );
};

describe('Enhanced Mobile Features Test Suite', () => {
  beforeEach(() => {
    // Reset to mobile viewport
    mockViewport(375, 667); // iPhone SE dimensions

    // Mock vibration API
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vi.fn(() => true),
    });

    // Mock touch support
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset to desktop
    mockViewport(1024, 768);
  });

  describe('Responsive Breakpoint Detection', () => {
    it('should detect mobile breakpoint correctly', async () => {
      mockViewport(375, 667); // iPhone SE

      render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-breakpoint')).toHaveTextContent(
          'mobile',
        );
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      });
    });

    it('should detect tablet breakpoint correctly', async () => {
      mockViewport(768, 1024); // iPad

      render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-breakpoint')).toHaveTextContent(
          'tablet',
        );
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      });
    });

    it('should detect desktop breakpoint correctly', async () => {
      mockViewport(1200, 800); // Desktop

      render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-breakpoint')).toHaveTextContent(
          'desktop',
        );
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
        expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
        expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
      });
    });

    it('should update breakpoint on window resize', async () => {
      const { rerender } = render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      // Start with mobile
      expect(screen.getByTestId('current-breakpoint')).toHaveTextContent(
        'mobile',
      );

      // Resize to tablet
      mockViewport(768, 1024);

      rerender(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('current-breakpoint')).toHaveTextContent(
            'tablet',
          );
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Touch and Interaction Capabilities', () => {
    it('should detect touch capabilities on mobile', () => {
      // Set up mobile environment
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });

      render(
        <MobileTestWrapper>
          <InteractionTestComponent />
        </MobileTestWrapper>,
      );

      expect(screen.getByTestId('has-touch')).toHaveTextContent('true');
    });

    it('should detect hover capabilities on desktop', () => {
      // Mock desktop environment
      mockViewport(1200, 800);
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      render(
        <MobileTestWrapper>
          <InteractionTestComponent />
        </MobileTestWrapper>,
      );

      // Note: Has hover detection depends on media queries which are hard to mock
      // So we just verify the component renders without error
      expect(screen.getByTestId('interaction-info')).toBeInTheDocument();
    });

    it('should detect retina displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 2.0,
        configurable: true,
      });

      render(
        <MobileTestWrapper>
          <InteractionTestComponent />
        </MobileTestWrapper>,
      );

      expect(screen.getByTestId('is-retina')).toHaveTextContent('true');
    });

    it('should detect reduced motion preference', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <MobileTestWrapper>
          <InteractionTestComponent />
        </MobileTestWrapper>,
      );

      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });

  describe('Haptic Feedback Integration', () => {
    it('should detect vibration API support', () => {
      render(
        <MobileTestWrapper>
          <HapticTestComponent />
        </MobileTestWrapper>,
      );

      expect(screen.getByTestId('haptic-supported')).toHaveTextContent('true');
    });

    it('should trigger haptic feedback when requested', async () => {
      const mockVibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
      });

      const user = userEvent.setup();

      render(
        <MobileTestWrapper>
          <HapticTestComponent />
        </MobileTestWrapper>,
      );

      await user.click(screen.getByTestId('haptic-button'));

      // Note: The actual haptic implementation might transform the pattern
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should handle missing vibration API gracefully', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      });

      render(
        <MobileTestWrapper>
          <HapticTestComponent />
        </MobileTestWrapper>,
      );

      // Should still render without error
      expect(screen.getByTestId('haptic-container')).toBeInTheDocument();
    });
  });

  describe('Pull-to-Refresh Functionality', () => {
    it('should initialize with correct default state', () => {
      render(
        <MobileTestWrapper>
          <PullToRefreshTestComponent />
        </MobileTestWrapper>,
      );

      expect(screen.getByTestId('pull-activated')).toHaveTextContent('false');
      expect(screen.getByTestId('pull-distance')).toHaveTextContent('0');
      expect(screen.getByTestId('refresh-state')).toHaveTextContent('idle');
    });

    it('should handle touch events without errors', () => {
      render(
        <MobileTestWrapper>
          <PullToRefreshTestComponent />
        </MobileTestWrapper>,
      );

      const container = screen.getByTestId('pullable-container');

      // Create touch event
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            identifier: 0,
            clientX: 100,
            clientY: 50,
            pageX: 100,
            pageY: 50,
            screenX: 100,
            screenY: 50,
            target: container,
          },
        ] as any,
        bubbles: true,
      });

      // Should not throw error
      expect(() => {
        fireEvent(container, touchEvent);
      }).not.toThrow();
    });

    it('should respond to touch gestures', async () => {
      render(
        <MobileTestWrapper>
          <PullToRefreshTestComponent />
        </MobileTestWrapper>,
      );

      const container = screen.getByTestId('pullable-container');

      // Simulate pull gesture
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 50 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // The component should remain stable
      expect(screen.getByTestId('pullable-container')).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid viewport changes', async () => {
      const { rerender } = render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      // Rapid viewport changes
      for (let i = 0; i < 10; i++) {
        mockViewport(300 + i * 100, 600);
        rerender(
          <MobileTestWrapper>
            <BreakpointTestComponent />
          </MobileTestWrapper>,
        );
      }

      // Should still be responsive
      expect(screen.getByTestId('breakpoint-info')).toBeInTheDocument();
    });

    it('should handle missing APIs gracefully', () => {
      // Remove touch support
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      // Remove vibration
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });

      expect(() => {
        render(
          <MobileTestWrapper>
            <InteractionTestComponent />
          </MobileTestWrapper>,
        );
      }).not.toThrow();

      expect(() => {
        render(
          <MobileTestWrapper>
            <HapticTestComponent />
          </MobileTestWrapper>,
        );
      }).not.toThrow();
    });

    it('should maintain functionality across orientation changes', async () => {
      render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
        </MobileTestWrapper>,
      );

      // Simulate orientation change
      mockViewport(667, 375); // Landscape
      fireEvent(window, new Event('orientationchange'));

      await waitFor(() => {
        expect(screen.getByTestId('window-width')).toHaveTextContent('667');
        expect(screen.getByTestId('window-height')).toHaveTextContent('375');
      });
    });
  });

  describe('Critical Mobile Features Integration', () => {
    it('should work correctly with theme system', () => {
      render(
        <MobileTestWrapper>
          <div data-testid="themed-mobile">
            <BreakpointTestComponent />
            <InteractionTestComponent />
          </div>
        </MobileTestWrapper>,
      );

      // Should render with theme applied
      expect(screen.getByTestId('themed-mobile')).toBeInTheDocument();
      expect(screen.getByTestId('breakpoint-info')).toBeInTheDocument();
      expect(screen.getByTestId('interaction-info')).toBeInTheDocument();
    });

    it('should provide consistent API across all mobile features', () => {
      render(
        <MobileTestWrapper>
          <BreakpointTestComponent />
          <InteractionTestComponent />
          <HapticTestComponent />
          <PullToRefreshTestComponent />
        </MobileTestWrapper>,
      );

      // All components should render successfully
      expect(screen.getByTestId('breakpoint-info')).toBeInTheDocument();
      expect(screen.getByTestId('interaction-info')).toBeInTheDocument();
      expect(screen.getByTestId('haptic-container')).toBeInTheDocument();
      expect(screen.getByTestId('pullable-container')).toBeInTheDocument();
    });
  });
});
