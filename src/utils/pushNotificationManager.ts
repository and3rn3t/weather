/**
 * Push Notification Manager
 * Handles weather alert notifications and user engagement
 */

import { logError, logWarn } from './logger';

interface WeatherData {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

interface WeatherAlert {
  id: string;
  type:
    | 'severe-weather'
    | 'temperature-extreme'
    | 'daily-forecast'
    | 'location-weather';
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'normal' | 'high';
  timestamp: number;
  weatherData?: WeatherData;
  location?: { latitude: number; longitude: number; cityName: string };
}

interface NotificationSettings {
  enabled: boolean;
  severeWeatherAlerts: boolean;
  temperatureAlerts: boolean;
  dailyForecast: boolean;
  locationUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
}

class PushNotificationManager {
  private readonly STORAGE_KEY = 'weather-notification-settings';
  private readonly ALERTS_STORAGE_KEY = 'weather-alert-history';
  private readonly MAX_ALERT_HISTORY = 50;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.permission = this.getNotificationPermission();
    this.initializeServiceWorker();
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logWarn('This browser does not support notifications');
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      logError('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get current notification permission
   */
  private getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  /**
   * Check if notifications are available and permitted
   */
  isNotificationAvailable(): boolean {
    return 'Notification' in window && this.permission === 'granted';
  }

  /**
   * Send weather alert notification
   */
  async sendWeatherAlert(
    alert: Omit<WeatherAlert, 'id' | 'timestamp'>
  ): Promise<boolean> {
    if (!this.isNotificationAvailable()) {
      logWarn('Notifications not available or not permitted');
      return false;
    }

    const settings = this.getNotificationSettings();
    if (!settings.enabled) {
      return false;
    }

    // Check quiet hours
    if (this.isQuietHours(settings)) {
      // Queue for later unless it's severe weather
      if (alert.priority !== 'high') {
        return false;
      }
    }

    // Check alert type preferences
    if (!this.shouldSendAlert(alert.type, settings)) {
      return false;
    }

    const fullAlert: WeatherAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: Date.now(),
    };

    try {
      // Try to use service worker for persistent notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(alert.title, {
          body: alert.message,
          icon: alert.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `weather-${alert.type}`,
          requireInteraction: alert.priority === 'high',
          data: {
            alertId: fullAlert.id,
            type: alert.type,
            weatherData: alert.weatherData,
            location: alert.location,
          },
        });
      } else {
        // Fallback to regular notification
        const notification = new Notification(alert.title, {
          body: alert.message,
          icon: alert.icon || '/icons/icon-192x192.png',
          tag: `weather-${alert.type}`,
          requireInteraction: alert.priority === 'high',
        });

        // Auto-dismiss after delay for non-critical alerts
        if (alert.priority !== 'high') {
          setTimeout(() => notification.close(), 5000);
        }
      }

      // Store alert in history
      this.storeAlertHistory(fullAlert);
      return true;
    } catch (error) {
      logError('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Schedule daily forecast notification
   */
  async scheduleDailyForecast(
    weatherData: WeatherData,
    cityName: string
  ): Promise<boolean> {
    const tomorrow = weatherData.daily;
    if (
      !tomorrow ||
      !tomorrow.temperature_2m_max ||
      !tomorrow.temperature_2m_min
    ) {
      return false;
    }

    const maxTemp = Math.round(tomorrow.temperature_2m_max[1]);
    const minTemp = Math.round(tomorrow.temperature_2m_min[1]);
    const weatherCode = tomorrow.weather_code[1];

    const condition = this.getWeatherCondition(weatherCode);

    return await this.sendWeatherAlert({
      type: 'daily-forecast',
      title: `Tomorrow's Forecast - ${cityName}`,
      message: `${condition}, High ${maxTemp}°F, Low ${minTemp}°F`,
      icon: '/icons/icon-192x192.png',
      priority: 'normal',
      weatherData,
    });
  }

  /**
   * Check for severe weather conditions and send alerts
   */
  async checkAndSendSevereWeatherAlerts(
    weatherData: WeatherData,
    cityName: string
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const current = weatherData.current_weather;

    if (!current) return alerts;

    const temp = current.temperature;
    const windSpeed = current.windspeed;
    const weatherCode = current.weathercode;

    // Temperature extremes
    if (temp >= 100) {
      const alert = await this.sendWeatherAlert({
        type: 'temperature-extreme',
        title: '🌡️ Extreme Heat Warning',
        message: `Dangerous heat in ${cityName}: ${Math.round(
          temp
        )}°F. Stay hydrated and seek shade.`,
        icon: '/icons/icon-192x192.png',
        priority: 'high',
        weatherData,
        location: { latitude: 0, longitude: 0, cityName },
      });
      if (alert)
        alerts.push({
          id: this.generateAlertId(),
          timestamp: Date.now(),
          type: 'temperature-extreme',
          title: '🌡️ Extreme Heat Warning',
          message: `Dangerous heat in ${cityName}: ${Math.round(temp)}°F`,
          icon: '/icons/icon-192x192.png',
          priority: 'high',
        });
    }

    if (temp <= 10) {
      const alert = await this.sendWeatherAlert({
        type: 'temperature-extreme',
        title: '🧊 Extreme Cold Warning',
        message: `Dangerous cold in ${cityName}: ${Math.round(
          temp
        )}°F. Dress warmly and limit exposure.`,
        icon: '/icons/icon-192x192.png',
        priority: 'high',
        weatherData,
        location: { latitude: 0, longitude: 0, cityName },
      });
      if (alert)
        alerts.push({
          id: this.generateAlertId(),
          timestamp: Date.now(),
          type: 'temperature-extreme',
          title: '🧊 Extreme Cold Warning',
          message: `Dangerous cold in ${cityName}: ${Math.round(temp)}°F`,
          icon: '/icons/icon-192x192.png',
          priority: 'high',
        });
    }

    // High wind warning
    if (windSpeed >= 40) {
      const alert = await this.sendWeatherAlert({
        type: 'severe-weather',
        title: '💨 High Wind Warning',
        message: `Strong winds in ${cityName}: ${Math.round(
          windSpeed
        )} mph. Avoid outdoor activities.`,
        icon: '/icons/icon-192x192.png',
        priority: 'high',
        weatherData,
        location: { latitude: 0, longitude: 0, cityName },
      });
      if (alert)
        alerts.push({
          id: this.generateAlertId(),
          timestamp: Date.now(),
          type: 'severe-weather',
          title: '💨 High Wind Warning',
          message: `Strong winds in ${cityName}: ${Math.round(windSpeed)} mph`,
          icon: '/icons/icon-192x192.png',
          priority: 'high',
        });
    }

    // Severe weather conditions (thunderstorm, heavy rain, etc.)
    if (this.isSevereWeatherCode(weatherCode)) {
      const condition = this.getWeatherCondition(weatherCode);
      const alert = await this.sendWeatherAlert({
        type: 'severe-weather',
        title: '⚠️ Severe Weather Alert',
        message: `${condition} in ${cityName}. Exercise caution and stay safe.`,
        icon: '/icons/icon-192x192.png',
        priority: 'high',
        weatherData,
        location: { latitude: 0, longitude: 0, cityName },
      });
      if (alert)
        alerts.push({
          id: this.generateAlertId(),
          timestamp: Date.now(),
          type: 'severe-weather',
          title: '⚠️ Severe Weather Alert',
          message: `${condition} in ${cityName}`,
          icon: '/icons/icon-192x192.png',
          priority: 'high',
        });
    }

    return alerts;
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const defaults: NotificationSettings = {
        enabled: true,
        severeWeatherAlerts: true,
        temperatureAlerts: true,
        dailyForecast: false,
        locationUpdates: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
        },
      };

      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (error) {
      logError('Failed to load notification settings:', error);
      return {
        enabled: true,
        severeWeatherAlerts: true,
        temperatureAlerts: true,
        dailyForecast: false,
        locationUpdates: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
        },
      };
    }
  }

  /**
   * Update notification settings
   */
  updateNotificationSettings(settings: Partial<NotificationSettings>): void {
    const current = this.getNotificationSettings();
    const updated = { ...current, ...settings };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      logError('Failed to save notification settings:', error);
    }
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const { start, end } = settings.quietHours;

    // Handle cases where quiet hours cross midnight
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  /**
   * Check if alert should be sent based on user preferences
   */
  private shouldSendAlert(
    type: WeatherAlert['type'],
    settings: NotificationSettings
  ): boolean {
    switch (type) {
      case 'severe-weather':
        return settings.severeWeatherAlerts;
      case 'temperature-extreme':
        return settings.temperatureAlerts;
      case 'daily-forecast':
        return settings.dailyForecast;
      case 'location-weather':
        return settings.locationUpdates;
      default:
        return true;
    }
  }

  /**
   * Get vibration pattern based on priority
   */
  private getVibrationPattern(priority: WeatherAlert['priority']): number[] {
    switch (priority) {
      case 'high':
        return [300, 100, 300, 100, 300]; // Urgent pattern
      case 'normal':
        return [200, 100, 200]; // Standard pattern
      case 'low':
        return [100]; // Single short vibration
      default:
        return [];
    }
  }

  /**
   * Store alert in history
   */
  private storeAlertHistory(alert: WeatherAlert): void {
    try {
      const history = this.getAlertHistory();
      history.unshift(alert);

      // Keep only recent alerts
      const trimmed = history.slice(0, this.MAX_ALERT_HISTORY);
      localStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      logError('Failed to store alert history:', error);
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(): WeatherAlert[] {
    try {
      const stored = localStorage.getItem(this.ALERTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logError('Failed to load alert history:', error);
      return [];
    }
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    localStorage.removeItem(this.ALERTS_STORAGE_KEY);
  }

  /**
   * Initialize service worker for notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
        // Service worker is ready for notifications
      } catch (error) {
        logError('Service worker initialization failed:', error);
      }
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if weather code indicates severe weather
   */
  private isSevereWeatherCode(code: number): boolean {
    // Severe weather codes: thunderstorms, heavy rain, snow storms, etc.
    const severeCodes = [95, 96, 97, 85, 86, 75, 77, 82, 84];
    return severeCodes.includes(code);
  }

  /**
   * Get human-readable weather condition from code
   */
  private getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: 'Clear Sky',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      77: 'Snow Grains',
      80: 'Slight Rain Showers',
      81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers',
      85: 'Slight Snow Showers',
      86: 'Heavy Snow Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Slight Hail',
      97: 'Thunderstorm with Heavy Hail',
    };

    return conditions[code] || 'Unknown Conditions';
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const history = this.getAlertHistory();
    const settings = this.getNotificationSettings();

    return {
      permission: this.permission,
      isAvailable: this.isNotificationAvailable(),
      settings,
      alertHistory: {
        total: history.length,
        last24h: history.filter(
          alert => Date.now() - alert.timestamp < 24 * 60 * 60 * 1000
        ).length,
        byType: {
          severe: history.filter(alert => alert.type === 'severe-weather')
            .length,
          temperature: history.filter(
            alert => alert.type === 'temperature-extreme'
          ).length,
          forecast: history.filter(alert => alert.type === 'daily-forecast')
            .length,
          location: history.filter(alert => alert.type === 'location-weather')
            .length,
        },
      },
    };
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();
