// Horror Quote DOM Repositioning Script
// This script moves the horror quote to the proper location within the content

console.log('🎃 Repositioning Horror Quote...');

function repositionHorrorQuote() {
  const quote = document.querySelector(
    '.horror-quote-overlay, .horror-weather-quote'
  );

  if (!quote) {
    console.log('⚠️ No horror quote found to reposition');
    return false;
  }

  console.log('✅ Found horror quote, analyzing current position...');

  // Find a better parent container
  const contentAreas = [
    '.main-content-area',
    '.mobile-container',
    '.weather-details',
    '.ios26-main-weather-card',
    'main',
    '.app-container',
  ];

  let targetContainer = null;

  for (const selector of contentAreas) {
    const container = document.querySelector(selector);
    if (container && container !== quote.parentElement) {
      targetContainer = container;
      console.log(`📦 Found target container: ${selector}`);
      break;
    }
  }

  if (!targetContainer) {
    console.log('❌ No suitable container found');
    return false;
  }

  // Remove quote from current position
  const originalParent = quote.parentElement;
  quote.remove();

  // Add to end of target container
  targetContainer.appendChild(quote);

  // Apply emergency positioning
  quote.style.cssText = `
        position: relative !important;
        display: block !important;
        margin: 20px auto 80px auto !important;
        max-width: 80% !important;
        width: auto !important;
        z-index: 1 !important;
        background: rgba(0, 0, 0, 0.85) !important;
        background-image: none !important;
        border: 1px solid #8b0000 !important;
        color: #ff6b6b !important;
        padding: 15px !important;
        border-radius: 8px !important;
        text-align: center !important;
        font-style: italic !important;
        box-shadow: 0 0 10px rgba(139, 0, 0, 0.3) !important;
        max-height: 150px !important;
        overflow: hidden !important;
        clear: both !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
    `;

  console.log(
    `✅ Moved quote from ${originalParent?.className || 'unknown'} to ${
      targetContainer.className || targetContainer.tagName
    }`
  );
  console.log('✅ Applied emergency positioning styles');

  // Check if it's still covering content
  setTimeout(() => {
    const rect = quote.getBoundingClientRect();
    const coverage =
      ((rect.width * rect.height) / (window.innerWidth * window.innerHeight)) *
      100;

    if (coverage > 30) {
      console.log(
        `⚠️ Quote still covers ${coverage.toFixed(
          1
        )}% of screen, applying compact mode...`
      );

      quote.style.maxHeight = '100px';
      quote.style.padding = '10px';
      quote.style.fontSize = '14px';
      quote.style.margin = '10px auto 40px auto';

      const textElement = quote.querySelector('.quote-text');
      if (textElement) {
        textElement.style.fontSize = '13px';
        textElement.style.lineHeight = '1.3';
      }

      console.log('✅ Applied compact mode');
    } else {
      console.log(`✅ Quote coverage acceptable: ${coverage.toFixed(1)}%`);
    }
  }, 100);

  return true;
}

// Run automatically when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(repositionHorrorQuote, 1000);
  });
} else {
  setTimeout(repositionHorrorQuote, 1000);
}

// Make available for manual use
window.repositionHorrorQuote = repositionHorrorQuote;

console.log('💡 Manual control: window.repositionHorrorQuote()');
