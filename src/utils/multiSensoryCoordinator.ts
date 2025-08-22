/**
 * Multi-Sensory Weather Experience Coordinator
 * Integrates audio, haptic, and visual feedback for immersive weather interface
 */

import { HapticPatternManager, hapticManager } from './hapticPatternLibrary';
import { logger } from './logger';
import { WeatherAudioManager } from './weatherAudioManager';

export interface MultiSensoryConfig {
  audio: {
    enabled: boolean;
    masterVolume: number;
    weatherSoundsEnabled: boolean;
    interactionSoundsEnabled: boolean;
    spatialAudioEnabled: boolean;
  };
  haptic: {
    enabled: boolean;
    intensity: number;
    weatherEnabled: boolean;
    interactionEnabled: boolean;
    alertEnabled: boolean;
    ambientEnabled: boolean;
  };
  visual: {
    animationsEnabled: boolean;
    transitionsEnabled: boolean;
    weatherEffectsEnabled: boolean;
    accessibilityMode: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    screenReaderMode: boolean;
    audioDescriptions: boolean;
  };
}

export interface WeatherExperienceEvent {
  type: 'weather-change' | 'interaction' | 'alert' | 'ambient';
  weatherCondition?: string;
  interactionType?: string;
  alertLevel?: 'info' | 'warning' | 'severe' | 'emergency';
  intensity?: number; // 0.0 to 1.0
  duration?: number; // milliseconds
  spatial?: { x: number; y: number; z: number };
  metadata?: Record<string, unknown>;
}

export interface SensoryFeedbackPlan {
  audio?: {
    soundId: string;
    volume?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    spatial?: { x: number; y: number; z: number };
  };
  haptic?: {
    patternId: string;
    intensity?: number;
    repeat?: boolean;
    delay?: number;
  };
  visual?: {
    animation: string;
    duration: number;
    effects: string[];
  };
  timing: {
    sequence:
      | 'simultaneous'
      | 'audio-first'
      | 'haptic-first'
      | 'visual-first'
      | 'cascading';
    delays: number[]; // milliseconds between each sensory activation
  };
}

// Pre-defined sensory experience mappings
export const WeatherExperienceMappings: Record<string, SensoryFeedbackPlan> = {
  'light-rain': {
    audio: {
      soundId: 'light-rain',
      volume: 0.3,
      loop: true,
      fadeIn: 2000,
      fadeOut: 3000,
    },
    haptic: {
      patternId: 'light-rain',
      intensity: 0.3,
      repeat: true,
      delay: 500,
    },
    visual: {
      animation: 'raindrops',
      duration: 2000,
      effects: ['gentle-blur', 'water-ripples'],
    },
    timing: {
      sequence: 'audio-first',
      delays: [0, 300, 600],
    },
  },
  'heavy-rain': {
    audio: {
      soundId: 'heavy-rain',
      volume: 0.5,
      loop: true,
      fadeIn: 1500,
      fadeOut: 2000,
    },
    haptic: {
      patternId: 'heavy-rain',
      intensity: 0.6,
      repeat: true,
      delay: 200,
    },
    visual: {
      animation: 'heavy-rain',
      duration: 1500,
      effects: ['intense-blur', 'rain-streaks', 'water-distortion'],
    },
    timing: {
      sequence: 'simultaneous',
      delays: [0, 0, 100],
    },
  },
  thunderstorm: {
    audio: {
      soundId: 'thunder',
      volume: 0.7,
      loop: false,
      fadeIn: 500,
      spatial: { x: 0, y: 0, z: -10 },
    },
    haptic: {
      patternId: 'thunder',
      intensity: 0.8,
      repeat: false,
      delay: 100,
    },
    visual: {
      animation: 'lightning-flash',
      duration: 1200,
      effects: ['screen-flash', 'shadow-flicker', 'electrical-glow'],
    },
    timing: {
      sequence: 'visual-first',
      delays: [0, 200, 300],
    },
  },
  snow: {
    audio: {
      soundId: 'snow',
      volume: 0.2,
      loop: true,
      fadeIn: 3000,
      fadeOut: 4000,
    },
    haptic: {
      patternId: 'snow',
      intensity: 0.2,
      repeat: true,
      delay: 1000,
    },
    visual: {
      animation: 'falling-snow',
      duration: 3000,
      effects: ['soft-particles', 'crystalline-sparkle'],
    },
    timing: {
      sequence: 'cascading',
      delays: [0, 800, 1500],
    },
  },
  'clear-sunny': {
    audio: {
      soundId: 'ocean', // Ambient background
      volume: 0.1,
      loop: true,
      fadeIn: 5000,
    },
    haptic: {
      patternId: 'sunshine',
      intensity: 0.25,
      repeat: false,
      delay: 0,
    },
    visual: {
      animation: 'sun-rays',
      duration: 2000,
      effects: ['warm-glow', 'lens-flare', 'golden-tint'],
    },
    timing: {
      sequence: 'audio-first',
      delays: [0, 1000, 500],
    },
  },
  windy: {
    audio: {
      soundId: 'wind',
      volume: 0.4,
      loop: true,
      fadeIn: 3000,
      fadeOut: 4000,
    },
    haptic: {
      patternId: 'wind',
      intensity: 0.4,
      repeat: true,
      delay: 500,
    },
    visual: {
      animation: 'wind-sway',
      duration: 3000,
      effects: ['leaf-scatter', 'wave-motion'],
    },
    timing: {
      sequence: 'simultaneous',
      delays: [0, 200, 400],
    },
  },
};

// Interaction experience mappings
export const InteractionExperienceMappings: Record<
  string,
  SensoryFeedbackPlan
> = {
  'button-press': {
    audio: {
      soundId: 'button-press',
      volume: 0.3,
    },
    haptic: {
      patternId: 'button-press',
      intensity: 0.4,
    },
    visual: {
      animation: 'button-ripple',
      duration: 200,
      effects: ['scale-bounce'],
    },
    timing: {
      sequence: 'simultaneous',
      delays: [0, 0, 0],
    },
  },
  'pull-to-refresh': {
    audio: {
      soundId: 'success',
      volume: 0.4,
      fadeIn: 0,
      fadeOut: 200,
    },
    haptic: {
      patternId: 'pull-to-refresh',
      intensity: 0.4,
    },
    visual: {
      animation: 'refresh-spin',
      duration: 800,
      effects: ['elastic-bounce', 'glow-pulse'],
    },
    timing: {
      sequence: 'haptic-first',
      delays: [100, 0, 50],
    },
  },
  success: {
    audio: {
      soundId: 'success',
      volume: 0.4,
    },
    haptic: {
      patternId: 'success',
      intensity: 0.6,
    },
    visual: {
      animation: 'success-checkmark',
      duration: 600,
      effects: ['green-glow', 'scale-celebration'],
    },
    timing: {
      sequence: 'simultaneous',
      delays: [0, 50, 0],
    },
  },
  error: {
    audio: {
      soundId: 'error',
      volume: 0.5,
    },
    haptic: {
      patternId: 'error',
      intensity: 0.7,
    },
    visual: {
      animation: 'error-shake',
      duration: 400,
      effects: ['red-flash', 'warning-pulse'],
    },
    timing: {
      sequence: 'simultaneous',
      delays: [0, 0, 0],
    },
  },
};

export class MultiSensoryExperienceCoordinator {
  private audioManager: WeatherAudioManager;
  private hapticManager: HapticPatternManager;
  private config: MultiSensoryConfig;
  private isInitialized = false;
  private activeExperiences: Map<string, NodeJS.Timeout[]> = new Map();

  constructor() {
    this.audioManager = new WeatherAudioManager();
    this.hapticManager = hapticManager;

    this.config = this.getDefaultConfig();
    this.initializeCoordinator();
  }

  /**
   * Initialize the multi-sensory coordinator
   */
  private async initializeCoordinator(): Promise<void> {
    try {
      // Initialize subsystems
      await this.audioManager.setMasterVolume(this.config.audio.masterVolume);
      await this.audioManager.setAudioEnabled(this.config.audio.enabled);

      this.hapticManager.updateConfig({
        enabled: this.config.haptic.enabled,
        intensity: this.config.haptic.intensity,
        weatherEnabled: this.config.haptic.weatherEnabled,
        interactionEnabled: this.config.haptic.interactionEnabled,
        alertEnabled: this.config.haptic.alertEnabled,
        ambientEnabled: this.config.haptic.ambientEnabled,
      });

      // Check for user accessibility preferences
      this.detectAccessibilityPreferences();

      this.isInitialized = true;
      logger.info('Multi-sensory experience coordinator initialized');
    } catch (error) {
      logger.warn('Failed to initialize multi-sensory coordinator:', error);
    }
  }

  /**
   * Play coordinated multi-sensory experience for weather event
   */
  async playWeatherExperience(event: WeatherExperienceEvent): Promise<void> {
    if (!this.isInitialized || !event.weatherCondition) return;

    const plan = WeatherExperienceMappings[event.weatherCondition];
    if (!plan) {
      logger.warn(
        `No sensory plan found for weather condition: ${event.weatherCondition}`
      );
      return;
    }

    await this.executeSensoryPlan(event.weatherCondition, plan, event);
  }

  /**
   * Play coordinated multi-sensory experience for interaction
   */
  async playInteractionExperience(
    event: WeatherExperienceEvent
  ): Promise<void> {
    if (!this.isInitialized || !event.interactionType) return;

    const plan = InteractionExperienceMappings[event.interactionType];
    if (!plan) {
      logger.warn(
        `No sensory plan found for interaction: ${event.interactionType}`
      );
      return;
    }

    await this.executeSensoryPlan(event.interactionType, plan, event);
  }

  /**
   * Play coordinated multi-sensory experience for alert
   */
  async playAlertExperience(event: WeatherExperienceEvent): Promise<void> {
    if (!this.isInitialized || !event.alertLevel) return;

    // Create dynamic alert plan based on severity
    const plan = this.createAlertPlan(event.alertLevel);
    await this.executeSensoryPlan(`alert-${event.alertLevel}`, plan, event);
  }

  /**
   * Execute a complete sensory feedback plan
   */
  private async executeSensoryPlan(
    experienceId: string,
    plan: SensoryFeedbackPlan,
    event: WeatherExperienceEvent
  ): Promise<void> {
    try {
      // Stop any existing experience with the same ID
      this.stopExperience(experienceId);

      const timeouts: NodeJS.Timeout[] = [];

      // Execute based on timing sequence
      switch (plan.timing.sequence) {
        case 'simultaneous':
          await this.executeSensoryComponents(plan, event, timeouts, [0, 0, 0]);
          break;
        case 'audio-first':
          await this.executeSensoryComponents(
            plan,
            event,
            timeouts,
            plan.timing.delays
          );
          break;
        case 'haptic-first':
          await this.executeSensoryComponents(plan, event, timeouts, [
            plan.timing.delays[1],
            0,
            plan.timing.delays[2],
          ]);
          break;
        case 'visual-first':
          await this.executeSensoryComponents(plan, event, timeouts, [
            plan.timing.delays[2],
            plan.timing.delays[1],
            0,
          ]);
          break;
        case 'cascading':
          await this.executeSensoryComponents(
            plan,
            event,
            timeouts,
            plan.timing.delays
          );
          break;
      }

      // Store timeouts for cleanup
      this.activeExperiences.set(experienceId, timeouts);
    } catch (error) {
      logger.warn(`Failed to execute sensory plan for ${experienceId}:`, error);
    }
  }

  /**
   * Execute individual sensory components with timing
   */
  private async executeSensoryComponents(
    plan: SensoryFeedbackPlan,
    event: WeatherExperienceEvent,
    timeouts: NodeJS.Timeout[],
    delays: number[]
  ): Promise<void> {
    // Audio component
    if (plan.audio && this.config.audio.enabled) {
      const audioTimeout = setTimeout(async () => {
        try {
          const audioConfig = {
            volume: plan.audio?.volume || 0.5,
            loop: plan.audio?.loop || false,
            fadeInDuration: plan.audio?.fadeIn || 0,
            fadeOutDuration: plan.audio?.fadeOut || 1000,
            spatialPosition: plan.audio?.spatial,
            enabled: true,
          };

          if (event.weatherCondition) {
            await this.audioManager.playWeatherSound(
              event.weatherCondition,
              audioConfig
            );
          } else if (event.interactionType && plan.audio?.soundId) {
            await this.audioManager.playInteractionSound(
              plan.audio.soundId as never,
              audioConfig
            );
          }
        } catch (error) {
          logger.warn('Failed to play audio component:', error);
        }
      }, delays[0]);
      timeouts.push(audioTimeout);
    }

    // Haptic component
    if (plan.haptic && this.config.haptic.enabled) {
      const hapticTimeout = setTimeout(async () => {
        try {
          const hapticConfig = {
            enabled: true,
            intensity:
              (plan.haptic?.intensity || 0.5) * this.config.haptic.intensity,
            weatherEnabled: this.config.haptic.weatherEnabled,
            interactionEnabled: this.config.haptic.interactionEnabled,
            alertEnabled: this.config.haptic.alertEnabled,
            ambientEnabled: this.config.haptic.ambientEnabled,
          };

          if (event.weatherCondition) {
            await this.hapticManager.playWeatherHaptic(
              event.weatherCondition,
              hapticConfig
            );
          } else if (event.interactionType && plan.haptic?.patternId) {
            await this.hapticManager.playInteractionHaptic(
              plan.haptic.patternId as never,
              hapticConfig
            );
          }
        } catch (error) {
          logger.warn('Failed to play haptic component:', error);
        }
      }, delays[1]);
      timeouts.push(hapticTimeout);
    }

    // Visual component (placeholder for future visual effects integration)
    if (plan.visual && this.config.visual.animationsEnabled) {
      const visualTimeout = setTimeout(() => {
        try {
          // Future: Integrate with visual effects system
          if (plan.visual?.animation) {
            logger.info(`Playing visual animation: ${plan.visual.animation}`);
          }
        } catch (error) {
          logger.warn('Failed to play visual component:', error);
        }
      }, delays[2]);
      timeouts.push(visualTimeout);
    }
  }

  /**
   * Create dynamic alert plan based on severity
   */
  private createAlertPlan(
    alertLevel: 'info' | 'warning' | 'severe' | 'emergency'
  ): SensoryFeedbackPlan {
    const baseIntensity = {
      info: 0.3,
      warning: 0.6,
      severe: 0.8,
      emergency: 1.0,
    }[alertLevel];

    // Determine haptic pattern based on alert level
    let hapticPatternId: string;
    if (alertLevel === 'emergency') {
      hapticPatternId = 'emergency-alert';
    } else if (alertLevel === 'severe') {
      hapticPatternId = 'severe-alert';
    } else {
      hapticPatternId = 'weather-alert';
    }

    return {
      audio: {
        soundId: alertLevel === 'emergency' ? 'severe-alert' : 'weather-alert',
        volume: baseIntensity * 0.8,
        loop: alertLevel === 'severe' || alertLevel === 'emergency',
        fadeIn: 200,
        fadeOut: 500,
        spatial: { x: 0, y: 5, z: 0 },
      },
      haptic: {
        patternId: hapticPatternId,
        intensity: baseIntensity,
        repeat: alertLevel === 'severe' || alertLevel === 'emergency',
      },
      visual: {
        animation: `alert-${alertLevel}`,
        duration: alertLevel === 'emergency' ? 3200 : 1300,
        effects: ['attention-flash', 'urgent-glow'],
      },
      timing: {
        sequence: 'simultaneous',
        delays: [0, 0, 0],
      },
    };
  }

  /**
   * Stop specific experience
   */
  stopExperience(experienceId: string): void {
    const timeouts = this.activeExperiences.get(experienceId);
    if (timeouts) {
      timeouts.forEach(timeout => clearTimeout(timeout));
      this.activeExperiences.delete(experienceId);
    }

    // Stop related audio and haptic feedback
    this.audioManager.stopSound(experienceId);
    this.hapticManager.stopPattern(experienceId);
  }

  /**
   * Stop all active experiences
   */
  stopAllExperiences(): void {
    this.activeExperiences.forEach((timeouts, experienceId) => {
      this.stopExperience(experienceId);
    });

    this.audioManager.stopAllSounds();
    this.hapticManager.stopAllPatterns();
  }

  /**
   * Update multi-sensory configuration
   */
  updateConfig(newConfig: Partial<MultiSensoryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update subsystem configurations
    if (newConfig.audio) {
      this.audioManager.setMasterVolume(this.config.audio.masterVolume);
      this.audioManager.setAudioEnabled(this.config.audio.enabled);
    }

    if (newConfig.haptic) {
      this.hapticManager.updateConfig({
        enabled: this.config.haptic.enabled,
        intensity: this.config.haptic.intensity,
        weatherEnabled: this.config.haptic.weatherEnabled,
        interactionEnabled: this.config.haptic.interactionEnabled,
        alertEnabled: this.config.haptic.alertEnabled,
        ambientEnabled: this.config.haptic.ambientEnabled,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MultiSensoryConfig {
    return { ...this.config };
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    audio: ReturnType<WeatherAudioManager['getAudioStatus']>;
    haptic: ReturnType<HapticPatternManager['getStatus']>;
    activeExperiences: string[];
  } {
    return {
      initialized: this.isInitialized,
      audio: this.audioManager.getAudioStatus(),
      haptic: this.hapticManager.getStatus(),
      activeExperiences: Array.from(this.activeExperiences.keys()),
    };
  }

  /**
   * Detect user accessibility preferences
   */
  private detectAccessibilityPreferences(): void {
    try {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (prefersReducedMotion) {
        this.config.visual.animationsEnabled = false;
        this.config.accessibility.reduceMotion = true;
      }

      // Check for high contrast preference
      const prefersHighContrast = window.matchMedia(
        '(prefers-contrast: high)'
      ).matches;
      if (prefersHighContrast) {
        this.config.accessibility.highContrast = true;
      }

      logger.info('Accessibility preferences detected and applied');
    } catch (error) {
      logger.warn('Failed to detect accessibility preferences:', error);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MultiSensoryConfig {
    return {
      audio: {
        enabled: true,
        masterVolume: 0.7,
        weatherSoundsEnabled: true,
        interactionSoundsEnabled: true,
        spatialAudioEnabled: true,
      },
      haptic: {
        enabled: true,
        intensity: 0.7,
        weatherEnabled: true,
        interactionEnabled: true,
        alertEnabled: true,
        ambientEnabled: false,
      },
      visual: {
        animationsEnabled: true,
        transitionsEnabled: true,
        weatherEffectsEnabled: true,
        accessibilityMode: false,
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        screenReaderMode: false,
        audioDescriptions: false,
      },
    };
  }

  /**
   * Destroy coordinator and cleanup resources
   */
  destroy(): void {
    this.stopAllExperiences();
    this.audioManager.destroy();
    this.hapticManager.destroy();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const multiSensoryCoordinator = new MultiSensoryExperienceCoordinator();
