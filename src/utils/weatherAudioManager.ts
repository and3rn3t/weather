/**
 * Weather Audio Library
 * Provides ambient weather sounds and spatial audio feedback for immersive weather experience
 */

import { logger } from './logger';

export interface WeatherAudioConfig {
  volume: number; // 0.0 to 1.0
  loop: boolean;
  fadeInDuration: number; // milliseconds
  fadeOutDuration: number; // milliseconds
  spatialPosition?: { x: number; y: number; z: number };
  enabled: boolean;
}

export interface WeatherSoundTrack {
  id: string;
  name: string;
  url: string;
  weatherConditions: string[];
  defaultConfig: WeatherAudioConfig;
  preload: boolean;
}

// Weather sound library with base64 encoded audio data or URLs
export const WeatherSoundTracks: Record<string, WeatherSoundTrack> = {
  lightRain: {
    id: 'light-rain',
    name: 'Light Rain',
    url: '/audio/weather/light-rain.mp3',
    weatherConditions: ['light-rain', 'drizzle', 'light-shower'],
    defaultConfig: {
      volume: 0.3,
      loop: true,
      fadeInDuration: 2000,
      fadeOutDuration: 3000,
      enabled: true,
    },
    preload: true,
  },
  heavyRain: {
    id: 'heavy-rain',
    name: 'Heavy Rain',
    url: '/audio/weather/heavy-rain.mp3',
    weatherConditions: ['heavy-rain', 'downpour', 'heavy-shower'],
    defaultConfig: {
      volume: 0.5,
      loop: true,
      fadeInDuration: 1500,
      fadeOutDuration: 2000,
      enabled: true,
    },
    preload: true,
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder',
    url: '/audio/weather/thunder.mp3',
    weatherConditions: ['thunderstorm', 'lightning', 'severe-thunderstorm'],
    defaultConfig: {
      volume: 0.4,
      loop: false,
      fadeInDuration: 500,
      fadeOutDuration: 1000,
      spatialPosition: { x: 0, y: 0, z: -10 },
      enabled: true,
    },
    preload: true,
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    url: '/audio/weather/wind.mp3',
    weatherConditions: ['windy', 'strong-wind', 'gale'],
    defaultConfig: {
      volume: 0.25,
      loop: true,
      fadeInDuration: 3000,
      fadeOutDuration: 4000,
      enabled: true,
    },
    preload: true,
  },
  snow: {
    id: 'snow',
    name: 'Falling Snow',
    url: '/audio/weather/snow.mp3',
    weatherConditions: ['snow', 'light-snow', 'heavy-snow', 'blizzard'],
    defaultConfig: {
      volume: 0.2,
      loop: true,
      fadeInDuration: 3000,
      fadeOutDuration: 4000,
      enabled: true,
    },
    preload: false,
  },
};

// Interaction sound effects
export const InteractionSounds: Record<string, WeatherSoundTrack> = {
  buttonPress: {
    id: 'button-press',
    name: 'Button Press',
    url: '/audio/ui/button-press.mp3',
    weatherConditions: [],
    defaultConfig: {
      volume: 0.3,
      loop: false,
      fadeInDuration: 0,
      fadeOutDuration: 100,
      enabled: true,
    },
    preload: true,
  },
  success: {
    id: 'success',
    name: 'Success Chime',
    url: '/audio/ui/success.mp3',
    weatherConditions: [],
    defaultConfig: {
      volume: 0.4,
      loop: false,
      fadeInDuration: 0,
      fadeOutDuration: 200,
      enabled: true,
    },
    preload: true,
  },
  weatherAlert: {
    id: 'weather-alert',
    name: 'Weather Alert',
    url: '/audio/alerts/weather-alert.mp3',
    weatherConditions: [],
    defaultConfig: {
      volume: 0.6,
      loop: false,
      fadeInDuration: 200,
      fadeOutDuration: 500,
      spatialPosition: { x: 0, y: 5, z: 0 },
      enabled: true,
    },
    preload: true,
  },
};

export class WeatherAudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeNodes: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private pannerNodes: Map<string, PannerNode> = new Map();
  private isInitialized = false;
  private masterVolume = 0.7;
  private audioEnabled = true;
  private preloadPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      // Check for Web Audio API support
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        logger.warn('Web Audio API not supported');
        return;
      }

      this.audioContext = new AudioContextClass();

      // Handle browser autoplay policies
      if (this.audioContext.state === 'suspended') {
        // Will be resumed on first user interaction
        document.addEventListener('click', this.resumeAudioContext.bind(this), {
          once: true,
        });
        document.addEventListener(
          'touchstart',
          this.resumeAudioContext.bind(this),
          { once: true }
        );
      }

      this.isInitialized = true;
      await this.preloadEssentialSounds();
    } catch (error) {
      logger.warn('Failed to initialize audio context:', error);
    }
  }

  /**
   * Resume audio context (required for autoplay policy compliance)
   */
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        logger.warn('Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Preload essential sounds for immediate playback
   */
  private async preloadEssentialSounds(): Promise<void> {
    const soundsToPreload = [
      ...Object.values(WeatherSoundTracks).filter(track => track.preload),
      ...Object.values(InteractionSounds).filter(track => track.preload),
    ];

    const preloadPromises = soundsToPreload.map(async track => {
      try {
        await this.loadAudioBuffer(track.id, track.url);
      } catch (error) {
        logger.warn(`Failed to preload audio: ${track.id}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Load audio buffer from URL
   */
  private async loadAudioBuffer(
    id: string,
    url: string
  ): Promise<AudioBuffer | null> {
    const existingBuffer = this.audioBuffers.get(id);
    if (existingBuffer) {
      return existingBuffer;
    }

    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Check if already loading
    if (this.preloadPromises.has(id)) {
      await this.preloadPromises.get(id);
      return this.audioBuffers.get(id) || null;
    }

    const loadPromise = this.fetchAndDecodeAudio(id, url);
    this.preloadPromises.set(id, loadPromise);

    await loadPromise;
    return this.audioBuffers.get(id) || null;
  }

  /**
   * Fetch and decode audio data
   */
  private async fetchAndDecodeAudio(id: string, _url: string): Promise<void> {
    try {
      // For demo purposes, create silent audio buffers
      // In production, these would fetch actual audio files
      if (!this.audioContext) return;

      const buffer = this.audioContext.createBuffer(
        2,
        this.audioContext.sampleRate * 2,
        this.audioContext.sampleRate
      );
      this.audioBuffers.set(id, buffer);
    } catch (error) {
      logger.warn(`Failed to load audio buffer for ${id}:`, error);
    }
  }

  /**
   * Play weather ambient sound
   */
  async playWeatherSound(
    weatherCondition: string,
    config?: Partial<WeatherAudioConfig>
  ): Promise<void> {
    if (!this.audioEnabled || !this.isInitialized) return;

    const track = this.findTrackForWeather(weatherCondition);
    if (!track) return;

    const finalConfig = { ...track.defaultConfig, ...config };
    await this.playSound(track.id, track.url, finalConfig);
  }

  /**
   * Play interaction sound effect
   */
  async playInteractionSound(
    soundId: keyof typeof InteractionSounds,
    config?: Partial<WeatherAudioConfig>
  ): Promise<void> {
    if (!this.audioEnabled || !this.isInitialized) return;

    const track = InteractionSounds[soundId];
    if (!track) return;

    const finalConfig = { ...track.defaultConfig, ...config };
    await this.playSound(track.id, track.url, finalConfig);
  }

  /**
   * Play sound with spatial audio positioning
   */
  private async playSound(
    id: string,
    url: string,
    config: WeatherAudioConfig
  ): Promise<void> {
    try {
      if (!this.audioContext || !config.enabled) return;

      // Stop existing sound if playing
      this.stopSound(id);

      // Load audio buffer
      const buffer = await this.loadAudioBuffer(id, url);
      if (!buffer) return;

      // Create audio nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.loop = config.loop;

      // Setup gain for volume control
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        config.volume * this.masterVolume,
        this.audioContext.currentTime + config.fadeInDuration / 1000
      );

      // Setup spatial audio if position specified
      if (config.spatialPosition) {
        const pannerNode = this.audioContext.createPanner();
        pannerNode.panningModel = 'HRTF';
        pannerNode.positionX.setValueAtTime(
          config.spatialPosition.x,
          this.audioContext.currentTime
        );
        pannerNode.positionY.setValueAtTime(
          config.spatialPosition.y,
          this.audioContext.currentTime
        );
        pannerNode.positionZ.setValueAtTime(
          config.spatialPosition.z,
          this.audioContext.currentTime
        );

        gainNode.connect(pannerNode);
        pannerNode.connect(this.audioContext.destination);
        this.pannerNodes.set(id, pannerNode);
      } else {
        gainNode.connect(this.audioContext.destination);
      }

      source.connect(gainNode);

      // Store references
      this.activeNodes.set(id, source);
      this.gainNodes.set(id, gainNode);

      // Start playback
      source.start();

      // Handle sound completion
      source.onended = () => {
        this.cleanupSound(id);
      };
    } catch (error) {
      logger.warn(`Failed to play sound ${id}:`, error);
    }
  }

  /**
   * Stop specific sound with fade out
   */
  stopSound(id: string, fadeOut: boolean = true): void {
    const source = this.activeNodes.get(id);
    const gainNode = this.gainNodes.get(id);

    if (!source || !gainNode || !this.audioContext) return;

    if (fadeOut) {
      const track = this.findTrackById(id);
      const fadeOutDuration = track?.defaultConfig.fadeOutDuration || 1000;

      gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + fadeOutDuration / 1000
      );

      setTimeout(() => {
        source.stop();
        this.cleanupSound(id);
      }, fadeOutDuration);
    } else {
      source.stop();
      this.cleanupSound(id);
    }
  }

  /**
   * Stop all playing sounds
   */
  stopAllSounds(fadeOut: boolean = true): void {
    Array.from(this.activeNodes.keys()).forEach(id => {
      this.stopSound(id, fadeOut);
    });
  }

  /**
   * Update spatial position for active sound
   */
  updateSpatialPosition(
    id: string,
    position: { x: number; y: number; z: number }
  ): void {
    const pannerNode = this.pannerNodes.get(id);
    if (!pannerNode || !this.audioContext) return;

    pannerNode.positionX.setValueAtTime(
      position.x,
      this.audioContext.currentTime
    );
    pannerNode.positionY.setValueAtTime(
      position.y,
      this.audioContext.currentTime
    );
    pannerNode.positionZ.setValueAtTime(
      position.z,
      this.audioContext.currentTime
    );
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all active gain nodes
    this.gainNodes.forEach((gainNode, id) => {
      const track = this.findTrackById(id);
      if (track && this.audioContext) {
        gainNode.gain.setValueAtTime(
          track.defaultConfig.volume * this.masterVolume,
          this.audioContext.currentTime
        );
      }
    });
  }

  /**
   * Enable or disable audio
   */
  setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    if (!enabled) {
      this.stopAllSounds(true);
    }
  }

  /**
   * Get current audio status
   */
  getAudioStatus(): {
    enabled: boolean;
    initialized: boolean;
    activeSounds: string[];
    masterVolume: number;
  } {
    return {
      enabled: this.audioEnabled,
      initialized: this.isInitialized,
      activeSounds: Array.from(this.activeNodes.keys()),
      masterVolume: this.masterVolume,
    };
  }

  /**
   * Find track for weather condition
   */
  private findTrackForWeather(
    weatherCondition: string
  ): WeatherSoundTrack | null {
    return (
      Object.values(WeatherSoundTracks).find(track =>
        track.weatherConditions.includes(weatherCondition)
      ) || null
    );
  }

  /**
   * Find track by ID
   */
  private findTrackById(id: string): WeatherSoundTrack | null {
    return (
      Object.values({ ...WeatherSoundTracks, ...InteractionSounds }).find(
        track => track.id === id
      ) || null
    );
  }

  /**
   * Cleanup sound references
   */
  private cleanupSound(id: string): void {
    this.activeNodes.delete(id);
    this.gainNodes.delete(id);
    this.pannerNodes.delete(id);
  }

  /**
   * Destroy audio manager and cleanup resources
   */
  destroy(): void {
    this.stopAllSounds(false);

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffers.clear();
    this.preloadPromises.clear();
    this.isInitialized = false;
  }
}
