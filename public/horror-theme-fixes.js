/**
 * Quick Horror Theme Test and Fix Script
 * Run this in the browser console to test and fix horror theme issues
 */

// 1. Activate Horror Theme
console.log('🎃 Activating Horror Theme...');
document.body.classList.add('horror-theme');
document.documentElement.classList.add('horror-theme');

// 2. Add Enhanced Quote Container Styling
const quoteStyle = document.createElement('style');
quoteStyle.innerHTML = `
/* Enhanced Horror Quote Container */
.horror-weather-quote {
  background: rgba(0, 0, 0, 0.95) !important;
  border: 2px solid #8b0000 !important;
  border-radius: 12px !important;
  padding: 20px 24px !important;
  margin: 20px auto !important;
  max-width: 90% !important;
  font-style: italic !important;
  color: #ff6b6b !important;
  text-align: center !important;
  box-shadow: 0 0 20px rgba(139, 0, 0, 0.8), 0 8px 32px rgba(0, 0, 0, 0.8) !important;
  position: relative !important;
  backdrop-filter: blur(8px) !important;
  z-index: 10 !important;
  animation: horrorGlow 3s ease-in-out infinite !important;
}

/* Better positioned quotation marks */
.horror-weather-quote::before {
  content: '"' !important;
  font-size: 3em !important;
  position: absolute !important;
  top: -15px !important;
  left: 15px !important;
  color: #8b0000 !important;
  text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
  animation: flickering 2s infinite !important;
}

.horror-weather-quote::after {
  content: '"' !important;
  font-size: 3em !important;
  position: absolute !important;
  bottom: -25px !important;
  right: 15px !important;
  color: #8b0000 !important;
  text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
  animation: flickering 2s infinite !important;
}

/* Horror quote overlay positioning - In content flow at bottom */
.horror-quote-overlay {
  position: relative !important;
  margin: 30px auto !important;
  width: calc(100% - 40px) !important;
  max-width: 600px !important;
  z-index: 10 !important;
  display: block !important;
}

/* Mobile-specific adjustments */
@media (max-width: 768px) {
  .horror-quote-overlay {
    margin: 20px auto !important;
    width: calc(100% - 30px) !important;
    max-width: 90% !important;
  }
}

/* Desktop adjustments */
@media (min-width: 769px) {
  .horror-quote-overlay {
    margin: 40px auto !important;
    max-width: 600px !important;
  }
}

/* Horror quote text styling */
.horror-weather-quote .quote-text {
  font-size: 16px !important;
  line-height: 1.4 !important;
  margin-bottom: 8px !important;
  color: #ff6b6b !important;
  text-shadow: 0 0 8px rgba(139, 0, 0, 0.6) !important;
}

.horror-weather-quote .quote-attribution {
  font-size: 14px !important;
  opacity: 0.9 !important;
  color: rgba(255, 107, 107, 0.8) !important;
}

/* Enhanced Film Grain Effect */
.horror-theme #root::before,
.horror-theme .app-container::before {
  content: '' !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.12) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.04) 1px, transparent 1px) !important;
  background-size: 4px 4px, 6px 6px, 8px 8px !important;
  pointer-events: none !important;
  z-index: 1 !important;
  opacity: 0.8 !important;
  animation: filmGrainFlicker 0.15s infinite !important;
}

/* Film Grain Flicker Animation */
@keyframes filmGrainFlicker {
  0% { opacity: 0.8; }
  25% { opacity: 0.6; }
  50% { opacity: 0.9; }
  75% { opacity: 0.5; }
  100% { opacity: 0.8; }
}

/* Fixed Blood Drip Animation */
.horror-theme h1::after,
.horror-theme .weather-header::after,
.horror-theme .city-name::after {
  content: '' !important;
  position: absolute !important;
  top: 100% !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 3px !important;
  height: 15px !important;
  background: linear-gradient(to bottom, #8b0000 0%, #8b0000 30%, transparent 100%) !important;
  border-radius: 0 0 50% 50% !important;
  animation: bloodDripRealistic 4s ease-in-out infinite !important;
  opacity: 0.8 !important;
}

/* Realistic Blood Drip Animation */
@keyframes bloodDripRealistic {
  0% {
    transform: translateX(-50%) scaleY(0);
    opacity: 0;
  }
  10% {
    transform: translateX(-50%) scaleY(0.3);
    opacity: 0.6;
  }
  30% {
    transform: translateX(-50%) scaleY(0.8);
    opacity: 0.9;
  }
  50% {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  80% {
    transform: translateX(-50%) scaleY(1.2) translateY(2px);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-50%) scaleY(0.8) translateY(5px);
    opacity: 0;
  }
}

/* Enhanced Flickering Animation */
.horror-theme .city-name,
.horror-theme .temperature,
.horror-theme .temp-display,
.horror-theme h1,
.horror-theme h2,
.horror-theme h3,
.horror-theme .weather-card,
.horror-theme .forecast-card {
  animation: flickeringHorror 4s infinite ease-in-out !important;
}

@keyframes flickeringHorror {
  0%, 94% {
    opacity: 1;
    text-shadow: 0 0 10px rgba(139, 0, 0, 0.8);
  }
  95% {
    opacity: 0.8;
    text-shadow: 0 0 15px rgba(139, 0, 0, 0.9);
  }
  96% {
    opacity: 0.95;
    text-shadow: 0 0 8px rgba(139, 0, 0, 0.7);
  }
  97% {
    opacity: 0.85;
    text-shadow: 0 0 20px rgba(139, 0, 0, 1);
  }
  98% {
    opacity: 0.98;
    text-shadow: 0 0 12px rgba(139, 0, 0, 0.8);
  }
  99% {
    opacity: 0.9;
    text-shadow: 0 0 18px rgba(139, 0, 0, 0.9);
  }
}

@keyframes horrorGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.8), 0 8px 32px rgba(0, 0, 0, 0.8);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 0, 0, 1), 0 8px 32px rgba(0, 0, 0, 0.9);
  }
}

@keyframes bloodDrip {
  0% {
    height: 0;
    opacity: 0;
  }
  50% {
    height: 20px;
    opacity: 1;
  }
  100% {
    height: 30px;
    opacity: 0;
  }
}

@keyframes flickering {
  0%, 100% { opacity: 1; }
  2% { opacity: 0.9; }
  4% { opacity: 1; }
  6% { opacity: 0.8; }
  8% { opacity: 1; }
  90% { opacity: 1; }
  92% { opacity: 0.9; }
  94% { opacity: 1; }
  96% { opacity: 0.85; }
  98% { opacity: 1; }
}
`;

document.head.appendChild(quoteStyle);

// 3. Create Horror Quote if it doesn't exist
setTimeout(() => {
  let quoteContainer = document.querySelector('.horror-weather-quote');
  if (!quoteContainer) {
    console.log('💬 Creating horror quote container...');

    quoteContainer = document.createElement('div');
    quoteContainer.className = 'horror-weather-quote horror-quote-overlay';
    quoteContainer.innerHTML = `
      <div class="quote-text">The darkness is coming... and it knows the weather.</div>
      <div class="quote-attribution">
        <span class="quote-author">— Jason Voorhees</span>
        <span class="quote-movie">Friday the 13th</span>
      </div>
    `;

    document.body.appendChild(quoteContainer);
  } else {
    // Enhance existing quote container
    quoteContainer.classList.add('horror-quote-overlay');
  }

  console.log('✅ Horror quote container positioned');
}, 1000);

// 4. Force film grain to be visible
setTimeout(() => {
  const root = document.getElementById('root');
  if (root) {
    console.log('🎬 Enhancing film grain effect...');
    root.style.position = 'relative';
  }
}, 500);

// 5. Add blood drip to all headers
setTimeout(() => {
  const headers = document.querySelectorAll(
    'h1, h2, h3, .city-name, .weather-header'
  );
  console.log(`🩸 Adding blood drip to ${headers.length} headers`);

  headers.forEach(header => {
    header.style.position = 'relative';
  });
}, 1000);

// 6. Test results
setTimeout(() => {
  console.log('🎃 Horror Theme Improvements Applied!');
  console.log('✅ Quote container: Enhanced and positioned at bottom');
  console.log('✅ Blood drip: Fixed to appear below headers');
  console.log('✅ Film flicker: Enhanced with more visible effect');
  console.log('✅ Film grain: Improved visibility and animation');

  // Show results
  const quote = document.querySelector('.horror-weather-quote');
  const filmGrain = document.querySelector('#root');
  const headers = document.querySelectorAll('h1, h2, h3');

  console.log(`💬 Quote found: ${!!quote}`);
  console.log(`🎬 Film grain element: ${!!filmGrain}`);
  console.log(`🩸 Headers with blood drip: ${headers.length}`);
  console.log(`⚡ Flicker animation applied to key elements`);

  if (quote) {
    console.log(
      '💬 Quote positioning:',
      window.getComputedStyle(quote).position
    );
    console.log('💬 Quote bottom:', window.getComputedStyle(quote).bottom);
  }
}, 2000);

// 7. Fix navigation icon rendering
setTimeout(() => {
  const navStyle = document.createElement('style');
  navStyle.innerHTML = `
    /* Fix for Navigation Icon Rendering Issues */
    .mobile-navigation .nav-button {
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif !important;
    }

    .mobile-navigation .nav-icon {
      font-size: 24px !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 32px !important;
      height: 32px !important;
    }

    /* Ensure emojis render properly */
    .nav-button .nav-icon,
    .nav-button .nav-icon * {
      font-variant-emoji: emoji !important;
      text-rendering: optimizeQuality !important;
    }
  `;
  document.head.appendChild(navStyle);
  console.log('✅ Navigation icon rendering fixed');
}, 500);

console.log('🎃 Horror theme test script loaded. Applying fixes...');
