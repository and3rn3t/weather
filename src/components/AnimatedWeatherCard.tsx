/**
 * iOS26 Advanced Animations Integration Example
 * Demonstrates how to use the complete animation system together
 */

import React, { useEffect, useRef } from 'react';
import { useInteractionFeedback } from '../utils/interactionFeedback';
import { usePageTransitionChoreographer } from '../utils/pageTransitionChoreographer';
import { useSpringAnimation } from '../utils/springAnimation';
import { useWeatherIconMorpher } from '../utils/weatherIconMorpher';

interface AnimatedWeatherCardProps {
  weatherType: string;
  temperature: number;
  onRefresh: () => void;
  isVisible: boolean;
}

export const AnimatedWeatherCard: React.FC<AnimatedWeatherCardProps> = ({
  weatherType,
  temperature,
  onRefresh,
  isVisible,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const temperatureRef = useRef<HTMLSpanElement>(null);

  // Animation systems
  const { morphTo, isTransitioning } = useWeatherIconMorpher(
    iconRef,
    weatherType
  );
  const cardFeedback = useInteractionFeedback(cardRef, 'card');
  const buttonFeedback = useInteractionFeedback(refreshButtonRef, 'button');
  const { addElement, choreograph, clearElements } =
    usePageTransitionChoreographer();
  const temperatureAnimation = useSpringAnimation();

  // Setup entrance choreography
  useEffect(() => {
    if (
      isVisible &&
      cardRef.current &&
      iconRef.current &&
      refreshButtonRef.current &&
      temperatureRef.current
    ) {
      clearElements();

      // Add elements with staggered entrance
      addElement(cardRef.current, 'fadeIn', 0);
      addElement(iconRef.current, 'scaleIn', 100);
      addElement(temperatureRef.current, 'slideInUp', 200);
      addElement(refreshButtonRef.current, 'slideInDown', 300);

      // Execute entrance choreography
      choreograph({
        direction: 'in',
        sequence: 'cascade',
        stagger: 80,
      });
    }
  }, [isVisible, addElement, choreograph, clearElements]);

  // Handle weather type changes with icon morphing
  useEffect(() => {
    if (weatherType && !isTransitioning) {
      morphTo(weatherType, {
        easing: 'gentle',
        stagger: 25,
      });
    }
  }, [weatherType, morphTo, isTransitioning]);

  // Animate temperature changes
  useEffect(() => {
    if (temperatureRef.current) {
      const currentTemp = parseInt(temperatureRef.current.textContent || '0');
      if (currentTemp !== temperature) {
        // Spring animation for temperature counter
        temperatureAnimation.animate({
          from: currentTemp,
          to: temperature,
          config: { mass: 1, tension: 150, friction: 15 },
          onUpdate: value => {
            if (temperatureRef.current) {
              temperatureRef.current.textContent = Math.round(value).toString();
            }
          },
        });
      }
    }
  }, [temperature, temperatureAnimation]);

  const handleRefresh = async () => {
    // Exit animation
    await choreograph({
      direction: 'out',
      sequence: 'parallel',
    });

    // Trigger refresh
    onRefresh();

    // Re-entrance animation
    setTimeout(() => {
      choreograph({
        direction: 'in',
        sequence: 'cascade',
        stagger: 60,
      });
    }, 200);
  };

  const handleCardPress = () => {
    // Card press creates a gentle scale effect
    // Handled automatically by useInteractionFeedback
  };

  if (!isVisible) return null;

  return (
    <div
      ref={cardRef}
      className="animated-weather-card"
      onClick={handleCardPress}
      style={{
        padding: '24px',
        borderRadius: '16px',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'none', // Let spring animations handle transitions
      }}
    >
      {/* Weather Icon with Morphing */}
      <div
        ref={iconRef}
        className="weather-icon"
        data-weather-icon={weatherType}
        style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          fontSize: '48px',
          textAlign: 'center',
          lineHeight: '64px',
        }}
      >
        {/* Icon content would be rendered here based on weatherType */}
        🌤️
      </div>

      {/* Animated Temperature */}
      <div
        className="temperature-display"
        style={{ textAlign: 'center', marginBottom: '16px' }}
      >
        <span
          ref={temperatureRef}
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#333',
          }}
        >
          {temperature}
        </span>
        <span style={{ fontSize: '18px', color: '#666' }}>°F</span>
      </div>

      {/* Refresh Button with Interaction Feedback */}
      <button
        ref={refreshButtonRef}
        onClick={handleRefresh}
        style={{
          display: 'block',
          margin: '0 auto',
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          background: 'rgba(99, 102, 241, 0.8)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Refresh Weather
      </button>
    </div>
  );
};

/**
 * Example of weather icon grid with coordinated animations
 */
export const AnimatedWeatherIconGrid: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const { addElement, choreograph } = usePageTransitionChoreographer();

  const weatherTypes = [
    'clear-day',
    'clear-night',
    'partly-cloudy-day',
    'partly-cloudy-night',
    'cloudy',
    'rain',
    'snow',
    'thunderstorm',
    'fog',
  ];

  useEffect(() => {
    if (gridRef.current) {
      const iconElements =
        gridRef.current.querySelectorAll('.grid-weather-icon');

      // Clear and add all icon elements
      iconElements.forEach((element, index) => {
        addElement(element as HTMLElement, 'scaleIn', index * 50);
      });

      // Animate entrance
      choreograph({
        direction: 'in',
        sequence: 'cascade',
        stagger: 60,
      });
    }
  }, [addElement, choreograph]);

  return (
    <div
      ref={gridRef}
      className="weather-icon-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '24px',
      }}
    >
      {weatherTypes.map(type => (
        <WeatherIconGridItem key={type} weatherType={type} />
      ))}
    </div>
  );
};

/**
 * Individual grid item with interaction feedback
 */
const WeatherIconGridItem: React.FC<{ weatherType: string }> = ({
  weatherType,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const { morphTo } = useWeatherIconMorpher(iconRef, weatherType);
  const { isInteracting } = useInteractionFeedback(itemRef, 'button');

  const handlePress = () => {
    // Trigger icon change for demo
    const randomTypes = ['clear-day', 'rain', 'snow', 'thunderstorm'];
    const randomType =
      randomTypes[Math.floor(Math.random() * randomTypes.length)];
    morphTo(randomType, { easing: 'bounce', stagger: 30 });
  };

  return (
    <div
      ref={itemRef}
      className={`grid-weather-icon ${isInteracting ? 'interacting' : ''}`}
      onClick={handlePress}
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '32px',
      }}
    >
      <div ref={iconRef} data-weather-icon={weatherType}>
        {/* Icon would be rendered based on weatherType */}
        {weatherType === 'rain' ? '🌧️' : weatherType === 'snow' ? '❄️' : '☀️'}
      </div>
    </div>
  );
};

export default AnimatedWeatherCard;
