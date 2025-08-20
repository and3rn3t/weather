// ENHANCED HORROR THEME - FIXES COMPONENT STYLING
console.log('🎃 ENHANCED CRYSTAL LAKE HORROR THEME...');

function enhancedHorrorActivation() {
  // Add horror theme classes
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');

  // Create enhanced horror styling
  const existingStyle = document.getElementById('enhanced-horror-override');
  if (existingStyle) existingStyle.remove();

  const enhancedStyle = document.createElement('style');
  enhancedStyle.id = 'enhanced-horror-override';
  enhancedStyle.innerHTML = `
    /* ENHANCED HORROR THEME - COMPONENT FIXES */

    /* Main background */
    html.horror-theme, body.horror-theme, #root, .app-container {
      background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
      background-color: #0d0d0d !important;
      color: #ff6b6b !important;
    }

    /* FIX COMPONENT GAPS - Transparent text containers */
    .horror-theme .weather-card,
    .horror-theme .forecast-card,
    .horror-theme .glass-card,
    .horror-theme .card,
    .horror-theme .ios26-weather-card {
      background: transparent !important;
      border: 1px solid rgba(139, 0, 0, 0.3) !important;
      border-radius: 12px !important;
      box-shadow: 0 0 20px rgba(139, 0, 0, 0.2) !important;
      margin: 12px !important;
      padding: 20px !important;
      color: #ff6b6b !important;
      backdrop-filter: blur(5px) !important;
    }

    /* Transparent text sections - clean look */
    .horror-theme .weather-info,
    .horror-theme .forecast-item,
    .horror-theme .weather-detail,
    .horror-theme .metric-item,
    .horror-theme .temperature-display,
    .horror-theme .weather-description {
      background: transparent !important;
      backdrop-filter: none !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* Subtle cards only where needed */
    .horror-theme .weather-card:hover,
    .horror-theme .forecast-card:hover {
      background: rgba(26, 0, 0, 0.1) !important;
      box-shadow: 0 0 30px rgba(139, 0, 0, 0.4) !important;
    }

    /* REMOVE BLUE BORDERS */
    .horror-theme * {
      border-color: #8b0000 !important;
    }

    /* Main container fixes */
    .horror-theme .main-content,
    .horror-theme .screen-container,
    .horror-theme .weather-display {
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      padding: 16px !important;
    }

    /* Navigation fixes */
    .horror-theme .mobile-navigation {
      background: rgba(0, 0, 0, 0.95) !important;
      border-top: 2px solid #8b0000 !important;
      backdrop-filter: blur(10px) !important;
    }

    /* Button fixes */
    .horror-theme button {
      background: rgba(139, 0, 0, 0.8) !important;
      color: #ffffff !important;
      border: 1px solid #ff6b6b !important;
      border-radius: 8px !important;
      padding: 10px 16px !important;
      transition: all 0.3s ease !important;
    }

    .horror-theme button:hover {
      background: rgba(139, 0, 0, 1) !important;
      box-shadow: 0 0 20px rgba(139, 0, 0, 0.8) !important;
      transform: translateY(-1px) !important;
    }

    /* Text styling */
    .horror-theme h1, .horror-theme h2, .horror-theme h3,
    .horror-theme .city-name, .horror-theme .temperature {
      color: #ff6b6b !important;
      text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
    }

    /* Weather icons */
    .horror-theme .weather-icon,
    .horror-theme svg {
      filter: drop-shadow(0 0 8px rgba(139, 0, 0, 0.8)) !important;
      color: #ff6b6b !important;
    }

    /* Grid and container spacing fixes */
    .horror-theme .forecast-grid,
    .horror-theme .weather-metrics,
    .horror-theme .metrics-grid {
      gap: 16px !important;
      padding: 16px !important;
      background: transparent !important;
      margin: 0 !important;
    }

    /* Theme toggle button */
    .horror-theme .theme-toggle-btn {
      background: rgba(0, 0, 0, 0.8) !important;
      border: 1px solid #8b0000 !important;
      color: #ff6b6b !important;
      font-size: 1.5rem !important;
    }

    /* Flickering animation for atmosphere */
    @keyframes flickering {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .horror-theme h1,
    .horror-theme .city-name {
      animation: flickering 2s infinite !important;
    }

    /* Remove any remaining blue/purple elements */
    .horror-theme .gradient-bg,
    .horror-theme .bg-gradient {
      background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
    }
  `;

  document.head.appendChild(enhancedStyle);

  // Apply direct inline styles for absolute control
  document.body.style.setProperty(
    'background',
    'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
    'important'
  );
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

  // Fix any remaining components
  const cards = document.querySelectorAll(
    '.weather-card, .forecast-card, .card, .glass-card'
  );
  cards.forEach(card => {
    card.style.setProperty('background', 'rgba(26, 0, 0, 0.9)', 'important');
    card.style.setProperty('border', '1px solid #8b0000', 'important');
    card.style.setProperty('color', '#ff6b6b', 'important');
  });

  // Update page elements
  document.title = '🎃 Crystal Lake Weather Station';
  localStorage.setItem('weather-app-theme', 'horror');

  // Add atmosphere quote
  if (!document.querySelector('.crystal-lake-quote')) {
    const quote = document.createElement('div');
    quote.className = 'crystal-lake-quote';
    quote.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(139, 0, 0, 0.95);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Georgia', serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 0 30px rgba(139, 0, 0, 0.8);
      animation: flickering 3s infinite;
      text-align: center;
      max-width: 90%;
      border: 1px solid #ff6b6b;
      font-style: italic;
    `;
    quote.innerHTML =
      '🏚️ "Welcome to Crystal Lake Weather Station... you\'ll never leave." 🔪';
    document.body.appendChild(quote);
  }

  console.log('🦇 ENHANCED HORROR THEME APPLIED!');
  console.log('🎃 Component styling fixed - no more gaps or blue borders!');
}

// Execute enhanced activation
enhancedHorrorActivation();

// Make globally available
window.enhancedHorrorActivation = enhancedHorrorActivation;
