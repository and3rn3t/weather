/**
 * Weather Interaction Enhancer - Phase F-4
 * 
 * Provides enhanced haptic feedback for weather-specific user interactions,
 * creating an immersive and contextual experience that responds to weather
 * conditions and user gestures.
 */

import React, { useCallback, useRef } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import { logInteraction, logWeatherLoading, logLocation } from '../utils/logger';
import { executeWeatherVibration, executeVibration, executeProgressiveLoading } from '../utils/hapticPatterns';

export interface WeatherInteractionEnhancerProps {
  children: React.ReactNode;
  weatherCode?: number;
  temperature?: number;
  enableWeatherContextualFeedback?: boolean;
  onWeatherCardTap?: () => void;
  onWeatherRefresh?: () => void;
  onLocationTap?: () => void;
}

const WeatherInteractionEnhancer: React.FC<WeatherInteractionEnhancerProps> = ({
  children,
  weatherCode = 0,
  temperature = 20,
  enableWeatherContextualFeedback = true,
  onWeatherCardTap,
  onWeatherRefresh,
  onLocationTap
}) => {
  const haptic = useHaptic();
  const lastInteraction = useRef<number>(0);
  const INTERACTION_COOLDOWN = 150; // Prevent rapid-fire haptics

  // Enhanced weather card tap with contextual feedback
  const handleWeatherCardTap = useCallback(() => {
    const now = Date.now();
    if (now - lastInteraction.current < INTERACTION_COOLDOWN) return;
    lastInteraction.current = now;

    if (enableWeatherContextualFeedback) {
      // Base interaction haptic
      haptic.buttonPress();
      
      // Add weather-contextual feedback after a brief delay
      setTimeout(() => {
        executeWeatherVibration(weatherCode, 0.8);
      }, 50);
    } else {
      haptic.buttonPress();
    }

    logInteraction(`Weather card tap - Code: ${weatherCode}, Temp: ${temperature}°`);
    onWeatherCardTap?.();
  }, [
    weatherCode,
    temperature,
    enableWeatherContextualFeedback,
    haptic,
    onWeatherCardTap
  ]);

  // Enhanced refresh with progressive feedback
  const handleWeatherRefresh = useCallback(() => {
    logWeatherLoading('Enhanced weather refresh with progressive haptics');
    
    // Initial refresh haptic
    haptic.weatherRefresh();
    
    // Progressive loading feedback
    executeProgressiveLoading();

    onWeatherRefresh?.();
  }, [haptic, onWeatherRefresh]);

  // Enhanced location tap with geographic feedback
  const handleLocationTap = useCallback(() => {
    logLocation('Enhanced location tap with geographic feedback');
    
    // Location selection haptic
    haptic.searchSuccess();
    
    // Add subtle geographic feedback
    setTimeout(() => {
      executeVibration('location_found');
    }, 100);

    onLocationTap?.();
  }, [haptic, onLocationTap]);

  // Enhanced weather element touch feedback
  const handleWeatherElementTouch = useCallback((elementType: string) => {
    const patternMap = {
      temperature: 'temperature_change',
      humidity: 'rainy',
      pressure: 'pressure_change',
      wind: 'wind_gust',
      uv: 'clear'
    } as const;

    const patternKey = patternMap[elementType as keyof typeof patternMap];
    if (patternKey) {
      executeVibration(patternKey);
      logInteraction(`Weather element touch - ${elementType}`);
    }
  }, []);

  // Provide interaction methods through a simple wrapper
  return (
    <div 
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        const className = target.className || '';
        
        if (className.includes('weather-card')) {
          handleWeatherCardTap();
        } else if (className.includes('location')) {
          handleLocationTap();
        } else if (className.includes('refresh')) {
          handleWeatherRefresh();
        } else if (className.includes('temperature')) {
          handleWeatherElementTouch('temperature');
        } else if (className.includes('humidity')) {
          handleWeatherElementTouch('humidity');
        } else if (className.includes('pressure')) {
          handleWeatherElementTouch('pressure');
        } else if (className.includes('wind')) {
          handleWeatherElementTouch('wind');
        } else if (className.includes('uv')) {
          handleWeatherElementTouch('uv');
        }
      }}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
};

export default WeatherInteractionEnhancer;
