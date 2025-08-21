/* Theme Switcher Diagnostic Script
   Use this in browser console to test theme switching functionality
   Run in browser dev tools console: copy and paste this entire script
*/

console.log('🔍 THEME SWITCHER DIAGNOSTIC STARTING...');

// Test 1: Check if theme toggle button exists
const themeButton = document.querySelector('.theme-toggle-btn');
console.log('📍 Theme toggle button found:', !!themeButton);
if (themeButton) {
  console.log('  - Button classes:', themeButton.className);
  console.log(
    '  - Button text/content:',
    themeButton.textContent || themeButton.innerHTML
  );
  console.log(
    '  - Button computed styles:',
    window.getComputedStyle(themeButton)
  );
  console.log(
    '  - Button visibility:',
    window.getComputedStyle(themeButton).visibility
  );
  console.log(
    '  - Button display:',
    window.getComputedStyle(themeButton).display
  );
  console.log(
    '  - Button z-index:',
    window.getComputedStyle(themeButton).zIndex
  );
}

// Test 2: Check current theme in localStorage
const currentTheme = localStorage.getItem('weather-app-theme');
console.log('💾 Current theme in localStorage:', currentTheme);

// Test 3: Check body classes
const bodyClasses = document.body.className;
console.log('🏷️ Body classes:', bodyClasses);

// Test 4: Check if ThemeProvider is working
const rootDataTheme = document.body.getAttribute('data-theme');
console.log('📱 Body data-theme attribute:', rootDataTheme);

// Test 5: Manual theme switching test
function testThemeSwitch() {
  console.log('🧪 Testing manual theme switching...');

  const themes = ['light', 'dark', 'horror'];
  const currentTheme = localStorage.getItem('weather-app-theme') || 'light';
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  console.log(`  - Switching from ${currentTheme} to ${nextTheme}`);

  // Update localStorage
  localStorage.setItem('weather-app-theme', nextTheme);

  // Update body classes
  document.body.classList.remove('dark-theme', 'horror-theme');
  if (nextTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (nextTheme === 'horror') {
    document.body.classList.add('horror-theme');
  }

  // Update data-theme attribute
  document.body.setAttribute('data-theme', nextTheme);

  console.log(`  ✅ Manually switched to ${nextTheme} theme`);
  console.log('  - New body classes:', document.body.className);
}

// Test 6: CSS Variable Values
function checkCSSVariables() {
  console.log('🎨 Checking CSS variables...');
  const computedStyle = window.getComputedStyle(document.body);

  console.log(
    '  - --toggle-background:',
    computedStyle.getPropertyValue('--toggle-background')
  );
  console.log(
    '  - --toggle-border:',
    computedStyle.getPropertyValue('--toggle-border')
  );
  console.log(
    '  - --toggle-icon:',
    computedStyle.getPropertyValue('--toggle-icon')
  );
  console.log(
    '  - --app-background:',
    computedStyle.getPropertyValue('--app-background')
  );
}

// Run tests
checkCSSVariables();
console.log('');
console.log('🚀 DIAGNOSTIC COMPLETE! To test manual theme switching, run:');
console.log('testThemeSwitch()');

// Make function available globally
window.testThemeSwitch = testThemeSwitch;
window.checkCSSVariables = checkCSSVariables;
