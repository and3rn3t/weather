/**
 * Enhanced Haptic Pattern Library
 * Weather-specific vibration patterns for immersive tactile feedback
 */

import { logger } from './logger';

export interface HapticPattern {
  id: string;
  name: string;
  description: string;
  pattern: number[]; // [vibrate, pause, vibrate, pause, ...]
  intensity?: number; // 0.0 to 1.0 (for devices that support it)
  weatherConditions: string[];
  category: 'weather' | 'interaction' | 'alert' | 'ambient';
  duration: number; // Total duration in milliseconds
  repeatable: boolean;
}

export interface HapticConfig {
  enabled: boolean;
  intensity: number; // Global intensity multiplier 0.0 to 1.0
  weatherEnabled: boolean;
  interactionEnabled: boolean;
  alertEnabled: boolean;
  ambientEnabled: boolean;
}

// Weather-specific haptic patterns
export const WeatherHapticPatterns: Record<string, HapticPattern> = {
  lightRain: {
    id: 'light-rain',
    name: 'Light Rain',
    description: 'Gentle, rapid taps simulating light raindrops',
    pattern: [50, 30, 40, 35, 60, 25, 45, 40, 50, 30],
    intensity: 0.3,
    weatherConditions: ['light-rain', 'drizzle', 'light-shower'],
    category: 'weather',
    duration: 450,
    repeatable: true,
  },
  heavyRain: {
    id: 'heavy-rain',
    name: 'Heavy Rain',
    description: 'Strong, continuous vibration for heavy rainfall',
    pattern: [100, 20, 120, 15, 110, 25, 130, 10, 140, 20],
    intensity: 0.6,
    weatherConditions: ['heavy-rain', 'downpour', 'heavy-shower'],
    category: 'weather',
    duration: 650,
    repeatable: true,
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder',
    description: 'Sharp, powerful burst followed by rolling vibration',
    pattern: [200, 100, 300, 200, 150, 150, 100, 100, 80, 80, 60, 60],
    intensity: 0.8,
    weatherConditions: ['thunderstorm', 'lightning', 'severe-thunderstorm'],
    category: 'weather',
    duration: 1200,
    repeatable: false,
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    description: 'Flowing, wave-like vibration pattern',
    pattern: [80, 40, 100, 30, 120, 20, 100, 30, 80, 40, 60, 50],
    intensity: 0.4,
    weatherConditions: ['windy', 'strong-wind', 'gale'],
    category: 'weather',
    duration: 700,
    repeatable: true,
  },
  snow: {
    id: 'snow',
    name: 'Falling Snow',
    description: 'Soft, delicate pulses like snowflakes landing',
    pattern: [30, 80, 25, 90, 35, 70, 20, 100, 40, 60],
    intensity: 0.2,
    weatherConditions: ['snow', 'light-snow', 'heavy-snow', 'blizzard'],
    category: 'weather',
    duration: 550,
    repeatable: true,
  },
  sunshine: {
    id: 'sunshine',
    name: 'Sunshine',
    description: 'Warm, gentle pulse representing sun rays',
    pattern: [150, 300, 100, 200, 80, 150],
    intensity: 0.25,
    weatherConditions: ['clear', 'sunny', 'mostly-sunny'],
    category: 'weather',
    duration: 980,
    repeatable: false,
  },
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy',
    description: 'Soft, rolling vibration like clouds passing',
    pattern: [100, 100, 120, 80, 140, 60, 120, 80, 100, 100],
    intensity: 0.3,
    weatherConditions: ['cloudy', 'overcast', 'partly-cloudy'],
    category: 'weather',
    duration: 900,
    repeatable: true,
  },
};

// Interaction haptic patterns
export const InteractionHapticPatterns: Record<string, HapticPattern> = {
  buttonPress: {
    id: 'button-press',
    name: 'Button Press',
    description: 'Quick, sharp feedback for button interactions',
    pattern: [25],
    intensity: 0.4,
    weatherConditions: [],
    category: 'interaction',
    duration: 25,
    repeatable: false,
  },
  longPress: {
    id: 'long-press',
    name: 'Long Press',
    description: 'Gradual build-up for long press actions',
    pattern: [50, 20, 80, 15, 120],
    intensity: 0.5,
    weatherConditions: [],
    category: 'interaction',
    duration: 285,
    repeatable: false,
  },
  swipeGesture: {
    id: 'swipe-gesture',
    name: 'Swipe Gesture',
    description: 'Directional feedback for swipe actions',
    pattern: [30, 10, 40, 10, 50, 10, 40, 10, 30],
    intensity: 0.3,
    weatherConditions: [],
    category: 'interaction',
    duration: 180,
    repeatable: false,
  },
  pullToRefresh: {
    id: 'pull-to-refresh',
    name: 'Pull to Refresh',
    description: 'Elastic feedback for pull-to-refresh action',
    pattern: [40, 30, 60, 20, 80, 15, 60, 20, 40],
    intensity: 0.4,
    weatherConditions: [],
    category: 'interaction',
    duration: 305,
    repeatable: false,
  },
  success: {
    id: 'success',
    name: 'Success',
    description: 'Positive confirmation pattern',
    pattern: [100, 50, 150, 100, 200],
    intensity: 0.6,
    weatherConditions: [],
    category: 'interaction',
    duration: 600,
    repeatable: false,
  },
  error: {
    id: 'error',
    name: 'Error',
    description: 'Alert pattern for errors',
    pattern: [200, 100, 200, 100, 200],
    intensity: 0.7,
    weatherConditions: [],
    category: 'interaction',
    duration: 800,
    repeatable: false,
  },
};

// Alert haptic patterns
export const AlertHapticPatterns: Record<string, HapticPattern> = {
  weatherAlert: {
    id: 'weather-alert',
    name: 'Weather Alert',
    description: 'Attention-grabbing pattern for weather warnings',
    pattern: [150, 100, 150, 100, 150, 200, 300, 100, 100, 50, 100],
    intensity: 0.8,
    weatherConditions: [],
    category: 'alert',
    duration: 1300,
    repeatable: true,
  },
  severeAlert: {
    id: 'severe-alert',
    name: 'Severe Weather Alert',
    description: 'Urgent pattern for severe weather warnings',
    pattern: [300, 100, 300, 100, 300, 150, 400, 100, 200, 50, 200, 50, 200],
    intensity: 1.0,
    weatherConditions: [],
    category: 'alert',
    duration: 2100,
    repeatable: true,
  },
  emergencyAlert: {
    id: 'emergency-alert',
    name: 'Emergency Alert',
    description: 'Maximum intensity for emergency situations',
    pattern: [
      500, 100, 500, 100, 500, 200, 600, 100, 300, 50, 300, 50, 300, 50, 300,
    ],
    intensity: 1.0,
    weatherConditions: [],
    category: 'alert',
    duration: 3200,
    repeatable: true,
  },
};

// Ambient haptic patterns
export const AmbientHapticPatterns: Record<string, HapticPattern> = {
  heartbeat: {
    id: 'heartbeat',
    name: 'Heartbeat',
    description: 'Subtle, rhythmic pulse for background feedback',
    pattern: [80, 120, 50, 200],
    intensity: 0.15,
    weatherConditions: [],
    category: 'ambient',
    duration: 450,
    repeatable: true,
  },
  breathe: {
    id: 'breathe',
    name: 'Breathing',
    description: 'Calming inhale/exhale pattern',
    pattern: [200, 300, 100, 400, 200, 300],
    intensity: 0.2,
    weatherConditions: [],
    category: 'ambient',
    duration: 1500,
    repeatable: true,
  },
  pulse: {
    id: 'pulse',
    name: 'Gentle Pulse',
    description: 'Soft, regular pulse for notifications',
    pattern: [60, 180, 60, 180],
    intensity: 0.25,
    weatherConditions: [],
    category: 'ambient',
    duration: 480,
    repeatable: true,
  },
};

export class HapticPatternManager {
  private config: HapticConfig = {
    enabled: true,
    intensity: 0.7,
    weatherEnabled: true,
    interactionEnabled: true,
    alertEnabled: true,
    ambientEnabled: false, // Disabled by default to avoid battery drain
  };

  private isSupported = false;
  private activePatterns: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeHapticSupport();
  }

  /**
   * Check for haptic feedback support
   */
  private initializeHapticSupport(): void {
    // Check for Vibration API support
    this.isSupported = 'vibrate' in navigator;

    if (!this.isSupported) {
      logger.info('Haptic feedback not supported on this device');
    }
  }

  /**
   * Play haptic pattern for weather condition
   */
  async playWeatherHaptic(
    weatherCondition: string,
    config?: Partial<HapticConfig>,
  ): Promise<void> {
    if (!this.canPlayHaptic('weather')) return;

    const pattern = this.findPatternForWeather(weatherCondition);
    if (!pattern) return;

    await this.playPattern(pattern, config);
  }

  /**
   * Play interaction haptic feedback
   */
  async playInteractionHaptic(
    interactionId: keyof typeof InteractionHapticPatterns,
    config?: Partial<HapticConfig>,
  ): Promise<void> {
    if (!this.canPlayHaptic('interaction')) return;

    const pattern = InteractionHapticPatterns[interactionId];
    if (!pattern) return;

    await this.playPattern(pattern, config);
  }

  /**
   * Play alert haptic pattern
   */
  async playAlertHaptic(
    alertId: keyof typeof AlertHapticPatterns,
    config?: Partial<HapticConfig>,
  ): Promise<void> {
    if (!this.canPlayHaptic('alert')) return;

    const pattern = AlertHapticPatterns[alertId];
    if (!pattern) return;

    await this.playPattern(pattern, config);
  }

  /**
   * Play ambient haptic pattern
   */
  async playAmbientHaptic(
    ambientId: keyof typeof AmbientHapticPatterns,
    config?: Partial<HapticConfig>,
  ): Promise<void> {
    if (!this.canPlayHaptic('ambient')) return;

    const pattern = AmbientHapticPatterns[ambientId];
    if (!pattern) return;

    await this.playPattern(pattern, config);
  }

  /**
   * Play custom haptic pattern
   */
  async playCustomPattern(
    pattern: number[],
    intensity?: number,
  ): Promise<void> {
    if (!this.isSupported || !this.config.enabled) return;

    try {
      const adjustedPattern = this.adjustPatternIntensity(pattern, intensity);
      navigator.vibrate(adjustedPattern);
    } catch (error) {
      logger.warn('Failed to play custom haptic pattern:', error);
    }
  }

  /**
   * Play haptic pattern with configuration
   */
  private async playPattern(
    pattern: HapticPattern,
    config?: Partial<HapticConfig>,
  ): Promise<void> {
    try {
      const effectiveConfig = { ...this.config, ...config };
      const adjustedPattern = this.adjustPatternIntensity(
        pattern.pattern,
        pattern.intensity
          ? pattern.intensity * effectiveConfig.intensity
          : effectiveConfig.intensity,
      );

      // Stop existing pattern with same ID if running
      this.stopPattern(pattern.id);

      // Play the pattern
      navigator.vibrate(adjustedPattern);

      // Handle repeatable patterns
      if (pattern.repeatable) {
        const timeout = setTimeout(() => {
          this.playPattern(pattern, config);
        }, pattern.duration + 500); // Small gap between repetitions

        this.activePatterns.set(pattern.id, timeout);
      }
    } catch (error) {
      logger.warn(`Failed to play haptic pattern ${pattern.id}:`, error);
    }
  }

  /**
   * Stop specific haptic pattern
   */
  stopPattern(patternId: string): void {
    const timeout = this.activePatterns.get(patternId);
    if (timeout) {
      clearTimeout(timeout);
      this.activePatterns.delete(patternId);
    }
  }

  /**
   * Stop all haptic feedback
   */
  stopAllPatterns(): void {
    // Stop vibration
    if (this.isSupported) {
      navigator.vibrate(0);
    }

    // Clear all timeouts
    this.activePatterns.forEach(timeout => clearTimeout(timeout));
    this.activePatterns.clear();
  }

  /**
   * Adjust pattern intensity based on configuration
   */
  private adjustPatternIntensity(
    pattern: number[],
    intensity?: number,
  ): number[] {
    const effectiveIntensity = intensity || this.config.intensity;

    // Adjust vibration durations, keep pause durations unchanged
    return pattern.map((value, index) => {
      if (index % 2 === 0) {
        // Vibration duration - adjust by intensity
        return Math.round(value * effectiveIntensity);
      } else {
        // Pause duration - keep unchanged
        return value;
      }
    });
  }

  /**
   * Check if haptic feedback can be played for category
   */
  private canPlayHaptic(category: HapticPattern['category']): boolean {
    if (!this.isSupported || !this.config.enabled) return false;

    switch (category) {
      case 'weather':
        return this.config.weatherEnabled;
      case 'interaction':
        return this.config.interactionEnabled;
      case 'alert':
        return this.config.alertEnabled;
      case 'ambient':
        return this.config.ambientEnabled;
      default:
        return false;
    }
  }

  /**
   * Find haptic pattern for weather condition
   */
  private findPatternForWeather(
    weatherCondition: string,
  ): HapticPattern | null {
    return (
      Object.values(WeatherHapticPatterns).find(pattern =>
        pattern.weatherConditions.includes(weatherCondition),
      ) || null
    );
  }

  /**
   * Update haptic configuration
   */
  updateConfig(newConfig: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // If haptics are disabled, stop all active patterns
    if (!this.config.enabled) {
      this.stopAllPatterns();
    }
  }

  /**
   * Get current haptic configuration
   */
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  /**
   * Get haptic support status
   */
  getStatus(): {
    supported: boolean;
    enabled: boolean;
    activePatterns: string[];
    config: HapticConfig;
  } {
    return {
      supported: this.isSupported,
      enabled: this.config.enabled,
      activePatterns: Array.from(this.activePatterns.keys()),
      config: this.getConfig(),
    };
  }

  /**
   * Get all available patterns by category
   */
  getAvailablePatterns(): {
    weather: HapticPattern[];
    interaction: HapticPattern[];
    alert: HapticPattern[];
    ambient: HapticPattern[];
  } {
    return {
      weather: Object.values(WeatherHapticPatterns),
      interaction: Object.values(InteractionHapticPatterns),
      alert: Object.values(AlertHapticPatterns),
      ambient: Object.values(AmbientHapticPatterns),
    };
  }

  /**
   * Test haptic pattern (for settings/preferences)
   */
  async testPattern(patternId: string): Promise<void> {
    const allPatterns = {
      ...WeatherHapticPatterns,
      ...InteractionHapticPatterns,
      ...AlertHapticPatterns,
      ...AmbientHapticPatterns,
    };

    const pattern = allPatterns[patternId];
    if (pattern) {
      // Temporarily enable for testing
      const originalConfig = { ...this.config };
      this.config.enabled = true;

      // Type-safe way to enable category-specific setting
      const categoryKey = `${pattern.category}Enabled` as const;
      if (categoryKey in this.config) {
        (this.config as any)[categoryKey] = true;
      }

      await this.playPattern(pattern);

      // Restore original config
      this.config = originalConfig;
    }
  }

  /**
   * Destroy haptic manager and cleanup
   */
  destroy(): void {
    this.stopAllPatterns();
  }
}

// Export singleton instance
export const hapticManager = new HapticPatternManager();

// Export pattern collections for reference
export const AllHapticPatterns = {
  ...WeatherHapticPatterns,
  ...InteractionHapticPatterns,
  ...AlertHapticPatterns,
  ...AmbientHapticPatterns,
};
