// TARGETED THEME BUTTON DEBUGGING
// Copy this into browser console at http://localhost:5173/

console.log('🔍 TARGETED THEME BUTTON DEBUG');
console.log('==============================');

// Test 1: Check if React is rendering anything
console.log('1️⃣ React rendering check:');
const reactRoot = document.querySelector('#root');
console.log('   React root element:', !!reactRoot);
if (reactRoot) {
  console.log('   React root has children:', reactRoot.children.length > 0);
  console.log('   React root innerHTML length:', reactRoot.innerHTML.length);
  console.log(
    '   First 200 chars:',
    reactRoot.innerHTML.substring(0, 200) + '...'
  );
}

// Test 2: Look for any buttons at all
console.log('');
console.log('2️⃣ All buttons on page:');
const allButtons = document.querySelectorAll('button');
console.log('   Total buttons found:', allButtons.length);
allButtons.forEach((btn, i) => {
  console.log(`   Button ${i + 1}:`, {
    text: btn.textContent?.trim(),
    className: btn.className,
    title: btn.title,
    visible: window.getComputedStyle(btn).display !== 'none',
  });
});

// Test 3: Check for React errors in console
console.log('');
console.log('3️⃣ Checking for console errors:');
// This will show any errors that have occurred
console.log('   Check the red error messages above in console');

// Test 4: Check if ThemeToggle component exists in DOM
console.log('');
console.log('4️⃣ Looking for theme-related elements:');
const themeElements = document.querySelectorAll(
  '[class*="theme"], [data-theme]'
);
console.log('   Theme-related elements:', themeElements.length);
themeElements.forEach((el, i) => {
  console.log(`   Element ${i + 1}:`, {
    tagName: el.tagName,
    className: el.className,
    dataTheme: el.getAttribute('data-theme'),
  });
});

// Test 5: Check localStorage and body classes
console.log('');
console.log('5️⃣ Theme state check:');
console.log(
  '   localStorage theme:',
  localStorage.getItem('weather-app-theme')
);
console.log('   Body classes:', document.body.className);
console.log('   Body data-theme:', document.body.getAttribute('data-theme'));

// Test 6: Try to manually create a theme button for testing
console.log('');
console.log('6️⃣ Creating test theme button:');
window.createTestThemeButton = function () {
  // Remove any existing test button
  const existing = document.querySelector('#test-theme-btn');
  if (existing) existing.remove();

  // Create test button
  const testBtn = document.createElement('button');
  testBtn.id = 'test-theme-btn';
  testBtn.className = 'theme-toggle-btn theme-toggle-light';
  testBtn.textContent = '🌙';
  testBtn.title = 'Test Theme Switch';
  testBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid #ccc;
    background: white;
    cursor: pointer;
    font-size: 20px;
  `;

  testBtn.onclick = function () {
    const themes = ['light', 'dark', 'horror'];
    const current = localStorage.getItem('weather-app-theme') || 'light';
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    localStorage.setItem('weather-app-theme', nextTheme);

    document.body.classList.remove('dark-theme', 'horror-theme');
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (nextTheme === 'horror') {
      document.body.classList.add('horror-theme');
    }

    document.body.setAttribute('data-theme', nextTheme);

    // Update button appearance
    testBtn.className = `theme-toggle-btn theme-toggle-${nextTheme}`;
    testBtn.textContent =
      nextTheme === 'light' ? '🌙' : nextTheme === 'dark' ? '💀' : '☀️';

    console.log(`✅ Test button switched to ${nextTheme} theme`);
  };

  document.body.appendChild(testBtn);
  console.log('   ✅ Test theme button created in top-right corner');
  console.log('   Click it to test theme switching manually');
};

console.log('');
console.log('🎯 NEXT STEPS:');
console.log('• Check for any RED error messages in console above');
console.log('• Run createTestThemeButton() to test manual theme switching');
console.log('• Look for the orange test button in top-right corner');
console.log(
  '• If React app is not rendering, check for import/compilation errors'
);

console.log('');
console.log('✅ Debug complete! Run createTestThemeButton() to test themes.');
