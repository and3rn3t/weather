/**
 * Page Transition Choreography System
 * Provides coordinated animations for screen transitions and element choreography
 */

import { SpringAnimation, SpringPresets } from './springAnimation';

export interface TransitionElement {
  element: HTMLElement;
  config: ElementTransitionConfig;
  delay?: number;
}

export interface ElementTransitionConfig {
  from: {
    opacity?: number;
    scale?: number;
    translateX?: number;
    translateY?: number;
    rotate?: number;
  };
  to: {
    opacity?: number;
    scale?: number;
    translateX?: number;
    translateY?: number;
    rotate?: number;
  };
  spring?: keyof typeof SpringPresets;
  duration?: number;
}

export interface ChoreographyConfig {
  direction: 'in' | 'out';
  stagger?: number;
  sequence?: 'parallel' | 'sequential' | 'cascade';
  spring?: keyof typeof SpringPresets;
  onComplete?: () => void;
}

// Predefined transition patterns
export const TransitionPatterns = {
  fadeIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    spring: 'gentle' as const,
  },
  fadeOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.95 },
    spring: 'stiff' as const,
  },
  slideInUp: {
    from: { opacity: 0, translateY: 30, scale: 0.98 },
    to: { opacity: 1, translateY: 0, scale: 1 },
    spring: 'wobbly' as const,
  },
  slideInDown: {
    from: { opacity: 0, translateY: -30, scale: 0.98 },
    to: { opacity: 1, translateY: 0, scale: 1 },
    spring: 'wobbly' as const,
  },
  slideOutUp: {
    from: { opacity: 1, translateY: 0, scale: 1 },
    to: { opacity: 0, translateY: -30, scale: 0.98 },
    spring: 'stiff' as const,
  },
  slideOutDown: {
    from: { opacity: 1, translateY: 0, scale: 1 },
    to: { opacity: 0, translateY: 30, scale: 0.98 },
    spring: 'stiff' as const,
  },
  slideInLeft: {
    from: { opacity: 0, translateX: -30, scale: 0.98 },
    to: { opacity: 1, translateX: 0, scale: 1 },
    spring: 'bounce' as const,
  },
  slideInRight: {
    from: { opacity: 0, translateX: 30, scale: 0.98 },
    to: { opacity: 1, translateX: 0, scale: 1 },
    spring: 'bounce' as const,
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    spring: 'bounce' as const,
  },
  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.8 },
    spring: 'stiff' as const,
  },
  rotateIn: {
    from: { opacity: 0, scale: 0.9, rotate: -10 },
    to: { opacity: 1, scale: 1, rotate: 0 },
    spring: 'wobbly' as const,
  },
  rotateOut: {
    from: { opacity: 1, scale: 1, rotate: 0 },
    to: { opacity: 0, scale: 0.9, rotate: 10 },
    spring: 'stiff' as const,
  },
};

export class PageTransitionChoreographer {
  private elements: TransitionElement[] = [];
  private animations: Map<HTMLElement, Map<string, SpringAnimation>> =
    new Map();
  private isTransitioning = false;
  private currentDirection: 'in' | 'out' = 'in';

  /**
   * Add element to choreography
   */
  addElement(
    element: HTMLElement,
    pattern: keyof typeof TransitionPatterns | ElementTransitionConfig,
    delay: number = 0
  ): void {
    const config =
      typeof pattern === 'string' ? TransitionPatterns[pattern] : pattern;

    this.elements.push({
      element,
      config,
      delay,
    });

    // Initialize animations for this element
    this.initializeElementAnimations(element);
  }

  /**
   * Remove element from choreography
   */
  removeElement(element: HTMLElement): void {
    this.elements = this.elements.filter(item => item.element !== element);
    this.animations.delete(element);
  }

  /**
   * Clear all elements
   */
  clearElements(): void {
    this.elements = [];
    this.animations.clear();
  }

  /**
   * Initialize animations for an element
   */
  private initializeElementAnimations(element: HTMLElement): void {
    const elementAnimations = new Map<string, SpringAnimation>();

    elementAnimations.set('opacity', new SpringAnimation(1));
    elementAnimations.set('scale', new SpringAnimation(1));
    elementAnimations.set('translateX', new SpringAnimation(0));
    elementAnimations.set('translateY', new SpringAnimation(0));
    elementAnimations.set('rotate', new SpringAnimation(0));

    this.animations.set(element, elementAnimations);
  }

  /**
   * Execute choreography
   */
  async choreograph(config: ChoreographyConfig): Promise<void> {
    if (this.isTransitioning) {
      await this.stopAllAnimations();
    }

    this.isTransitioning = true;
    this.currentDirection = config.direction;

    try {
      switch (config.sequence) {
        case 'parallel':
          await this.executeParallel(config);
          break;
        case 'sequential':
          await this.executeSequential(config);
          break;
        case 'cascade':
        default:
          await this.executeCascade(config);
          break;
      }

      config.onComplete?.();
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Execute parallel animations (all at once)
   */
  private async executeParallel(config: ChoreographyConfig): Promise<void> {
    const promises = this.elements.map(
      ({ element, config: elementConfig, delay = 0 }) => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            this.animateElement(element, elementConfig, config.spring).then(
              resolve
            );
          }, delay);
        });
      }
    );

    await Promise.all(promises);
  }

  /**
   * Execute sequential animations (one after another)
   */
  private async executeSequential(config: ChoreographyConfig): Promise<void> {
    for (const { element, config: elementConfig, delay = 0 } of this.elements) {
      if (delay > 0) {
        await this.delay(delay);
      }
      await this.animateElement(element, elementConfig, config.spring);
    }
  }

  /**
   * Execute cascade animations (staggered)
   */
  private async executeCascade(config: ChoreographyConfig): Promise<void> {
    const stagger = config.stagger || 100;
    const promises: Promise<void>[] = [];

    this.elements.forEach(({ element, config: elementConfig }, index) => {
      const promise = new Promise<void>(resolve => {
        setTimeout(() => {
          this.animateElement(element, elementConfig, config.spring).then(
            resolve
          );
        }, index * stagger);
      });
      promises.push(promise);
    });

    await Promise.all(promises);
  }

  /**
   * Animate individual element
   */
  private async animateElement(
    element: HTMLElement,
    config: ElementTransitionConfig,
    globalSpring?: keyof typeof SpringPresets
  ): Promise<void> {
    const elementAnimations = this.animations.get(element);
    if (!elementAnimations) return;

    const springConfig =
      SpringPresets[config.spring || globalSpring || 'gentle'];
    const animationPromises: Promise<void>[] = [];

    // Determine animation direction
    const fromState = this.currentDirection === 'in' ? config.from : config.to;
    const toState = this.currentDirection === 'in' ? config.to : config.from;

    // Set initial state
    this.applyElementState(element, fromState);

    // Animate each property
    Object.entries(toState).forEach(([property, targetValue]) => {
      if (targetValue !== undefined) {
        const animation = elementAnimations.get(property);
        if (animation) {
          const promise = new Promise<void>(resolve => {
            animation.animate({
              from:
                fromState[property as keyof typeof fromState] ||
                animation.getValue(),
              to: targetValue,
              config: springConfig,
              onUpdate: value =>
                this.updateElementProperty(element, property, value),
              onComplete: resolve,
            });
          });
          animationPromises.push(promise);
        }
      }
    });

    await Promise.all(animationPromises);
  }

  /**
   * Apply state to element immediately
   */
  private applyElementState(
    element: HTMLElement,
    state: ElementTransitionConfig['from'] | ElementTransitionConfig['to']
  ): void {
    const transforms: string[] = [];

    if (state.scale !== undefined) {
      transforms.push(`scale(${state.scale})`);
    }
    if (state.translateX !== undefined) {
      transforms.push(`translateX(${state.translateX}px)`);
    }
    if (state.translateY !== undefined) {
      transforms.push(`translateY(${state.translateY}px)`);
    }
    if (state.rotate !== undefined) {
      transforms.push(`rotate(${state.rotate}deg)`);
    }

    if (transforms.length > 0) {
      element.style.transform = transforms.join(' ');
    }

    if (state.opacity !== undefined) {
      element.style.opacity = state.opacity.toString();
    }
  }

  /**
   * Update element property during animation
   */
  private updateElementProperty(
    element: HTMLElement,
    property: string,
    value: number
  ): void {
    const elementAnimations = this.animations.get(element);
    if (!elementAnimations) return;

    const currentScale = elementAnimations.get('scale')?.getValue() || 1;
    const currentTranslateX =
      elementAnimations.get('translateX')?.getValue() || 0;
    const currentTranslateY =
      elementAnimations.get('translateY')?.getValue() || 0;
    const currentRotate = elementAnimations.get('rotate')?.getValue() || 0;

    switch (property) {
      case 'opacity':
        element.style.opacity = value.toString();
        break;
      case 'scale':
      case 'translateX':
      case 'translateY':
      case 'rotate':
        element.style.transform = [
          `scale(${currentScale})`,
          `translateX(${currentTranslateX}px)`,
          `translateY(${currentTranslateY}px)`,
          `rotate(${currentRotate}deg)`,
        ].join(' ');
        break;
    }
  }

  /**
   * Stop all running animations
   */
  private async stopAllAnimations(): Promise<void> {
    this.animations.forEach(elementAnimations => {
      elementAnimations.forEach(animation => animation.stop());
    });

    // Wait a frame for animations to stop
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if currently transitioning
   */
  isTransitionActive(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get current transition direction
   */
  getDirection(): 'in' | 'out' {
    return this.currentDirection;
  }

  /**
   * Get element count
   */
  getElementCount(): number {
    return this.elements.length;
  }

  /**
   * Cleanup all animations
   */
  destroy(): void {
    this.stopAllAnimations();
    this.clearElements();
  }
}

/**
 * React hook for page transition choreography
 */
export const usePageTransitionChoreographer = () => {
  const [choreographer] = useState(() => new PageTransitionChoreographer());

  const addElement = useCallback(
    (
      element: HTMLElement,
      pattern: keyof typeof TransitionPatterns | ElementTransitionConfig,
      delay: number = 0
    ) => {
      choreographer.addElement(element, pattern, delay);
    },
    [choreographer]
  );

  const removeElement = useCallback(
    (element: HTMLElement) => {
      choreographer.removeElement(element);
    },
    [choreographer]
  );

  const choreograph = useCallback(
    async (config: ChoreographyConfig) => {
      await choreographer.choreograph(config);
    },
    [choreographer]
  );

  const clearElements = useCallback(() => {
    choreographer.clearElements();
  }, [choreographer]);

  useEffect(() => {
    return () => {
      choreographer.destroy();
    };
  }, [choreographer]);

  return {
    addElement,
    removeElement,
    choreograph,
    clearElements,
    isTransitioning: choreographer.isTransitionActive(),
    direction: choreographer.getDirection(),
    elementCount: choreographer.getElementCount(),
    TransitionPatterns,
  };
};

// React imports
import { useCallback, useEffect, useState } from 'react';
