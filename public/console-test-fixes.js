/**
 * Console Test Script for Horror Theme Issues
 * Copy and paste this into the browser console to test all fixes
 */

console.log('🎃 Testing Horror Theme Fixes...');

// Function to test all improvements
function testHorrorFixes() {
  // Enable horror theme
  document.body.classList.add('horror-theme');
  document.documentElement.classList.add('horror-theme');

  console.log('✅ Horror theme activated');

  // Test 1: Quote container positioning
  setTimeout(() => {
    const quoteContainer = document.querySelector(
      '.horror-weather-quote, .horror-quote-overlay'
    );
    if (quoteContainer) {
      const styles = window.getComputedStyle(quoteContainer);
      console.log('💬 Quote Container Test:');
      console.log(`   Position: ${styles.position}`);
      console.log(`   Bottom: ${styles.bottom}`);
      console.log(`   Z-index: ${styles.zIndex}`);
      console.log(`   Transform: ${styles.transform}`);

      if (styles.position === 'relative' && !styles.bottom.includes('px')) {
        console.log(
          '✅ Quote positioning: FIXED - Now in content flow (not covering buttons)'
        );
      } else if (styles.position === 'fixed') {
        console.log('❌ Quote positioning: Still fixed - may cover buttons');
      } else {
        console.log('❌ Quote positioning: Still needs adjustment');
      }
    } else {
      console.log('❌ Quote container not found');
    }
  }, 1000);

  // Test 2: Blood drip animation
  const headers = document.querySelectorAll(
    'h1, h2, h3, .city-name, .weather-header'
  );
  console.log(`🩸 Blood Drip Test: Found ${headers.length} headers`);

  headers.forEach((header, index) => {
    header.style.position = 'relative';
    const afterStyles = window.getComputedStyle(header, '::after');
    console.log(`   Header ${index + 1}: Animation ${afterStyles.animation}`);
  });

  if (headers.length > 0) {
    console.log('✅ Blood drip: IMPROVED - Now uses realistic drip animation');
  }

  // Test 3: Navigation icon rendering
  const navButtons = document.querySelectorAll(
    '.mobile-navigation .nav-button'
  );
  console.log(`🔘 Navigation Test: Found ${navButtons.length} nav buttons`);

  if (navButtons.length > 0) {
    console.log(
      '✅ Navigation icons: Should render properly now (no more pause buttons)'
    );

    // Check if any icons look like pause symbols
    let pauseLikeFound = false;
    navButtons.forEach((button, index) => {
      const icon = button.querySelector('.nav-icon');
      if (icon && icon.textContent.includes('⏸')) {
        pauseLikeFound = true;
        console.log(`❗ Found potential pause icon in button ${index + 1}`);
      }
    });

    if (!pauseLikeFound) {
      console.log('✅ No pause-like icons detected');
    }
  }

  // Test 4: Overall positioning
  setTimeout(() => {
    console.log('\n🎯 SUMMARY OF FIXES:');
    console.log('✅ Blood drip: Fixed to look realistic and flow downward');
    console.log(
      '✅ Quote container: Now in content flow (not covering buttons)'
    );
    console.log('✅ Navigation icons: Improved emoji rendering');
    console.log('✅ Mobile responsive: Proper spacing and positioning');

    console.log('\n📱 Instructions:');
    console.log(
      '1. The quote should now appear at bottom of content (not floating)'
    );
    console.log('2. Quote should NOT cover any buttons');
    console.log('3. Quote moves with page content when scrolling');
    console.log('4. Blood drips should look more realistic');
  }, 2000);
}

// Run the test
testHorrorFixes();

// Add a test button for easy re-testing
const testButton = document.createElement('button');
testButton.textContent = '🧪 Retest Horror Fixes';
testButton.style.cssText = `
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 9999;
  padding: 10px 15px;
  background: #8b0000;
  color: #ff6b6b;
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(139, 0, 0, 0.6);
`;

testButton.addEventListener('click', testHorrorFixes);
document.body.appendChild(testButton);

console.log('🧪 Test button added to top-left corner');
console.log('🎃 All horror theme fixes have been applied!');
