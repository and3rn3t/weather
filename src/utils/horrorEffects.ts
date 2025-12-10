/**
 * Horror Effects System
 * Implements screen flicker and other horror-themed effects
 * Respects reduced motion preferences
 */

export interface HorrorEffectsConfig {
  flickerEnabled: boolean;
  flickerIntensity: number; // 0-1
  flickerFrequency: number; // milliseconds between flickers
  staticEnabled: boolean;
  staticIntensity: number; // 0-1
  colorShiftEnabled: boolean;
}

const defaultConfig: HorrorEffectsConfig = {
  flickerEnabled: true,
  flickerIntensity: 0.15,
  flickerFrequency: 3000,
  staticEnabled: false,
  staticIntensity: 0.1,
  colorShiftEnabled: true,
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Apply screen flicker effect
 */
export const applyScreenFlicker = (
  element: HTMLElement,
  config: Partial<HorrorEffectsConfig> = {}
): (() => void) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.flickerEnabled || prefersReducedMotion()) {
    return () => {}; // No-op cleanup
  }

  let flickerInterval: NodeJS.Timeout | null = null;
  let isFlickering = false;

  const flicker = () => {
    if (isFlickering) return;
    isFlickering = true;

    const intensity = finalConfig.flickerIntensity;
    const duration = 50 + Math.random() * 100; // 50-150ms

    // Random opacity/brightness variation
    const opacity = 1 - Math.random() * intensity;
    const brightness = 1 - Math.random() * intensity * 0.5;

    element.style.transition = 'opacity 0.05s, filter 0.05s';
    element.style.opacity = String(opacity);
    element.style.filter = `brightness(${brightness})`;

    setTimeout(() => {
      element.style.opacity = '1';
      element.style.filter = 'brightness(1)';
      isFlickering = false;
    }, duration);
  };

  // Start flickering at random intervals
  const scheduleFlicker = () => {
    const delay = finalConfig.flickerFrequency + Math.random() * 2000;
    flickerInterval = setTimeout(() => {
      flicker();
      scheduleFlicker();
    }, delay);
  };

  scheduleFlicker();

  // Cleanup function
  return () => {
    if (flickerInterval) {
      clearTimeout(flickerInterval);
      flickerInterval = null;
    }
    element.style.opacity = '1';
    element.style.filter = 'brightness(1)';
    element.style.transition = '';
  };
};

/**
 * Apply static/noise overlay
 */
export const applyStaticOverlay = (
  element: HTMLElement,
  config: Partial<HorrorEffectsConfig> = {}
): (() => void) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.staticEnabled || prefersReducedMotion()) {
    return () => {}; // No-op cleanup
  }

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '9999';
  overlay.style.opacity = String(finalConfig.staticIntensity);
  overlay.style.backgroundImage = `
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.1) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 3px
    )
  `;
  overlay.style.mixBlendMode = 'overlay';
  overlay.className = 'horror-static-overlay';

  document.body.appendChild(overlay);

  // Cleanup function
  return () => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };
};

/**
 * Apply color shift animation
 */
export const applyColorShift = (
  element: HTMLElement,
  config: Partial<HorrorEffectsConfig> = {}
): (() => void) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.colorShiftEnabled || prefersReducedMotion()) {
    return () => {}; // No-op cleanup
  }

  // Add CSS animation class
  element.classList.add('horror-color-shift');

  // Cleanup function
  return () => {
    element.classList.remove('horror-color-shift');
  };
};

/**
 * Initialize all horror effects
 */
export const initializeHorrorEffects = (
  element: HTMLElement,
  config: Partial<HorrorEffectsConfig> = {}
): (() => void) => {
  const cleanups: Array<() => void> = [];

  cleanups.push(applyScreenFlicker(element, config));
  cleanups.push(applyStaticOverlay(element, config));
  cleanups.push(applyColorShift(element, config));

  // Return combined cleanup function
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};

