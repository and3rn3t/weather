/**
 * Native API Service - Capacitor Integration
 *
 * Provides native device capabilities for enhanced mobile experience:
 * - GPS-based geolocation with high accuracy
 * - Native haptic feedback patterns
 * - Push notifications for weather alerts
 * - Device information for optimization
 * - Network status monitoring
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { Device, type DeviceInfo } from '@capacitor/device';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { App } from '@capacitor/app';
import { logError, logWarn, logInfo } from '../utils/logger';


// Type definitions for native API responses
export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'severe';
  scheduledAt?: Date;
}

export interface DeviceCapabilities {
  platform: string;
  model: string;
  osVersion: string;
  isVirtual: boolean;
  memUsed?: number;
  diskFree?: number;
  diskTotal?: number;
}

/**
 * Native Geolocation Service
 * Provides high-accuracy GPS location with fallback to web API
 */
export class NativeGeolocationService {
  private static instance: NativeGeolocationService;
  private watchId: string | null = null;

  static getInstance(): NativeGeolocationService {
    if (!NativeGeolocationService.instance) {
      NativeGeolocationService.instance = new NativeGeolocationService();
    }
    return NativeGeolocationService.instance;
  }

  /**
   * Get current position with high accuracy
   */
  async getCurrentPosition(): Promise<LocationResult> {
    try {
      if (!Capacitor.isNativePlatform()) {
        logInfo('Web platform detected, using web geolocation API');
        return this.getWebLocation();
      }

      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Location permission denied');
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // Cache for 1 minute
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
    } catch (error) {
      logWarn(
        'Native geolocation failed, falling back to web API:',
        error
      );
      return this.getWebLocation();
    }
  }

  /**
   * Fallback web geolocation
   */
  private async getWebLocation(): Promise<LocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Watch position changes for real-time updates
   */
  async startWatching(
    callback: (location: LocationResult) => void
  ): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return; // Skip watching on web platform
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 120000, // Update every 2 minutes max
        },
        position => {
          if (position) {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          }
        }
      );
    } catch (error) {
      logError('Failed to start location watching:', error);
    }
  }

  /**
   * Stop watching position changes
   */
  async stopWatching(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}

/**
 * Native Haptic Feedback Service
 * Provides rich haptic patterns for different interactions
 */
export class NativeHapticService {
  private static instance: NativeHapticService;
  private isAvailable: boolean = false;

  static getInstance(): NativeHapticService {
    if (!NativeHapticService.instance) {
      NativeHapticService.instance = new NativeHapticService();
    }
    return NativeHapticService.instance;
  }

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    this.isAvailable = Capacitor.isNativePlatform();
  }

  /**
   * Light impact feedback - for button taps, selections
   */
  async light(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Medium impact feedback - for significant actions
   */
  async medium(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Heavy impact feedback - for important confirmations
   */
  async heavy(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Success notification - for successful operations
   */
  async success(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Warning notification - for warnings and alerts
   */
  async warning(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Error notification - for errors and failures
   */
  async error(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      logWarn('Haptic feedback failed:', error);
    }
  }

  /**
   * Progressive feedback for swipe gestures
   */
  async progressiveFeedback(progress: number): Promise<void> {
    if (!this.isAvailable || progress < 0 || progress > 1) return;

    try {
      if (progress < 0.3) {
        await this.light();
      } else if (progress < 0.7) {
        await this.medium();
      } else {
        await this.heavy();
      }
    } catch (error) {
      logWarn('Progressive haptic feedback failed:', error);
    }
  }
}

/**
 * Weather Notification Service
 * Manages weather alerts and push notifications
 */
export class WeatherNotificationService {
  private static instance: WeatherNotificationService;
  private hasPermission: boolean = false;

  static getInstance(): WeatherNotificationService {
    if (!WeatherNotificationService.instance) {
      WeatherNotificationService.instance = new WeatherNotificationService();
    }
    return WeatherNotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Web notification API fallback
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          this.hasPermission = permission === 'granted';
          return this.hasPermission;
        }
        return false;
      }

      const permissionStatus = await LocalNotifications.requestPermissions();
      this.hasPermission = permissionStatus.display === 'granted';
      return this.hasPermission;
    } catch (error) {
      logError('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule weather alert notification
   */
  async scheduleWeatherAlert(alert: WeatherAlert): Promise<void> {
    if (!this.hasPermission) {
      logWarn('Notification permission not granted');
      return;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        // Web notification fallback
        new Notification(alert.title, {
          body: alert.body,
          icon: '/vite.svg',
          badge: '/vite.svg',
        });
        return;
      }

      const notification: LocalNotificationSchema = {
        id: parseInt(alert.id.replace(/\D/g, '')) || Date.now(),
        title: alert.title,
        body: alert.body,
        sound: alert.severity === 'severe' ? 'beep.wav' : undefined,
        attachments: undefined,
        actionTypeId: 'WEATHER_ALERT',
        extra: {
          severity: alert.severity,
        },
      };

      if (alert.scheduledAt) {
        notification.schedule = { at: alert.scheduledAt };
      }

      await LocalNotifications.schedule({
        notifications: [notification],
      });

      logInfo('Weather alert scheduled:', alert.title);
    } catch (error) {
      logError('Failed to schedule weather alert:', error);
    }
  }

  /**
   * Send immediate weather update notification
   */
  async sendWeatherUpdate(
    temperature: number,
    condition: string,
    city: string
  ): Promise<void> {
    const alert: WeatherAlert = {
      id: `weather-update-${Date.now()}`,
      title: `${city} Weather Update`,
      body: `${Math.round(temperature)}°F - ${condition}`,
      severity: 'info',
    };

    await this.scheduleWeatherAlert(alert);
  }

  /**
   * Send severe weather alert
   */
  async sendSevereWeatherAlert(
    alertType: string,
    description: string,
    city: string
  ): Promise<void> {
    const alert: WeatherAlert = {
      id: `severe-alert-${Date.now()}`,
      title: `⚠️ ${alertType} Alert - ${city}`,
      body: description,
      severity: 'severe',
    };

    await this.scheduleWeatherAlert(alert);
  }

  /**
   * Clear all weather notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.removeAllDeliveredNotifications();
        logInfo('All weather notifications cleared');
      }
    } catch (error) {
      logError('Failed to clear notifications:', error);
    }
  }
}

/**
 * Device Information Service
 * Provides device capabilities and system information
 */
export class DeviceInfoService {
  private static instance: DeviceInfoService;
  private deviceInfo: DeviceCapabilities | null = null;

  static getInstance(): DeviceInfoService {
    if (!DeviceInfoService.instance) {
      DeviceInfoService.instance = new DeviceInfoService();
    }
    return DeviceInfoService.instance;
  }

  /**
   * Get comprehensive device information
   */
  async getDeviceInfo(): Promise<DeviceCapabilities> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        // Web platform fallback
        this.deviceInfo = {
          platform: 'web',
          model: navigator.userAgent,
          osVersion: navigator.appVersion,
          isVirtual: false,
        };
        return this.deviceInfo;
      }

      const info: DeviceInfo = await Device.getInfo();

      this.deviceInfo = {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        isVirtual: info.isVirtual,
        memUsed: info.memUsed,
        // Note: diskFree and diskTotal are not available in current Capacitor DeviceInfo
        // These would require additional plugins or native implementation
        diskFree: 0, // Placeholder - requires additional plugin
        diskTotal: 0, // Placeholder - requires additional plugin
      };

      return this.deviceInfo;
    } catch (error) {
      logError('Failed to get device info:', error);
      return {
        platform: 'unknown',
        model: 'unknown',
        osVersion: 'unknown',
        isVirtual: false,
      };
    }
  }

  /**
   * Check if device has sufficient resources for advanced features
   */
  async canHandleAdvancedFeatures(): Promise<boolean> {
    const info = await this.getDeviceInfo();

    // Basic resource checks
    if (info.memUsed && info.memUsed > 0.8) {
      logWarn('High memory usage detected, limiting advanced features');
      return false;
    }

    return true;
  }
}

/**
 * Network Status Service
 * Monitors network connectivity for offline handling
 */
export class NetworkStatusService {
  private static instance: NetworkStatusService;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private isOnline: boolean = true;

  static getInstance(): NetworkStatusService {
    if (!NetworkStatusService.instance) {
      NetworkStatusService.instance = new NetworkStatusService();
    }
    return NetworkStatusService.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network status monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native network monitoring
        const status: ConnectionStatus = await Network.getStatus();
        this.isOnline = status.connected;

        Network.addListener('networkStatusChange', status => {
          this.isOnline = status.connected;
          this.notifyListeners(status.connected);
        });
      } else {
        // Web network monitoring
        this.isOnline = navigator.onLine;
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.notifyListeners(true);
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.notifyListeners(false);
        });
      }
    } catch (error) {
      logError('Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add network status change listener
   */
  addNetworkListener(callback: (isOnline: boolean) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove network status change listener
   */
  removeNetworkListener(callback: (isOnline: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of network status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        logError('Network listener callback failed:', error);
      }
    });
  }
}

/**
 * App State Service
 * Handles app lifecycle events for background updates
 */
export class AppStateService {
  private static instance: AppStateService;
  private listeners: ((isActive: boolean) => void)[] = [];

  static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  constructor() {
    this.initializeAppStateMonitoring();
  }

  /**
   * Initialize app state monitoring
   */
  private initializeAppStateMonitoring(): void {
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        this.notifyListeners(isActive);
      });
    } else {
      // Web visibility API fallback
      document.addEventListener('visibilitychange', () => {
        this.notifyListeners(!document.hidden);
      });
    }
  }

  /**
   * Add app state change listener
   */
  addAppStateListener(callback: (isActive: boolean) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove app state change listener
   */
  removeAppStateListener(callback: (isActive: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of app state change
   */
  private notifyListeners(isActive: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isActive);
      } catch (error) {
        logError('App state listener callback failed:', error);
      }
    });
  }
}

// Export singleton instances for easy use
export const nativeGeolocation = NativeGeolocationService.getInstance();
/**
 * nativeHaptics - Haptic feedback system for mobile interactions
 */
/**
 * nativeHaptics - Haptic feedback system for mobile interactions
 */
export const nativeHaptics = NativeHapticService.getInstance();
/**
 * weatherNotifications - Core nativeApiService functionality
 */
/**
 * weatherNotifications - Core nativeApiService functionality
 */
export const weatherNotifications = WeatherNotificationService.getInstance();
/**
 * deviceInfo - Core nativeApiService functionality
 */
/**
 * deviceInfo - Core nativeApiService functionality
 */
export const deviceInfo = DeviceInfoService.getInstance();
/**
 * networkStatus - Core nativeApiService functionality
 */
/**
 * networkStatus - Core nativeApiService functionality
 */
export const networkStatus = NetworkStatusService.getInstance();
/**
 * appState - Core nativeApiService functionality
 */
/**
 * appState - Core nativeApiService functionality
 */
export const appState = AppStateService.getInstance();

// Export utility function to check if native features are available
export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

// Export function to initialize all native services
export const initializeNativeServices = async (): Promise<void> => {
  try {
    logInfo('Initializing native services...');

    // Request necessary permissions
    await weatherNotifications.requestPermissions();

    // Get device info for optimization
    const info = await deviceInfo.getDeviceInfo();
    logInfo('Device info:', info);

    // Check network status
    const online = networkStatus.getNetworkStatus();
    logInfo('Network status:', online ? 'Online' : 'Offline');

    logInfo('Native services initialized successfully');
  } catch (error) {
    logError('Failed to initialize native services:', error);
  }
};
