import React, { useEffect, useState } from 'react';
import { useTheme } from '../utils/useTheme';

// Direct horror effects force function
const forceHorrorEffectsNow = () => {
  console.log('🎃 FORCING HORROR EFFECTS DIRECTLY...');

  // Force add horror classes to body and html
  document.body.classList.add('horror-theme', 'horror-film-grain');
  document.documentElement.classList.add('horror-theme');

  // Force change page title
  document.title = '🎃 Crystal Lake Weather Station - FORCED MODE';

  // Force add blood drip to ALL headings and text
  const selector =
    'h1, h2, h3, h4, h5, h6, .temperature, .temp, .temperature-display, .city-name, .weather-description, .metric-value, .forecast-temp, .weather-title, .location-title';
  const elements = document.querySelectorAll(selector);

  console.log(`🩸 Adding blood drip to ${elements.length} elements`);

  elements.forEach((element, index) => {
    (element as HTMLElement).classList.add('horror-blood-drip');
    (element as HTMLElement).style.setProperty(
      'animation',
      'bloodDrip 4s infinite ease-in-out',
      'important',
    );
    (element as HTMLElement).style.setProperty(
      'filter',
      'drop-shadow(0 2px 10px rgba(139, 0, 0, 0.8))',
      'important',
    );
    (element as HTMLElement).style.setProperty(
      'text-shadow',
      '0 0 10px rgba(139, 0, 0, 0.8)',
      'important',
    );
    console.log(
      `Added blood drip to element ${index + 1}:`,
      element.tagName,
      element.className,
    );
  });

  // Force add flickering to weather cards and text
  const flickerSelector =
    '.weather-card, .forecast-card, .metric-card, .weather-description, .forecast-day, .ios26-weather-card';
  const flickerElements = document.querySelectorAll(flickerSelector);

  console.log(`⚡ Adding flicker to ${flickerElements.length} elements`);

  flickerElements.forEach((element, index) => {
    (element as HTMLElement).classList.add('horror-flicker');
    (element as HTMLElement).style.setProperty(
      'animation',
      'flickeringHorror 3s infinite ease-in-out',
      'important',
    );
    console.log(
      `Added flicker to element ${index + 1}:`,
      element.tagName,
      element.className,
    );
  });

  // Force film grain overlay
  if (!document.querySelector('.horror-film-grain-overlay-forced')) {
    const overlay = document.createElement('div');
    overlay.className = 'horror-film-grain-overlay-forced';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.05) 1px, transparent 1px);
      background-size: 4px 4px, 6px 6px, 8px 8px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0.8;
      animation: filmGrainFlicker 0.1s infinite;
    `;
    document.body.appendChild(overlay);
    console.log('🌫️ Added film grain overlay');
  }

  // Force dark background
  document.body.style.setProperty(
    'background',
    'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
    'important',
  );
  document.body.style.setProperty('background-color', '#0d0d0d', 'important');

  console.log('🎃 Horror effects FORCED successfully!');
};

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
        <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '4px' }}>
          Theme: {themeName} | Body Classes:{' '}
          {document.body.className
            .split(' ')
            .filter(c => c.includes('horror'))
            .join(', ') || 'none'}
        </div>
        <button
          onClick={() => {
            // Force horror effects directly
            forceHorrorEffectsNow();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            fontSize: '12px',
            background: '#8b0000',
            border: '1px solid #ff6b6b',
            color: '#ff6b6b',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          title="Force Horror Effects (Debug)"
        >
          🩸 Force Effects
        </button>
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
      <button
        onClick={() => {
          // Force horror effects directly
          forceHorrorEffectsNow();
        }}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          background: '#8b0000',
          border: '1px solid #ff6b6b',
          color: '#ff6b6b',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'block',
        }}
        title="Force Horror Effects (Debug)"
      >
        🩸 Force Effects
      </button>
    </div>
  );
};

export default React.memo(HorrorThemeActivator);
