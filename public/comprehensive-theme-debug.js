// COMPREHENSIVE THEME SWITCHER DEBUGGING SCRIPT
// Copy and paste this entire script into browser console

console.log('🔍 COMPREHENSIVE THEME SWITCHER DEBUG - Starting...');
console.log('============================================');

// Test 1: Check for React errors in console
console.log('1️⃣ Checking for React/import errors...');
const reactErrors = performance
  .getEntries()
  .filter(entry => entry.name.includes('error') || entry.name.includes('fail'));
console.log('   React/import errors found:', reactErrors.length);
if (reactErrors.length > 0) {
  console.log('   Errors:', reactErrors);
}

// Test 2: Check if useTheme hook file exists (via network requests)
console.log('');
console.log('2️⃣ Checking theme-related imports...');
const networkEntries = performance
  .getEntries()
  .filter(
    entry => entry.name.includes('useTheme') || entry.name.includes('theme')
  );
console.log(
  '   Theme-related network requests:',
  networkEntries.map(e => e.name)
);

// Test 3: Check if theme toggle button exists with various selectors
console.log('');
console.log('3️⃣ Looking for theme toggle button...');
const selectors = [
  '.theme-toggle-btn',
  '[class*="theme-toggle"]',
  'button[title*="theme"]',
  'button[title*="Switch"]',
  'button:contains("🌙")',
  'button:contains("💀")',
  'button:contains("☀️")',
];

let themeButton = null;
for (const selector of selectors) {
  try {
    const found = document.querySelector(selector);
    if (found) {
      themeButton = found;
      console.log(`   ✅ Button found with selector: ${selector}`);
      break;
    }
  } catch (e) {
    // Ignore invalid selectors
  }
}

if (!themeButton) {
  console.log('   ❌ No theme button found with any selector');
  console.log('   🔍 All buttons on page:');
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach((btn, i) => {
    console.log(`     Button ${i + 1}:`, {
      text: btn.textContent?.trim(),
      classes: btn.className,
      title: btn.title,
      id: btn.id,
    });
  });
} else {
  console.log('   Button details:', {
    text: themeButton.textContent?.trim(),
    classes: themeButton.className,
    title: themeButton.title,
    visible: window.getComputedStyle(themeButton).display !== 'none',
    position: window.getComputedStyle(themeButton).position,
    zIndex: window.getComputedStyle(themeButton).zIndex,
  });
}

// Test 4: Check current theme state
console.log('');
console.log('4️⃣ Checking current theme state...');
const localStorage_theme = localStorage.getItem('weather-app-theme');
const body_classes = document.body.className;
const data_theme = document.body.getAttribute('data-theme');

console.log('   localStorage theme:', localStorage_theme);
console.log('   Body classes:', body_classes);
console.log('   Body data-theme:', data_theme);

// Test 5: Check CSS variables
console.log('');
console.log('5️⃣ Checking CSS variables...');
const rootStyle = window.getComputedStyle(document.documentElement);
const bodyStyle = window.getComputedStyle(document.body);

const cssVars = [
  '--toggle-background',
  '--toggle-border',
  '--toggle-icon',
  '--app-background',
  '--text-primary',
  '--bg-primary',
];

cssVars.forEach(varName => {
  const rootValue = rootStyle.getPropertyValue(varName).trim();
  const bodyValue = bodyStyle.getPropertyValue(varName).trim();
  console.log(`   ${varName}:`, rootValue || bodyValue || 'NOT FOUND');
});

// Test 6: Check if ThemeProvider is in React tree
console.log('');
console.log('6️⃣ Checking React components...');
const reactRoot = document.querySelector('#root');
if (reactRoot) {
  console.log('   React root found');
  // Check if there are any React error boundaries
  const errorBoundaries = document.querySelectorAll('[data-reactroot] *');
  console.log('   React elements found:', errorBoundaries.length);
} else {
  console.log('   ❌ No React root found');
}

// Test 7: Manual theme switching function
console.log('');
console.log('7️⃣ Creating manual theme switch function...');

window.manualThemeSwitch = function () {
  console.log('🔄 Attempting manual theme switch...');

  const themes = ['light', 'dark', 'horror'];
  const current = localStorage.getItem('weather-app-theme') || 'light';
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  console.log(`   Switching from ${current} to ${nextTheme}`);

  // Update localStorage
  localStorage.setItem('weather-app-theme', nextTheme);

  // Update body classes
  document.body.classList.remove('dark-theme', 'horror-theme');
  if (nextTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (nextTheme === 'horror') {
    document.body.classList.add('horror-theme');
  }

  // Update data-theme
  document.body.setAttribute('data-theme', nextTheme);

  console.log(`   ✅ Theme switched to ${nextTheme}`);
  console.log('   New body classes:', document.body.className);

  // Force a page refresh to see if React picks it up
  setTimeout(() => {
    console.log('   🔄 Reloading page to test React theme pickup...');
    window.location.reload();
  }, 2000);
};

// Test 8: Try clicking the theme button if found
if (themeButton) {
  console.log('');
  console.log('8️⃣ Testing theme button click...');

  const originalTheme = localStorage.getItem('weather-app-theme');
  console.log('   Theme before click:', originalTheme);

  try {
    themeButton.click();
    setTimeout(() => {
      const newTheme = localStorage.getItem('weather-app-theme');
      console.log('   Theme after click:', newTheme);
      console.log('   Click successful:', originalTheme !== newTheme);
    }, 100);
  } catch (error) {
    console.log('   ❌ Error clicking button:', error);
  }
}

console.log('');
console.log('🎯 SUMMARY & NEXT STEPS:');
console.log('========================');
console.log('• Check console for any red React errors');
console.log('• Run manualThemeSwitch() to test manual switching');
console.log('• Look for theme toggle button in top-right corner');
console.log('• If no button visible, check React component tree');
console.log('');
console.log('✅ Diagnostic complete!');
