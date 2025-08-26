/**
 * Dash0 Configuration for Weather App
 *
 * This configuration sets up the Dash0 Web SDK with appropriate
 * settings for the weather application telemetry.
 */

import { init } from '@dash0/sdk-web';

export interface Dash0Config {
  // Required: Your Dash0 endpoint URL (e.g., https://ingress.dash0.dev)
  endpointUrl: string;
  // Required: Your Dash0 authorization token (e.g., auth_abc123...)
  authToken: string;
  // Optional: Service name for telemetry
  serviceName?: string;
  // Optional: Service version
  serviceVersion?: string;
  // Optional: Environment (dev, staging, prod)
  environment?: string;
  // Optional: Dataset name
  dataset?: string;
}

// Default configuration - replace with your actual Dash0 credentials
const DEFAULT_CONFIG: Dash0Config = {
  endpointUrl:
    import.meta.env.VITE_DASH0_ENDPOINT_URL || 'https://ingress.dash0.dev',
  authToken:
    import.meta.env.VITE_DASH0_AUTH_TOKEN || 'your-dash0-auth-token-here',
  serviceName: 'weather',
  serviceVersion: '1.0.0',
  environment: import.meta.env.MODE || 'development',
  dataset: 'default',
};

/**
 * Initialize Dash0 SDK with configuration
 */
export const initializeDash0 = (config: Partial<Dash0Config> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if we have required configuration
  if (
    !finalConfig.authToken ||
    finalConfig.authToken === 'your-dash0-auth-token-here'
  ) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Dash0: No auth token provided, running in debug mode');
    return { enabled: false, reason: 'No auth token' };
  }

  try {
    // Initialize Dash0 SDK with the correct API
    init({
      serviceName: finalConfig.serviceName || 'weather',
      serviceVersion: finalConfig.serviceVersion,
      environment: finalConfig.environment,
      endpoint: {
        url: finalConfig.endpointUrl,
        authToken: finalConfig.authToken,
        dataset: finalConfig.dataset,
      },
      // Additional configuration for web app
      sessionInactivityTimeoutMillis: 30 * 60 * 1000, // 30 minutes
      sessionTerminationTimeoutMillis: 4 * 60 * 60 * 1000, // 4 hours
      additionalSignalAttributes: {
        'app.type': 'weather-app',
        'app.features': 'dark-theme,mobile-optimized,voice-search',
      },
      // Enable page view instrumentation for navigation tracking
      pageViewInstrumentation: {
        generateMetadata: (url: URL) => ({
          title: document.title,
          attributes: {
            'page.path': url.pathname,
            'page.search': url.search,
          },
        }),
      },
    });

    // eslint-disable-next-line no-console
    console.log('✅ Dash0 SDK initialized successfully');
    return { enabled: true, config: finalConfig };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to initialize Dash0 SDK:', error);
    return { enabled: false, reason: 'Initialization failed', error };
  }
};

export { DEFAULT_CONFIG };
