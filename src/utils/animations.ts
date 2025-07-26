/**
 * Animation utilities for mobile weather app
 * Smooth, performant animations optimized for mobile devices
 */

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
  loading: 1000,
} as const;

export const EASING = {
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// CSS-in-JS animation styles
export const animations = {
  // Fade animations
  fadeIn: {
    animation: `fadeIn ${ANIMATION_DURATIONS.normal}ms ${EASING.easeOut} forwards`,
  },
  fadeInUp: {
    animation: `fadeInUp ${ANIMATION_DURATIONS.normal}ms ${EASING.easeOut} forwards`,
  },
  fadeInScale: {
    animation: `fadeInScale ${ANIMATION_DURATIONS.normal}ms ${EASING.spring} forwards`,
  },

  // Loading animations
  pulse: {
    animation: `pulse ${ANIMATION_DURATIONS.loading}ms ${EASING.easeInOut} infinite`,
  },
  shimmer: {
    animation: `shimmer 1.5s ${EASING.easeInOut} infinite`,
  },

  // Interactive animations
  buttonPress: {
    transition: `transform ${ANIMATION_DURATIONS.fast}ms ${EASING.easeOut}`,
  },
  cardHover: {
    transition: `all ${ANIMATION_DURATIONS.normal}ms ${EASING.easeOut}`,
  },

  // Weather-specific animations
  weatherIconFloat: {
    animation: `float 3s ${EASING.easeInOut} infinite`,
  },
  rainDrop: {
    animation: `rainDrop 1s ${EASING.easeIn} infinite`,
  },
  snowFall: {
    animation: `snowFall 3s linear infinite`,
  },
};

// Keyframes for CSS animations
export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  @keyframes fadeInScale {
    from { 
      opacity: 0; 
      transform: scale(0.9); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes rainDrop {
    0% { 
      transform: translateY(-10px); 
      opacity: 0; 
    }
    50% { 
      opacity: 1; 
    }
    100% { 
      transform: translateY(10px); 
      opacity: 0; 
    }
  }

  @keyframes snowFall {
    0% { 
      transform: translateY(-10px) rotate(0deg); 
      opacity: 0; 
    }
    50% { 
      opacity: 1; 
    }
    100% { 
      transform: translateY(10px) rotate(360deg); 
      opacity: 0; 
    }
  }

  @keyframes slideInFromBottom {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToBottom {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;

// React hook for managing animations
export const useAnimation = (trigger: boolean, delay = 0) => {
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  React.useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => setShouldAnimate(true), delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay]);

  return shouldAnimate;
};

// Staggered animation utility
export const getStaggerDelay = (index: number, baseDelay = 50) => ({
  animationDelay: `${index * baseDelay}ms`,
});

import React from 'react';
