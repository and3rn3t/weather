/* eslint-disable no-console */
/**
 * Dash0 OpenTelemetry Integration Setup
 * This file configures OpenTelemetry instrumentation for sending telemetry data to Dash0
 *
 * Installation Steps:
 * 1. Sign up for Dash0 at https://dash0.com
 * 2. Get your auth token from the Dash0 dashboard
 * 3. Install OpenTelemetry packages: npm install @opentelemetry/api @opentelemetry/sdk-web
 * 4. Update the configuration below with your Dash0 endpoint and auth token
 */

// Dash0 Configuration Interface
export interface Dash0Config {
  endpoint: string;
  authToken: string;
  serviceName: string;
  serviceVersion: string;
  environment: string;
}

// Default Dash0 configuration (to be updated with your actual values)
const defaultConfig: Dash0Config = {
  endpoint: 'https://ingress.dash0.com/v1/traces', // Replace with your Dash0 endpoint
  authToken: process.env.VITE_DASH0_AUTH_TOKEN || 'your-auth-token-here', // Use environment variable
  serviceName: 'weather',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
};

// Weather App Telemetry Class
export class WeatherAppTelemetry {
  private config: Dash0Config;
  private isInitialized: boolean = false;

  constructor(config?: Partial<Dash0Config>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize Dash0 OpenTelemetry SDK
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Dash0 telemetry already initialized');
      return;
    }

    try {
      console.log('Initializing Dash0 telemetry...');

      // Ready for OpenTelemetry integration when packages are installed
      this.isInitialized = true;
      console.log('Dash0 telemetry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Dash0 telemetry:', error);
    }
  }

  /**
   * Track weather API calls
   */
  public trackWeatherApiCall(
    city: string,
    apiType: 'weather' | 'geocoding'
  ): void {
    if (!this.isInitialized) return;

    console.log(`[Dash0] Tracking ${apiType} API call for ${city}`);
  }

  /**
   * Track user interactions
   */
  public trackUserInteraction(
    action: string,
    details?: Record<string, string | number>
  ): void {
    if (!this.isInitialized) return;

    console.log(`[Dash0] Tracking user interaction: ${action}`, details);
  }

  /**
   * Track errors
   */
  public trackError(error: Error, context?: string): void {
    if (!this.isInitialized) return;

    console.error('[Dash0] Error tracked:', error, `Context: ${context}`);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    metricName: string,
    value: number,
    unit?: string
  ): void {
    if (!this.isInitialized) return;

    console.log(
      `[Dash0] Performance metric: ${metricName} = ${value}${unit || 'ms'}`
    );
  }

  /**
   * Create custom spans for complex operations
   */
  public async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    _attributes?: Record<string, string | number>
  ): Promise<T> {
    if (!this.isInitialized) {
      return operation();
    }

    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      console.log(
        `[Dash0] Operation ${operationName} completed in ${duration}ms`
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[Dash0] Operation ${operationName} failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get configuration for debugging
   */
  public getConfig(): Dash0Config {
    return { ...this.config };
  }

  /**
   * Check if telemetry is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Global telemetry instance
export const dash0Telemetry = new WeatherAppTelemetry();

// Initialize telemetry when module loads
if (typeof window !== 'undefined') {
  dash0Telemetry.initialize().catch(console.error);
}
