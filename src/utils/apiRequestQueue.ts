/**
 * API Request Queue Manager
 * - Intelligent queuing for rate limit management (especially Nominatim)
 * - Request batching for multiple locations
 * - Priority-based request scheduling
 */

interface QueuedRequest<T = unknown> {
  id: string;
  priority: 'high' | 'medium' | 'low';
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface QueueConfig {
  maxConcurrent: number;
  minDelayMs: number; // Minimum delay between requests for rate limiting
  batchWindowMs: number; // Window for batching requests
  maxQueueSize: number;
}

class APIRequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private lastRequestTime = 0;
  private readonly config: QueueConfig;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingBatch: QueuedRequest[] = [];

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      minDelayMs: config.minDelayMs ?? 1200, // 1.2s for Nominatim courtesy
      batchWindowMs: config.batchWindowMs ?? 500, // 500ms batching window
      maxQueueSize: config.maxQueueSize ?? 50,
    };
  }

  /**
   * Add request to queue with priority
   */
  async enqueue<T>(
    id: string,
    execute: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      const request: QueuedRequest<T> = {
        id,
        priority,
        execute,
        resolve: resolve as (value: T) => void,
        reject: reject as (error: Error) => void,
        timestamp: Date.now(),
      };

      // Insert based on priority (high first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const insertIndex = this.queue.findIndex(
        r => priorityOrder[r.priority] > priorityOrder[priority]
      );
      if (insertIndex === -1) {
        this.queue.push(request as QueuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, request as QueuedRequest);
      }

      this.processQueue();
    });
  }

  /**
   * Process queue with rate limiting and concurrency control
   */
  private async processQueue(): Promise<void> {
    // Don't process if at max concurrency
    if (this.activeRequests >= this.config.maxConcurrent) {
      return;
    }

    // Don't process if queue is empty
    if (this.queue.length === 0) {
      return;
    }

    // Check rate limiting
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.minDelayMs) {
      const delay = this.config.minDelayMs - timeSinceLastRequest;
      setTimeout(() => this.processQueue(), delay);
      return;
    }

    // Get next request
    const request = this.queue.shift();
    if (!request) return;

    this.activeRequests++;
    this.lastRequestTime = Date.now();

    // Execute request
    request
      .execute()
      .then(result => {
        request.resolve(result);
      })
      .catch(error => {
        request.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      })
      .finally(() => {
        this.activeRequests--;
        // Process next request
        this.processQueue();
      });
  }

  /**
   * Batch multiple requests together
   */
  async batch<T>(
    requests: Array<{ id: string; execute: () => Promise<T> }>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T[]> {
    // Clear any pending batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Add to pending batch
    const batchPromises = requests.map(req =>
      this.enqueue(req.id, req.execute, priority)
    );

    // Wait for batch window, then execute
    return new Promise<T[]>(resolve => {
      this.batchTimer = setTimeout(() => {
        Promise.all(batchPromises)
          .then(results => resolve(results))
          .catch(() => resolve([]));
        this.batchTimer = null;
        this.pendingBatch = [];
      }, this.config.batchWindowMs);
    });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.config.maxConcurrent,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.activeRequests = 0;
  }
}

// Singleton instances for different API types
export const nominatimQueue = new APIRequestQueue({
  maxConcurrent: 1, // Nominatim requires 1 request per second
  minDelayMs: 1200, // 1.2s between requests
  batchWindowMs: 500,
  maxQueueSize: 20,
});

export const openMeteoQueue = new APIRequestQueue({
  maxConcurrent: 5, // OpenMeteo is more lenient
  minDelayMs: 100, // Minimal delay
  batchWindowMs: 200,
  maxQueueSize: 50,
});

export default APIRequestQueue;
