/**
 * Accessibility Audio Cues System
 * Screen reader enhancements and audio accessibility features for weather app
 */

import { logger } from './logger';
import { WeatherAudioManager } from './weatherAudioManager';

export interface AccessibilityAudioConfig {
  enabled: boolean;
  screenReaderMode: boolean;
  audioDescriptions: boolean;
  navigationCues: boolean;
  weatherDescriptions: boolean;
  volume: number; // 0.0 to 1.0
  speechRate: number; // 0.5 to 2.0
  voiceIndex: number; // Index of preferred voice
}

export interface WeatherAudioDescription {
  condition: string;
  shortDescription: string;
  detailedDescription: string;
  pronunciation: string;
  alerts?: string[];
}

export interface NavigationAudioCue {
  element: string;
  description: string;
  instructions: string;
  shortcut?: string;
}

// Weather condition audio descriptions
export const WeatherAudioDescriptions: Record<string, WeatherAudioDescription> =
  {
    clear: {
      condition: 'clear',
      shortDescription: 'Clear skies',
      detailedDescription:
        'Clear blue skies with no clouds. Perfect weather for outdoor activities.',
      pronunciation: 'Clear skies',
      alerts: [],
    },
    'partly-cloudy': {
      condition: 'partly-cloudy',
      shortDescription: 'Partly cloudy',
      detailedDescription:
        'Mix of sun and clouds. Some clouds scattered across the sky with sunny breaks.',
      pronunciation: 'Partly cloudy',
      alerts: [],
    },
    cloudy: {
      condition: 'cloudy',
      shortDescription: 'Cloudy',
      detailedDescription:
        'Overcast skies with thick cloud cover. Limited sunshine expected.',
      pronunciation: 'Cloudy',
      alerts: [],
    },
    'light-rain': {
      condition: 'light-rain',
      shortDescription: 'Light rain',
      detailedDescription:
        'Light rainfall with gentle precipitation. Consider bringing an umbrella.',
      pronunciation: 'Light rain',
      alerts: ['Wet road conditions possible'],
    },
    'heavy-rain': {
      condition: 'heavy-rain',
      shortDescription: 'Heavy rain',
      detailedDescription:
        'Heavy rainfall with significant precipitation. Exercise caution when traveling.',
      pronunciation: 'Heavy rain',
      alerts: [
        'Flooding possible',
        'Reduced visibility',
        'Hazardous driving conditions',
      ],
    },
    thunderstorm: {
      condition: 'thunderstorm',
      shortDescription: 'Thunderstorm',
      detailedDescription:
        'Thunderstorm with lightning and heavy rain. Seek shelter indoors immediately.',
      pronunciation: 'Thunderstorm',
      alerts: ['Lightning danger', 'Severe weather warning', 'Stay indoors'],
    },
    snow: {
      condition: 'snow',
      shortDescription: 'Snow',
      detailedDescription:
        'Snowfall with accumulation possible. Winter driving conditions may apply.',
      pronunciation: 'Snow',
      alerts: ['Slippery conditions', 'Reduced visibility'],
    },
    windy: {
      condition: 'windy',
      shortDescription: 'Windy',
      detailedDescription:
        'Strong winds with gusts possible. Secure loose objects outdoors.',
      pronunciation: 'Windy',
      alerts: ['High wind advisory'],
    },
  };

// Navigation audio cues
export const NavigationAudioCues: Record<string, NavigationAudioCue> = {
  'weather-card': {
    element: 'weather-card',
    description: 'Current weather conditions card',
    instructions: 'Tap to view detailed forecast',
    shortcut: 'Space or Enter key',
  },
  'forecast-list': {
    element: 'forecast-list',
    description: 'Seven day weather forecast',
    instructions: 'Use arrow keys to navigate between days',
    shortcut: 'Arrow keys',
  },
  'search-button': {
    element: 'search-button',
    description: 'Search for weather in different location',
    instructions: 'Tap to open location search',
    shortcut: 'S key',
  },
  'refresh-button': {
    element: 'refresh-button',
    description: 'Refresh current weather data',
    instructions: 'Pull down or tap to refresh',
    shortcut: 'R key',
  },
  'settings-button': {
    element: 'settings-button',
    description: 'Open app settings and preferences',
    instructions: 'Tap to access settings menu',
    shortcut: 'Escape key',
  },
  'theme-toggle': {
    element: 'theme-toggle',
    description: 'Switch between light and dark theme',
    instructions: 'Tap to toggle theme',
    shortcut: 'T key',
  },
};

export class AccessibilityAudioManager {
  private audioManager: WeatherAudioManager;
  private speechSynthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private config: AccessibilityAudioConfig;
  private isInitialized = false;

  constructor() {
    this.audioManager = new WeatherAudioManager();
    this.config = this.getDefaultConfig();
    this.initializeAccessibilityAudio();
  }

  /**
   * Initialize accessibility audio features
   */
  private async initializeAccessibilityAudio(): Promise<void> {
    try {
      // Check for Speech Synthesis API support
      if ('speechSynthesis' in window) {
        this.speechSynthesis = window.speechSynthesis;

        // Load available voices
        await this.loadAvailableVoices();

        // Detect if screen reader is active
        this.detectScreenReader();

        this.isInitialized = true;
        logger.info('Accessibility audio manager initialized');
      } else {
        logger.warn('Speech Synthesis API not supported');
      }
    } catch (error) {
      logger.warn('Failed to initialize accessibility audio:', error);
    }
  }

  /**
   * Load available speech synthesis voices
   */
  private async loadAvailableVoices(): Promise<void> {
    return new Promise(resolve => {
      const loadVoices = () => {
        this.availableVoices = this.speechSynthesis?.getVoices() || [];
        if (this.availableVoices.length > 0) {
          logger.info(
            `Found ${this.availableVoices.length} speech synthesis voices`
          );
          resolve();
        } else {
          // Voices might load asynchronously
          setTimeout(loadVoices, 100);
        }
      };

      if (this.speechSynthesis) {
        this.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
      } else {
        resolve();
      }
    });
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): void {
    try {
      // Check for common screen reader indicators
      const hasScreenReaderLandmarks =
        document.querySelectorAll(
          '[role="main"], [role="navigation"], [aria-live]'
        ).length > 0;
      const hasAriaLabels =
        document.querySelectorAll('[aria-label], [aria-describedby]').length >
        0;

      if (hasScreenReaderLandmarks || hasAriaLabels) {
        this.config.screenReaderMode = true;
        this.config.audioDescriptions = true;
        logger.info('Screen reader detected, enabling audio descriptions');
      }
    } catch (error) {
      logger.warn('Failed to detect screen reader:', error);
    }
  }

  /**
   * Announce weather condition with audio description
   */
  async announceWeatherCondition(
    condition: string,
    temperature?: number,
    location?: string
  ): Promise<void> {
    if (!this.config.enabled || !this.config.weatherDescriptions) return;

    const description = WeatherAudioDescriptions[condition];
    if (!description) return;

    let announcement = '';

    if (location) {
      announcement += `Weather for ${location}. `;
    }

    if (temperature !== undefined) {
      announcement += `Current temperature: ${Math.round(
        temperature
      )} degrees. `;
    }

    announcement += description.detailedDescription;

    if (description.alerts && description.alerts.length > 0) {
      announcement += ` Weather alerts: ${description.alerts.join(', ')}.`;
    }

    await this.speak(announcement, 'weather-announcement');
  }

  /**
   * Announce navigation element
   */
  async announceNavigationElement(
    elementId: string,
    includeinstructions: boolean = false
  ): Promise<void> {
    if (!this.config.enabled || !this.config.navigationCues) return;

    const cue = NavigationAudioCues[elementId];
    if (!cue) return;

    let announcement = cue.description;

    if (includeinstructions) {
      announcement += `. ${cue.instructions}`;
      if (cue.shortcut) {
        announcement += `. Keyboard shortcut: ${cue.shortcut}`;
      }
    }

    await this.speak(announcement, 'navigation-cue');
  }

  /**
   * Announce forecast summary
   */
  async announceForecastSummary(
    forecast: Array<{
      day: string;
      condition: string;
      high: number;
      low: number;
    }>
  ): Promise<void> {
    if (!this.config.enabled || !this.config.weatherDescriptions) return;

    let announcement = 'Seven day weather forecast. ';

    forecast.slice(0, 3).forEach((day, index) => {
      const description = WeatherAudioDescriptions[day.condition];
      const conditionText = description?.shortDescription || day.condition;

      announcement += `${day.day}: ${conditionText}, high ${day.high}, low ${day.low} degrees. `;

      if (index === 0) {
        announcement += 'Tomorrow: ';
      }
    });

    announcement += 'Use arrow keys to navigate full forecast.';

    await this.speak(announcement, 'forecast-summary');
  }

  /**
   * Announce weather alerts
   */
  async announceWeatherAlert(
    alertLevel: 'info' | 'warning' | 'severe' | 'emergency',
    message: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    const urgencyPrefixes = {
      info: 'Weather information',
      warning: 'Weather warning',
      severe: 'Severe weather alert',
      emergency: 'Emergency weather alert',
    };

    const announcement = `${urgencyPrefixes[alertLevel]}. ${message}`;

    // Use higher priority for severe alerts
    const priority =
      alertLevel === 'severe' || alertLevel === 'emergency' ? 'high' : 'normal';

    await this.speak(announcement, 'weather-alert', priority);
  }

  /**
   * Announce app state changes
   */
  async announceStateChange(state: string, details?: string): Promise<void> {
    if (!this.config.enabled || !this.config.navigationCues) return;

    const stateAnnouncements = {
      loading: 'Loading weather data',
      error: 'Error loading weather data',
      offline: 'App is offline, showing cached data',
      refreshed: 'Weather data refreshed',
      'location-changed': 'Location changed',
      'theme-changed': 'Theme changed',
      'settings-opened': 'Settings menu opened',
      'search-opened': 'Location search opened',
    };

    let announcement =
      stateAnnouncements[state as keyof typeof stateAnnouncements] || state;

    if (details) {
      announcement += `. ${details}`;
    }

    await this.speak(announcement, 'state-change');
  }

  /**
   * Speak text using Speech Synthesis API
   */
  private async speak(
    text: string,
    category: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    if (!this.speechSynthesis || !this.isInitialized) return;

    try {
      // Cancel previous speech if high priority
      if (priority === 'high') {
        this.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure speech parameters
      utterance.volume = this.config.volume;
      utterance.rate = this.config.speechRate;

      // Select voice
      if (
        this.availableVoices.length > 0 &&
        this.config.voiceIndex < this.availableVoices.length
      ) {
        utterance.voice = this.availableVoices[this.config.voiceIndex];
      }

      // Add event listeners
      utterance.onstart = () => {
        logger.debug(
          `Started speaking ${category}: ${text.substring(0, 50)}...`
        );
      };

      utterance.onerror = event => {
        logger.warn(`Speech synthesis error for ${category}:`, event.error);
      };

      // Queue or speak immediately based on priority
      if (priority === 'high') {
        this.speechSynthesis.speak(utterance);
      } else {
        // For normal/low priority, check if currently speaking
        if (!this.speechSynthesis.speaking) {
          this.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      logger.warn(`Failed to speak ${category}:`, error);
    }
  }

  /**
   * Stop all speech synthesis
   */
  stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(newConfig: Partial<AccessibilityAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update audio manager volume if changed
    if (newConfig.volume !== undefined) {
      this.audioManager.setMasterVolume(newConfig.volume);
    }
  }

  /**
   * Get available voices for configuration
   */
  getAvailableVoices(): {
    index: number;
    name: string;
    lang: string;
    localService: boolean;
  }[] {
    return this.availableVoices.map((voice, index) => ({
      index,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    }));
  }

  /**
   * Test speech synthesis with sample text
   */
  async testSpeech(): Promise<void> {
    await this.speak(
      'Accessibility audio is working. This is a test of the speech synthesis system.',
      'test',
      'high'
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessibilityAudioConfig {
    return { ...this.config };
  }

  /**
   * Get accessibility status
   */
  getStatus(): {
    initialized: boolean;
    speechSupported: boolean;
    voiceCount: number;
    screenReaderMode: boolean;
    currentlySpeaking: boolean;
  } {
    return {
      initialized: this.isInitialized,
      speechSupported: !!this.speechSynthesis,
      voiceCount: this.availableVoices.length,
      screenReaderMode: this.config.screenReaderMode,
      currentlySpeaking: this.speechSynthesis?.speaking || false,
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AccessibilityAudioConfig {
    return {
      enabled: false, // Disabled by default, user must opt-in
      screenReaderMode: false,
      audioDescriptions: false,
      navigationCues: false,
      weatherDescriptions: false,
      volume: 0.8,
      speechRate: 1.0,
      voiceIndex: 0,
    };
  }

  /**
   * Destroy accessibility audio manager
   */
  destroy(): void {
    this.stopSpeaking();
    this.audioManager.destroy();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const accessibilityAudioManager = new AccessibilityAudioManager();
