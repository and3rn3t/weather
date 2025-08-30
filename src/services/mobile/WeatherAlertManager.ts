/**
 * WeatherAlertManager - Phase 5C Implementation
 * Intelligent weather alert system with push notifications and user preferences
 *
 * Features:
 * - Severe weather detection from OpenMeteo data
 * - Customizable alert rules and thresholds
 * - Web push notifications with fallbacks
 * - Location-aware alerting
 * - Alert history and management
 * - Battery-conscious background processing
 */

import { logger } from '../../utils/logger';
import {
  getStoredUnits,
  getTemperatureSymbol,
  getWindSpeedLabel,
} from '../../utils/units';

// Minimal weather data shapes to avoid `any`
interface CurrentWeatherLike {
  temperature?: number;
  temperature_2m?: number;
  windspeed?: number;
  wind_speed_10m?: number;
  weathercode?: number;
  weather_code?: number;
  visibility?: number;
  precipitation?: number;
}

interface HourlyWeatherLike {
  precipitation?: number[];
}

interface WeatherDataLike {
  current_weather?: CurrentWeatherLike;
  current?: CurrentWeatherLike;
  hourly?: HourlyWeatherLike;
}

type _StoredWeatherAlert = Omit<
  WeatherAlert,
  'startTime' | 'endTime' | 'createdAt'
> & {
  startTime: string;
  endTime?: string;
  createdAt: string;
};

type _StoredAlertRule = Omit<AlertRule, 'createdAt'> & {
  createdAt: string;
};

// Alert Types and Severity Levels
export type AlertSeverity = 'info' | 'warning' | 'severe' | 'extreme';
export type AlertType =
  | 'temperature'
  | 'precipitation'
  | 'wind'
  | 'storm'
  | 'visibility'
  | 'general';

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lon: number };
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isRead: boolean;
  notificationSent: boolean;
  createdAt: Date;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  conditions: {
    temperature?: { min?: number; max?: number };
    precipitation?: { threshold: number; duration?: number };
    windSpeed?: { threshold: number };
    visibility?: { threshold: number };
  };
  locations: string[]; // City names or 'current' for GPS location
  timeRange?: { start: string; end: string }; // HH:MM format
  severity: AlertSeverity;
  notificationEnabled: boolean;
  title: string;
  description: string;
  createdAt: Date;
}

export interface AlertPreferences {
  enableNotifications: boolean;
  enableSounds: boolean;
  enableVibration: boolean;
  quietHours: { start: string; end: string };
  minimumSeverity: AlertSeverity;
  locationAlertsEnabled: boolean;
  favoriteLocationAlertsOnly: boolean;
  maxAlertsPerDay: number;
  alertHistoryDays: number;
}

const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enableNotifications: true,
  enableSounds: true,
  enableVibration: true,
  quietHours: { start: '22:00', end: '07:00' },
  minimumSeverity: 'warning',
  locationAlertsEnabled: true,
  favoriteLocationAlertsOnly: false,
  maxAlertsPerDay: 10,
  alertHistoryDays: 7,
};

export class WeatherAlertManager {
  private static instance: WeatherAlertManager;
  private alerts: WeatherAlert[] = [];
  private alertRules: AlertRule[] = [];
  private preferences: AlertPreferences = DEFAULT_ALERT_PREFERENCES;
  private lastAlertCheck: Date = new Date(0);
  private alertCounts: Map<string, number> = new Map(); // Daily alert counts by location
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.loadStoredData();
    this.requestNotificationPermission();
    this.setupDefaultAlertRules();
  }

  static getInstance(): WeatherAlertManager {
    if (!WeatherAlertManager.instance) {
      WeatherAlertManager.instance = new WeatherAlertManager();
    }
    return WeatherAlertManager.instance;
  }

  // ===== Core Alert Processing =====

  /**
   * Process weather data and trigger alerts based on conditions
   */
  async processWeatherData(
    weatherData: WeatherDataLike,
    location: string,
    coordinates?: { lat: number; lon: number }
  ): Promise<WeatherAlert[]> {
    try {
      const triggeredAlerts: WeatherAlert[] = [];
      const currentTime = new Date();

      // Skip if within rate limit or quiet hours
      if (!this.shouldProcessAlerts(location, currentTime)) {
        return triggeredAlerts;
      }

      // Process each active alert rule
      for (const rule of this.alertRules.filter(r => r.enabled)) {
        // Check location match
        if (!this.isLocationMatch(rule, location, coordinates)) {
          continue;
        }

        // Check time range
        if (!this.isTimeRangeMatch(rule, currentTime)) {
          continue;
        }

        // Evaluate weather conditions
        const alertTriggered = await this.evaluateAlertConditions(
          rule,
          weatherData,
          location
        );
        if (alertTriggered) {
          // Check for duplicate recent alerts
          const existingAlert = this.findRecentAlert(rule, location, 60); // 60 minutes
          if (!existingAlert) {
            const alert = this.createAlert(
              rule,
              weatherData,
              location,
              coordinates
            );
            triggeredAlerts.push(alert);
            this.addAlert(alert);
          }
        }
      }

      // Process severe weather warnings from OpenMeteo
      const severeWeatherAlerts = await this.processSevereWeatherWarnings(
        weatherData,
        location,
        coordinates
      );
      triggeredAlerts.push(...severeWeatherAlerts);

      // Send notifications for new alerts
      for (const alert of triggeredAlerts) {
        await this.sendNotification(alert);
      }

      this.lastAlertCheck = currentTime;
      this.saveStoredData();

      logger.info(`Processed weather alerts for ${location}`, {
        alertsTriggered: triggeredAlerts.length,
        location,
        timestamp: currentTime.toISOString(),
      });

      return triggeredAlerts;
    } catch (error) {
      logger.error('Error processing weather data for alerts', {
        error,
        location,
      });
      return [];
    }
  }

  /**
   * Evaluate if weather conditions meet alert rule criteria
   */
  private async evaluateAlertConditions(
    rule: AlertRule,
    weatherData: WeatherDataLike,
    location: string
  ): Promise<boolean> {
    try {
      const conditions = rule.conditions;
      const current = weatherData.current_weather || weatherData.current || {};
      const hourly = weatherData.hourly || {};

      // Temperature alerts
      if (conditions.temperature) {
        const temp = current.temperature || current.temperature_2m;
        if (temp !== undefined) {
          if (
            conditions.temperature.min !== undefined &&
            temp < conditions.temperature.min
          ) {
            return true;
          }
          if (
            conditions.temperature.max !== undefined &&
            temp > conditions.temperature.max
          ) {
            return true;
          }
        }
      }

      // Precipitation alerts
      if (conditions.precipitation) {
        const precipitation =
          current.precipitation || hourly.precipitation?.[0] || 0;
        if (precipitation >= conditions.precipitation.threshold) {
          return true;
        }
      }

      // Wind speed alerts
      if (conditions.windSpeed) {
        const windSpeed = current.windspeed || current.wind_speed_10m || 0;
        if (windSpeed >= conditions.windSpeed.threshold) {
          return true;
        }
      }

      // Visibility alerts
      if (conditions.visibility) {
        const visibility = current.visibility || 10000; // Default to good visibility
        if (visibility <= conditions.visibility.threshold) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error evaluating alert conditions', {
        error,
        rule: rule.id,
        location,
      });
      return false;
    }
  }

  /**
   * Process severe weather warnings from OpenMeteo weather codes
   */
  private async processSevereWeatherWarnings(
    weatherData: WeatherDataLike,
    location: string,
    coordinates?: { lat: number; lon: number }
  ): Promise<WeatherAlert[]> {
    const severeAlerts: WeatherAlert[] = [];

    try {
      const current = weatherData.current_weather || weatherData.current || {};
      const weatherCode = current.weathercode || current.weather_code;

      if (weatherCode !== undefined) {
        const severity = this.getWeatherCodeSeverity(weatherCode);

        if (severity === 'severe' || severity === 'extreme') {
          const existingAlert = this.findRecentAlert(
            { id: 'severe-weather', type: 'general' } as AlertRule,
            location,
            120 // 2 hours
          );

          if (!existingAlert) {
            const alert: WeatherAlert = {
              id: `severe-${Date.now()}-${location}`,
              type: 'storm',
              severity,
              title: this.getWeatherCodeTitle(weatherCode),
              description: this.getWeatherCodeDescription(weatherCode, current),
              location,
              coordinates,
              startTime: new Date(),
              isActive: true,
              isRead: false,
              notificationSent: false,
              createdAt: new Date(),
            };

            severeAlerts.push(alert);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing severe weather warnings', {
        error,
        location,
      });
    }

    return severeAlerts;
  }

  // ===== Alert Management =====

  /**
   * Add new alert to system
   */
  private addAlert(alert: WeatherAlert): void {
    this.alerts.unshift(alert); // Add to beginning for chronological order

    // Cleanup old alerts based on preferences
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - this.preferences.alertHistoryDays
    );

    this.alerts = this.alerts.filter(a => a.createdAt >= cutoffDate);

    // Update daily count
    const today = new Date().toDateString();
    const todayCount = this.alertCounts.get(today) || 0;
    this.alertCounts.set(today, todayCount + 1);
  }

  /**
   * Create alert from rule and weather data
   */
  private createAlert(
    rule: AlertRule,
    weatherData: WeatherDataLike,
    location: string,
    coordinates?: { lat: number; lon: number }
  ): WeatherAlert {
    const current = weatherData.current_weather || weatherData.current || {};

    return {
      id: `${rule.id}-${Date.now()}-${location}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.title,
      description: this.formatAlertDescription(rule, current, location),
      location,
      coordinates,
      startTime: new Date(),
      isActive: true,
      isRead: false,
      notificationSent: false,
      createdAt: new Date(),
    };
  }

  /**
   * Format alert description with current weather data
   */
  private formatAlertDescription(
    rule: AlertRule,
    weatherData: CurrentWeatherLike,
    location: string
  ): string {
    let description = rule.description;

    // Replace placeholders with actual values
    description = description.replace('{location}', location);
    {
      const tempVal =
        weatherData.temperature || weatherData.temperature_2m || 'N/A';
      const symbol = getTemperatureSymbol(getStoredUnits());
      description = description.replace('{temperature}', `${tempVal}${symbol}`);
    }
    description = description.replace(
      '{windSpeed}',
      `${weatherData.windspeed || weatherData.wind_speed_10m || 'N/A'} ${getWindSpeedLabel(getStoredUnits())}`
    );
    description = description.replace(
      '{time}',
      new Date().toLocaleTimeString()
    );

    return description;
  }

  // ===== Notification System =====

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: WeatherAlert): Promise<void> {
    try {
      if (!this.preferences.enableNotifications || !alert.notificationSent) {
        return;
      }

      // Check notification permission
      if (this.notificationPermission !== 'granted') {
        logger.warn(
          'Notification permission not granted, skipping notification'
        );
        return;
      }

      // Check if within quiet hours
      if (this.isQuietHours()) {
        logger.info('Within quiet hours, skipping notification', {
          alert: alert.id,
        });
        return;
      }

      // Create notification
      const notification = new Notification(alert.title, {
        body: alert.description,
        icon: '/icons/weather-alert.png',
        badge: '/icons/weather-badge.png',
        tag: `weather-alert-${alert.type}`,
        data: { alertId: alert.id, location: alert.location },
        requireInteraction: alert.severity === 'extreme',
        silent: !this.preferences.enableSounds,
      });

      // Handle notification events
      notification.onclick = () => {
        this.markAlertAsRead(alert.id);
        window.focus();
        notification.close();
      };

      notification.onclose = () => {
        this.markAlertAsRead(alert.id);
      };

      // Vibration for mobile devices
      if (this.preferences.enableVibration && 'vibrate' in navigator) {
        const pattern =
          alert.severity === 'extreme'
            ? [200, 100, 200, 100, 200]
            : [200, 100, 200];
        navigator.vibrate(pattern);
      }

      alert.notificationSent = true;

      logger.info('Notification sent successfully', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Error sending notification', { error, alertId: alert.id });
    }
  }

  /**
   * Request notification permission from user
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      if ('Notification' in window) {
        this.notificationPermission = Notification.permission;

        if (this.notificationPermission === 'default') {
          const permission = await Notification.requestPermission();
          this.notificationPermission = permission;

          logger.info('Notification permission requested', { permission });
        }
      } else {
        logger.warn('Notifications not supported in this browser');
      }
    } catch (error) {
      logger.error('Error requesting notification permission', { error });
    }
  }

  // ===== Helper Methods =====

  /**
   * Check if alerts should be processed based on rate limits and preferences
   */
  private shouldProcessAlerts(location: string, currentTime: Date): boolean {
    // Check daily limit
    const today = currentTime.toDateString();
    const todayCount = this.alertCounts.get(today) || 0;
    if (todayCount >= this.preferences.maxAlertsPerDay) {
      return false;
    }

    // Check if too soon since last check (rate limiting)
    const timeSinceLastCheck =
      currentTime.getTime() - this.lastAlertCheck.getTime();
    if (timeSinceLastCheck < 5 * 60 * 1000) {
      // 5 minutes minimum
      return false;
    }

    return true;
  }

  /**
   * Check if location matches alert rule
   */
  private isLocationMatch(
    rule: AlertRule,
    location: string,
    coordinates?: { lat: number; lon: number }
  ): boolean {
    if (rule.locations.includes('current') && coordinates) {
      return true;
    }

    return rule.locations.some(
      ruleLocation => ruleLocation.toLowerCase() === location.toLowerCase()
    );
  }

  /**
   * Check if current time is within rule's time range
   */
  private isTimeRangeMatch(rule: AlertRule, currentTime: Date): boolean {
    if (!rule.timeRange) {
      return true;
    }

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = rule.timeRange.start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = rule.timeRange.end.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (startTimeInMinutes <= endTimeInMinutes) {
      return (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes <= endTimeInMinutes
      );
    } else {
      // Crosses midnight
      return (
        currentTimeInMinutes >= startTimeInMinutes ||
        currentTimeInMinutes <= endTimeInMinutes
      );
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    const currentTime = new Date();
    return !this.isTimeRangeMatch(
      { timeRange: this.preferences.quietHours } as AlertRule,
      currentTime
    );
  }

  /**
   * Find recent alert matching criteria
   */
  private findRecentAlert(
    rule: { id: string; type: AlertType },
    location: string,
    minutesBack: number
  ): WeatherAlert | undefined {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesBack);

    return this.alerts.find(
      alert =>
        alert.type === rule.type &&
        alert.location === location &&
        alert.createdAt >= cutoffTime
    );
  }

  /**
   * Get severity level from OpenMeteo weather code
   */
  private getWeatherCodeSeverity(weatherCode: number): AlertSeverity {
    // OpenMeteo weather codes: https://open-meteo.com/en/docs
    if ([95, 96, 97].includes(weatherCode)) return 'extreme'; // Thunderstorms with hail
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'severe'; // Heavy snow
    if ([65, 67, 81, 82].includes(weatherCode)) return 'warning'; // Heavy rain
    return 'info';
  }

  /**
   * Get title for weather code
   */
  private getWeatherCodeTitle(weatherCode: number): string {
    const titles: { [key: number]: string } = {
      95: 'Severe Thunderstorm Warning',
      96: 'Thunderstorm with Light Hail',
      97: 'Thunderstorm with Heavy Hail',
      75: 'Heavy Snow Warning',
      77: 'Snow Grains Warning',
      85: 'Heavy Snow Showers',
      86: 'Heavy Snow Showers',
      67: 'Heavy Freezing Rain',
      82: 'Heavy Rain Showers',
    };

    return titles[weatherCode] || 'Severe Weather Alert';
  }

  /**
   * Get description for weather code
   */
  private getWeatherCodeDescription(
    weatherCode: number,
    weatherData: CurrentWeatherLike
  ): string {
    const temp = weatherData.temperature || weatherData.temperature_2m || 'N/A';
    const wind = weatherData.windspeed || weatherData.wind_speed_10m || 'N/A';

    const tempWithUnit = `${temp}${getTemperatureSymbol(getStoredUnits())}`;
    const descriptions: { [key: number]: string } = {
      95: `Severe thunderstorms in your area. Temperature: ${tempWithUnit}, Wind: ${wind} ${getWindSpeedLabel(getStoredUnits())}. Stay indoors and avoid travel.`,
      96: `Thunderstorm with light hail reported. Temperature: ${tempWithUnit}. Protect vehicles and stay inside.`,
      97: `Dangerous thunderstorm with heavy hail. Temperature: ${tempWithUnit}, Wind: ${wind} ${getWindSpeedLabel(getStoredUnits())}. Seek shelter immediately.`,
      75: `Heavy snowfall warning in effect. Temperature: ${tempWithUnit}. Avoid unnecessary travel.`,
      82: `Heavy rain showers expected. Temperature: ${tempWithUnit}. Watch for flooding and reduced visibility.`,
    };

    return (
      descriptions[weatherCode] ||
      `Severe weather conditions detected. Temperature: ${tempWithUnit}, Wind: ${wind} ${getWindSpeedLabel(getStoredUnits())}.`
    );
  }

  // ===== Public API Methods =====

  /**
   * Get all active alerts
   */
  getActiveAlerts(): WeatherAlert[] {
    return this.alerts.filter(alert => alert.isActive);
  }

  /**
   * Get unread alerts
   */
  getUnreadAlerts(): WeatherAlert[] {
    return this.alerts.filter(alert => !alert.isRead && alert.isActive);
  }

  /**
   * Get alert history
   */
  getAlertHistory(days?: number): WeatherAlert[] {
    if (!days) return this.alerts;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.alerts.filter(alert => alert.createdAt >= cutoffDate);
  }

  /**
   * Mark alert as read
   */
  markAlertAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.saveStoredData();
    }
  }

  /**
   * Mark all alerts as read
   */
  markAllAlertsAsRead(): void {
    this.alerts.forEach(alert => (alert.isRead = true));
    this.saveStoredData();
  }

  /**
   * Dismiss/deactivate alert
   */
  dismissAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isActive = false;
      alert.isRead = true;
      this.saveStoredData();
    }
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Add or update alert rule
   */
  setAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): string {
    const ruleId = `rule-${Date.now()}`;
    const fullRule: AlertRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
    };

    this.alertRules.push(fullRule);
    this.saveStoredData();

    return ruleId;
  }

  /**
   * Update existing alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.alertRules[ruleIndex] = {
        ...this.alertRules[ruleIndex],
        ...updates,
      };
      this.saveStoredData();
      return true;
    }
    return false;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.alertRules.splice(ruleIndex, 1);
      this.saveStoredData();
      return true;
    }
    return false;
  }

  /**
   * Get alert preferences
   */
  getPreferences(): AlertPreferences {
    return { ...this.preferences };
  }

  /**
   * Update alert preferences
   */
  updatePreferences(updates: Partial<AlertPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.saveStoredData();
  }

  /**
   * Reset alert preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_ALERT_PREFERENCES };
    this.saveStoredData();
  }

  // ===== Default Alert Rules Setup =====

  /**
   * Setup default alert rules for new users
   */
  private setupDefaultAlertRules(): void {
    if (this.alertRules.length === 0) {
      const defaultRules: Omit<AlertRule, 'id' | 'createdAt'>[] = [
        {
          type: 'temperature',
          enabled: true,
          conditions: { temperature: { max: 100 } },
          locations: ['current'],
          severity: 'warning',
          notificationEnabled: true,
          title: 'Extreme Heat Warning',
          description:
            'Temperature is extremely high at {temperature} in {location}. Stay hydrated and avoid outdoor activities.',
        },
        {
          type: 'temperature',
          enabled: true,
          conditions: { temperature: { min: 20 } },
          locations: ['current'],
          severity: 'warning',
          notificationEnabled: true,
          title: 'Extreme Cold Warning',
          description:
            'Temperature is dangerously low at {temperature} in {location}. Dress warmly and limit outdoor exposure.',
        },
        {
          type: 'wind',
          enabled: true,
          conditions: { windSpeed: { threshold: 40 } },
          locations: ['current'],
          severity: 'severe',
          notificationEnabled: true,
          title: 'High Wind Warning',
          description:
            'Dangerous wind speeds of {windSpeed} detected in {location}. Secure outdoor items and avoid driving.',
        },
        {
          type: 'storm',
          enabled: true,
          conditions: {},
          locations: ['current'],
          severity: 'extreme',
          notificationEnabled: true,
          title: 'Severe Weather Alert',
          description:
            'Severe weather conditions detected in {location}. Take immediate shelter and stay indoors.',
        },
      ];

      defaultRules.forEach(rule => this.setAlertRule(rule));
    }
  }

  // ===== Data Persistence =====

  /**
   * Load stored data from localStorage
   */
  private loadStoredData(): void {
    try {
      const alertsData = localStorage.getItem('weatherAlerts');
      if (alertsData) {
        const parsed: _StoredWeatherAlert[] = JSON.parse(alertsData);
        this.alerts = parsed.map(alert => ({
          ...alert,
          startTime: new Date(alert.startTime),
          endTime: alert.endTime ? new Date(alert.endTime) : undefined,
          createdAt: new Date(alert.createdAt),
        }));
      }

      const rulesData = localStorage.getItem('weatherAlertRules');
      if (rulesData) {
        const parsedRules: _StoredAlertRule[] = JSON.parse(rulesData);
        this.alertRules = parsedRules.map(rule => ({
          ...rule,
          createdAt: new Date(rule.createdAt),
        }));
      }

      const preferencesData = localStorage.getItem('weatherAlertPreferences');
      if (preferencesData) {
        this.preferences = {
          ...DEFAULT_ALERT_PREFERENCES,
          ...JSON.parse(preferencesData),
        };
      }

      const countsData = localStorage.getItem('weatherAlertCounts');
      if (countsData) {
        this.alertCounts = new Map(JSON.parse(countsData));
      }
    } catch (error) {
      logger.error('Error loading stored alert data', { error });
    }
  }

  /**
   * Save data to localStorage
   */
  private saveStoredData(): void {
    try {
      localStorage.setItem('weatherAlerts', JSON.stringify(this.alerts));
      localStorage.setItem(
        'weatherAlertRules',
        JSON.stringify(this.alertRules)
      );
      localStorage.setItem(
        'weatherAlertPreferences',
        JSON.stringify(this.preferences)
      );
      localStorage.setItem(
        'weatherAlertCounts',
        JSON.stringify(Array.from(this.alertCounts.entries()))
      );
    } catch (error) {
      logger.error('Error saving alert data', { error });
    }
  }

  /**
   * Clear all stored data (for testing/reset)
   */
  clearAllData(): void {
    this.alerts = [];
    this.alertRules = [];
    this.preferences = { ...DEFAULT_ALERT_PREFERENCES };
    this.alertCounts.clear();

    localStorage.removeItem('weatherAlerts');
    localStorage.removeItem('weatherAlertRules');
    localStorage.removeItem('weatherAlertPreferences');
    localStorage.removeItem('weatherAlertCounts');

    this.setupDefaultAlertRules();
  }
}

// Export singleton instance
export const weatherAlertManager = WeatherAlertManager.getInstance();
