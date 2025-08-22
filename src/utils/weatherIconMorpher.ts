/**
 * Weather Icon Morphing System
 * Provides smooth transitions between different weather states using spring animations
 */

import { SpringAnimation, SpringPresets } from './springAnimation';

export interface WeatherIconState {
  type: string;
  rotation: number;
  scale: number;
  opacity: number;
  color: string;
  shadow: number;
}

export interface MorphingOptions {
  duration?: number;
  easing?: keyof typeof SpringPresets;
  stagger?: number;
}

// Weather icon configurations for different states
export const WeatherIconConfigs: Record<string, WeatherIconState> = {
  'clear-day': {
    type: 'sun',
    rotation: 0,
    scale: 1,
    opacity: 1,
    color: '#FFD700',
    shadow: 8,
  },
  'clear-night': {
    type: 'moon',
    rotation: 0,
    scale: 0.9,
    opacity: 0.9,
    color: '#E6E6FA',
    shadow: 6,
  },
  'partly-cloudy-day': {
    type: 'cloud-sun',
    rotation: 15,
    scale: 1.1,
    opacity: 1,
    color: '#87CEEB',
    shadow: 10,
  },
  'partly-cloudy-night': {
    type: 'cloud-moon',
    rotation: -10,
    scale: 1.05,
    opacity: 0.95,
    color: '#B0C4DE',
    shadow: 8,
  },
  cloudy: {
    type: 'cloud',
    rotation: 0,
    scale: 1.2,
    opacity: 0.9,
    color: '#D3D3D3',
    shadow: 12,
  },
  rain: {
    type: 'rain',
    rotation: 5,
    scale: 1.1,
    opacity: 1,
    color: '#4682B4',
    shadow: 15,
  },
  snow: {
    type: 'snow',
    rotation: -5,
    scale: 1.15,
    opacity: 0.95,
    color: '#F0F8FF',
    shadow: 10,
  },
  thunderstorm: {
    type: 'lightning',
    rotation: 10,
    scale: 1.3,
    opacity: 1,
    color: '#FFD700',
    shadow: 20,
  },
  fog: {
    type: 'mist',
    rotation: 0,
    scale: 1.1,
    opacity: 0.7,
    color: '#F5F5DC',
    shadow: 5,
  },
};

export class WeatherIconMorpher {
  private element: HTMLElement;
  private currentState: WeatherIconState;
  private animations: Map<string, SpringAnimation> = new Map();
  private isTransitioning = false;

  constructor(element: HTMLElement, initialWeatherType: string = 'clear-day') {
    this.element = element;
    this.currentState = { ...WeatherIconConfigs[initialWeatherType] };
    this.initializeAnimations();
    this.applyState(this.currentState, true);
  }

  /**
   * Initialize spring animations for each property
   */
  private initializeAnimations(): void {
    this.animations.set('rotation', new SpringAnimation(0));
    this.animations.set('scale', new SpringAnimation(1));
    this.animations.set('opacity', new SpringAnimation(1));
    this.animations.set('shadow', new SpringAnimation(0));
  }

  /**
   * Morph to a new weather state with smooth transitions
   */
  async morphTo(
    weatherType: string,
    options: MorphingOptions = {},
  ): Promise<void> {
    if (this.isTransitioning) {
      // Stop current transition
      this.stopAllAnimations();
    }

    const targetState = WeatherIconConfigs[weatherType];
    if (!targetState) {
      // Silent fallback for unknown weather types
      return;
    }

    this.isTransitioning = true;
    const springConfig = SpringPresets[options.easing || 'gentle'];
    const stagger = options.stagger || 0;

    try {
      // Start all property animations with optional staggering
      const animationPromises = [
        this.animateProperty('rotation', targetState.rotation, springConfig, 0),
        this.animateProperty(
          'scale',
          targetState.scale,
          springConfig,
          stagger * 1,
        ),
        this.animateProperty(
          'opacity',
          targetState.opacity,
          springConfig,
          stagger * 2,
        ),
        this.animateProperty(
          'shadow',
          targetState.shadow,
          springConfig,
          stagger * 3,
        ),
        this.animateColor(targetState.color, springConfig, stagger * 4),
      ];

      // Update icon type immediately or with delay
      if (targetState.type !== this.currentState.type) {
        if (stagger > 0) {
          setTimeout(() => this.updateIconType(targetState.type), stagger * 2);
        } else {
          this.updateIconType(targetState.type);
        }
      }

      await Promise.all(animationPromises);
      this.currentState = { ...targetState };
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Animate a specific property
   */
  private animateProperty(
    property: string,
    targetValue: number,
    springConfig: (typeof SpringPresets)[keyof typeof SpringPresets],
    delay: number = 0,
  ): Promise<void> {
    return new Promise(resolve => {
      const animation = this.animations.get(property);
      if (!animation) {
        resolve();
        return;
      }

      const startAnimation = () => {
        animation.animate({
          from: animation.getValue(),
          to: targetValue,
          config: springConfig,
          onUpdate: value => this.updateElementProperty(property, value),
          onComplete: resolve,
        });
      };

      if (delay > 0) {
        setTimeout(startAnimation, delay);
      } else {
        startAnimation();
      }
    });
  }

  /**
   * Animate color transition (simplified - could be enhanced with color interpolation)
   */
  private animateColor(
    targetColor: string,
    _springConfig: (typeof SpringPresets)[keyof typeof SpringPresets],
    delay: number = 0,
  ): Promise<void> {
    return new Promise(resolve => {
      const startColorAnimation = () => {
        // For simplicity, we'll do an immediate color change
        // In a full implementation, this would interpolate between colors
        this.element.style.color = targetColor;
        this.element.style.filter = `drop-shadow(0 0 10px ${targetColor}40)`;
        resolve();
      };

      if (delay > 0) {
        setTimeout(startColorAnimation, delay);
      } else {
        startColorAnimation();
      }
    });
  }

  /**
   * Update icon type (e.g., change SVG or icon class)
   */
  private updateIconType(iconType: string): void {
    // This would update the actual icon representation
    // Implementation depends on how icons are rendered (SVG, icon font, etc.)
    this.element.setAttribute('data-icon-type', iconType);

    // Example: If using CSS classes for icons
    this.element.className = this.element.className.replace(
      /weather-icon-\w+/,
      `weather-icon-${iconType}`,
    );

    // Example: If using data attributes for icon selection
    this.element.setAttribute('data-weather-icon', iconType);
  }

  /**
   * Update element property based on animation value
   */
  private updateElementProperty(property: string, value: number): void {
    const currentRotation = this.animations.get('rotation')?.getValue() || 0;
    const currentScale = this.animations.get('scale')?.getValue() || 1;

    switch (property) {
      case 'rotation':
      case 'scale':
        this.element.style.transform = `rotate(${currentRotation}deg) scale(${currentScale})`;
        break;
      case 'opacity':
        this.element.style.opacity = value.toString();
        break;
      case 'shadow':
        this.element.style.filter = `drop-shadow(0 0 ${value}px currentColor)`;
        break;
    }
  }

  /**
   * Apply state immediately without animation
   */
  private applyState(
    state: WeatherIconState,
    immediate: boolean = false,
  ): void {
    if (immediate) {
      this.element.style.transform = `rotate(${state.rotation}deg) scale(${state.scale})`;
      this.element.style.opacity = state.opacity.toString();
      this.element.style.color = state.color;
      this.element.style.filter = `drop-shadow(0 0 ${state.shadow}px currentColor)`;
      this.updateIconType(state.type);
    }
  }

  /**
   * Stop all running animations
   */
  private stopAllAnimations(): void {
    this.animations.forEach(animation => animation.stop());
    this.isTransitioning = false;
  }

  /**
   * Get current weather type
   */
  getCurrentWeatherType(): string {
    return this.currentState.type;
  }

  /**
   * Check if currently transitioning
   */
  isTransitioningState(): boolean {
    return this.isTransitioning;
  }

  /**
   * Add hover effect with spring animation
   */
  addHoverEffect(): void {
    let isHovered = false;

    const onMouseEnter = () => {
      if (isHovered || this.isTransitioning) return;
      isHovered = true;

      this.animations.get('scale')?.animate({
        from: this.animations.get('scale')?.getValue() || 1,
        to: (this.currentState.scale || 1) * 1.1,
        config: SpringPresets.wobbly,
        onUpdate: value => this.updateElementProperty('scale', value),
      });
    };

    const onMouseLeave = () => {
      if (!isHovered || this.isTransitioning) return;
      isHovered = false;

      this.animations.get('scale')?.animate({
        from: this.animations.get('scale')?.getValue() || 1,
        to: this.currentState.scale || 1,
        config: SpringPresets.gentle,
        onUpdate: value => this.updateElementProperty('scale', value),
      });
    };

    this.element.addEventListener('mouseenter', onMouseEnter);
    this.element.addEventListener('mouseleave', onMouseLeave);
  }

  /**
   * Add click effect with spring animation
   */
  addClickEffect(): void {
    const onClick = () => {
      if (this.isTransitioning) return;

      const scaleAnimation = this.animations.get('scale');
      if (!scaleAnimation) return;

      const originalScale = this.currentState.scale || 1;

      // Press down
      scaleAnimation
        .animate({
          from: scaleAnimation.getValue(),
          to: originalScale * 0.9,
          config: SpringPresets.stiff,
          onUpdate: value => this.updateElementProperty('scale', value),
        })
        .then(() => {
          // Spring back
          scaleAnimation.animate({
            from: scaleAnimation.getValue(),
            to: originalScale,
            config: SpringPresets.bounce,
            onUpdate: value => this.updateElementProperty('scale', value),
          });
        });
    };

    this.element.addEventListener('click', onClick);
  }

  /**
   * Cleanup event listeners and animations
   */
  destroy(): void {
    this.stopAllAnimations();
    // Remove event listeners (would need references to remove properly)
    // In a real implementation, you'd store listener references
  }
}

/**
 * React hook for weather icon morphing
 */
export const useWeatherIconMorpher = (
  elementRef: React.RefObject<HTMLElement>,
  initialWeatherType: string = 'clear-day',
) => {
  const [morpher, setMorpher] = useState<WeatherIconMorpher | null>(null);
  const [currentWeatherType, setCurrentWeatherType] =
    useState(initialWeatherType);

  useEffect(() => {
    if (elementRef.current && !morpher) {
      const newMorpher = new WeatherIconMorpher(
        elementRef.current,
        initialWeatherType,
      );
      newMorpher.addHoverEffect();
      newMorpher.addClickEffect();
      setMorpher(newMorpher);
    }

    return () => {
      morpher?.destroy();
    };
  }, [elementRef, initialWeatherType, morpher]);

  const morphTo = useCallback(
    async (weatherType: string, options?: MorphingOptions) => {
      if (morpher && weatherType !== currentWeatherType) {
        await morpher.morphTo(weatherType, options);
        setCurrentWeatherType(weatherType);
      }
    },
    [morpher, currentWeatherType],
  );

  return {
    morphTo,
    currentWeatherType,
    isTransitioning: morpher?.isTransitioningState() || false,
  };
};

// React imports
import { useCallback, useEffect, useState } from 'react';
