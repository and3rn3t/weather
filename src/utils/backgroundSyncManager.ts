/**
 * Background Sync Manager
 * Handles background synchronization of weather data when network is available
 */

interface PendingRequest {
  id: string;
  type: 'weather-update' | 'city-search' | 'location-fetch';
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class BackgroundSyncManager {
  private readonly STORAGE_KEY = 'weather-pending-sync';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MS = 5000;
  private isProcessing = false;

  /**
   * Queue a request for background sync
   */
  queueRequest(
    type: PendingRequest['type'],
    data: any,
    priority: PendingRequest['priority'] = 'medium',
  ): void {
    const pendingRequests = this.getPendingRequests();

    const request: PendingRequest = {
      id: this.generateRequestId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    };

    pendingRequests.push(request);
    this.savePendingRequests(pendingRequests);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processPendingRequests();
    }
  }

  /**
   * Process all pending requests
   */
  async processPendingRequests(): Promise<SyncResult> {
    if (this.isProcessing || !navigator.onLine) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: ['Sync already in progress or offline'],
      };
    }

    this.isProcessing = true;
    const pendingRequests = this.getPendingRequests();

    // Sort by priority and timestamp
    const sortedRequests = this.sortRequestsByPriority(pendingRequests);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    const remainingRequests: PendingRequest[] = [];

    for (const request of sortedRequests) {
      try {
        const success = await this.processRequest(request);

        if (success) {
          processed++;
        } else {
          request.retryCount++;

          if (request.retryCount < this.MAX_RETRY_COUNT) {
            remainingRequests.push(request);
          } else {
            failed++;
            errors.push(`Request ${request.id} exceeded retry limit`);
          }
        }
      } catch (error) {
        request.retryCount++;

        if (request.retryCount < this.MAX_RETRY_COUNT) {
          remainingRequests.push(request);
        } else {
          failed++;
          errors.push(
            `Request ${request.id} failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    // Save remaining requests
    this.savePendingRequests(remainingRequests);
    this.isProcessing = false;

    return {
      success: errors.length === 0,
      processed,
      failed,
      errors,
    };
  }

  /**
   * Process a single request
   */
  private async processRequest(request: PendingRequest): Promise<boolean> {
    const { type, data } = request;

    try {
      switch (type) {
        case 'weather-update':
          return await this.processWeatherUpdate(data);
        case 'city-search':
          return await this.processCitySearch(data);
        case 'location-fetch':
          return await this.processLocationFetch(data);
        default:
          console.warn(`Unknown request type: ${type}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to process ${type} request:`, error);
      return false;
    }
  }

  /**
   * Process weather update request
   */
  private async processWeatherUpdate(data: {
    cityName: string;
    latitude: number;
    longitude: number;
  }): Promise<boolean> {
    const { cityName, latitude, longitude } = data;

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&temperature_unit=fahrenheit&timezone=auto`,
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const weatherData = await response.json();

      // Cache the data using our offline storage
      const { offlineStorage } = await import('./offlineWeatherStorage');
      await offlineStorage.cacheWeatherData(cityName, weatherData);

      return true;
    } catch (error) {
      console.error('Weather update failed:', error);
      return false;
    }
  }

  /**
   * Process city search request
   */
  private async processCitySearch(data: { query: string }): Promise<boolean> {
    const { query } = data;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'Premium Weather App (https://weather.andernet.dev)',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const results = await response.json();

      // Cache the search results
      if (results.length > 0) {
        const { offlineStorage } = await import('./offlineWeatherStorage');
        await offlineStorage.cacheRecentCity(
          query,
          parseFloat(results[0].lat),
          parseFloat(results[0].lon),
        );
      }

      return true;
    } catch (error) {
      console.error('City search failed:', error);
      return false;
    }
  }

  /**
   * Process location fetch request
   */
  private async processLocationFetch(data: {
    latitude: number;
    longitude: number;
  }): Promise<boolean> {
    const { latitude, longitude } = data;

    try {
      // Reverse geocoding to get city name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            'User-Agent': 'Premium Weather App (https://weather.andernet.dev)',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
      }

      const location = await response.json();
      const cityName =
        location.display_name?.split(',')[0] || 'Current Location';

      // Cache the location
      const { offlineStorage } = await import('./offlineWeatherStorage');
      await offlineStorage.cacheRecentCity(cityName, latitude, longitude);

      return true;
    } catch (error) {
      console.error('Location fetch failed:', error);
      return false;
    }
  }

  /**
   * Sort requests by priority and timestamp
   */
  private sortRequestsByPriority(requests: PendingRequest[]): PendingRequest[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return requests.sort((a, b) => {
      // First sort by priority
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by timestamp (newer first)
      return b.timestamp - a.timestamp;
    });
  }

  /**
   * Get pending requests from storage
   */
  private getPendingRequests(): PendingRequest[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      return [];
    }
  }

  /**
   * Save pending requests to storage
   */
  private savePendingRequests(requests: PendingRequest[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save pending requests:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const pendingRequests = this.getPendingRequests();

    return {
      pendingCount: pendingRequests.length,
      highPriority: pendingRequests.filter(r => r.priority === 'high').length,
      mediumPriority: pendingRequests.filter(r => r.priority === 'medium')
        .length,
      lowPriority: pendingRequests.filter(r => r.priority === 'low').length,
      isProcessing: this.isProcessing,
      oldestRequest:
        pendingRequests.length > 0
          ? Math.min(...pendingRequests.map(r => r.timestamp))
          : null,
    };
  }

  /**
   * Clear all pending requests (for testing/debugging)
   */
  clearPendingRequests(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Register service worker background sync
   */
  async registerBackgroundSync(): Promise<boolean> {
    if (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('weather-background-sync');
        }
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }
}

// Export singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();
