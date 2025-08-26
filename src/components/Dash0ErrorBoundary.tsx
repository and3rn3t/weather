/**
 * Enhanced Error Boundary and Performance Monitoring with Dash0
 * This provides comprehensive error tracking and performance monitoring
 */

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { dash0Telemetry } from '../utils/dash0Setup';

// Global error tracking setup
declare global {
  interface Window {
    dash0ErrorHandler?: (error: Error, context?: string) => void;
  }
}

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Enhanced Error Boundary with Dash0 Integration
 * Catches React component errors and sends them to Dash0
 */
export class Dash0ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };

    // Set up global error handler
    this.setupGlobalErrorHandling();
  }

  /**
   * Set up global error handling for the entire app
   */
  private setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
      this.trackError(error, 'unhandled_promise_rejection');
    });

    // Handle global JavaScript errors
    window.addEventListener('error', event => {
      const error = new Error(`Global Error: ${event.message}`);
      this.trackError(error, 'global_error');
    });

    // Set up global error handler function
    window.dash0ErrorHandler = (error: Error, context?: string) => {
      this.trackError(error, context || 'manual_error_report');
    };
  }

  /**
   * Track error with Dash0 telemetry
   */
  private trackError(error: Error, context: string) {
    try {
      // Ensure telemetry is initialized
      if (!dash0Telemetry.isReady()) {
        dash0Telemetry.initialize().catch(() => {
          // Silently handle initialization errors
        });
      }

      // Track the error
      dash0Telemetry.trackError(error, context);

      // Track error metrics
      dash0Telemetry.trackPerformance('error_count', 1, 'count');

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Dash0 Error Tracked:', { error, context });
      }
    } catch (telemetryError) {
      // Fallback: log to console if telemetry fails
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to track error with Dash0:', telemetryError);
        console.error('Original error:', error);
      }
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID
    const errorId = `err_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Track with Dash0
    this.trackError(error, 'react_error_boundary');

    // Track additional context
    try {
      dash0Telemetry.trackUserInteraction('error_boundary_triggered', {
        component_stack: errorInfo.componentStack?.substring(0, 500) || '',
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500) || '',
      });
    } catch (e) {
      console.error('Failed to track error boundary context:', e);
    }

    // Call user-provided error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private readonly handleRetry = () => {
    // Track retry attempt
    try {
      dash0Telemetry.trackUserInteraction('error_boundary_retry', {
        error_id: this.state.errorId || '',
      });
    } catch (e) {
      console.error('Failed to track retry:', e);
    }

    // Reset error state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="dash0-error-boundary">
          <div className="error-container">
            <h2>🚨 Oops! Something went wrong</h2>
            <p>
              We've been notified about this error and are working to fix it.
            </p>

            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="error-retry-button"
                type="button"
              >
                🔄 Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="error-reload-button"
                type="button"
              >
                🔁 Reload Page
              </button>
            </div>

            {this.state.errorId && (
              <p className="error-id">
                Error ID: <code>{this.state.errorId}</code>
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error Message:</h4>
                  <pre>{this.state.error.message}</pre>

                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error.stack}</pre>

                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Performance Monitor Hook
 * Use this to monitor component performance and user interactions
 */
import { useCallback, useEffect, useRef } from 'react';
import { useDash0Telemetry } from '../hooks/useDash0Telemetry';

interface PerformanceConfig {
  componentName: string;
  trackRender?: boolean;
  trackMount?: boolean;
  trackUnmount?: boolean;
  trackInteractions?: boolean;
}

export function usePerformanceMonitor(config: PerformanceConfig) {
  const telemetry = useDash0Telemetry();
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);

  // Track component mount
  useEffect(() => {
    const mountedAt = mountTimeRef.current;
    if (config.trackMount) {
      const mountTime = Date.now() - mountedAt;
      telemetry.trackPerformance({
        name: 'component_mount_time',
        value: mountTime,
        unit: 'milliseconds',
      });
    }

    // Track component unmount
    return () => {
      if (config.trackUnmount) {
        const totalTime = Date.now() - mountedAt;
        telemetry.trackPerformance({
          name: 'component_total_time',
          value: totalTime,
          unit: 'milliseconds',
        });
      }
    };
  }, [config.trackMount, config.trackUnmount, telemetry]);

  // Track render performance
  useEffect(() => {
    if (config.trackRender) {
      renderCountRef.current += 1;
      telemetry.trackPerformance({
        name: 'component_render_count',
        value: renderCountRef.current,
        unit: 'count',
      });
    }
  });

  // Track user interactions
  const trackInteraction = useCallback(
    (action: string, _properties?: Record<string, unknown>) => {
      if (config.trackInteractions) {
        telemetry.trackUserInteraction({
          action: `${config.componentName}_${action}`,
          component: config.componentName,
        });

        // Track interaction timing
        const interactionTime = Date.now() - mountTimeRef.current;
        telemetry.trackPerformance({
          name: 'interaction_timing',
          value: interactionTime,
          unit: 'milliseconds',
        });
      }
    },
    [config.componentName, config.trackInteractions, telemetry]
  );

  return {
    trackInteraction,
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
  };
}

/**
 * Weather API Performance Wrapper
 * Wraps weather API calls with performance monitoring
 */
export class WeatherApiPerformanceMonitor {
  private static instance: WeatherApiPerformanceMonitor;
  private performanceEntries: Map<string, PerformanceEntry> = new Map();

  static getInstance(): WeatherApiPerformanceMonitor {
    if (!WeatherApiPerformanceMonitor.instance) {
      WeatherApiPerformanceMonitor.instance =
        new WeatherApiPerformanceMonitor();
    }
    return WeatherApiPerformanceMonitor.instance;
  }

  /**
   * Monitor API call performance
   */
  async monitorApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    city?: string
  ): Promise<T> {
    const markStart = `${apiName}_start_${Date.now()}`;
    const markEnd = `${apiName}_end_${Date.now()}`;

    // Mark start
    performance.mark(markStart);

    try {
      // Execute API call
      const result = await apiCall();

      // Mark end and measure
      performance.mark(markEnd);
      const measureName = `${apiName}_duration`;
      performance.measure(measureName, markStart, markEnd);

      // Get measurement
      const entries = performance.getEntriesByName(measureName);
      const duration =
        entries.length > 0 ? entries[entries.length - 1].duration : 0;

      // Track with Dash0
      try {
        if (!dash0Telemetry.isReady()) {
          await dash0Telemetry.initialize();
        }

        dash0Telemetry.trackPerformance(
          `api_${apiName}_duration`,
          duration,
          'milliseconds'
        );
        dash0Telemetry.trackUserInteraction(`api_${apiName}_success`, {
          city: city || 'unknown',
          duration: duration.toFixed(2),
        });
      } catch (telemetryError) {
        console.error('Failed to track API performance:', telemetryError);
      }

      // Clean up performance entries
      performance.clearMarks(markStart);
      performance.clearMarks(markEnd);
      performance.clearMeasures(measureName);

      return result;
    } catch (error) {
      // Mark end even on error
      performance.mark(markEnd);

      // Track error with Dash0
      try {
        if (!dash0Telemetry.isReady()) {
          await dash0Telemetry.initialize();
        }

        dash0Telemetry.trackError(error as Error, `api_${apiName}_error`);
        dash0Telemetry.trackUserInteraction(`api_${apiName}_error`, {
          city: city || 'unknown',
          error_message: (error as Error).message.substring(0, 100),
        });
      } catch (telemetryError: unknown) {
        console.error('Failed to track API error:', telemetryError);
      }

      // Clean up performance entries
      performance.clearMarks(markStart);
      performance.clearMarks(markEnd);

      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, unknown> {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    return {
      pageLoadTime: navigation
        ? navigation.loadEventEnd - navigation.fetchStart
        : 0,
      domContentLoaded: navigation
        ? navigation.domContentLoadedEventEnd - navigation.fetchStart
        : 0,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(
      entry => entry.name === 'first-contentful-paint'
    );
    return fcp ? fcp.startTime : 0;
  }

  private getMemoryUsage(): Record<string, number> {
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      const memory = perfWithMemory.memory;
      return {
        usedJSHeapSize: memory?.usedJSHeapSize ?? 0,
        totalJSHeapSize: memory?.totalJSHeapSize ?? 0,
        jsHeapSizeLimit: memory?.jsHeapSizeLimit ?? 0,
      };
    }
    return {};
  }
}

/**
 * CSS for Error Boundary
 * Add this to your CSS file or use CSS-in-JS
 */
export const errorBoundaryStyles = `
  .dash0-error-boundary {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    padding: 2rem;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .error-container {
    max-width: 500px;
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1.5rem 0;
  }

  .error-retry-button,
  .error-reload-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .error-retry-button {
    background: #667eea;
    color: white;
  }

  .error-retry-button:hover {
    background: #5a6fd8;
    transform: translateY(-1px);
  }

  .error-reload-button {
    background: #f1f3f4;
    color: #333;
  }

  .error-reload-button:hover {
    background: #e8eaed;
    transform: translateY(-1px);
  }

  .error-id {
    font-size: 0.875rem;
    color: #666;
    margin-top: 1rem;
  }

  .error-details {
    margin-top: 1.5rem;
    text-align: left;
  }

  .error-stack pre {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.875rem;
    max-height: 200px;
    overflow-y: auto;
  }
`;
