/**
 * Dash0 Telemetry Hook - Real Implementation
 *
 * This hook provides comprehensive telemetry integration with the Dash0 SDK
 * for tracking user interactions, performance metrics, and errors.
 */

import { reportError, sendEvent } from '@dash0/sdk-web';
import { initializeDash0 } from '../config/dash0ConfigReal';

export interface TelemetryInteraction {
  action: string;
  component: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetryMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface TelemetryError {
  context: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetryPerformance {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface Dash0TelemetryHook {
  trackUserInteraction: (interaction: TelemetryInteraction) => void;
  trackMetric: (metric: TelemetryMetric) => void;
  trackError: (error: Error, context: TelemetryError) => void;
  trackOperation: (
    name: string,
    operation: () => Promise<unknown>
  ) => Promise<unknown>;
  trackPerformance: (performance: TelemetryPerformance) => void;
}

// Initialize Dash0 on first import
let dash0Initialized = false;
const initializationResult = (() => {
  if (!dash0Initialized) {
    dash0Initialized = true;
    return initializeDash0();
  }
  return { enabled: false, reason: 'Already initialized' };
})();

/**
 * Real Dash0 telemetry hook with full SDK integration
 */
export const useDash0Telemetry = (): Dash0TelemetryHook => {
  const isEnabled = initializationResult.enabled;

  return {
    trackUserInteraction: (interaction: TelemetryInteraction) => {
      if (isEnabled) {
        // Send interaction as a custom event to Dash0
        sendEvent('user.interaction', {
          title: `${interaction.component}: ${interaction.action}`,
          attributes: {
            'interaction.action': interaction.action,
            'interaction.component': interaction.component,
            ...interaction.metadata,
          },
        });
      } else {
        // Fallback to console debug when Dash0 is not enabled
        // eslint-disable-next-line no-console
        console.debug('Telemetry (fallback):', interaction);
      }
    },

    trackMetric: (metric: TelemetryMetric) => {
      if (isEnabled) {
        // Send metric as a custom event to Dash0
        sendEvent('app.metric', {
          title: `Metric: ${metric.name}`,
          attributes: {
            'metric.name': metric.name,
            'metric.value': metric.value,
            ...metric.tags,
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug('Metric (fallback):', metric);
      }
    },

    trackError: (error: Error, context: TelemetryError) => {
      if (isEnabled) {
        // Use Dash0's built-in error reporting with supported options
        reportError(error, {
          componentStack: context.context || null,
        });

        // Track additional context as a separate event if metadata exists
        if (context.metadata && Object.keys(context.metadata).length > 0) {
          sendEvent('error.context', {
            title: 'Error Context Information',
            attributes: {
              error_context: context.context,
              ...context.metadata,
            },
          });
        }
      } else {
        // eslint-disable-next-line no-console
        console.debug('Error (fallback):', error.message, context);
      }
    },

    trackOperation: async (name: string, operation: () => Promise<unknown>) => {
      const startTime = performance.now();

      try {
        if (isEnabled) {
          // Track operation start
          sendEvent('app.operation.start', {
            title: `Operation Started: ${name}`,
            attributes: {
              'operation.name': name,
              'operation.start_time': startTime,
            },
          });
        }

        // Execute the operation
        const result = await operation();

        const duration = performance.now() - startTime;

        if (isEnabled) {
          // Track successful operation completion
          sendEvent('app.operation.success', {
            title: `Operation Completed: ${name}`,
            attributes: {
              'operation.name': name,
              'operation.duration_ms': duration,
            },
          });
        } else {
          // eslint-disable-next-line no-console
          console.debug(
            `Operation (fallback): ${name} completed in ${duration}ms`
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        if (isEnabled) {
          // Track failed operation
          sendEvent('app.operation.error', {
            title: `Operation Failed: ${name}`,
            attributes: {
              'operation.name': name,
              'operation.duration_ms': duration,
              'error.message':
                error instanceof Error ? error.message : String(error),
            },
          });
        } else {
          // eslint-disable-next-line no-console
          console.debug(
            `Operation (fallback): ${name} failed after ${duration}ms`,
            error
          );
        }

        throw error;
      }
    },

    trackPerformance: (performance: TelemetryPerformance) => {
      if (isEnabled) {
        // Send performance metric as a custom event
        sendEvent('app.performance', {
          title: `Performance: ${performance.name}`,
          attributes: {
            'performance.name': performance.name,
            'performance.value': performance.value,
            ...performance.tags,
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug('Performance (fallback):', performance);
      }
    },
  };
};
