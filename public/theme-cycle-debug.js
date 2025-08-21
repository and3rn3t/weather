// THEME CYCLING DEBUG - Run this in browser console
console.log('🔄 THEME CYCLING DIAGNOSTIC');
console.log('===========================');

// Get the actual theme button
const themeBtn = document.querySelector('.theme-toggle-btn');
console.log('Theme button found:', !!themeBtn);

if (themeBtn) {
  console.log('Current button details:');
  console.log('  Text:', themeBtn.textContent);
  console.log('  Classes:', themeBtn.className);
  console.log('  Title:', themeBtn.title);
}

// Check current state
console.log('');
console.log('Current theme state:');
console.log('  localStorage:', localStorage.getItem('weather-app-theme'));
console.log('  Body classes:', document.body.className);
console.log('  Body data-theme:', document.body.getAttribute('data-theme'));

// Test clicking the actual button multiple times
console.log('');
console.log('Testing actual button clicks...');

let clickCount = 0;
window.testActualClicks = function () {
  if (!themeBtn) {
    console.log('❌ No theme button found');
    return;
  }

  const interval = setInterval(() => {
    clickCount++;
    console.log(`Click ${clickCount}:`);
    console.log(
      '  Before - localStorage:',
      localStorage.getItem('weather-app-theme')
    );
    console.log('  Before - Body classes:', document.body.className);

    // Click the actual button
    themeBtn.click();

    // Check immediately after
    setTimeout(() => {
      console.log(
        '  After - localStorage:',
        localStorage.getItem('weather-app-theme')
      );
      console.log('  After - Body classes:', document.body.className);
      console.log('  After - Button text:', themeBtn.textContent);
      console.log('  After - Button classes:', themeBtn.className);
      console.log('  ---');

      if (clickCount >= 5) {
        clearInterval(interval);
        console.log('✅ Test complete - check if themes cycled properly');
      }
    }, 100);
  }, 1500); // 1.5 second between clicks
};

// Manual theme switching function to compare
window.manualThemeCycle = function () {
  console.log('🔧 Manual theme cycling test...');
  const themes = ['light', 'dark', 'horror'];
  const current = localStorage.getItem('weather-app-theme') || 'light';
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  console.log(`Manual switch: ${current} → ${nextTheme}`);

  // Update localStorage
  localStorage.setItem('weather-app-theme', nextTheme);

  // Update body classes manually
  document.body.classList.remove('dark-theme', 'horror-theme');
  if (nextTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (nextTheme === 'horror') {
    document.body.classList.add('horror-theme');
  }

  // Update data-theme
  document.body.setAttribute('data-theme', nextTheme);

  console.log('Manual result:');
  console.log('  localStorage:', localStorage.getItem('weather-app-theme'));
  console.log('  Body classes:', document.body.className);
};

// Check for event listeners on the button
console.log('');
console.log('Button event listeners:');
if (themeBtn) {
  // Try to get React props (if available)
  const reactProps = Object.keys(themeBtn).find(key =>
    key.startsWith('__reactProps')
  );
  if (reactProps) {
    console.log('  React props found:', !!themeBtn[reactProps]);
  }

  // Check if onClick handler exists
  console.log('  onclick handler:', typeof themeBtn.onclick);
}

console.log('');
console.log('🎯 AVAILABLE TESTS:');
console.log('• testActualClicks() - Test real button clicks (5 times)');
console.log('• manualThemeCycle() - Manual theme switching');
console.log('');
console.log('Run testActualClicks() to see if React theme cycling works');
