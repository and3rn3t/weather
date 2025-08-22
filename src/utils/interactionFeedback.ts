/**
 * Interaction Feedback System
 * Provides visual and haptic feedback for touch interactions using spring animations
 */

import { SpringAnimation, SpringPresets } from './springAnimation';
import type { HapticPatternType } from './useHapticFeedback';
import { useHapticFeedback } from './useHapticFeedback';

export interface InteractionFeedbackConfig {
  visual: {
    scale?: { from: number; to: number; duration?: number };
    opacity?: { from: number; to: number; duration?: number };
    shadow?: { from: number; to: number; duration?: number };
    color?: { from: string; to: string; duration?: number };
  };
  haptic: {
    type: HapticPatternType;
    delay?: number;
  };
  spring: keyof typeof SpringPresets;
}

export interface TouchState {
  isPressed: boolean;
  isPressing: boolean;
  pressStartTime: number;
  element: HTMLElement | null;
}

// Predefined interaction patterns
export const InteractionPatterns: Record<string, InteractionFeedbackConfig> = {
  button: {
    visual: {
      scale: { from: 1, to: 0.95 },
      shadow: { from: 4, to: 8 },
    },
    haptic: { type: 'light', delay: 0 },
    spring: 'stiff',
  },
  card: {
    visual: {
      scale: { from: 1, to: 1.02 },
      shadow: { from: 8, to: 16 },
    },
    haptic: { type: 'medium', delay: 50 },
    spring: 'gentle',
  },
  toggle: {
    visual: {
      scale: { from: 1, to: 1.1 },
      opacity: { from: 1, to: 0.8 },
    },
    haptic: { type: 'selection' },
    spring: 'wobbly',
  },
  navigation: {
    visual: {
      scale: { from: 1, to: 0.9 },
      opacity: { from: 1, to: 0.7 },
    },
    haptic: { type: 'navigation' },
    spring: 'bounce',
  },
  destructive: {
    visual: {
      scale: { from: 1, to: 0.98 },
      color: { from: '#ef4444', to: '#dc2626' },
    },
    haptic: { type: 'heavy', delay: 100 },
    spring: 'stiff',
  },
  success: {
    visual: {
      scale: { from: 1, to: 1.05 },
      color: { from: '#10b981', to: '#059669' },
    },
    haptic: { type: 'success' },
    spring: 'bounce',
  },
};

export class InteractionFeedbackManager {
  private readonly element: HTMLElement;
  private config: InteractionFeedbackConfig;
  private readonly animations: Map<string, SpringAnimation> = new Map();
  private readonly touchState: TouchState;
  private isActive = false;
  private hapticManager: ReturnType<typeof useHapticFeedback> | null = null;

  constructor(
    element: HTMLElement,
    pattern: keyof typeof InteractionPatterns | InteractionFeedbackConfig
  ) {
    this.element = element;
    this.config =
      typeof pattern === 'string' ? InteractionPatterns[pattern] : pattern;
    this.touchState = {
      isPressed: false,
      isPressing: false,
      pressStartTime: 0,
      element: null,
    };

    this.initializeAnimations();
    this.bindEventListeners();
  }

  /**
   * Set haptic manager for feedback
   */
  setHapticManager(hapticManager: ReturnType<typeof useHapticFeedback>): void {
    this.hapticManager = hapticManager;
  }

  /**
   * Initialize spring animations for visual properties
   */
  private initializeAnimations(): void {
    if (this.config.visual.scale) {
      this.animations.set(
        'scale',
        new SpringAnimation(this.config.visual.scale.from)
      );
    }
    if (this.config.visual.opacity) {
      this.animations.set(
        'opacity',
        new SpringAnimation(this.config.visual.opacity.from)
      );
    }
    if (this.config.visual.shadow) {
      this.animations.set(
        'shadow',
        new SpringAnimation(this.config.visual.shadow.from)
      );
    }
  }

  /**
   * Bind touch and mouse event listeners
   */
  private bindEventListeners(): void {
    // Touch events for mobile
    this.element.addEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.element.addEventListener(
      'touchcancel',
      this.handleTouchCancel.bind(this),
      { passive: false }
    );

    // Mouse events for desktop
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener(
      'mouseleave',
      this.handleMouseLeave.bind(this)
    );

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', e => {
      if (this.touchState.isPressed) {
        e.preventDefault();
      }
    });
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.startInteraction();
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.endInteraction();
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    this.cancelInteraction();
  }

  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.startInteraction();
  }

  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    event.preventDefault();
    this.endInteraction();
  }

  /**
   * Handle mouse leave event
   */
  private handleMouseLeave(): void {
    this.cancelInteraction();
  }

  /**
   * Start interaction feedback
   */
  private startInteraction(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.touchState.isPressed = true;
    this.touchState.isPressing = true;
    this.touchState.pressStartTime = Date.now();
    this.touchState.element = this.element;

    // Trigger haptic feedback
    this.triggerHapticFeedback();

    // Start visual feedback animations
    this.animateToPressed();
  }

  /**
   * End interaction feedback
   */
  private endInteraction(): void {
    if (!this.isActive) return;

    this.touchState.isPressed = false;
    this.touchState.isPressing = false;

    // Animate back to original state
    this.animateToReleased();

    // Reset after animation
    setTimeout(() => {
      this.isActive = false;
    }, 300);
  }

  /**
   * Cancel interaction feedback
   */
  private cancelInteraction(): void {
    if (!this.isActive) return;

    this.touchState.isPressed = false;
    this.touchState.isPressing = false;

    // Animate back to original state quickly
    this.animateToReleased(true);

    setTimeout(() => {
      this.isActive = false;
    }, 150);
  }

  /**
   * Animate to pressed state
   */
  private animateToPressed(): void {
    const springConfig = SpringPresets[this.config.spring];

    // Scale animation
    if (this.config.visual.scale && this.animations.has('scale')) {
      this.animations.get('scale')?.animate({
        from: this.config.visual.scale.from,
        to: this.config.visual.scale.to,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('scale', value),
      });
    }

    // Opacity animation
    if (this.config.visual.opacity && this.animations.has('opacity')) {
      this.animations.get('opacity')?.animate({
        from: this.config.visual.opacity.from,
        to: this.config.visual.opacity.to,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('opacity', value),
      });
    }

    // Shadow animation
    if (this.config.visual.shadow && this.animations.has('shadow')) {
      this.animations.get('shadow')?.animate({
        from: this.config.visual.shadow.from,
        to: this.config.visual.shadow.to,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('shadow', value),
      });
    }

    // Color change (immediate for now)
    if (this.config.visual.color) {
      this.element.style.color = this.config.visual.color.to;
    }
  }

  /**
   * Animate to released state
   */
  private animateToReleased(quick: boolean = false): void {
    const springConfig = quick
      ? SpringPresets.stiff
      : SpringPresets[this.config.spring];

    // Scale animation
    if (this.config.visual.scale && this.animations.has('scale')) {
      this.animations.get('scale')?.animate({
        from:
          this.animations.get('scale')?.getValue() ||
          this.config.visual.scale.to,
        to: this.config.visual.scale.from,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('scale', value),
      });
    }

    // Opacity animation
    if (this.config.visual.opacity && this.animations.has('opacity')) {
      this.animations.get('opacity')?.animate({
        from:
          this.animations.get('opacity')?.getValue() ||
          this.config.visual.opacity.to,
        to: this.config.visual.opacity.from,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('opacity', value),
      });
    }

    // Shadow animation
    if (this.config.visual.shadow && this.animations.has('shadow')) {
      this.animations.get('shadow')?.animate({
        from:
          this.animations.get('shadow')?.getValue() ||
          this.config.visual.shadow.to,
        to: this.config.visual.shadow.from,
        config: springConfig,
        onUpdate: value => this.updateVisualProperty('shadow', value),
      });
    }

    // Color change back (immediate for now)
    if (this.config.visual.color) {
      this.element.style.color = this.config.visual.color.from;
    }
  }

  /**
   * Update visual property on element
   */
  private updateVisualProperty(property: string, value: number): void {
    switch (property) {
      case 'scale':
        this.element.style.transform = `scale(${value})`;
        break;
      case 'opacity':
        this.element.style.opacity = value.toString();
        break;
      case 'shadow':
        this.element.style.boxShadow = `0 0 ${value}px rgba(0, 0, 0, 0.1)`;
        break;
    }
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(): void {
    if (!this.hapticManager) return;

    const { type, delay = 0 } = this.config.haptic;

    if (delay > 0) {
      setTimeout(() => {
        this.hapticManager?.triggerHaptic(type);
      }, delay);
    } else {
      this.hapticManager.triggerHaptic(type);
    }
  }

  /**
   * Check if currently interacting
   */
  isInteracting(): boolean {
    return this.isActive;
  }

  /**
   * Get touch state
   */
  getTouchState(): TouchState {
    return { ...this.touchState };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<InteractionFeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy(): void {
    this.animations.forEach(animation => animation.stop());
    // Note: In a production app, you'd store event listener references to remove them properly
  }
}

/**
 * React hook for interaction feedback
 */
export const useInteractionFeedback = (
  elementRef: React.RefObject<HTMLElement>,
  pattern: keyof typeof InteractionPatterns | InteractionFeedbackConfig
) => {
  const [manager, setManager] = useState<InteractionFeedbackManager | null>(
    null
  );
  const hapticManager = useHapticFeedback();

  useEffect(() => {
    if (elementRef.current && !manager) {
      const newManager = new InteractionFeedbackManager(
        elementRef.current,
        pattern
      );
      newManager.setHapticManager(hapticManager);
      setManager(newManager);
    }

    return () => {
      manager?.destroy();
    };
  }, [elementRef, pattern, manager, hapticManager]);

  const updateConfig = useCallback(
    (newConfig: Partial<InteractionFeedbackConfig>) => {
      manager?.updateConfig(newConfig);
    },
    [manager]
  );

  return {
    isInteracting: manager?.isInteracting() || false,
    touchState: manager?.getTouchState() || {
      isPressed: false,
      isPressing: false,
      pressStartTime: 0,
      element: null,
    },
    updateConfig,
  };
};

// React imports
import { useCallback, useEffect, useState } from 'react';
