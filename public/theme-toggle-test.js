// THEME SWITCHER VERIFICATION SCRIPT
// Copy and paste this into browser console to test theme switching

console.log('🧪 TESTING THEME SWITCHER FUNCTIONALITY');
console.log('');

// Test 1: Check if theme button exists
const themeButton = document.querySelector(
  '[data-testid="theme-toggle"], .theme-toggle, button[class*="theme"]'
);
console.log('1. Theme button found:', !!themeButton);
if (themeButton) {
  console.log('   - Button classes:', themeButton.className);
  console.log(
    '   - Button visible:',
    window.getComputedStyle(themeButton).display !== 'none'
  );
}

// Test 2: Check current theme
const currentTheme = localStorage.getItem('weatherAppTheme') || 'light';
console.log('2. Current theme from localStorage:', currentTheme);

// Test 3: Check if body has theme class
const bodyClasses = document.body.className;
console.log('3. Body classes:', bodyClasses);
console.log('   - Has theme class:', /theme-\w+/.test(bodyClasses));

// Test 4: Check CSS variables
const computedStyle = window.getComputedStyle(document.documentElement);
const bgColor = computedStyle.getPropertyValue('--bg-primary').trim();
const textColor = computedStyle.getPropertyValue('--text-primary').trim();
console.log('4. CSS Variables:');
console.log('   - Background:', bgColor);
console.log('   - Text color:', textColor);

// Test 5: Manual theme switching test
function testThemeSwitch() {
  const themes = ['light', 'dark', 'horror'];

  console.log('');
  console.log('🔄 MANUAL THEME SWITCHING TEST:');

  themes.forEach((theme, index) => {
    setTimeout(() => {
      localStorage.setItem('weatherAppTheme', theme);
      document.body.className =
        document.body.className.replace(/theme-\w+/g, '') + ` theme-${theme}`;
      console.log(`   → Switched to ${theme} theme`);

      if (index === themes.length - 1) {
        setTimeout(() => {
          // Restore original theme
          localStorage.setItem('weatherAppTheme', currentTheme);
          document.body.className =
            document.body.className.replace(/theme-\w+/g, '') +
            ` theme-${currentTheme}`;
          console.log(`   → Restored to ${currentTheme} theme`);
          console.log('');
          console.log('✅ Manual theme switching test complete!');
          console.log(
            '🎯 Try clicking the theme toggle button in the top-right corner!'
          );
        }, 1000);
      }
    }, index * 1000);
  });
}

// Test 6: Try to click the theme button programmatically
function testButtonClick() {
  if (themeButton) {
    console.log('');
    console.log('🖱️ TESTING BUTTON CLICK:');
    console.log(
      '   - Before click, theme:',
      localStorage.getItem('weatherAppTheme')
    );
    themeButton.click();
    setTimeout(() => {
      console.log(
        '   - After click, theme:',
        localStorage.getItem('weatherAppTheme')
      );
    }, 100);
  }
}

// Run tests
console.log('');
console.log('🚀 To test theme switching manually:');
console.log('   testThemeSwitch() - Test all themes automatically');
console.log('   testButtonClick() - Test button click');

// Auto-run basic tests
testButtonClick();
