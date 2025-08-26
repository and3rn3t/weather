/**
 * Horror Effects Debug and Force Activator
 * This script forces horror effects regardless of theme state
 */

// Debug function to check theme state
export const debugHorrorTheme = () => {
  console.log('🔍 Horror Theme Debug Info:');
  console.log('Body classes:', document.body.className);
  console.log('HTML classes:', document.documentElement.className);
  console.log(
    'Theme in localStorage:',
    localStorage.getItem('weatherAppTheme')
  );

  // Check if horror CSS is loaded
  const horrorStylesheets = Array.from(document.styleSheets).filter(sheet => {
    try {
      return sheet.href && sheet.href.includes('horror');
    } catch {
      return false;
    }
  });
  console.log('Horror stylesheets loaded:', horrorStylesheets.length);

  // Check for horror animations
  const hasBloodDripAnimation = Array.from(document.styleSheets).some(sheet => {
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          if ((rule as CSSKeyframesRule).name === 'bloodDrip') {
            return true;
          }
        }
      }
    } catch {
      // CORS or access issues
    }
    return false;
  });
  console.log('Blood drip animation found:', hasBloodDripAnimation);
};

// Force horror effects regardless of theme state
export const forceHorrorEffects = () => {
  console.log('🎃 FORCING HORROR EFFECTS...');

  // Force add horror classes to body and html
  document.body.classList.add('horror-theme', 'horror-film-grain');
  document.documentElement.classList.add('horror-theme');

  // Force change page title
  document.title = '🎃 Crystal Lake Weather Station - FORCED MODE';

  // Force add blood drip to ALL headings and text
  const selector =
    'h1, h2, h3, h4, h5, h6, .temperature, .temp, .temperature-display, .city-name, .weather-description, .metric-value, .forecast-temp';
  const elements = document.querySelectorAll(selector);

  console.log(`🩸 Adding blood drip to ${elements.length} elements`);

  elements.forEach((element, index) => {
    (element as HTMLElement).classList.add('horror-blood-drip');
    (element as HTMLElement).style.setProperty(
      'animation',
      'bloodDrip 4s infinite ease-in-out',
      'important'
    );
    (element as HTMLElement).style.setProperty(
      'filter',
      'drop-shadow(0 2px 10px rgba(139, 0, 0, 0.8))',
      'important'
    );
    console.log(
      `Added blood drip to element ${index + 1}:`,
      element.tagName,
      element.className
    );
  });

  // Force add flickering to weather cards and text
  const flickerSelector =
    '.weather-card, .forecast-card, .metric-card, .weather-description, .forecast-day';
  const flickerElements = document.querySelectorAll(flickerSelector);

  console.log(`⚡ Adding flicker to ${flickerElements.length} elements`);

  flickerElements.forEach((element, index) => {
    (element as HTMLElement).classList.add('horror-flicker');
    (element as HTMLElement).style.setProperty(
      'animation',
      'flickeringHorror 3s infinite ease-in-out',
      'important'
    );
    console.log(
      `Added flicker to element ${index + 1}:`,
      element.tagName,
      element.className
    );
  });

  // Force film grain overlay
  if (!document.querySelector('.horror-film-grain-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'horror-film-grain-overlay';
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

  console.log('🎃 Horror effects FORCED successfully!');
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (
    window as unknown as {
      debugHorrorTheme?: unknown;
      forceHorrorEffects?: unknown;
    }
  ).debugHorrorTheme = debugHorrorTheme;
  (
    window as unknown as {
      debugHorrorTheme?: unknown;
      forceHorrorEffects?: unknown;
    }
  ).forceHorrorEffects = forceHorrorEffects;

  // Auto-run debug on load
  setTimeout(() => {
    debugHorrorTheme();
    console.log(
      '💀 Horror debug loaded. Run forceHorrorEffects() in console to force effects.'
    );
  }, 2000);
}
