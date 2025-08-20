// INSTANT HORROR THEME ACTIVATION
// Copy and paste this entire script into browser console

console.log('🎃 ACTIVATING CRYSTAL LAKE HORROR THEME...');

// NUCLEAR HORROR THEME ACTIVATION
function activateHorrorThemeNuclear() {
  // Remove all existing theme classes
  document.documentElement.className =
    document.documentElement.className.replace(/light-theme|dark-theme/g, '');
  document.body.className = document.body.className.replace(
    /light-theme|dark-theme/g,
    ''
  );

  // Add horror theme classes
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');

  // FORCE horror styling with inline CSS (highest specificity)
  const horrorStyle = document.createElement('style');
  horrorStyle.id = 'nuclear-horror-override';
  horrorStyle.innerHTML = `
    /* NUCLEAR HORROR THEME OVERRIDE */
    html.horror-theme,
    html.horror-theme *,
    body.horror-theme,
    body.horror-theme *,
    .horror-theme,
    .horror-theme *,
    #root,
    .app-container,
    .main-content,
    main,
    section {
      background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
      background-color: #0d0d0d !important;
      color: #ff6b6b !important;
    }

    /* Preserve card styling */
    .horror-theme .weather-card,
    .horror-theme .forecast-card {
      background: rgba(26, 0, 0, 0.95) !important;
      border: 1px solid #8b0000 !important;
      color: #ff6b6b !important;
    }

    /* Horror navigation */
    .horror-theme .mobile-navigation,
    .horror-theme .navigation {
      background: rgba(0, 0, 0, 0.95) !important;
      border-top: 1px solid #8b0000 !important;
    }

    /* Horror text */
    .horror-theme h1,
    .horror-theme h2,
    .horror-theme h3,
    .horror-theme p,
    .horror-theme span {
      color: #ff6b6b !important;
      text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
    }

    /* Horror buttons */
    .horror-theme button {
      background: rgba(139, 0, 0, 0.8) !important;
      color: #ffffff !important;
      border: 1px solid #ff6b6b !important;
    }

    /* Flickering animation */
    @keyframes flickering {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .horror-theme h1,
    .horror-theme .city-name {
      animation: flickering 2s infinite !important;
    }
  `;

  // Remove any existing override styles
  const existingStyle = document.getElementById('nuclear-horror-override');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Add the new horror styles
  document.head.appendChild(horrorStyle);

  // Apply inline styles as backup
  document.body.style.setProperty(
    'background',
    'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
    'important'
  );
  document.body.style.setProperty('background-color', '#0d0d0d', 'important');
  document.body.style.setProperty('color', '#ff6b6b', 'important');

  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty(
      'background',
      'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
      'important'
    );
    root.style.setProperty('color', '#ff6b6b', 'important');
  }

  // Update localStorage
  localStorage.setItem('weather-app-theme', 'horror');

  // Update page title
  document.title = '🎃 Crystal Lake Weather Station';

  // Add horror quote
  if (!document.querySelector('.horror-quote-overlay')) {
    const quote = document.createElement('div');
    quote.className = 'horror-quote-overlay';
    quote.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(139, 0, 0, 0.95);
      color: #ffffff;
      padding: 15px 25px;
      border-radius: 8px;
      font-family: 'Creepster', cursive, monospace;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 0 30px rgba(139, 0, 0, 0.8);
      animation: flickering 3s infinite;
      text-align: center;
      max-width: 90%;
      border: 1px solid #ff6b6b;
    `;
    quote.innerHTML =
      '🏚️ "Welcome to Crystal Lake... you\'ll never leave." 🔪<br><small>- Camp Crystal Lake Weather Station</small>';
    document.body.appendChild(quote);
  }

  console.log('🦇 NUCLEAR HORROR THEME ACTIVATED!');
  console.log('🎃 Crystal Lake Weather Station is now fully operational!');
  console.log(
    '🩸 If you still see purple, try refreshing the page and running this script again.'
  );
}

// Execute immediately
activateHorrorThemeNuclear();

// Make it available globally
window.activateHorrorThemeNuclear = activateHorrorThemeNuclear;
