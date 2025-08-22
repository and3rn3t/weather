/**
 * Multi-Sensory Weather Experience Hook
 * React hook for integrating audio, haptic, and accessibility features
 */

import { useCallback, useEffect, useRef } from 'react';
import { accessibilityAudioManager } from './accessibilityAudioManager';
import { logger } from './logger';
import type {
  MultiSensoryConfig,
  WeatherExperienceEvent,
} from './multiSensoryCoordinator';
import { multiSensoryCoordinator } from './multiSensoryCoordinator';

export interface UseMultiSensoryWeatherOptions {
  enableAudio?: boolean;
  enableHaptics?: boolean;
  enableAccessibility?: boolean;
  autoAnnounceWeather?: boolean;
  hapticIntensity?: number;
  audioVolume?: number;
}

export interface MultiSensoryWeatherAPI {
  // Weather experiences
  playWeatherExperience: (
    weatherCondition: string,
    intensity?: number
  ) => Promise<void>;
  announceWeather: (
    condition: string,
    temperature?: number,
    location?: string
  ) => Promise<void>;

  // Interaction feedback
  playInteractionFeedback: (interactionType: string) => Promise<void>;
  announceNavigation: (
    elementId: string,
    includeInstructions?: boolean
  ) => Promise<void>;

  // Alert systems
  playWeatherAlert: (
    level: 'info' | 'warning' | 'severe' | 'emergency',
    message: string
  ) => Promise<void>;
  announceStateChange: (state: string, details?: string) => Promise<void>;

  // Configuration
  updateConfig: (config: Partial<MultiSensoryConfig>) => void;
  enableAccessibility: (enabled: boolean) => void;

  // Status
  getStatus: () => {
    audio: boolean;
    haptic: boolean;
    accessibility: boolean;
    initialized: boolean;
  };

  // Cleanup
  cleanup: () => void;
}

/**
 * Multi-sensory weather experience hook
 */
export function useMultiSensoryWeather(
  options: UseMultiSensoryWeatherOptions = {},
): MultiSensoryWeatherAPI {
  const {
    enableAudio = true,
    enableHaptics = true,
    enableAccessibility = false,
    autoAnnounceWeather = false,
    hapticIntensity = 0.7,
    audioVolume = 0.7,
  } = options;

  const isInitialized = useRef(false);

  // Initialize multi-sensory systems
  useEffect(() => {
    if (isInitialized.current) return;

    const initializeSystems = async () => {
      try {
        // Configure multi-sensory coordinator
        multiSensoryCoordinator.updateConfig({
          audio: {
            enabled: enableAudio,
            masterVolume: audioVolume,
            weatherSoundsEnabled: true,
            interactionSoundsEnabled: true,
            spatialAudioEnabled: true,
          },
          haptic: {
            enabled: enableHaptics,
            intensity: hapticIntensity,
            weatherEnabled: true,
            interactionEnabled: true,
            alertEnabled: true,
            ambientEnabled: false,
          },
          visual: {
            animationsEnabled: true,
            transitionsEnabled: true,
            weatherEffectsEnabled: true,
            accessibilityMode: enableAccessibility,
          },
          accessibility: {
            reduceMotion: false,
            highContrast: false,
            screenReaderMode: enableAccessibility,
            audioDescriptions: enableAccessibility,
          },
        });

        // Configure accessibility audio
        accessibilityAudioManager.updateConfig({
          enabled: enableAccessibility,
          screenReaderMode: enableAccessibility,
          audioDescriptions: autoAnnounceWeather,
          navigationCues: enableAccessibility,
          weatherDescriptions: autoAnnounceWeather,
          volume: audioVolume,
          speechRate: 1.0,
          voiceIndex: 0,
        });

        isInitialized.current = true;
        logger.info('Multi-sensory weather experience initialized');
      } catch (error) {
        logger.warn('Failed to initialize multi-sensory experience:', error);
      }
    };

    initializeSystems();
  }, [
    enableAudio,
    enableHaptics,
    enableAccessibility,
    autoAnnounceWeather,
    hapticIntensity,
    audioVolume,
  ]);

  // Play coordinated weather experience
  const playWeatherExperience = useCallback(
    async (weatherCondition: string, intensity: number = 1.0) => {
      if (!isInitialized.current) return;

      try {
        const event: WeatherExperienceEvent = {
          type: 'weather-change',
          weatherCondition,
          intensity,
          metadata: {
            timestamp: Date.now(),
            source: 'weather-experience',
          },
        };

        await multiSensoryCoordinator.playWeatherExperience(event);
        logger.debug(`Played weather experience for: ${weatherCondition}`);
      } catch (error) {
        logger.warn(
          `Failed to play weather experience for ${weatherCondition}:`,
          error,
        );
      }
    },
    [],
  );

  // Announce weather with accessibility features
  const announceWeather = useCallback(
    async (condition: string, temperature?: number, location?: string) => {
      if (!isInitialized.current || !enableAccessibility) return;

      try {
        await accessibilityAudioManager.announceWeatherCondition(
          condition,
          temperature,
          location,
        );
        logger.debug(`Announced weather: ${condition}`);
      } catch (error) {
        logger.warn(`Failed to announce weather for ${condition}:`, error);
      }
    },
    [enableAccessibility],
  );

  // Play interaction feedback
  const playInteractionFeedback = useCallback(
    async (interactionType: string) => {
      if (!isInitialized.current) return;

      try {
        const event: WeatherExperienceEvent = {
          type: 'interaction',
          interactionType,
          metadata: {
            timestamp: Date.now(),
            source: 'interaction-feedback',
          },
        };

        await multiSensoryCoordinator.playInteractionExperience(event);
        logger.debug(`Played interaction feedback: ${interactionType}`);
      } catch (error) {
        logger.warn(
          `Failed to play interaction feedback for ${interactionType}:`,
          error,
        );
      }
    },
    [],
  );

  // Announce navigation element
  const announceNavigation = useCallback(
    async (elementId: string, includeInstructions: boolean = false) => {
      if (!isInitialized.current || !enableAccessibility) return;

      try {
        await accessibilityAudioManager.announceNavigationElement(
          elementId,
          includeInstructions,
        );
        logger.debug(`Announced navigation: ${elementId}`);
      } catch (error) {
        logger.warn(`Failed to announce navigation for ${elementId}:`, error);
      }
    },
    [enableAccessibility],
  );

  // Play weather alert with coordinated feedback
  const playWeatherAlert = useCallback(
    async (
      level: 'info' | 'warning' | 'severe' | 'emergency',
      message: string,
    ) => {
      if (!isInitialized.current) return;

      try {
        // Play coordinated alert experience
        const event: WeatherExperienceEvent = {
          type: 'alert',
          alertLevel: level,
          metadata: {
            message,
            timestamp: Date.now(),
            source: 'weather-alert',
          },
        };

        await multiSensoryCoordinator.playAlertExperience(event);

        // Also announce via accessibility audio
        if (enableAccessibility) {
          await accessibilityAudioManager.announceWeatherAlert(level, message);
        }

        logger.info(`Played weather alert: ${level} - ${message}`);
      } catch (error) {
        logger.warn(`Failed to play weather alert: ${level}`, error);
      }
    },
    [enableAccessibility],
  );

  // Announce app state changes
  const announceStateChange = useCallback(
    async (state: string, details?: string) => {
      if (!isInitialized.current || !enableAccessibility) return;

      try {
        await accessibilityAudioManager.announceStateChange(state, details);
        logger.debug(`Announced state change: ${state}`);
      } catch (error) {
        logger.warn(`Failed to announce state change: ${state}`, error);
      }
    },
    [enableAccessibility],
  );

  // Update configuration
  const updateConfig = useCallback(
    (config: Partial<MultiSensoryConfig>) => {
      if (!isInitialized.current) return;

      try {
        multiSensoryCoordinator.updateConfig(config);

        // Update accessibility audio if accessibility config changed
        if (config.accessibility || config.audio) {
          accessibilityAudioManager.updateConfig({
            enabled:
              config.accessibility?.audioDescriptions ?? enableAccessibility,
            volume: config.audio?.masterVolume ?? audioVolume,
          });
        }

        logger.debug('Updated multi-sensory configuration');
      } catch (error) {
        logger.warn('Failed to update multi-sensory configuration:', error);
      }
    },
    [enableAccessibility, audioVolume],
  );

  // Enable/disable accessibility features
  const enableAccessibilityFeatures = useCallback((enabled: boolean) => {
    if (!isInitialized.current) return;

    try {
      accessibilityAudioManager.updateConfig({
        enabled,
        screenReaderMode: enabled,
        audioDescriptions: enabled,
        navigationCues: enabled,
        weatherDescriptions: enabled,
      });

      multiSensoryCoordinator.updateConfig({
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          screenReaderMode: enabled,
          audioDescriptions: enabled,
        },
        visual: {
          animationsEnabled: true,
          transitionsEnabled: true,
          weatherEffectsEnabled: true,
          accessibilityMode: enabled,
        },
      });

      logger.info(`Accessibility features ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.warn('Failed to update accessibility settings:', error);
    }
  }, []);

  // Get system status
  const getStatus = useCallback(() => {
    if (!isInitialized.current) {
      return {
        audio: false,
        haptic: false,
        accessibility: false,
        initialized: false,
      };
    }

    try {
      const coordinatorStatus = multiSensoryCoordinator.getStatus();
      const accessibilityStatus = accessibilityAudioManager.getStatus();

      return {
        audio: coordinatorStatus.audio.enabled,
        haptic: coordinatorStatus.haptic.enabled,
        accessibility:
          accessibilityStatus.initialized &&
          accessibilityStatus.speechSupported,
        initialized: coordinatorStatus.initialized,
      };
    } catch (error) {
      logger.warn('Failed to get multi-sensory status:', error);
      return {
        audio: false,
        haptic: false,
        accessibility: false,
        initialized: false,
      };
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (!isInitialized.current) return;

    try {
      multiSensoryCoordinator.stopAllExperiences();
      accessibilityAudioManager.stopSpeaking();
      isInitialized.current = false;
      logger.info('Multi-sensory weather experience cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup multi-sensory experience:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Auto-announce weather changes
  useEffect(() => {
    if (!autoAnnounceWeather || !enableAccessibility) return;

    // This effect would be triggered by weather data changes in the parent component
    // Implementation depends on how weather data is managed in the app
  }, [autoAnnounceWeather, enableAccessibility]);

  return {
    playWeatherExperience,
    announceWeather,
    playInteractionFeedback,
    announceNavigation,
    playWeatherAlert,
    announceStateChange,
    updateConfig,
    enableAccessibility: enableAccessibilityFeatures,
    getStatus,
    cleanup,
  };
}

/**
 * Quick interaction feedback hook for common UI interactions
 */
export function useInteractionFeedback() {
  const { playInteractionFeedback } = useMultiSensoryWeather({
    enableAudio: true,
    enableHaptics: true,
    enableAccessibility: false,
  });

  return {
    onButtonPress: () => playInteractionFeedback('button-press'),
    onSuccess: () => playInteractionFeedback('success'),
    onError: () => playInteractionFeedback('error'),
    onPullToRefresh: () => playInteractionFeedback('pull-to-refresh'),
    onSwipe: () => playInteractionFeedback('swipe-gesture'),
    onLongPress: () => playInteractionFeedback('long-press'),
  };
}

/**
 * Weather announcement hook for accessibility
 */
export function useWeatherAnnouncements() {
  const { announceWeather, announceStateChange, playWeatherAlert } =
    useMultiSensoryWeather({
      enableAudio: false,
      enableHaptics: false,
      enableAccessibility: true,
      autoAnnounceWeather: true,
    });

  return {
    announceWeather,
    announceStateChange,
    playWeatherAlert,
    announceLoading: () => announceStateChange('loading'),
    announceError: () => announceStateChange('error'),
    announceRefresh: () => announceStateChange('refreshed'),
    announceOffline: () => announceStateChange('offline'),
  };
}
