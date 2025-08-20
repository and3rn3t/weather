// HORROR THEME ACTIVATION BUTTON
// Add this to any page to get a button to activate horror theme

function createHorrorActivationButton() {
  // Remove existing button if present
  const existingButton = document.getElementById('horror-activation-btn');
  if (existingButton) existingButton.remove();

  // Create button
  const button = document.createElement('button');
  button.id = 'horror-activation-btn';
  button.innerHTML = '🩸 ACTIVATE HORROR THEME 💀';
  button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        background: linear-gradient(45deg, #8b0000, #4a0000);
        color: #ff6b6b;
        border: 2px solid #ff6b6b;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(139, 0, 0, 0.5);
        text-shadow: 0 0 10px rgba(139, 0, 0, 0.8);
        transition: all 0.3s ease;
    `;

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 0 30px rgba(139, 0, 0, 0.8)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 0 20px rgba(139, 0, 0, 0.5)';
  });

  // Click handler
  button.addEventListener('click', () => {
    console.log('🩸 ACTIVATING CRYSTAL LAKE HORROR THEME...');

    // Add horror classes
    document.documentElement.classList.add('horror-theme');
    document.body.classList.add('horror-theme');

    // Set localStorage
    localStorage.setItem('weather-app-theme', 'horror');

    // Force theme context update if available
    try {
      // Trigger React context update
      window.dispatchEvent(
        new CustomEvent('storage', {
          key: 'weather-app-theme',
          newValue: 'horror',
        })
      );
    } catch (e) {
      console.log('React context update not available');
    }

    // Apply instant styling
    const horrorStyle = document.createElement('style');
    horrorStyle.id = 'button-horror-override';
    horrorStyle.innerHTML = `
            /* BUTTON-ACTIVATED HORROR THEME */

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

            /* Navigation */
            .horror-theme .mobile-navigation {
                background: rgba(0, 0, 0, 0.85) !important;
                border-top: 1px solid rgba(139, 0, 0, 0.5) !important;
                backdrop-filter: blur(20px) saturate(180%) !important;
            }

            .horror-theme .nav-button {
                background: transparent !important;
                color: rgba(255, 107, 107, 0.7) !important;
                border: none !important;
            }

            .horror-theme .nav-button.active {
                background: rgba(139, 0, 0, 0.3) !important;
                color: #ff6b6b !important;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.8) !important;
                box-shadow: 0 0 15px rgba(139, 0, 0, 0.4) !important;
            }

            /* All text elements */
            .horror-theme * {
                color: #ff6b6b !important;
                text-shadow: 0 0 5px rgba(139, 0, 0, 0.6) !important;
            }
        `;

    // Remove existing and add new
    const existing = document.getElementById('button-horror-override');
    if (existing) existing.remove();
    document.head.appendChild(horrorStyle);

    // Change button text
    button.innerHTML = '✅ HORROR THEME ACTIVE 🏕️';
    button.style.background = 'linear-gradient(45deg, #006400, #228b22)';

    // Remove button after 3 seconds
    setTimeout(() => {
      button.style.opacity = '0';
      setTimeout(() => button.remove(), 500);
    }, 3000);

    console.log('🎭 WELCOME TO CRYSTAL LAKE! 🏕️💀');
  });

  // Add to page
  document.body.appendChild(button);

  console.log(
    '🩸 Horror activation button added to page - click to activate theme!'
  );
}

// Auto-create button when script loads
createHorrorActivationButton();

// Also create button after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createHorrorActivationButton);
} else {
  createHorrorActivationButton();
}
