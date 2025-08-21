// SIMPLE THEME TOGGLE TEST - Run this in browser console
console.log('🧪 Simple Theme Toggle Test');

// 1. Check if button exists
const button = document.querySelector('.theme-toggle-btn');
console.log('Button found:', !!button);

if (button) {
  console.log('Button classes:', button.className);
  console.log('Button style:', {
    display: window.getComputedStyle(button).display,
    position: window.getComputedStyle(button).position,
    zIndex: window.getComputedStyle(button).zIndex,
    top: window.getComputedStyle(button).top,
    right: window.getComputedStyle(button).right,
  });
} else {
  console.log('❌ No button found. Looking for any buttons...');
  const allButtons = document.querySelectorAll('button');
  console.log('Total buttons found:', allButtons.length);
  allButtons.forEach((btn, i) => {
    console.log(`Button ${i + 1}:`, btn.textContent, btn.className);
  });
}

// 2. Check theme state
console.log('Current theme:', localStorage.getItem('weather-app-theme'));
console.log('Body classes:', document.body.className);

// 3. Force show button if hidden
if (button) {
  button.style.display = 'flex !important';
  button.style.position = 'fixed';
  button.style.top = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.background = 'red'; // Make it obvious
  console.log('✅ Forced button visibility');
}

// 4. Manual click test
window.testClick = function () {
  if (button) {
    console.log('Testing click...');
    button.click();
    setTimeout(() => {
      console.log('New theme:', localStorage.getItem('weather-app-theme'));
    }, 100);
  }
};

console.log('Run testClick() to test button functionality');
