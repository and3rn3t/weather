/**
 * Horror Theme Activation Script
 * This script ensures the horror theme works by bypassing TypeScript JSX issues
 */

// Global horror theme activation
window.activateHorrorTheme = function () {
  console.log('🎃 Activating Horror Theme...');

  // Add horror theme class to body
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add('horror-theme');

  // Update localStorage
  localStorage.setItem('weather-app-theme', 'horror');

  // Update page title
  document.title = '🎃 Crystal Lake Weather Station';

  // Add horror quotes if container exists
  const addHorrorQuote = () => {
    const quoteContainer =
      document.querySelector('.horror-quote-container') ||
      document.querySelector('.main-content') ||
      document.body;

    if (quoteContainer && !document.querySelector('.horror-weather-quote')) {
      const quote = document.createElement('div');
      quote.className = 'horror-weather-quote';
      quote.innerHTML = `
        <p class="quote-text">"Welcome to Crystal Lake... you'll never leave."</p>
        <div class="quote-attribution">- Camp Crystal Lake Weather Station</div>
      `;
      quoteContainer.insertBefore(quote, quoteContainer.firstChild);
    }
  };

  // Add quote immediately and after potential DOM updates
  addHorrorQuote();
  setTimeout(addHorrorQuote, 100);

  // Trigger theme change event for React components
  window.dispatchEvent(
    new CustomEvent('themeChanged', {
      detail: { theme: 'horror' },
    })
  );

  console.log('🦇 Horror theme activated! Welcome to Crystal Lake...');
};

// Auto-activate horror theme if saved in localStorage
if (localStorage.getItem('weather-app-theme') === 'horror') {
  setTimeout(window.activateHorrorTheme, 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { activateHorrorTheme: window.activateHorrorTheme };
}
