/**
 * Network Resilience Manager
 *
 * Provides intelligent network management, automatic retry mechanisms,
 * and seamless offline/online state handling for search functionality.
 */

// Network Configuration
const NETWORK_CONFIG = {
  // Retry strategy
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Progressive delays in ms
  EXPONENTIAL_BACKOFF: true,
  JITTER_MAX: 500, // Random jitter up to 500ms

  // Timeout configuration
  DEFAULT_TIMEOUT: 8000, // 8 seconds
  QUICK_TIMEOUT: 3000, // 3 seconds for cached data fallback
  SLOW_TIMEOUT: 15000, // 15 seconds for critical operations

  // Connection monitoring
  CONNECTION_CHECK_INTERVAL: 10000, // Check connection every 10 seconds
  HEALTH_CHECK_URL: 'https://httpbin.org/status/200',
  FALLBACK_CHECK_URL: 'https://www.google.com/favicon.ico',

  // Request prioritization
  PRIORITY_LEVELS: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  },

  // Circuit breaker
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5,
    SUCCESS_THRESHOLD: 3,
    TIMEOUT: 60000, // 1 minute
  },
} as const;

// Types
interface NetworkRequest {
  id: string;
  url: string;
  options: RequestInit;
  priority: string;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  timestamp: number;
  source: 'user' | 'system' | 'background';
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

interface NetworkMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  retryCount: number;
  circuitBreakerTrips: number;
  lastConnectionCheck: number;
  isOnline: boolean;
}

interface QueuedRequest extends NetworkRequest {
  resolve: (value: Response) => void;
  reject: (reason: unknown) => void;
  abortController: AbortController;
}

/**
 * Advanced Network Resilience Manager
 * Handles network requests with intelligent retry, caching, and offline support
 */
export class NetworkResilienceManager {
  private requestQueue: QueuedRequest[] = [];
  private processingQueue = false;
  private isOnline = navigator.onLine;
  private connectionCheckTimer: NodeJS.Timeout | null = null;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private metrics: NetworkMetrics = {
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    averageResponseTime: 0,
    retryCount: 0,
    circuitBreakerTrips: 0,
    lastConnectionCheck: Date.now(),
    isOnline: navigator.onLine,
  };

  // Event listeners for network state changes
  private onlineHandlers: Array<() => void> = [];
  private offlineHandlers: Array<() => void> = [];

  /**
   * Initialize network resilience manager
   */
  initialize(): void {
    this.setupNetworkListeners();
    this.startConnectionMonitoring();
    this.processRequestQueue();

    // eslint-disable-next-line no-console
    console.log('🌐 Network Resilience Manager initialized');
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.metrics.isOnline = true;
      this.onNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.metrics.isOnline = false;
      this.onNetworkOffline();
    });

    // Listen for visibility changes to check connection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnectionHealth();
      }
    });
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring(): void {
    this.connectionCheckTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, NETWORK_CONFIG.CONNECTION_CHECK_INTERVAL);
  }

  /**
   * Make resilient network request with automatic retry and queue management
   */
  async makeRequest(
    url: string,
    options: RequestInit = {},
    config: {
      priority?: string;
      maxRetries?: number;
      timeout?: number;
      source?: 'user' | 'system' | 'background';
    } = {}
  ): Promise<Response> {
    const request: NetworkRequest = {
      id: this.generateRequestId(),
      url,
      options: {
        ...options,
        headers: {
          'User-Agent': 'WeatherApp/1.0',
          ...options.headers,
        },
      },
      priority: config.priority || NETWORK_CONFIG.PRIORITY_LEVELS.MEDIUM,
      retryCount: 0,
      maxRetries: config.maxRetries ?? NETWORK_CONFIG.MAX_RETRIES,
      timeout: config.timeout ?? NETWORK_CONFIG.DEFAULT_TIMEOUT,
      timestamp: Date.now(),
      source: config.source || 'user',
    };

    return new Promise((resolve, reject) => {
      const abortController = new AbortController();

      const queuedRequest: QueuedRequest = {
        ...request,
        resolve,
        reject,
        abortController,
      };

      this.addToQueue(queuedRequest);
    });
  }

  /**
   * Add request to priority queue
   */
  private addToQueue(request: QueuedRequest): void {
    // Insert request based on priority
    const priorityOrder = Object.values(NETWORK_CONFIG.PRIORITY_LEVELS);
    // @ts-expect-error - Priority type mismatch
    const requestPriorityIndex = priorityOrder.indexOf(request.priority);

    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuePriorityIndex = priorityOrder.indexOf(
        // @ts-expect-error - Priority type mismatch
        this.requestQueue[i].priority
      );
      if (requestPriorityIndex < queuePriorityIndex) {
        insertIndex = i;
        break;
      }
    }

    this.requestQueue.splice(insertIndex, 0, request);

    // Start processing if not already processing
    if (!this.processingQueue) {
      this.processRequestQueue();
    }
  }

  /**
   * Process request queue with intelligent scheduling
   */
  private async processRequestQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) {
        continue;
      }

      try {
        const response = await this.executeRequest(request);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to prevent overwhelming
      if (this.requestQueue.length > 0) {
        await this.delay(50);
      }
    }

    this.processingQueue = false;
  }

  /**
   * Execute individual request with retry logic and circuit breaker
   */
  private async executeRequest(request: QueuedRequest): Promise<Response> {
    const host = new URL(request.url).host;

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(host)) {
      throw new Error(`Circuit breaker open for ${host}`);
    }

    this.metrics.requestCount++;
    const startTime = performance.now();

    while (request.retryCount <= request.maxRetries) {
      try {
        const response = await this.performRequest(request);

        // Update metrics and circuit breaker on success
        const duration = performance.now() - startTime;
        this.updateMetrics(true, duration);
        this.updateCircuitBreaker(host, true);

        return response;
      } catch (error) {
        request.retryCount++;
        this.metrics.retryCount++;

        // Update circuit breaker on failure
        this.updateCircuitBreaker(host, false);

        // If max retries reached, fail
        if (request.retryCount > request.maxRetries) {
          this.updateMetrics(false);
          throw error;
        }

        // Calculate retry delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(request.retryCount);
        await this.delay(delay);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Perform the actual network request
   */
  private async performRequest(request: QueuedRequest): Promise<Response> {
    // If offline, reject immediately for non-critical requests
    if (
      !this.isOnline &&
      request.priority !== NETWORK_CONFIG.PRIORITY_LEVELS.CRITICAL
    ) {
      throw new Error('Network offline');
    }

    // Setup timeout
    const timeoutId = setTimeout(() => {
      request.abortController.abort();
    }, request.timeout);

    try {
      // Minimal policy compliance for external APIs
      let host = '';
      try {
        host = new URL(request.url).hostname;
      } catch {
        // ignore
      }
      const isNominatim = /nominatim\.openstreetmap\.org$/i.test(host);

      // Sanitize headers and enforce UA for Nominatim
      let finalHeaders: HeadersInit | undefined = request.options?.headers;
      if (request.options?.headers) {
        const h = new Headers(request.options.headers as HeadersInit);
        // Remove headers that may cause preflight unless Nominatim requires UA
        h.delete('Cache-Control');
        h.delete('cache-control');
        if (!isNominatim) {
          h.delete('User-Agent');
          h.delete('user-agent');
        } else if (!h.has('User-Agent') && !h.has('user-agent')) {
          h.set(
            'User-Agent',
            'PremiumWeatherApp/1.0 (optimized-fetch@weather)'
          );
        }
        finalHeaders = h;
      } else if (isNominatim) {
        const h = new Headers();
        h.set('User-Agent', 'PremiumWeatherApp/1.0 (optimized-fetch@weather)');
        finalHeaders = h;
      }

      const response = await fetch(request.url, {
        ...request.options,
        headers: finalHeaders,
        signal: request.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Network request failed');
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(retryCount: number): number {
    let delay: number;

    if (NETWORK_CONFIG.EXPONENTIAL_BACKOFF) {
      delay = Math.min(
        NETWORK_CONFIG.RETRY_DELAYS[
          Math.min(retryCount - 1, NETWORK_CONFIG.RETRY_DELAYS.length - 1)
        ],
        NETWORK_CONFIG.RETRY_DELAYS[NETWORK_CONFIG.RETRY_DELAYS.length - 1] *
          Math.pow(2, retryCount - NETWORK_CONFIG.RETRY_DELAYS.length)
      );
    } else {
      delay =
        NETWORK_CONFIG.RETRY_DELAYS[
          Math.min(retryCount - 1, NETWORK_CONFIG.RETRY_DELAYS.length - 1)
        ];
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * NETWORK_CONFIG.JITTER_MAX;
    return delay + jitter;
  }

  /**
   * Check if circuit breaker is open for a host
   */
  private isCircuitBreakerOpen(host: string): boolean {
    const breaker = this.circuitBreakers.get(host);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if timeout has passed to transition to half-open
      if (
        Date.now() - breaker.lastFailureTime >
        NETWORK_CONFIG.CIRCUIT_BREAKER.TIMEOUT
      ) {
        breaker.state = 'half-open';
        breaker.successCount = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(host: string, success: boolean): void {
    let breaker = this.circuitBreakers.get(host);

    if (!breaker) {
      breaker = {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
      };
      this.circuitBreakers.set(host, breaker);
    }

    if (success) {
      breaker.successCount++;
      breaker.lastSuccessTime = Date.now();

      if (
        breaker.state === 'half-open' &&
        breaker.successCount >= NETWORK_CONFIG.CIRCUIT_BREAKER.SUCCESS_THRESHOLD
      ) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
      }
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (
        breaker.state === 'closed' &&
        breaker.failureCount >= NETWORK_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD
      ) {
        breaker.state = 'open';
        this.metrics.circuitBreakerTrips++;
        // eslint-disable-next-line no-console
        console.warn(`🔴 Circuit breaker opened for ${host}`);
      } else if (breaker.state === 'half-open') {
        breaker.state = 'open';
        breaker.successCount = 0;
      }
    }
  }

  /**
   * Check connection health using ping requests
   */
  private async checkConnectionHealth(): Promise<boolean> {
    try {
      await fetch(NETWORK_CONFIG.HEALTH_CHECK_URL, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      this.isOnline = true;
      this.metrics.isOnline = true;
      this.metrics.lastConnectionCheck = Date.now();

      return true;
    } catch {
      // Try fallback URL
      try {
        await fetch(NETWORK_CONFIG.FALLBACK_CHECK_URL, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        });

        this.isOnline = true;
        this.metrics.isOnline = true;
        this.metrics.lastConnectionCheck = Date.now();

        return true;
      } catch {
        this.isOnline = false;
        this.metrics.isOnline = false;
        return false;
      }
    }
  }

  /**
   * Handle network coming online
   */
  private onNetworkOnline(): void {
    // eslint-disable-next-line no-console
    console.log('🟢 Network connection restored');

    // Process any queued requests
    if (!this.processingQueue && this.requestQueue.length > 0) {
      this.processRequestQueue();
    }

    // Notify handlers
    this.onlineHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in online handler:', error);
      }
    });
  }

  /**
   * Handle network going offline
   */
  private onNetworkOffline(): void {
    // eslint-disable-next-line no-console
    console.warn('🔴 Network connection lost');

    // Abort non-critical requests
    this.requestQueue.forEach(request => {
      if (request.priority !== NETWORK_CONFIG.PRIORITY_LEVELS.CRITICAL) {
        request.abortController.abort();
        request.reject(new Error('Network offline'));
      }
    });

    // Remove aborted requests from queue
    this.requestQueue = this.requestQueue.filter(
      request => request.priority === NETWORK_CONFIG.PRIORITY_LEVELS.CRITICAL
    );

    // Notify handlers
    this.offlineHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in offline handler:', error);
      }
    });
  }

  /**
   * Update network metrics
   */
  private updateMetrics(success: boolean, duration?: number): void {
    if (success) {
      this.metrics.successCount++;

      if (duration !== undefined) {
        // Update average response time
        const totalRequests = this.metrics.successCount;
        this.metrics.averageResponseTime =
          (this.metrics.averageResponseTime * (totalRequests - 1) + duration) /
          totalRequests;
      }
    } else {
      this.metrics.failureCount++;
    }
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Add online event handler
   */
  onOnline(handler: () => void): void {
    this.onlineHandlers.push(handler);
  }

  /**
   * Add offline event handler
   */
  onOffline(handler: () => void): void {
    this.offlineHandlers.push(handler);
  }

  /**
   * Remove online event handler
   */
  removeOnlineHandler(handler: () => void): void {
    const index = this.onlineHandlers.indexOf(handler);
    if (index > -1) {
      this.onlineHandlers.splice(index, 1);
    }
  }

  /**
   * Remove offline event handler
   */
  removeOfflineHandler(handler: () => void): void {
    const index = this.offlineHandlers.indexOf(handler);
    if (index > -1) {
      this.offlineHandlers.splice(index, 1);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): {
    isOnline: boolean;
    metrics: NetworkMetrics;
    queueLength: number;
    circuitBreakers: Array<{ host: string; state: string }>;
  } {
    return {
      isOnline: this.isOnline,
      metrics: { ...this.metrics },
      queueLength: this.requestQueue.length,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(
        ([host, breaker]) => ({
          host,
          state: breaker.state,
        })
      ),
    };
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.requestQueue.forEach(request => {
      request.abortController.abort();
      request.reject(new Error('Request cancelled'));
    });

    this.requestQueue = [];
    this.processingQueue = false;
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    // eslint-disable-next-line no-console
    console.log('🔄 All circuit breakers reset');
  }

  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    if (this.connectionCheckTimer) {
      clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }

    this.cancelAllRequests();
    this.circuitBreakers.clear();
    this.onlineHandlers = [];
    this.offlineHandlers = [];

    // eslint-disable-next-line no-console
    console.log('🔌 Network Resilience Manager destroyed');
  }
}

// Export singleton instance
export const networkResilienceManager = new NetworkResilienceManager();

// Export types for use in other modules
export type {
  CircuitBreakerState,
  NetworkMetrics,
  NetworkRequest,
  QueuedRequest,
};
