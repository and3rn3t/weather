/**
 * Background Refresh Service
 *
 * Comprehensive background task management for weather data updates:
 * - Native app lifecycle integration with Capacitor
 * - Intelligent refresh scheduling based on app state
 * - Battery-conscious background operation
 * - Network-aware refresh strategies
 * - User-configurable refresh intervals
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { logError, logInfo } from './logger';


// Background refresh configuration
export interface BackgroundRefreshConfig {
  foregroundInterval: number; // Minutes between foreground refreshes
  backgroundInterval: number; // Minutes between background refreshes
  forceRefreshThreshold: number; // Minutes to force refresh on app return
  maxBackgroundRefreshes: number; // Max background refreshes per session
  enableBatteryOptimization: boolean; // Reduce frequency on low battery
  enableNetworkOptimization: boolean; // Adjust based on connection type
  debugMode: boolean; // Enable detailed logging
}

// Default configuration optimized for mobile performance
export const DEFAULT_CONFIG: BackgroundRefreshConfig = {
  foregroundInterval: 10, // 10 minutes
  backgroundInterval: 15, // 15 minutes (battery conscious)
  forceRefreshThreshold: 10, // Force refresh after 10 minutes in background
  maxBackgroundRefreshes: 4, // Limit to 4 background refreshes per hour
  enableBatteryOptimization: true,
  enableNetworkOptimization: true,
  debugMode: false,
};

// Background refresh statistics
export interface RefreshStats {
  totalRefreshes: number;
  foregroundRefreshes: number;
  backgroundRefreshes: number;
  forcedRefreshes: number;
  lastRefreshTime: number;
  lastBackgroundTime: number;
  averageRefreshDuration: number;
  failedRefreshes: number;
}

// Refresh context information
export interface RefreshContext {
  type: 'foreground' | 'background' | 'forced' | 'network-change' | 'manual';
  isOnline: boolean;
  appState: 'active' | 'inactive' | 'background';
  batteryLevel?: number;
  connectionType?: string;
  timeInBackground: number;
  lastRefreshAge: number;
}

/**
 * Background Refresh Service Class
 * Manages all aspects of background data refresh with native integration
 */
export class BackgroundRefreshService {
  private static instance: BackgroundRefreshService;

  private config: BackgroundRefreshConfig;
  private refreshCallback: (() => Promise<void>) | null = null;
  private stats: RefreshStats;
  private isInitialized: boolean = false;

  // State tracking
  private isAppActive: boolean = true;
  private isOnline: boolean = true;
  private backgroundStartTime: number = 0;
  private backgroundRefreshCount: number = 0;
  private lastRefreshTimes: number[] = [];

  // Timers and intervals
  private foregroundInterval: NodeJS.Timeout | null = null;
  private backgroundTimeout: NodeJS.Timeout | null = null;
  private networkStatusListener: Promise<{ remove: () => void }> | null = null;
  private appStateListener: Promise<{ remove: () => void }> | null = null;

  private constructor(config: Partial<BackgroundRefreshConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initializeStats();
    this.log('BackgroundRefreshService initialized with config:', this.config);
  }

  static getInstance(
    config?: Partial<BackgroundRefreshConfig>,
  ): BackgroundRefreshService {
    if (!BackgroundRefreshService.instance) {
      BackgroundRefreshService.instance = new BackgroundRefreshService(config);
    }
    return BackgroundRefreshService.instance;
  }

  /**
   * Initialize the background refresh service
   */
  async initialize(refreshCallback: () => Promise<void>): Promise<void> {
    if (this.isInitialized) {
      this.log('Service already initialized');
      return;
    }

    this.refreshCallback = refreshCallback;

    try {
      // Initialize native platform monitoring
      if (Capacitor.isNativePlatform()) {
        await this.initializeNativeMonitoring();
      } else {
        await this.initializeWebMonitoring();
      }

      // Get initial network status
      await this.updateNetworkStatus();

      // Start foreground refresh if app is active
      if (this.isAppActive && this.isOnline) {
        this.startForegroundRefresh();
      }

      this.isInitialized = true;
      this.log('Background refresh service initialized successfully');

      // Perform initial refresh
      await this.performRefresh({
        type: 'forced',
        isOnline: this.isOnline,
        appState: this.isAppActive ? 'active' : 'background',
        timeInBackground: 0,
        lastRefreshAge: 0,
      });
    } catch (error) {
      logError('Failed to initialize background refresh service:', error);
      throw error;
    }
  }

  /**
   * Initialize native platform monitoring (iOS/Android)
   */
  private async initializeNativeMonitoring(): Promise<void> {
    // App state monitoring
    this.appStateListener = App.addListener(
      'appStateChange',
      ({ isActive }) => {
        this.handleAppStateChange(isActive);
      },
    );

    // Network status monitoring
    this.networkStatusListener = Network.addListener(
      'networkStatusChange',
      status => {
        this.handleNetworkChange(status.connected);
      },
    );

    this.log('Native monitoring initialized');
  }

  /**
   * Initialize web platform monitoring
   */
  private async initializeWebMonitoring(): Promise<void> {
    // Page visibility API for app state
    document.addEventListener('visibilitychange', () => {
      this.handleAppStateChange(!document.hidden);
    });

    // Network status monitoring
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    this.log('Web monitoring initialized');
  }

  /**
   * Handle app state changes (active/background)
   */
  private handleAppStateChange(isActive: boolean): void {
    const wasActive = this.isAppActive;
    this.isAppActive = isActive;

    this.log(`App state changed: ${isActive ? 'active' : 'background'}`);

    if (isActive && !wasActive) {
      // App came to foreground
      const timeInBackground =
        this.backgroundStartTime > 0
          ? Date.now() - this.backgroundStartTime
          : 0;

      this.backgroundStartTime = 0;
      this.backgroundRefreshCount = 0;

      // Check if force refresh is needed
      const shouldForceRefresh =
        timeInBackground > this.config.forceRefreshThreshold * 60 * 1000;

      if (shouldForceRefresh && this.isOnline) {
        this.log(
          `Force refresh triggered after ${Math.round(timeInBackground / 60000)} minutes in background`,
        );
        this.performRefresh({
          type: 'forced',
          isOnline: this.isOnline,
          appState: 'active',
          timeInBackground,
          lastRefreshAge: this.getLastRefreshAge(),
        });
      }

      // Start foreground refresh
      this.startForegroundRefresh();
      this.stopBackgroundRefresh();
    } else if (!isActive && wasActive) {
      // App went to background
      this.backgroundStartTime = Date.now();
      this.stopForegroundRefresh();

      if (this.isOnline) {
        this.startBackgroundRefresh();
      }
    }
  }

  /**
   * Handle network connectivity changes
   */
  private handleNetworkChange(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    this.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);

    if (isOnline && !wasOnline) {
      // Network restored - perform refresh
      this.performRefresh({
        type: 'network-change',
        isOnline: true,
        appState: this.isAppActive ? 'active' : 'background',
        timeInBackground: this.getTimeInBackground(),
        lastRefreshAge: this.getLastRefreshAge(),
      });

      // Restart appropriate refresh schedule
      if (this.isAppActive) {
        this.startForegroundRefresh();
      } else {
        this.startBackgroundRefresh();
      }
    } else if (!isOnline) {
      // Network lost - stop all refresh activities
      this.stopAllRefresh();
    }
  }

  /**
   * Update network status from native APIs
   */
  private async updateNetworkStatus(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        this.isOnline = status.connected;
      } else {
        this.isOnline = navigator.onLine;
      }
    } catch (error) {
      this.log('Failed to get network status:', error);
      this.isOnline = true; // Assume online if check fails
    }
  }

  /**
   * Perform a weather data refresh with context
   */
  private async performRefresh(context: RefreshContext): Promise<void> {
    if (!this.refreshCallback || !context.isOnline) {
      return;
    }

    const startTime = Date.now();

    try {
      this.log(`Starting ${context.type} refresh`);

      await this.refreshCallback();

      const duration = Date.now() - startTime;
      this.updateStats(context.type, duration, true);

      this.log(`${context.type} refresh completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStats(context.type, duration, false);

      logError(`${context.type} refresh failed:`, error);
    }
  }

  /**
   * Start foreground refresh interval
   */
  private startForegroundRefresh(): void {
    this.stopForegroundRefresh();

    if (!this.isOnline) return;

    const intervalMs = this.config.foregroundInterval * 60 * 1000;

    this.foregroundInterval = setInterval(async () => {
      await this.performRefresh({
        type: 'foreground',
        isOnline: this.isOnline,
        appState: 'active',
        timeInBackground: 0,
        lastRefreshAge: this.getLastRefreshAge(),
      });
    }, intervalMs);

    this.log(
      `Foreground refresh started (${this.config.foregroundInterval} minute interval)`,
    );
  }

  /**
   * Start background refresh with intelligent scheduling
   */
  private startBackgroundRefresh(): void {
    this.stopBackgroundRefresh();

    if (
      !this.isOnline ||
      this.backgroundRefreshCount >= this.config.maxBackgroundRefreshes
    ) {
      return;
    }

    const intervalMs = this.getOptimizedBackgroundInterval();

    this.backgroundTimeout = setTimeout(async () => {
      if (!this.isAppActive && this.isOnline) {
        this.backgroundRefreshCount++;

        await this.performRefresh({
          type: 'background',
          isOnline: this.isOnline,
          appState: 'background',
          timeInBackground: this.getTimeInBackground(),
          lastRefreshAge: this.getLastRefreshAge(),
        });

        // Schedule next background refresh
        this.startBackgroundRefresh();
      }
    }, intervalMs);

    this.log(
      `Background refresh scheduled in ${Math.round(intervalMs / 60000)} minutes`,
    );
  }

  /**
   * Get optimized background refresh interval based on device state
   */
  private getOptimizedBackgroundInterval(): number {
    let intervalMs = this.config.backgroundInterval * 60 * 1000;

    // Battery optimization - increase interval if battery optimization is enabled
    if (this.config.enableBatteryOptimization) {
      intervalMs *= 1.5; // 50% longer intervals to preserve battery
    }

    // Network optimization - adjust based on connection quality
    if (this.config.enableNetworkOptimization) {
      // Could adjust based on connection type in the future
      // For now, keep standard interval
    }

    // Progressive increase - longer intervals for subsequent background refreshes
    const progressiveMultiplier = 1 + this.backgroundRefreshCount * 0.2;
    intervalMs *= progressiveMultiplier;

    return Math.min(intervalMs, 30 * 60 * 1000); // Cap at 30 minutes
  }

  /**
   * Stop foreground refresh
   */
  private stopForegroundRefresh(): void {
    if (this.foregroundInterval) {
      clearInterval(this.foregroundInterval);
      this.foregroundInterval = null;
      this.log('Foreground refresh stopped');
    }
  }

  /**
   * Stop background refresh
   */
  private stopBackgroundRefresh(): void {
    if (this.backgroundTimeout) {
      clearTimeout(this.backgroundTimeout);
      this.backgroundTimeout = null;
      this.log('Background refresh stopped');
    }
  }

  /**
   * Stop all refresh activities
   */
  private stopAllRefresh(): void {
    this.stopForegroundRefresh();
    this.stopBackgroundRefresh();
    this.log('All refresh activities stopped');
  }

  /**
   * Manual refresh triggered by user
   */
  async manualRefresh(): Promise<void> {
    await this.performRefresh({
      type: 'manual',
      isOnline: this.isOnline,
      appState: this.isAppActive ? 'active' : 'background',
      timeInBackground: this.getTimeInBackground(),
      lastRefreshAge: this.getLastRefreshAge(),
    });
  }

  /**
   * Get time spent in background
   */
  private getTimeInBackground(): number {
    return this.backgroundStartTime > 0
      ? Date.now() - this.backgroundStartTime
      : 0;
  }

  /**
   * Get age of last refresh
   */
  private getLastRefreshAge(): number {
    return this.stats.lastRefreshTime > 0
      ? Date.now() - this.stats.lastRefreshTime
      : 0;
  }

  /**
   * Update refresh statistics
   */
  private updateStats(
    type: RefreshContext['type'],
    duration: number,
    success: boolean,
  ): void {
    this.stats.totalRefreshes++;

    if (success) {
      this.stats.lastRefreshTime = Date.now();
      this.lastRefreshTimes.push(duration);

      // Keep only last 10 refresh times for average calculation
      if (this.lastRefreshTimes.length > 10) {
        this.lastRefreshTimes.shift();
      }

      this.stats.averageRefreshDuration =
        this.lastRefreshTimes.reduce((a, b) => a + b, 0) /
        this.lastRefreshTimes.length;

      switch (type) {
        case 'foreground':
          this.stats.foregroundRefreshes++;
          break;
        case 'background':
          this.stats.backgroundRefreshes++;
          this.stats.lastBackgroundTime = Date.now();
          break;
        case 'forced':
        case 'network-change':
          this.stats.forcedRefreshes++;
          break;
      }
    } else {
      this.stats.failedRefreshes++;
    }
  }

  /**
   * Initialize refresh statistics
   */
  private initializeStats(): RefreshStats {
    return {
      totalRefreshes: 0,
      foregroundRefreshes: 0,
      backgroundRefreshes: 0,
      forcedRefreshes: 0,
      lastRefreshTime: 0,
      lastBackgroundTime: 0,
      averageRefreshDuration: 0,
      failedRefreshes: 0,
    };
  }

  /**
   * Get current refresh statistics
   */
  getStats(): RefreshStats {
    return { ...this.stats };
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isAppActive: this.isAppActive,
      isOnline: this.isOnline,
      timeInBackground: this.getTimeInBackground(),
      lastRefreshAge: this.getLastRefreshAge(),
      backgroundRefreshCount: this.backgroundRefreshCount,
      hasActiveRefresh:
        this.foregroundInterval !== null || this.backgroundTimeout !== null,
      config: this.config,
      stats: this.stats,
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<BackgroundRefreshConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated:', newConfig);

    // Restart refresh with new config if active
    if (this.isAppActive && this.isOnline) {
      this.startForegroundRefresh();
    } else if (!this.isAppActive && this.isOnline) {
      this.startBackgroundRefresh();
    }
  }

  /**
   * Cleanup and destroy the service
   */
  destroy(): void {
    this.stopAllRefresh();

    // Remove native listeners
    if (this.appStateListener) {
      this.appStateListener.then(listener => listener.remove());
    }
    if (this.networkStatusListener) {
      this.networkStatusListener.then(listener => listener.remove());
    }

    // Remove web listeners
    if (!Capacitor.isNativePlatform()) {
      document.removeEventListener('visibilitychange', () => {});
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    }

    this.isInitialized = false;
    this.log('Background refresh service destroyed');
  }

  /**
   * Debug logging
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.debugMode) {
      logInfo(`[BackgroundRefresh] ${message}`, ...args);
    }
  }
}

// Export singleton instance creator
export const createBackgroundRefreshService = (
  config?: Partial<BackgroundRefreshConfig>,
) => {
  return BackgroundRefreshService.getInstance(config);
};

// Export utility functions
export const getDefaultConfig = (): BackgroundRefreshConfig => ({
  ...DEFAULT_CONFIG,
});

/**
 * createOptimizedConfig - Creates and configures optimizedconfig
 */
/**
 * createOptimizedConfig - Creates and configures optimizedconfig
 */
export const createOptimizedConfig = (
  platform: 'mobile' | 'web' = 'mobile',
): BackgroundRefreshConfig => {
  const baseConfig = getDefaultConfig();

  if (platform === 'web') {
    return {
      ...baseConfig,
      backgroundInterval: 20, // Longer intervals for web
      maxBackgroundRefreshes: 2, // Fewer background refreshes
      enableBatteryOptimization: false, // Not applicable to web
    };
  }

  return baseConfig; // Mobile-optimized defaults
};
