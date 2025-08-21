// COMPREHENSIVE THEME SWITCHER VERIFICATION
// Run this in browser console after refreshing with Ctrl+F5

console.log('🧪 COMPREHENSIVE THEME SWITCHER VERIFICATION');
console.log('==============================================');

// Step 1: Clear any cached horror theme state
console.log('1️⃣ Clearing cached theme state...');
localStorage.removeItem('weather-app-theme');
document.body.className = document.body.className.replace(
  /\b(light|dark|horror)-theme\b/g,
  ''
);
document.body.removeAttribute('data-theme');
console.log('   ✅ Theme state cleared');

// Step 2: Set to light theme as baseline
console.log('');
console.log('2️⃣ Setting baseline light theme...');
localStorage.setItem('weather-app-theme', 'light');
document.body.className = document.body.className + ' light-theme';
document.body.setAttribute('data-theme', 'light');
console.log('   ✅ Light theme set as baseline');

// Step 3: Check for interfering scripts
console.log('');
console.log('3️⃣ Checking for interfering scripts...');
const interferingElements = [];

// Check for horror scripts
const horrorScripts = document.querySelectorAll('script[src*="horror"]');
horrorScripts.forEach(script => {
  interferingElements.push('Horror script: ' + script.src);
});

// Check for elements with horror event listeners
const themeButtons = document.querySelectorAll('.theme-toggle-btn');
themeButtons.forEach(btn => {
  if (btn.hasAttribute('data-horror-enabled')) {
    interferingElements.push('Button has horror integration: ' + btn.className);
  }
});

if (interferingElements.length === 0) {
  console.log('   ✅ No interfering scripts found');
} else {
  console.log('   ⚠️ Found interfering elements:', interferingElements);
}

// Step 4: Test React theme button
console.log('');
console.log('4️⃣ Testing React theme button...');
const themeBtn = document.querySelector('.theme-toggle-btn');

if (!themeBtn) {
  console.log('   ❌ Theme button not found');
} else {
  console.log('   ✅ Theme button found');
  console.log('   Button details:', {
    text: themeBtn.textContent,
    classes: themeBtn.className,
    title: themeBtn.title,
    hasHorrorFlag: themeBtn.hasAttribute('data-horror-enabled'),
  });

  // Test multiple clicks
  console.log('');
  console.log('   🔄 Testing theme cycling...');

  let clickCount = 0;
  const testClicks = () => {
    if (clickCount >= 4) {
      console.log('   ✅ Theme cycling test complete');
      return;
    }

    clickCount++;
    const beforeTheme = localStorage.getItem('weather-app-theme');
    const beforeClasses = document.body.className;

    console.log(`   Click ${clickCount}:`);
    console.log(
      `     Before: ${beforeTheme} | ${
        beforeClasses.match(/\w+-theme/)?.[0] || 'no-theme'
      }`
    );

    // Click the button
    themeBtn.click();

    // Check result after a delay
    setTimeout(() => {
      const afterTheme = localStorage.getItem('weather-app-theme');
      const afterClasses = document.body.className;
      const changed = beforeTheme !== afterTheme;

      console.log(
        `     After:  ${afterTheme} | ${
          afterClasses.match(/\w+-theme/)?.[0] || 'no-theme'
        } | Changed: ${changed}`
      );

      if (changed) {
        console.log(`     ✅ Theme switched successfully`);
      } else {
        console.log(`     ❌ Theme did not change`);
      }

      setTimeout(testClicks, 1000); // Next click after 1 second
    }, 200);
  };

  testClicks();
}

// Step 5: Manual theme cycling function as backup
console.log('');
console.log('5️⃣ Creating manual theme cycling function...');

window.manualThemeCycle = function () {
  const themes = ['light', 'dark', 'horror'];
  const current = localStorage.getItem('weather-app-theme') || 'light';
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  console.log(`Manual cycle: ${current} → ${nextTheme}`);

  // Update localStorage
  localStorage.setItem('weather-app-theme', nextTheme);

  // Update body classes
  document.body.classList.remove('light-theme', 'dark-theme', 'horror-theme');
  document.body.classList.add(nextTheme + '-theme');

  // Update data-theme
  document.body.setAttribute('data-theme', nextTheme);

  // Update button if it exists
  if (themeBtn) {
    themeBtn.className = themeBtn.className.replace(
      /theme-toggle-\w+/,
      `theme-toggle-${nextTheme}`
    );
    const icons = { light: '🌙', dark: '💀', horror: '☀️' };
    themeBtn.textContent = icons[nextTheme] || '🌙';
  }

  console.log(`✅ Manually switched to ${nextTheme}`);
  return nextTheme;
};

console.log('   ✅ manualThemeCycle() function ready');

// Step 6: Final verification
setTimeout(() => {
  console.log('');
  console.log('6️⃣ FINAL VERIFICATION RESULTS:');
  console.log('===============================');

  const finalTheme = localStorage.getItem('weather-app-theme');
  const finalClasses = document.body.className;
  const buttonExists = !!document.querySelector('.theme-toggle-btn');

  console.log('Current theme:', finalTheme);
  console.log('Body classes:', finalClasses.match(/\w+-theme/g) || ['none']);
  console.log('Button exists:', buttonExists);

  if (buttonExists) {
    console.log('✅ React theme button is present');
  } else {
    console.log('❌ React theme button missing');
  }

  console.log('');
  console.log('🎯 AVAILABLE COMMANDS:');
  console.log('• manualThemeCycle() - Manual theme switching');
  console.log('• Click the theme button in top-right corner');
  console.log('');
  console.log('If React button still not working, try manualThemeCycle()');
}, 5000);
