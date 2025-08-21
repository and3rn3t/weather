/**
 * Test Script for Horror Theme Improvements
 * Tests: Quote container positioning, blood drip animation, film flicker effect
 */

console.log('🎃 Testing Horror Theme Improvements...');

// Function to activate horror theme and test features
function testHorrorImprovements() {
  // 1. Activate horror theme
  document.body.classList.add('horror-theme');
  document.documentElement.classList.add('horror-theme');

  console.log('✅ Horror theme activated');

  // 2. Test film grain effect visibility
  const root = document.getElementById('root');
  if (root) {
    const beforeElement = window.getComputedStyle(root, '::before');
    console.log(
      '🎬 Film grain background-image:',
      beforeElement.backgroundImage
    );
    console.log('🎬 Film grain opacity:', beforeElement.opacity);
  }

  // 3. Check for blood drip animations on headers
  const headers = document.querySelectorAll(
    'h1, h2, h3, .city-name, .weather-header'
  );
  console.log(`🩸 Found ${headers.length} headers for blood drip effect`);

  headers.forEach((header, index) => {
    const afterElement = window.getComputedStyle(header, '::after');
    console.log(
      `🩸 Header ${index + 1} blood drip animation:`,
      afterElement.animation
    );
  });

  // 4. Check flicker animations on key elements
  const flickerElements = document.querySelectorAll(
    '.city-name, .temperature, .temp-display, .weather-card'
  );
  console.log(
    `⚡ Found ${flickerElements.length} elements with flicker animation`
  );

  flickerElements.forEach((element, index) => {
    const computedStyle = window.getComputedStyle(element);
    console.log(`⚡ Element ${index + 1} animation:`, computedStyle.animation);
  });

  // 5. Test horror quote positioning and styling
  setTimeout(() => {
    const quoteContainer = document.querySelector('.horror-weather-quote');
    if (quoteContainer) {
      const computedStyle = window.getComputedStyle(quoteContainer);
      console.log('💬 Quote container found');
      console.log('💬 Position:', computedStyle.position);
      console.log('💬 Bottom:', computedStyle.bottom);
      console.log('💬 Z-index:', computedStyle.zIndex);
      console.log('💬 Background:', computedStyle.background);
      console.log('💬 Border:', computedStyle.border);
    } else {
      console.log('❌ Horror quote container not found');
    }

    // Check for quote overlay class
    const quoteOverlay = document.querySelector('.horror-quote-overlay');
    if (quoteOverlay) {
      const overlayStyle = window.getComputedStyle(quoteOverlay);
      console.log('💬 Quote overlay positioning:');
      console.log('   Position:', overlayStyle.position);
      console.log('   Bottom:', overlayStyle.bottom);
      console.log('   Transform:', overlayStyle.transform);
      console.log('   Z-index:', overlayStyle.zIndex);
    } else {
      console.log('❌ Horror quote overlay not found');
    }
  }, 1000);

  // 6. Test film grain flicker animation
  setTimeout(() => {
    const filmGrainElement = document.querySelector('#root::before') || root;
    if (filmGrainElement) {
      console.log('🎬 Testing film grain flicker animation...');
      // Watch for opacity changes indicating flicker
      let flickerCount = 0;
      const observer = new MutationObserver(() => {
        flickerCount++;
        if (flickerCount > 5) {
          console.log('✅ Film grain flicker detected');
          observer.disconnect();
        }
      });

      // Start observing for style changes
      observer.observe(filmGrainElement, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }
  }, 2000);

  console.log('🎃 Horror theme test completed. Check console for results.');
}

// Add test button to page
function addTestButton() {
  const testButton = document.createElement('button');
  testButton.textContent = '🎃 Test Horror Improvements';
  testButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    padding: 12px 16px;
    background: #8b0000;
    color: #ff6b6b;
    border: 2px solid #ff6b6b;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 0 20px rgba(139, 0, 0, 0.6);
  `;

  testButton.addEventListener('click', testHorrorImprovements);
  document.body.appendChild(testButton);

  console.log('🎃 Horror test button added to page');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTestButton);
} else {
  addTestButton();
}

// Auto-test after a short delay
setTimeout(() => {
  console.log('🎃 Auto-testing horror improvements...');
  testHorrorImprovements();
}, 3000);
