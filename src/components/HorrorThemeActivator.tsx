// Clean rewrite of HorrorThemeActivator to fix previous corruption
import React, { useEffect, useState } from 'react';
import { logInfo } from '../utils/logger';
import { useTheme } from '../utils/useTheme';
import './HorrorThemeActivator.css';

const forceHorrorEffectsNow = (): void => {
  logInfo('🎃 FORCING HORROR EFFECTS DIRECTLY...');
  document.body.classList.add('horror-theme', 'horror-film-grain');
  document.documentElement.classList.add('horror-theme');
  document.title = '🎃 Crystal Lake Weather Station - FORCED MODE';

  const selector =
    'h1, h2, h3, h4, h5, h6, .temperature, .temp, .temperature-display, .city-name, .weather-description, .metric-value, .forecast-temp, .weather-title, .location-title';
  const elements = document.querySelectorAll(selector);
  logInfo(`🩸 Adding blood drip to ${elements.length} elements`);
  elements.forEach((element, index) => {
    const el = element as HTMLElement;
    el.classList.add('horror-blood-drip');
    el.style.setProperty(
      'animation',
      'bloodDrip 4s infinite ease-in-out',
      'important'
    );
    el.style.setProperty(
      'filter',
      'drop-shadow(0 2px 10px rgba(139, 0, 0, 0.8))',
      'important'
    );
    el.style.setProperty(
      'text-shadow',
      '0 0 10px rgba(139, 0, 0, 0.8)',
      'important'
    );
    logInfo(
      `Added blood drip to element ${index + 1}: ${el.tagName} ${el.className}`
    );
  });

  const flickerSelector =
    '.weather-card, .forecast-card, .metric-card, .weather-description, .forecast-day, .ios26-weather-card';
  const flickerElements = document.querySelectorAll(flickerSelector);
  logInfo(`⚡ Adding flicker to ${flickerElements.length} elements`);
  flickerElements.forEach((element, index) => {
    const el = element as HTMLElement;
    el.classList.add('horror-flicker');
    el.style.setProperty(
      'animation',
      'flickeringHorror 3s infinite ease-in-out',
      'important'
    );
    logInfo(
      `Added flicker to element ${index + 1}: ${el.tagName} ${el.className}`
    );
  });

  if (!document.querySelector('.horror-film-grain-overlay-forced')) {
    const overlay = document.createElement('div');
    overlay.className = 'horror-film-grain-overlay-forced';
    overlay.style.cssText =
      'position: fixed; inset: 0; pointer-events: none; z-index: 1000; opacity: 0.8; animation: filmGrainFlicker 0.1s infinite;';
    document.body.appendChild(overlay);
    logInfo('🌫️ Added film grain overlay');
  }

  document.body.style.setProperty(
    'background',
    'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
    'important'
  );
  document.body.style.setProperty('background-color', '#0d0d0d', 'important');
};

const HorrorThemeActivator: React.FC = () => {
  const { isHorror, toggleTheme, themeName } = useTheme();
  const [showActivator, setShowActivator] = useState(false);

  useEffect(() => {
    setShowActivator(!isHorror);
  }, [isHorror]);

  useEffect(() => {
    if (isHorror) {
      document.body.classList.add('horror-film-grain');
      setTimeout(() => {
        const headers = document.querySelectorAll(
          'h1, h2, h3, .temperature-display'
        );
        headers.forEach(header =>
          (header as HTMLElement).classList.add('horror-blood-drip')
        );
        const texts = document.querySelectorAll(
          '.weather-description, .forecast-day, .metric-label'
        );
        texts.forEach(el =>
          (el as HTMLElement).classList.add('horror-flicker')
        );
      }, 500);
      document.title = '🎃 Crystal Lake Weather Station';
    } else {
      document.body.classList.remove('horror-film-grain');
      document.title = '🌤️ Weather App';
      const elements = document.querySelectorAll(
        '.horror-blood-drip, .horror-flicker'
      );
      elements.forEach(el =>
        (el as HTMLElement).classList.remove(
          'horror-blood-drip',
          'horror-flicker'
        )
      );
    }
    return () => {
      document.body.classList.remove('horror-film-grain');
      const elements = document.querySelectorAll(
        '.horror-blood-drip, .horror-flicker'
      );
      elements.forEach(el =>
        (el as HTMLElement).classList.remove(
          'horror-blood-drip',
          'horror-flicker'
        )
      );
    };
  }, [isHorror]);

  const handleActivateHorror = (): void => {
    let clicksNeeded = 0;
    switch (themeName) {
      case 'light':
        clicksNeeded = 2;
        break;
      case 'dark':
        clicksNeeded = 1;
        break;
      case 'horror':
        return;
      default:
        clicksNeeded = 2;
    }
    for (let i = 0; i < clicksNeeded; i++) {
      setTimeout(() => toggleTheme(), i * 100);
    }
  };

  if (isHorror) {
    return (
      <div className="horror-status-indicator">
        <div className="horror-status-content">💀 HORROR MODE ACTIVE 💀</div>
        <div className="horror-status-subtext">
          Theme: {themeName} | Body Classes{' '}
          {document.body.className
            .split(' ')
            .filter(c => c.includes('horror'))
            .join(', ') || 'none'}
        </div>
        <button
          onClick={forceHorrorEffectsNow}
          className="horror-force-button"
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
        onClick={forceHorrorEffectsNow}
        className="horror-force-button"
        title="Force Horror Effects (Debug)"
      >
        🩸 Force Effects
      </button>
    </div>
  );
};

export default React.memo(HorrorThemeActivator);
