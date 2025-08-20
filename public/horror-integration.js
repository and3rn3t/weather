/**
 * Horror Theme Integration Script
 * This script ensures the horror theme works with the existing React app
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('🎃 Horror theme integration loading...');

  // Function to apply horror theme CSS
  function applyHorrorTheme() {
    console.log('🎃 Applying nuclear horror theme...');

    // Remove other theme classes aggressively
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.body.classList.remove('light-theme', 'dark-theme');

    // Add horror theme to html and body
    document.documentElement.classList.add('horror-theme');
    document.body.classList.add('horror-theme');

    // Force horror background with inline styles as backup
    document.body.style.setProperty(
      'background',
      'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
      'important'
    );
    document.body.style.setProperty('background-color', '#0d0d0d', 'important');
    document.body.style.setProperty('color', '#ff6b6b', 'important');

    // Apply to root element as well
    const root = document.getElementById('root');
    if (root) {
      root.style.setProperty(
        'background',
        'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
        'important'
      );
      root.style.setProperty('background-color', '#0d0d0d', 'important');
      root.style.setProperty('color', '#ff6b6b', 'important');
    }

    // Update page title for horror atmosphere
    document.title = '🎃 Crystal Lake Weather Station';

    // Add meta theme color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#8b0000');
    }

    console.log('🦇 Nuclear horror theme CSS applied with inline styles');
  }

  // Function to remove horror theme
  function removeHorrorTheme() {
    document.body.classList.remove('horror-theme');
    document.title = 'Weather App';

    // Reset theme color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#667eea');
    }

    console.log('👻 Horror theme removed');
  }

  // Check localStorage for saved horror theme preference
  function checkSavedTheme() {
    const savedTheme = localStorage.getItem('weather-app-theme');
    if (savedTheme === 'horror') {
      applyHorrorTheme();
      return true;
    }
    return false;
  }

  // Listen for theme changes from React components
  window.addEventListener('themeChanged', function (event) {
    console.log('🎭 Theme change event received:', event.detail);

    if (event.detail && event.detail.theme === 'horror') {
      applyHorrorTheme();
    } else {
      removeHorrorTheme();
    }
  });

  // Override theme toggle to work with horror theme
  function interceptThemeToggle() {
    // Find theme toggle buttons and add horror theme support
    const checkForThemeButtons = () => {
      const themeButtons = document.querySelectorAll(
        '.theme-toggle-btn, [aria-label*="theme"], [class*="theme"]'
      );

      themeButtons.forEach(button => {
        if (button.hasAttribute('data-horror-enabled')) return; // Already processed

        button.setAttribute('data-horror-enabled', 'true');

        button.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          // Cycle through themes: light -> dark -> horror -> light
          const currentTheme =
            localStorage.getItem('weather-app-theme') || 'light';
          let nextTheme;

          switch (currentTheme) {
            case 'light':
              nextTheme = 'dark';
              break;
            case 'dark':
              nextTheme = 'horror';
              break;
            case 'horror':
            default:
              nextTheme = 'light';
              break;
          }

          // Save new theme
          localStorage.setItem('weather-app-theme', nextTheme);

          // Apply theme
          if (nextTheme === 'horror') {
            applyHorrorTheme();
          } else {
            removeHorrorTheme();
            // Apply other themes
            document.body.classList.remove(
              'light-theme',
              'dark-theme',
              'horror-theme'
            );
            document.body.classList.add(nextTheme + '-theme');
          }

          // Trigger React theme change
          window.dispatchEvent(
            new CustomEvent('themeChanged', {
              detail: { theme: nextTheme },
            })
          );

          console.log(`🎨 Theme changed to: ${nextTheme}`);

          return false;
        });
      });
    };

    // Check immediately and periodically for new theme buttons
    checkForThemeButtons();
    setInterval(checkForThemeButtons, 1000);
  }

  // Apply Crystal Lake default if no location is set
  function setCrystalLakeDefault() {
    const checkForLocationInput = () => {
      const locationInputs = document.querySelectorAll(
        'input[placeholder*="city"], input[placeholder*="location"], #nuclear-search'
      );

      locationInputs.forEach(input => {
        if (!input.value && !input.hasAttribute('data-crystal-lake-set')) {
          input.setAttribute('data-crystal-lake-set', 'true');
          input.placeholder = '🏚️ Search cities (Currently: Crystal Lake, NJ)';
        }
      });
    };

    checkForLocationInput();
    setInterval(checkForLocationInput, 2000);
  }

  // Add horror quotes when horror theme is active
  function addHorrorQuotes() {
    if (!document.body.classList.contains('horror-theme')) return;

    const quotes = [
      "Welcome to Crystal Lake... you'll never leave.",
      'Ki ki ki... ma ma ma...',
      'The weather here is to DIE for.',
      'Something wicked this way comes...',
      "They're coming to get you, Barbara.",
      "Heeere's... Johnny! And here's your weather forecast.",
      'The mist is rising... and so is the temperature.',
    ];

    // Helper function for secure random selection
    function getSecureRandomIndex(arrayLength) {
      if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return Math.floor((array[0] / (0xffffffff + 1)) * arrayLength);
      } else {
        // Fallback for older browsers
        return Math.floor(Math.random() * arrayLength);
      }
    }

    // Only add quote if one doesn't exist
    if (!document.querySelector('.horror-weather-quote')) {
      const quote = quotes[getSecureRandomIndex(quotes.length)];

      const quoteDiv = document.createElement('div');
      quoteDiv.className = 'horror-weather-quote';
      quoteDiv.innerHTML = `
        <p class="quote-text">"${quote}"</p>
        <div class="quote-attribution">- Crystal Lake Weather Station</div>
      `;

      // Try to add to main content or body
      const targetContainer =
        document.querySelector('.main-content') ||
        document.querySelector('#root') ||
        document.body;

      if (targetContainer && targetContainer.firstChild) {
        targetContainer.insertBefore(quoteDiv, targetContainer.firstChild);
      }
    }
  }

  // Initialize everything
  checkSavedTheme();
  interceptThemeToggle();
  setCrystalLakeDefault();

  // Add quotes periodically when horror theme is active
  setInterval(() => {
    if (document.body.classList.contains('horror-theme')) {
      addHorrorQuotes();
    }
  }, 5000);

  // Global functions for manual control
  window.enableHorrorTheme = function () {
    localStorage.setItem('weather-app-theme', 'horror');
    applyHorrorTheme();
    addHorrorQuotes();
    console.log('🎃 Horror theme manually enabled!');
  };

  window.disableHorrorTheme = function () {
    localStorage.setItem('weather-app-theme', 'light');
    removeHorrorTheme();
    console.log('👻 Horror theme manually disabled!');
  };

  console.log(
    '🦇 Horror theme integration ready! Use enableHorrorTheme() to activate.'
  );
});

// Auto-enable if horror theme is saved
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('weather-app-theme') === 'horror'
) {
  setTimeout(() => {
    if (window.enableHorrorTheme) {
      window.enableHorrorTheme();
    }
  }, 500);
}
