// EMERGENCY CONSOLE HORROR ACTIVATION - TRANSPARENT CLEAN VERSION
// Copy and paste this entire block into your browser console

console.log('🩸 CLEAN TRANSPARENT HORROR THEME ACTIVATION...');

// Step 1: Add horror classes
document.documentElement.classList.add('horror-theme');
document.body.classList.add('horror-theme');
const rootEl = document.getElementById('root');
if (rootEl) rootEl.classList.add('horror-theme');

// Step 2: Set localStorage
localStorage.setItem('weather-app-theme', 'horror');

// Step 3: Create CLEAN horror styling (no black backgrounds)
const horrorStyle = document.createElement('style');
horrorStyle.id = 'emergency-horror-style';
horrorStyle.innerHTML = `
/* CLEAN TRANSPARENT HORROR THEME - NO BLACK BACKGROUNDS */
html.horror-theme, body.horror-theme, #root {
    background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
    color: #ff6b6b !important;
}

/* TRANSPARENT CARDS - NO BLACK BACKGROUNDS */
.horror-theme .weather-card,
.horror-theme .forecast-card,
.horror-theme .glass-card,
.horror-theme .card,
.horror-theme .ios26-weather-card {
    background: transparent !important;
    background-color: transparent !important;
    border: 1px solid rgba(139, 0, 0, 0.2) !important;
    color: #ff6b6b !important;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
    backdrop-filter: blur(2px) !important;
}

/* TRANSPARENT CONTAINERS - NO BLACK BACKGROUNDS */
.horror-theme .weather-info,
.horror-theme .forecast-item,
.horror-theme .weather-detail,
.horror-theme .metric-item,
.horror-theme .temperature-display,
.horror-theme .weather-description,
.horror-theme .weather-summary,
.horror-theme .forecast-list,
.horror-theme .metrics-grid,
.horror-theme div:not(.mobile-navigation):not(.theme-toggle-btn) {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    color: #ff6b6b !important;
    text-shadow: 0 0 8px rgba(139, 0, 0, 0.6) !important;
}

/* CLEAN NAVIGATION - NO BLACK BOXES */
.horror-theme .mobile-navigation {
    background: rgba(0, 0, 0, 0.85) !important;
    border-top: 1px solid rgba(139, 0, 0, 0.5) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
}

.horror-theme .nav-button {
    background: transparent !important;
    background-color: transparent !important;
    color: rgba(255, 107, 107, 0.7) !important;
    border: none !important;
    box-shadow: none !important;
    transition: all 0.3s ease !important;
    margin: 4px 8px !important;
    padding: 12px 16px !important;
    border-radius: 12px !important;
}

.horror-theme .nav-button.active {
    background: rgba(139, 0, 0, 0.3) !important;
    background-color: rgba(139, 0, 0, 0.3) !important;
    color: #ff6b6b !important;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
    box-shadow: 0 0 15px rgba(139, 0, 0, 0.4) !important;
    border: none !important;
}

.horror-theme .nav-button:hover {
    background: rgba(139, 0, 0, 0.15) !important;
    color: #ff6b6b !important;
    transform: translateY(-1px) !important;
}

/* NAVIGATION ICONS */
.horror-theme .nav-button svg {
    filter: drop-shadow(0 0 8px rgba(139, 0, 0, 0.6)) !important;
    color: inherit !important;
}

/* ALL TEXT ELEMENTS */
.horror-theme * {
    color: #ff6b6b !important;
    text-shadow: 0 0 8px rgba(139, 0, 0, 0.6) !important;
}

/* HEADERS WITH STRONGER GLOW */
.horror-theme h1, .horror-theme h2, .horror-theme h3 {
    color: #ff6b6b !important;
    text-shadow: 0 0 15px rgba(139, 0, 0, 0.8) !important;
}

/* THEME TOGGLE BUTTON */
.horror-theme .theme-toggle-btn {
    background: rgba(139, 0, 0, 0.3) !important;
    color: #ff6b6b !important;
    border: 1px solid rgba(139, 0, 0, 0.5) !important;
}

/* REMOVE ANY DEFAULT BACKGROUNDS */
.horror-theme .weather-app,
.horror-theme .app-container,
.horror-theme .main-content,
.horror-theme .screen-container {
    background: transparent !important;
    background-color: transparent !important;
}

/* FILM GRAIN EFFECT */
.horror-theme #root::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        radial-gradient(circle at 20% 80%, rgba(139, 0, 0, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
}
`;
.horror-theme .forecast-card,
.horror-theme .glass-card,
.horror-theme .card {
    background: transparent !important;
    border: 1px solid rgba(139, 0, 0, 0.3) !important;
    backdrop-filter: blur(2px) !important;
}

.horror-theme .mobile-navigation {
    background: rgba(0, 0, 0, 0.85) !important;
    border-top: 1px solid rgba(139, 0, 0, 0.5) !important;
    backdrop-filter: blur(20px) !important;
}

.horror-theme .nav-button {
    color: rgba(255, 107, 107, 0.7) !important;
    background: transparent !important;
    border: none !important;
}

.horror-theme .nav-button.active {
    color: #ff6b6b !important;
    background: rgba(139, 0, 0, 0.3) !important;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
    box-shadow: 0 0 15px rgba(139, 0, 0, 0.4) !important;
}

.horror-theme .nav-button:hover {
    color: #ff6b6b !important;
    background: rgba(139, 0, 0, 0.15) !important;
}

.horror-theme h1, .horror-theme h2, .horror-theme h3 {
    color: #ff6b6b !important;
    text-shadow: 0 0 15px rgba(139, 0, 0, 0.8) !important;
}

.horror-theme .theme-toggle-btn {
    background: rgba(139, 0, 0, 0.3) !important;
    color: #ff6b6b !important;
    border: 1px solid rgba(139, 0, 0, 0.5) !important;
}

/* Film grain effect */
.horror-theme #root::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        radial-gradient(circle at 20% 80%, rgba(139, 0, 0, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
}
`;

// Remove existing horror styles and add new one
const existingStyle = document.getElementById('emergency-horror-style');
if (existingStyle) existingStyle.remove();
document.head.appendChild(horrorStyle);

console.log('🎭 HORROR THEME ACTIVATED! Welcome to Crystal Lake! 🏕️💀');
console.log('Navigation should now have blood-red glow effects');
console.log('All text should be floating transparently over dark background');

// Also try to trigger React theme change
try {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'weather-app-theme',
      newValue: 'horror',
    })
  );
} catch (e) {
  console.log('React theme event not triggered');
}
