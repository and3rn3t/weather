/**
 * Quick Horror Theme Test & Fix Script
 * This script tests the horror theme and fixes common issues
 */

console.log('🎃 Running Horror Theme Quick Test & Fix...');

// Function to enable horror theme and test functionality
function quickHorrorTest() {
  console.log('🦇 Enabling NUCLEAR horror theme...');

  // Remove other theme classes aggressively
  document.documentElement.classList.remove('light-theme', 'dark-theme');
  document.body.classList.remove('light-theme', 'dark-theme');

  // Add horror theme to html and body
  document.documentElement.classList.add('horror-theme');
  document.body.classList.add('horror-theme');

  // NUCLEAR: Force horror background with inline styles
  document.body.style.setProperty(
    'background',
    'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
    'important'
  );
  document.body.style.setProperty('background-color', '#0d0d0d', 'important');
  document.body.style.setProperty('color', '#ff6b6b', 'important');

  // Apply to root and all major containers
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

  // Nuclear override for any containers
  const containers = document.querySelectorAll(
    '.app-container, .main-content, main, section'
  );
  containers.forEach(container => {
    container.style.setProperty(
      'background',
      'linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%)',
      'important'
    );
    container.style.setProperty('background-color', '#0d0d0d', 'important');
    container.style.setProperty('color', '#ff6b6b', 'important');
  });

  // Update localStorage
  localStorage.setItem('weather-app-theme', 'horror');

  // Update title
  document.title = '🎃 Crystal Lake Weather Station';

  // Test scrollbars
  console.log('📊 Testing scrollbars...');
  const bodyOverflow = getComputedStyle(document.body).overflow;
  const rootOverflow = getComputedStyle(
    document.getElementById('root') || document.body
  ).overflow;
  console.log('Body overflow:', bodyOverflow);
  console.log('Root overflow:', rootOverflow);

  // Test click functionality
  console.log('🖱️ Testing click functionality...');
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons`);

  // Remove any floating nuclear search boxes
  console.log('🗑️ Removing floating search boxes...');
  const nuclearBoxes = document.querySelectorAll('.nuclear-autocomplete');
  nuclearBoxes.forEach(box => {
    console.log('Removing nuclear autocomplete box');
    box.remove();
  });

  // Check for multiple scrollbars
  console.log('📏 Checking for scroll issues...');
  const scrollableElements = [];
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    const style = getComputedStyle(el);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      scrollableElements.push(el);
    }
  });
  console.log(
    `Found ${scrollableElements.length} scrollable elements:`,
    scrollableElements
  );

  // Add horror atmosphere
  console.log('🎬 Adding horror atmosphere...');
  if (!document.querySelector('.horror-weather-quote')) {
    const quote = document.createElement('div');
    quote.className = 'horror-weather-quote';
    quote.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(139, 0, 0, 0.9);
      color: #ff6b6b;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Creepster', cursive, monospace;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 0 20px rgba(139, 0, 0, 0.6);
      animation: flickering 2s infinite;
      text-align: center;
      max-width: 90%;
    `;
    quote.innerHTML =
      '"Welcome to Crystal Lake... you\'ll never leave." - Weather Station';
    document.body.appendChild(quote);
  }

  console.log('✅ Horror theme test complete!');
  console.log('🎃 Crystal Lake Weather Station is now active!');

  return {
    theme: 'horror',
    scrollableElements: scrollableElements.length,
    buttons: buttons.length,
    nuclearBoxesRemoved: nuclearBoxes.length,
  };
}

// Function to disable horror theme
function disableHorrorTheme() {
  document.body.classList.remove('horror-theme');
  document.body.classList.add('light-theme');
  localStorage.setItem('weather-app-theme', 'light');
  document.title = 'Weather App';

  // Remove horror quotes
  const quotes = document.querySelectorAll('.horror-weather-quote');
  quotes.forEach(quote => quote.remove());

  console.log('👻 Horror theme disabled');
}

// Auto-run test
const testResults = quickHorrorTest();
console.log('📊 Test Results:', testResults);

// Make functions globally available
window.quickHorrorTest = quickHorrorTest;
window.disableHorrorTheme = disableHorrorTheme;

console.log('🔧 Available commands: quickHorrorTest(), disableHorrorTheme()');
