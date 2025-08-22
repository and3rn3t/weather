/**
 * Dash0 Telemetry Hook - No-Op Implementation
 *
 * This is a temporary no-op implementation to fix build issues.
 * The actual Dash0 integration will be implemented separately.
 */

export interface TelemetryInteraction {
  action: string;
  component: string;
  metadata?: Record<string, any>;
}

export interface TelemetryMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export interface TelemetryError {
  context: string;
  metadata?: Record<string, any>;
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
  trackOperation: (name: string, operation: () => Promise<any>) => Promise<any>;
  trackPerformance: (performance: TelemetryPerformance) => void;
}

/**
 * No-op Dash0 telemetry hook
 * This provides the interface without actual telemetry to prevent build failures
 */
export const useDash0Telemetry = (): Dash0TelemetryHook => {
  return {
    trackUserInteraction: (interaction: TelemetryInteraction) => {
      // No-op implementation
      console.debug('Telemetry (no-op):', interaction);
    },

    trackMetric: (metric: TelemetryMetric) => {
      // No-op implementation
      console.debug('Metric (no-op):', metric);
    },

    trackError: (error: Error, context: TelemetryError) => {
      // No-op implementation
      console.debug('Error (no-op):', error.message, context);
    },

    trackOperation: async (name: string, operation: () => Promise<any>) => {
      // No-op implementation - just execute the operation
      console.debug('Operation (no-op):', name);
      return await operation();
    },

    trackPerformance: (performance: TelemetryPerformance) => {
      // No-op implementation
      console.debug('Performance (no-op):', performance);
    },
  };
};
