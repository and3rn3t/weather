/**
 * Spring Physics Animation Framework
 * Provides natural, physics-based animations for iOS26 UI components
 */

export interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
  velocity: number;
  precision: number;
}

export interface AnimationState {
  position: number;
  velocity: number;
  target: number;
  isAnimating: boolean;
}

export interface SpringAnimationOptions {
  from: number;
  to: number;
  config?: Partial<SpringConfig>;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
  immediate?: boolean;
}

// Pre-defined spring configurations for different animation types
export const SpringPresets = {
  // Gentle spring for subtle UI transitions
  gentle: {
    tension: 120,
    friction: 14,
    mass: 1,
    velocity: 0,
    precision: 0.01,
  },

  // Wobbly spring for playful interactions
  wobbly: {
    tension: 180,
    friction: 12,
    mass: 1,
    velocity: 0,
    precision: 0.01,
  },

  // Stiff spring for quick, responsive animations
  stiff: {
    tension: 210,
    friction: 20,
    mass: 1,
    velocity: 0,
    precision: 0.01,
  },

  // Slow spring for dramatic reveals
  slow: {
    tension: 280,
    friction: 60,
    mass: 1,
    velocity: 0,
    precision: 0.01,
  },

  // Bounce spring for attention-grabbing effects
  bounce: {
    tension: 300,
    friction: 8,
    mass: 1,
    velocity: 0,
    precision: 0.01,
  },
} as const;

export class SpringAnimation {
  private state: AnimationState;
  private config: SpringConfig;
  private rafId: number | null = null;
  private onUpdate?: (value: number) => void;
  private onComplete?: () => void;

  constructor(initialValue: number = 0) {
    this.state = {
      position: initialValue,
      velocity: 0,
      target: initialValue,
      isAnimating: false,
    };
    this.config = SpringPresets.gentle;
  }

  /**
   * Start spring animation to target value
   */
  animate(options: SpringAnimationOptions): Promise<void> {
    return new Promise(resolve => {
      // Stop any existing animation
      this.stop();

      // Set up animation state
      this.state.position = options.from;
      this.state.target = options.to;
      this.state.velocity = 0;
      this.state.isAnimating = true;

      // Apply configuration
      this.config = { ...SpringPresets.gentle, ...options.config };
      this.onUpdate = options.onUpdate;
      this.onComplete = () => {
        options.onComplete?.();
        resolve();
      };

      // Handle immediate animation (no spring physics)
      if (options.immediate) {
        this.state.position = options.to;
        this.state.isAnimating = false;
        this.onUpdate?.(this.state.position);
        this.onComplete?.();
        return;
      }

      // Start animation loop
      this.startLoop();
    });
  }

  /**
   * Stop current animation
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.state.isAnimating = false;
  }

  /**
   * Get current animation value
   */
  getValue(): number {
    return this.state.position;
  }

  /**
   * Check if animation is currently running
   */
  isAnimating(): boolean {
    return this.state.isAnimating;
  }

  /**
   * Start the animation loop
   */
  private startLoop(): void {
    const step = (_timestamp: number) => {
      if (!this.state.isAnimating) return;

      // Calculate spring forces
      const displacement = this.state.target - this.state.position;
      const springForce = displacement * this.config.tension;
      const dampingForce = -this.state.velocity * this.config.friction;
      const acceleration = (springForce + dampingForce) / this.config.mass;

      // Update velocity and position
      this.state.velocity += acceleration * (1 / 60); // Assume 60fps
      this.state.position += this.state.velocity * (1 / 60);

      // Check if animation is complete
      const isComplete =
        Math.abs(displacement) < this.config.precision &&
        Math.abs(this.state.velocity) < this.config.precision;

      if (isComplete) {
        this.state.position = this.state.target;
        this.state.velocity = 0;
        this.state.isAnimating = false;
        this.onUpdate?.(this.state.position);
        this.onComplete?.();
        return;
      }

      // Continue animation
      this.onUpdate?.(this.state.position);
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }
}

/**
 * Hook for using spring animations in React components
 */
export const useSpringAnimation = (initialValue: number = 0) => {
  const [animation] = useState(() => new SpringAnimation(initialValue));
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    return () => {
      animation.stop();
    };
  }, [animation]);

  const animate = useCallback(
    (options: Omit<SpringAnimationOptions, 'onUpdate'>) => {
      return animation.animate({
        ...options,
        onUpdate: setValue,
      });
    },
    [animation]
  );

  return {
    value,
    animate,
    stop: () => animation.stop(),
    isAnimating: () => animation.isAnimating(),
  };
};

/**
 * Utility functions for common animation patterns
 */
export const SpringAnimationUtils = {
  /**
   * Create a scale animation for button press feedback
   */
  createPressAnimation: (element: HTMLElement, scale: number = 0.95) => {
    const animation = new SpringAnimation(1);

    const updateTransform = (value: number) => {
      element.style.transform = `scale(${value})`;
    };

    return {
      press: () =>
        animation.animate({
          from: 1,
          to: scale,
          config: SpringPresets.stiff,
          onUpdate: updateTransform,
        }),

      release: () =>
        animation.animate({
          from: animation.getValue(),
          to: 1,
          config: SpringPresets.wobbly,
          onUpdate: updateTransform,
        }),
    };
  },

  /**
   * Create a fade animation
   */
  createFadeAnimation: (element: HTMLElement) => {
    const animation = new SpringAnimation(0);

    const updateOpacity = (value: number) => {
      element.style.opacity = value.toString();
    };

    return {
      fadeIn: () =>
        animation.animate({
          from: 0,
          to: 1,
          config: SpringPresets.gentle,
          onUpdate: updateOpacity,
        }),

      fadeOut: () =>
        animation.animate({
          from: 1,
          to: 0,
          config: SpringPresets.gentle,
          onUpdate: updateOpacity,
        }),
    };
  },

  /**
   * Create a slide animation
   */
  createSlideAnimation: (
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right' = 'up'
  ) => {
    const animation = new SpringAnimation(0);

    const getTransform = (value: number) => {
      switch (direction) {
        case 'up':
          return `translateY(${value}px)`;
        case 'down':
          return `translateY(${-value}px)`;
        case 'left':
          return `translateX(${value}px)`;
        case 'right':
          return `translateX(${-value}px)`;
        default:
          return `translateY(${value}px)`;
      }
    };

    const updateTransform = (value: number) => {
      element.style.transform = getTransform(value);
    };

    return {
      slideIn: (distance: number = 100) =>
        animation.animate({
          from: distance,
          to: 0,
          config: SpringPresets.gentle,
          onUpdate: updateTransform,
        }),

      slideOut: (distance: number = 100) =>
        animation.animate({
          from: 0,
          to: distance,
          config: SpringPresets.gentle,
          onUpdate: updateTransform,
        }),
    };
  },

  /**
   * Create a rotation animation
   */
  createRotationAnimation: (element: HTMLElement) => {
    const animation = new SpringAnimation(0);

    const updateTransform = (value: number) => {
      element.style.transform = `rotate(${value}deg)`;
    };

    return {
      rotate: (degrees: number) =>
        animation.animate({
          from: animation.getValue(),
          to: degrees,
          config: SpringPresets.wobbly,
          onUpdate: updateTransform,
        }),

      spin: () =>
        animation.animate({
          from: 0,
          to: 360,
          config: SpringPresets.slow,
          onUpdate: updateTransform,
        }),
    };
  },
};

// React hook imports
import { useCallback, useEffect, useState } from 'react';
