// 🎃 Horror Theme Fixes Verification Script
// Tests all three reported issues to ensure they're resolved

console.log('🎃 Starting Horror Theme Fixes Verification...\n');

// Issue 1: Quote Container Positioning
function testQuotePositioning() {
  console.log('📍 Testing Quote Container Positioning...');

  const quote = document.querySelector(
    '.horror-weather-quote, .horror-quote-overlay'
  );
  if (!quote) {
    console.log('⚠️  No quote container found - may not be in horror mode');
    return false;
  }

  const computedStyle = window.getComputedStyle(quote);
  const position = computedStyle.position;

  console.log(`   Position: ${position}`);

  if (position === 'fixed') {
    console.log(
      '❌ ISSUE: Quote still using fixed positioning (will cover buttons)'
    );
    return false;
  } else if (position === 'relative' || position === 'static') {
    console.log('✅ FIXED: Quote using content flow positioning');

    // Check if it's at bottom of content
    const rect = quote.getBoundingClientRect();
    const body = document.body;
    const bodyRect = body.getBoundingClientRect();

    if (rect.bottom < bodyRect.bottom - 100) {
      // Account for mobile nav
      console.log('✅ GOOD: Quote positioned at bottom of content');
    } else {
      console.log('⚠️  NOTE: Quote position may need adjustment');
    }

    return true;
  }

  return false;
}

// Issue 2: Blood Drip Animation Quality
function testBloodDripAnimation() {
  console.log('\n🩸 Testing Blood Drip Animation...');

  const bloodDrips = document.querySelectorAll(
    '[class*="blood"], .horror-weather-quote::before, .horror-weather-quote::after'
  );

  if (bloodDrips.length === 0) {
    console.log('⚠️  No blood drip elements found - may not be active');
    return false;
  }

  console.log(`   Found ${bloodDrips.length} blood-related elements`);

  // Check for animation
  let hasAnimation = false;
  bloodDrips.forEach((drip, index) => {
    const computedStyle = window.getComputedStyle(drip);
    const animation = computedStyle.animation || computedStyle.animationName;

    if (animation && animation !== 'none') {
      console.log(`   Element ${index + 1}: Animation detected - ${animation}`);
      hasAnimation = true;
    }
  });

  if (hasAnimation) {
    console.log('✅ FIXED: Blood drip animations are active');
    return true;
  } else {
    console.log('❌ ISSUE: No blood drip animations detected');
    return false;
  }
}

// Issue 3: Navigation Icon Rendering (Emoji Pause Buttons)
function testNavigationIcons() {
  console.log('\n📱 Testing Navigation Icon Rendering...');

  const navItems = document.querySelectorAll(
    '.mobile-navigation .nav-item, .mobile-nav .nav-item, [class*="nav"] .nav-item'
  );

  if (navItems.length === 0) {
    console.log('⚠️  No navigation items found - may not be in mobile view');
    return false;
  }

  console.log(`   Found ${navItems.length} navigation items`);

  let properIconsCount = 0;
  let pauseButtonCount = 0;

  navItems.forEach((item, index) => {
    const text = item.textContent || item.innerHTML;
    const computedStyle = window.getComputedStyle(item);
    const fontFamily = computedStyle.fontFamily;

    console.log(`   Nav ${index + 1}: "${text}" | Font: ${fontFamily}`);

    // Check if it's showing pause symbols (⏸️ or ⏸ or similar)
    if (text.includes('⏸') || text.includes('pause')) {
      pauseButtonCount++;
      console.log(`     ❌ Showing pause symbol instead of proper icon`);
    } else if (text.match(/[🏠🌤️🔍⭐⚙️📍🎃]/)) {
      properIconsCount++;
      console.log(`     ✅ Proper emoji icon detected`);
    }
  });

  if (pauseButtonCount > 0) {
    console.log(
      `❌ ISSUE: ${pauseButtonCount} navigation items showing pause buttons`
    );
    console.log('   Suggestion: Add emoji font fallbacks to CSS');
    return false;
  } else if (properIconsCount > 0) {
    console.log('✅ FIXED: Navigation icons rendering properly');
    return true;
  } else {
    console.log('⚠️  UNCLEAR: Could not determine icon rendering status');
    return false;
  }
}

// Comprehensive Test Runner
function runAllTests() {
  console.log('🎃 HORROR THEME FIXES VERIFICATION REPORT');
  console.log('==========================================\n');

  const results = {
    quotePositioning: testQuotePositioning(),
    bloodDripAnimation: testBloodDripAnimation(),
    navigationIcons: testNavigationIcons(),
  };

  console.log('\n🎯 SUMMARY:');
  console.log('===========');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;

  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (results.quotePositioning) {
    console.log('✅ Quote container positioning: FIXED');
  } else {
    console.log('❌ Quote container positioning: NEEDS WORK');
  }

  if (results.bloodDripAnimation) {
    console.log('✅ Blood drip animation: IMPROVED');
  } else {
    console.log('❌ Blood drip animation: NEEDS WORK');
  }

  if (results.navigationIcons) {
    console.log('✅ Navigation icon rendering: FIXED');
  } else {
    console.log('❌ Navigation icon rendering: NEEDS WORK');
  }

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL HORROR THEME ISSUES RESOLVED! 🎃');
  } else {
    console.log('\n⚠️  Some issues still need attention');
  }

  return results;
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  setTimeout(runAllTests, 1000); // Give page time to render
}

// Export for manual testing
window.horrorThemeTest = {
  runAllTests,
  testQuotePositioning,
  testBloodDripAnimation,
  testNavigationIcons,
};

console.log(
  '\n🔧 Manual testing available via: window.horrorThemeTest.runAllTests()'
);
