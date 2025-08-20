// NUCLEAR HORROR THEME - GLASSMORPHIC NAVIGATION FIX
// Paste this into browser console for the complete Crystal Lake horror experience

console.log(
  '🩸💀 NUCLEAR CRYSTAL LAKE HORROR THEME - GLASSMORPHIC VERSION 💀🩸'
);

// Nuclear activation
document.documentElement.classList.add('horror-theme');
document.body.classList.add('horror-theme');
const root = document.getElementById('root');
if (root) root.classList.add('horror-theme');
localStorage.setItem('weather-app-theme', 'horror');

// Remove ALL existing horror styles
const existingStyles = document.querySelectorAll('style[id*="horror"]');
existingStyles.forEach(style => style.remove());

// Create NUCLEAR glassmorphic horror styling
const nuclearStyle = document.createElement('style');
nuclearStyle.id = 'nuclear-horror-glassmorphic';
nuclearStyle.innerHTML = `
/* 🩸 NUCLEAR CRYSTAL LAKE HORROR THEME - GLASSMORPHIC 🩸 */

/* MAIN BACKGROUND */
html.horror-theme,
body.horror-theme,
#root.horror-theme,
.horror-theme #root {
    background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
    color: #ff6b6b !important;
    min-height: 100vh !important;
}

/* NUCLEAR OVERRIDE - REMOVE ALL BLACK BACKGROUNDS */
.horror-theme *:not(.mobile-navigation):not(.nav-button) {
    background: transparent !important;
    background-color: transparent !important;
    color: #ff6b6b !important;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.7) !important;
}

/* GLASSMORPHIC NAVIGATION BAR - CRYSTAL LAKE STYLE */
.horror-theme .mobile-navigation {
    background: rgba(15, 15, 15, 0.75) !important;
    backdrop-filter: blur(25px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(25px) saturate(200%) !important;
    border: none !important;
    border-top: 1px solid rgba(139, 0, 0, 0.3) !important;
    box-shadow:
        0 -8px 32px rgba(139, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 80px !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-around !important;
    padding: 8px 16px !important;
}

/* GLASSMORPHIC NAVIGATION BUTTONS - NO BOXES */
.horror-theme .nav-button {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    border-radius: 16px !important;
    color: rgba(255, 107, 107, 0.6) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    width: 64px !important;
    height: 64px !important;
    margin: 0 8px !important;
    padding: 8px !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer !important;
    position: relative !important;
    overflow: hidden !important;
    box-shadow: none !important;
    outline: none !important;
    -webkit-tap-highlight-color: transparent !important;
}

/* ACTIVE NAVIGATION BUTTON - GLASSMORPHIC GLOW */
.horror-theme .nav-button.active {
    background: rgba(139, 0, 0, 0.2) !important;
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    color: #ff6b6b !important;
    transform: scale(1.05) translateY(-2px) !important;
    box-shadow:
        0 8px 25px rgba(139, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 107, 107, 0.2),
        0 0 20px rgba(139, 0, 0, 0.3) !important;
    border: 1px solid rgba(139, 0, 0, 0.3) !important;
    text-shadow: 0 0 15px rgba(139, 0, 0, 0.9) !important;
}

/* NAVIGATION BUTTON HOVER */
.horror-theme .nav-button:hover:not(.active) {
    background: rgba(139, 0, 0, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    color: rgba(255, 107, 107, 0.8) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 15px rgba(139, 0, 0, 0.2) !important;
}

/* NAVIGATION ICONS */
.horror-theme .nav-button svg {
    width: 24px !important;
    height: 24px !important;
    filter: drop-shadow(0 0 8px rgba(139, 0, 0, 0.6)) !important;
    color: inherit !important;
    fill: currentColor !important;
    margin-bottom: 4px !important;
}

/* NAVIGATION LABELS */
.horror-theme .nav-button span {
    font-size: 11px !important;
    font-weight: 500 !important;
    color: inherit !important;
    text-shadow: inherit !important;
    letter-spacing: 0.3px !important;
}

/* CARDS - PURE TRANSPARENT */
.horror-theme .weather-card,
.horror-theme .forecast-card,
.horror-theme .glass-card,
.horror-theme .card,
.horror-theme .ios26-weather-card {
    background: transparent !important;
    background-color: transparent !important;
    border: 1px solid rgba(139, 0, 0, 0.15) !important;
    border-radius: 16px !important;
    backdrop-filter: blur(3px) !important;
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.1) !important;
    color: #ff6b6b !important;
    text-shadow: 0 0 12px rgba(139, 0, 0, 0.8) !important;
    padding: 20px !important;
    margin: 16px !important;
}

/* ALL TEXT ELEMENTS */
.horror-theme h1,
.horror-theme h2,
.horror-theme h3,
.horror-theme h4,
.horror-theme h5,
.horror-theme h6,
.horror-theme p,
.horror-theme span,
.horror-theme div {
    color: #ff6b6b !important;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.7) !important;
    background: transparent !important;
}

/* HEADERS WITH STRONGER GLOW */
.horror-theme h1,
.horror-theme h2,
.horror-theme h3 {
    text-shadow: 0 0 20px rgba(139, 0, 0, 0.9) !important;
    font-weight: 700 !important;
}

/* THEME TOGGLE BUTTON */
.horror-theme .theme-toggle-btn {
    background: rgba(139, 0, 0, 0.25) !important;
    backdrop-filter: blur(15px) !important;
    border: 1px solid rgba(139, 0, 0, 0.4) !important;
    color: #ff6b6b !important;
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.3) !important;
}

/* FILM GRAIN OVERLAY */
.horror-theme #root::before {
    content: '' !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-image:
        radial-gradient(circle at 25% 75%, rgba(139, 0, 0, 0.02) 0%, transparent 50%),
        radial-gradient(circle at 75% 25%, rgba(139, 0, 0, 0.02) 0%, transparent 50%) !important;
    pointer-events: none !important;
    z-index: 1 !important;
    opacity: 0.7 !important;
}

/* SUBTLE FLICKERING ANIMATION */
@keyframes crystalLakeFlicker {
    0%, 96%, 100% { opacity: 1; }
    97% { opacity: 0.97; }
    98% { opacity: 0.99; }
    99% { opacity: 0.98; }
}

.horror-theme .nav-button.active {
    animation: crystalLakeFlicker 12s infinite !important;
}

/* REMOVE ANY REMAINING BACKGROUNDS */
.horror-theme .weather-app,
.horror-theme .app-container,
.horror-theme .main-content,
.horror-theme .screen-container,
.horror-theme .forecast-list,
.horror-theme .metrics-grid {
    background: transparent !important;
    background-color: transparent !important;
}
`;

// Apply the nuclear styling
document.head.appendChild(nuclearStyle);

console.log('🎭 NUCLEAR CRYSTAL LAKE HORROR THEME ACTIVATED!');
console.log('🏕️ Welcome to Camp Crystal Lake...');
console.log('💀 Navigation should now be glassmorphic with horror glow');
console.log('🩸 All text should float transparently over dark background');
console.log('⚡ No more black boxes or backgrounds!');

// Force a small delay and reapply classes to ensure everything takes
setTimeout(() => {
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');
  const root = document.getElementById('root');
  if (root) root.classList.add('horror-theme');
}, 100);
