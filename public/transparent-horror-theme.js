// TRANSPARENT TEXT HORROR THEME - CLEAN LOOK
console.log('🎃 APPLYING TRANSPARENT TEXT HORROR THEME...');

function transparentHorrorTheme() {
  // Add horror theme classes
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');

  // Remove any existing override styles
  const existingStyle = document.getElementById('transparent-horror-override');
  if (existingStyle) existingStyle.remove();

  const transparentStyle = document.createElement('style');
  transparentStyle.id = 'transparent-horror-override';
  transparentStyle.innerHTML = `
    /* TRANSPARENT TEXT HORROR THEME - CLEAN VERSION */

    /* Main horror background */
    html.horror-theme, body.horror-theme, #root, .app-container {
      background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
      background-color: #0d0d0d !important;
      color: #ff6b6b !important;
    }

    /* TRANSPARENT CARDS - Text floats on background */
    .horror-theme .weather-card,
    .horror-theme .forecast-card,
    .horror-theme .glass-card,
    .horror-theme .card {
      background: transparent !important;
      border: 1px solid rgba(139, 0, 0, 0.2) !important;
      border-radius: 12px !important;
      box-shadow: 0 0 15px rgba(139, 0, 0, 0.15) !important;
      margin: 16px !important;
      padding: 20px !important;
      color: #ff6b6b !important;
      backdrop-filter: blur(2px) !important;
    }

    /* TRANSPARENT TEXT CONTAINERS */
    .horror-theme .weather-info,
    .horror-theme .forecast-item,
    .horror-theme .weather-detail,
    .horror-theme .metric-item,
    .horror-theme .temperature-display,
    .horror-theme .weather-description,
    .horror-theme .weather-summary,
    .horror-theme div:not(.mobile-navigation):not(.theme-toggle-btn) {
      background: transparent !important;
      backdrop-filter: none !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* Enhanced text readability with stronger shadows */
    .horror-theme h1, .horror-theme h2, .horror-theme h3,
    .horror-theme .city-name, .horror-theme .weather-header {
      color: #ff6b6b !important;
      text-shadow:
        0 0 20px rgba(139, 0, 0, 1),
        0 0 40px rgba(139, 0, 0, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.9) !important;
      background: transparent !important;
      font-weight: bold !important;
    }

    .horror-theme p, .horror-theme span, .horror-theme .temperature,
    .horror-theme .weather-text, .horror-theme .forecast-text {
      color: #ff6b6b !important;
      text-shadow:
        0 0 15px rgba(139, 0, 0, 0.9),
        0 1px 3px rgba(0, 0, 0, 0.8) !important;
      background: transparent !important;
      font-weight: 500 !important;
    }

    /* Subtle hover effects */
    .horror-theme .weather-card:hover,
    .horror-theme .forecast-card:hover {
      background: rgba(26, 0, 0, 0.05) !important;
      box-shadow: 0 0 25px rgba(139, 0, 0, 0.3) !important;
      transform: translateY(-2px) !important;
      transition: all 0.3s ease !important;
    }

    /* Navigation stays solid for usability but iOS26 style */
    .horror-theme .mobile-navigation,
    .horror-theme .navigation-container,
    .horror-theme .ios26-navigation,
    .horror-theme .tab-bar {
      background: rgba(0, 0, 0, 0.85) !important;
      border-top: 1px solid rgba(139, 0, 0, 0.5) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      border-radius: 0 !important;
      padding: 8px 0 !important;
    }

    /* iOS26 Navigation Tabs - Clean Horror Style */
    .horror-theme .nav-button,
    .horror-theme .navigation-button,
    .horror-theme .tab-item,
    .horror-theme .ios26-tab {
      background: transparent !important;
      border: none !important;
      color: rgba(255, 107, 107, 0.7) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border-radius: 12px !important;
      margin: 4px 8px !important;
      padding: 12px 16px !important;
      backdrop-filter: none !important;
      box-shadow: none !important;
    }

    /* Active/Selected Tab State */
    .horror-theme .nav-button.active,
    .horror-theme .navigation-button.active,
    .horror-theme .tab-item.active,
    .horror-theme .ios26-tab.active {
      background: rgba(139, 0, 0, 0.3) !important;
      color: #ff6b6b !important;
      text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
      box-shadow: 0 0 15px rgba(139, 0, 0, 0.4) !important;
    }

    /* Hover State for Tabs */
    .horror-theme .nav-button:hover,
    .horror-theme .navigation-button:hover,
    .horror-theme .tab-item:hover {
      background: rgba(139, 0, 0, 0.15) !important;
      color: #ff6b6b !important;
      transform: translateY(-1px) !important;
    }

    /* Tab Icons */
    .horror-theme .nav-button svg,
    .horror-theme .tab-item svg,
    .horror-theme .navigation-icon {
      filter: drop-shadow(0 0 8px rgba(139, 0, 0, 0.6)) !important;
      color: inherit !important;
    }

    /* Buttons remain visible */
    .horror-theme button {
      background: rgba(139, 0, 0, 0.8) !important;
      color: #ffffff !important;
      border: 1px solid #ff6b6b !important;
      border-radius: 8px !important;
      padding: 10px 16px !important;
    }

    /* Weather icons with glow */
    .horror-theme .weather-icon,
    .horror-theme svg {
      filter: drop-shadow(0 0 12px rgba(139, 0, 0, 0.8)) !important;
      color: #ff6b6b !important;
    }

    /* Remove any remaining dark backgrounds */
    .horror-theme .main-content,
    .horror-theme .screen-container,
    .horror-theme .weather-display,
    .horror-theme .content-area {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Flickering animation for atmosphere */
    @keyframes flickering {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.9; }
    }

    .horror-theme .city-name,
    .horror-theme h1 {
      animation: flickering 3s infinite !important;
    }
  `;

  document.head.appendChild(transparentStyle);

  // Apply background to body and root
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

  // Force transparent backgrounds on text containers
  const textContainers = document.querySelectorAll(
    '.weather-card, .forecast-card, .card, .weather-info, .weather-detail'
  );
  textContainers.forEach(container => {
    container.style.setProperty('background', 'transparent', 'important');
  });

  // Update page
  document.title = '🎃 Crystal Lake Weather Station';
  localStorage.setItem('weather-app-theme', 'horror');

  console.log('👻 TRANSPARENT TEXT HORROR THEME APPLIED!');
  console.log('🔍 Text now floats cleanly on the horror background');
}

// Execute immediately
transparentHorrorTheme();

// Make globally available
window.transparentHorrorTheme = transparentHorrorTheme;
