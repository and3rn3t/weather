// INSTANT HORROR THEME ACTIVATION - Paste this into browser console
console.log('🩸 ACTIVATING CRYSTAL LAKE HORROR THEME...');

// Nuclear horror theme activation
function instantHorrorTheme() {
  // Add horror classes
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');

  // Set localStorage
  localStorage.setItem('weather-app-theme', 'horror');

  // Create comprehensive horror styling
  const horrorStyle = document.createElement('style');
  horrorStyle.id = 'instant-horror-override';
  horrorStyle.innerHTML = `
        /* INSTANT HORROR THEME */

        /* Main Background */
        html.horror-theme, body.horror-theme, #root, .app-container {
            background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important;
            color: #ff6b6b !important;
        }

        /* Transparent Cards */
        .horror-theme .weather-card,
        .horror-theme .forecast-card,
        .horror-theme .glass-card,
        .horror-theme .card,
        .horror-theme .ios26-weather-card {
            background: transparent !important;
            border: 1px solid rgba(139, 0, 0, 0.3) !important;
            color: #ff6b6b !important;
            text-shadow: 0 0 8px rgba(139, 0, 0, 0.6) !important;
        }

        /* Text Elements */
        .horror-theme .weather-info,
        .horror-theme .forecast-item,
        .horror-theme .temperature-display,
        .horror-theme .weather-description,
        .horror-theme div:not(.mobile-navigation):not(.theme-toggle-btn) {
            background: transparent !important;
            color: #ff6b6b !important;
            text-shadow: 0 0 8px rgba(139, 0, 0, 0.6) !important;
        }

        /* Navigation - iOS26 Horror Style */
        .horror-theme .mobile-navigation,
        .horror-theme .navigation-container {
            background: rgba(0, 0, 0, 0.85) !important;
            border-top: 1px solid rgba(139, 0, 0, 0.5) !important;
            backdrop-filter: blur(20px) saturate(180%) !important;
        }

        .horror-theme .nav-button {
            background: transparent !important;
            color: rgba(255, 107, 107, 0.7) !important;
            border: none !important;
            transition: all 0.3s ease !important;
        }

        .horror-theme .nav-button.active {
            background: rgba(139, 0, 0, 0.3) !important;
            color: #ff6b6b !important;
            text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
            box-shadow: 0 0 15px rgba(139, 0, 0, 0.4) !important;
        }

        /* Theme Toggle */
        .horror-theme .theme-toggle-btn {
            background: rgba(139, 0, 0, 0.3) !important;
            color: #ff6b6b !important;
            border: 1px solid rgba(139, 0, 0, 0.5) !important;
        }

        /* Horror Glow Effects */
        .horror-theme h1, .horror-theme h2, .horror-theme h3 {
            color: #ff6b6b !important;
            text-shadow: 0 0 15px rgba(139, 0, 0, 0.8) !important;
        }

        /* Film Grain Effect */
        .horror-theme #root::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                radial-gradient(circle at 20% 80%, rgba(139, 0, 0, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(139, 0, 0, 0.03) 0%, transparent 50%);
            pointer-events: none;
            z-index: 1;
        }

        /* Flickering Animation */
        @keyframes horrorFlicker {
            0%, 98% { opacity: 1; }
            99% { opacity: 0.98; }
            100% { opacity: 1; }
        }

        .horror-theme .weather-card {
            animation: horrorFlicker 8s infinite !important;
        }
    `;

  // Remove existing horror styles and add new ones
  const existing = document.getElementById('instant-horror-override');
  if (existing) existing.remove();

  document.head.appendChild(horrorStyle);

  // Force refresh theme context if available
  try {
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('theme-change', { detail: { theme: 'horror' } })
      );
    }
  } catch (e) {
    console.log('Theme event dispatch not available');
  }

  console.log('🎭 HORROR THEME ACTIVATED! Welcome to Crystal Lake... 🏕️💀');
  console.log('Navigation should now have blood-red glow effects');
  console.log('All text should be floating transparently over dark background');
}

// Run immediately
instantHorrorTheme();

// Also run after a delay to catch any late-loading components
setTimeout(instantHorrorTheme, 1000);
setTimeout(instantHorrorTheme, 3000);
