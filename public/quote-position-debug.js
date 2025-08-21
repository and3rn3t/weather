// Horror Quote Positioning Debug Script
// Run this in the browser console to test and fix positioning

console.log('🎃 Testing Horror Quote Positioning...');

// Function to test current positioning
function testQuotePosition() {
  const quote = document.querySelector('.horror-quote-overlay');
  const quoteInner = document.querySelector('.horror-weather-quote');

  if (!quote && !quoteInner) {
    console.log('❌ No quote found - horror theme may not be active');
    return false;
  }

  const element = quote || quoteInner;
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  console.log('📊 Quote Element Analysis:');
  console.log(`   Position: ${computedStyle.position}`);
  console.log(`   Background: ${computedStyle.backgroundColor}`);
  console.log(`   Background Image: ${computedStyle.backgroundImage}`);
  console.log(
    `   Location: top=${rect.top}, left=${rect.left}, width=${rect.width}`
  );
  console.log(`   Margin: ${computedStyle.margin}`);
  console.log(`   Z-index: ${computedStyle.zIndex}`);

  // Check for purple background
  const hasPurple =
    computedStyle.backgroundColor.includes('102, 126, 234') ||
    computedStyle.backgroundImage.includes('667eea');

  if (hasPurple) {
    console.log('❌ ISSUE: Purple background detected from main theme');
    return false;
  }

  // Check positioning
  if (computedStyle.position !== 'relative') {
    console.log('❌ ISSUE: Position should be relative');
    return false;
  }

  console.log('✅ Quote positioning looks correct');
  return true;
}

// Function to apply emergency fixes
function applyEmergencyFixes() {
  console.log('🔧 Applying emergency positioning fixes...');

  const quote = document.querySelector(
    '.horror-quote-overlay, .horror-weather-quote'
  );
  if (!quote) {
    console.log('❌ No quote element found to fix');
    return;
  }

  // Emergency CSS override
  const emergencyCSS = `
        .horror-quote-overlay,
        .horror-weather-quote {
            position: relative !important;
            margin: 30px auto 120px auto !important;
            max-width: 90% !important;
            background: rgba(0, 0, 0, 0.92) !important;
            background-image: none !important;
            background-color: rgba(0, 0, 0, 0.92) !important;
            border: 2px solid #8b0000 !important;
            color: #ff6b6b !important;
            padding: 20px !important;
            border-radius: 12px !important;
            text-align: center !important;
            font-style: italic !important;
            box-shadow: 0 0 20px rgba(139, 0, 0, 0.6) !important;
            z-index: 10 !important;
            clear: both !important;
            display: block !important;
        }

        @media (max-width: 768px) {
            .horror-quote-overlay,
            .horror-weather-quote {
                margin: 20px auto 140px auto !important;
                width: calc(100% - 30px) !important;
            }
        }
    `;

  // Inject CSS
  let styleElement = document.getElementById('emergency-horror-fix');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'emergency-horror-fix';
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = emergencyCSS;

  console.log('✅ Emergency fixes applied');

  // Test again
  setTimeout(() => {
    console.log('🔄 Re-testing after fixes...');
    testQuotePosition();
  }, 500);
}

// Run initial test
if (testQuotePosition()) {
  console.log('🎉 Quote positioning is working correctly!');
} else {
  console.log('⚠️ Issues detected, applying emergency fixes...');
  applyEmergencyFixes();
}

// Make functions available for manual testing
window.horrorQuoteDebug = {
  test: testQuotePosition,
  fix: applyEmergencyFixes,
};

console.log(
  '💡 Manual controls: window.horrorQuoteDebug.test() or window.horrorQuoteDebug.fix()'
);
