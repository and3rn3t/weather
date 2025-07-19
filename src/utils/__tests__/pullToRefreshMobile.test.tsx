/**
 * Pull-to-Refresh Mobile Test Suite
 * 
 * Tests for pull-to-refresh functionality on mobile devices,
 * ensuring proper touch handling and visual feedback.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '../themeContext';
import { HapticFeedbackProvider } from '../hapticContext';
import PullToRefresh from '../PullToRefresh';
import { usePullToRefresh } from '../usePullToRefresh';

// Mock touch events for mobile simulation
const createTouchEvent = (type: string, clientY: number) => {
  return new TouchEvent(type, {
    touches: [{
      clientY,
      clientX: 0,
      identifier: 0,
      target: document.body,
      pageX: 0,
      pageY: clientY,
      screenX: 0,
      screenY: clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as unknown as Touch],
    changedTouches: [{
      clientY,
      clientX: 0,
      identifier: 0,
      target: document.body,
      pageX: 0,
      pageY: clientY,
      screenX: 0,
      screenY: clientY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    } as unknown as Touch],
    bubbles: true,
    cancelable: true,
  });
};

// Helper functions for tests
const createSlowRefresh = (delay: number) => (): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, delay));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('Pull-to-Refresh Mobile Tests', () => {
  let refreshCallback: jest.Mock;

  beforeEach(() => {
    refreshCallback = jest.fn().mockResolvedValue(undefined);
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 812 });
    
    // Mock iOS Safari user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });
  });

  describe('iOS Pull-to-Refresh', () => {
    it('should trigger refresh on iOS when pull threshold is met', async () => {
      render(
        <TestWrapper>
          <PullToRefresh onRefresh={refreshCallback}>
            <div data-testid="content" style={{ height: '200px' }}>
              Content to refresh
            </div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('content').parentElement;

      // Simulate iOS pull-to-refresh gesture
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove1 = createTouchEvent('touchmove', 120); // Small initial pull
      const touchMove2 = createTouchEvent('touchmove', 180); // Exceed threshold (70px+)
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove1);
      fireEvent(container!, touchMove2);
      fireEvent(container!, touchEnd);

      await waitFor(() => {
        expect(refreshCallback).toHaveBeenCalled();
      });
    });

    it('should not trigger refresh if pull distance is insufficient', async () => {
      render(
        <TestWrapper>
          <PullToRefresh onRefresh={refreshCallback}>
            <div data-testid="content">Content</div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('content').parentElement;

      // Simulate small pull (below threshold)
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 130); // Only 30px pull
      const touchEnd = createTouchEvent('touchend', 130);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      await waitFor(() => {
        expect(refreshCallback).not.toHaveBeenCalled();
      });
    });

    it('should show loading indicator during refresh on iOS', async () => {
      const slowRefresh = createSlowRefresh(100);

      render(
        <TestWrapper>
          <PullToRefresh onRefresh={slowRefresh}>
            <div data-testid="content">Content</div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('content').parentElement;

      // Trigger refresh
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180);
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      // Check for loading indicator
      await waitFor(() => {
        expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
      });

      // Wait for refresh to complete
      await waitFor(() => {
        expect(screen.queryByText(/refreshing/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Android Pull-to-Refresh', () => {
    beforeEach(() => {
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36',
        configurable: true
      });
    });

    it('should handle Android-style pull gestures', async () => {
      render(
        <TestWrapper>
          <PullToRefresh onRefresh={refreshCallback}>
            <div data-testid="android-content">Android content</div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('android-content').parentElement;

      // Android typically has more momentum and faster gestures
      const touchStart = createTouchEvent('touchstart', 50);
      const touchMove1 = createTouchEvent('touchmove', 80);
      const touchMove2 = createTouchEvent('touchmove', 120);
      const touchMove3 = createTouchEvent('touchmove', 170); // Quick pull past threshold
      const touchEnd = createTouchEvent('touchend', 170);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove1);
      fireEvent(container!, touchMove2);
      fireEvent(container!, touchMove3);
      fireEvent(container!, touchEnd);

      await waitFor(() => {
        expect(refreshCallback).toHaveBeenCalled();
      });
    });

    it('should respect scroll position on Android', async () => {
      const TestContent = () => {
        const scrollRef = React.useRef<HTMLDivElement>(null);
        
        React.useEffect(() => {
          // Simulate scrolled position
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 100;
          }
        }, []);

        return (
          <div ref={scrollRef} style={{ height: '200px', overflowY: 'auto' }}>
            <div style={{ height: '400px' }} data-testid="scrollable-content">
              Scrollable content
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <PullToRefresh onRefresh={refreshCallback}>
            <TestContent />
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('scrollable-content').parentElement?.parentElement;

      // Try to pull when already scrolled (should not trigger)
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180);
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      // Should not refresh when not at top
      expect(refreshCallback).not.toHaveBeenCalled();
    });
  });

  describe('Pull-to-Refresh Hook Tests', () => {
    const HookTestComponent: React.FC<{ onRefresh: () => Promise<void> }> = ({ onRefresh }) => {
      const {
        pullDistance,
        isRefreshing,
        canRefresh,
        resetState,
        pullToRefreshHandlers,
      } = usePullToRefresh(onRefresh, {
        refreshThreshold: 70,
        maxPullDistance: 120,
      });

      return (
        <div
          data-testid="hook-container"
          {...pullToRefreshHandlers}
        >
          <div data-testid="pull-distance">{pullDistance}</div>
          <div data-testid="is-refreshing">{isRefreshing.toString()}</div>
          <div data-testid="can-refresh">{canRefresh.toString()}</div>
          <button onClick={resetState} data-testid="reset-button">Reset</button>
        </div>
      );
    };

    it('should track pull distance correctly', async () => {
      render(
        <TestWrapper>
          <HookTestComponent onRefresh={refreshCallback} />
        </TestWrapper>
      );

      const container = screen.getByTestId('hook-container');

      // Start pull
      const touchStart = createTouchEvent('touchstart', 100);
      fireEvent(container, touchStart);

      // Move down 50px
      const touchMove = createTouchEvent('touchmove', 150);
      fireEvent(container, touchMove);

      expect(screen.getByTestId('pull-distance')).toHaveTextContent('50');
    });

    it('should indicate when refresh threshold is reached', async () => {
      render(
        <TestWrapper>
          <HookTestComponent onRefresh={refreshCallback} />
        </TestWrapper>
      );

      const container = screen.getByTestId('hook-container');

      // Pull past threshold (70px)
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180); // 80px pull
      
      fireEvent(container, touchStart);
      fireEvent(container, touchMove);

      expect(screen.getByTestId('can-refresh')).toHaveTextContent('true');
    });

    it('should handle refresh state transitions', async () => {
      const slowRefresh = createSlowRefresh(50);

      render(
        <TestWrapper>
          <HookTestComponent onRefresh={slowRefresh} />
        </TestWrapper>
      );

      const container = screen.getByTestId('hook-container');

      // Trigger refresh
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180);
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container, touchStart);
      fireEvent(container, touchMove);
      fireEvent(container, touchEnd);

      // Should be refreshing
      await waitFor(() => {
        expect(screen.getByTestId('is-refreshing')).toHaveTextContent('true');
      });

      // Should complete refresh
      await waitFor(() => {
        expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
      });
    });

    it('should reset state when reset is called', async () => {
      render(
        <TestWrapper>
          <HookTestComponent onRefresh={refreshCallback} />
        </TestWrapper>
      );

      const container = screen.getByTestId('hook-container');
      const resetButton = screen.getByTestId('reset-button');

      // Create some pull state
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 150);
      
      fireEvent(container, touchStart);
      fireEvent(container, touchMove);

      expect(screen.getByTestId('pull-distance')).toHaveTextContent('50');

      // Reset
      fireEvent.click(resetButton);

      expect(screen.getByTestId('pull-distance')).toHaveTextContent('0');
      expect(screen.getByTestId('can-refresh')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle refresh errors gracefully', async () => {
      const failingRefresh = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <PullToRefresh onRefresh={failingRefresh}>
            <div data-testid="content">Content</div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('content').parentElement;

      // Trigger refresh
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180);
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      // Should handle error and reset state
      await waitFor(() => {
        expect(failingRefresh).toHaveBeenCalled();
      });

      // Should not be stuck in refreshing state
      await waitFor(() => {
        expect(screen.queryByText(/refreshing/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent refresh when disabled', async () => {
      render(
        <TestWrapper>
          <PullToRefresh onRefresh={refreshCallback} disabled={true}>
            <div data-testid="disabled-content">Disabled content</div>
          </PullToRefresh>
        </TestWrapper>
      );

      const container = screen.getByTestId('disabled-content').parentElement;

      // Try to trigger refresh
      const touchStart = createTouchEvent('touchstart', 100);
      const touchMove = createTouchEvent('touchmove', 180);
      const touchEnd = createTouchEvent('touchend', 180);

      fireEvent(container!, touchStart);
      fireEvent(container!, touchMove);
      fireEvent(container!, touchEnd);

      expect(refreshCallback).not.toHaveBeenCalled();
    });
  });
});
