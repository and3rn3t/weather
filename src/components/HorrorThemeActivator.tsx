import React, { useEffect, useState } from 'react';
import { useTheme } from '../utils/useTheme';

/**
 * Horror Theme Activator Component
 * Provides easy horror theme activation and atmospheric effects
 */
const HorrorThemeActivator: React.FC = () => {
  const { isHorror, toggleTheme, themeName } = useTheme();
  const [showActivator, setShowActivator] = useState(false);

  // Show the activator button when not in horror mode
  useEffect(() => {
    setShowActivator(!isHorror);
  }, [isHorror]);

  // Activate horror effects when in horror mode
  useEffect(() => {
    if (isHorror) {
      // Add film grain overlay to body
      document.body.classList.add('horror-film-grain');

      // Activate blood drip animations on headers
      setTimeout(() => {
        const headers = document.querySelectorAll(
          'h1, h2, h3, .temperature-display',
        );
        headers.forEach(header => {
          (header as HTMLElement).classList.add('horror-blood-drip');
        });

        // Add flickering animation to text elements
        const textElements = document.querySelectorAll(
          '.weather-description, .forecast-day, .metric-label',
        );
        textElements.forEach(element => {
          (element as HTMLElement).classList.add('horror-flicker');
        });
      }, 500);

      // Change page title for maximum spookiness
      document.title = '🎃 Crystal Lake Weather Station';

      // Add horror atmosphere message (disabled for production)
      // console.log('🎃 Horror mode activated - Crystal Lake Weather Station');
    } else {
      document.body.classList.remove('horror-film-grain');
      document.title = '🌤️ Weather App';

      // Remove horror classes
      const elements = document.querySelectorAll(
        '.horror-blood-drip, .horror-flicker',
      );
      elements.forEach(element => {
        (element as HTMLElement).classList.remove(
          'horror-blood-drip',
          'horror-flicker',
        );
      });
    }

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('horror-film-grain');
      const elements = document.querySelectorAll(
        '.horror-blood-drip, .horror-flicker',
      );
      elements.forEach(element => {
        (element as HTMLElement).classList.remove(
          'horror-blood-drip',
          'horror-flicker',
        );
      });
    };
  }, [isHorror]);

  const handleActivateHorror = () => {
    // Cycle through themes until we get to horror
    let clicksNeeded = 0;
    switch (themeName) {
      case 'light':
        clicksNeeded = 2; // light -> dark -> horror
        break;
      case 'dark':
        clicksNeeded = 1; // dark -> horror
        break;
      case 'horror':
        return; // already horror, no need to change
      default:
        clicksNeeded = 2;
    }

    // Toggle theme the required number of times
    for (let i = 0; i < clicksNeeded; i++) {
      setTimeout(() => toggleTheme(), i * 100);
    }
  };

  if (isHorror) {
    return (
      <div className="horror-status-indicator">
        <div className="horror-status-content">💀 HORROR MODE ACTIVE 💀</div>
      </div>
    );
  }

  if (!showActivator) return null;

  return (
    <div className="horror-activator">
      <button
        onClick={handleActivateHorror}
        className="horror-activate-button"
        title="Activate Horror Theme - Enter Crystal Lake..."
      >
        🎃 Enter Crystal Lake
      </button>
    </div>
  );
};

export default React.memo(HorrorThemeActivator);
