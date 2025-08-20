// Quick test script to verify horror theme navigation styling
console.log('🩸 Testing Horror Theme Navigation...');

// Check if horror theme is active
const checkHorrorTheme = () => {
  const body = document.body;
  const hasHorrorClass = body.classList.contains('horror-theme');
  console.log('Horror theme active:', hasHorrorClass);

  if (!hasHorrorClass) {
    console.log('🎭 Activating horror theme...');
    body.classList.add('horror-theme');
    localStorage.setItem('weather-app-theme', 'horror');
  }

  return hasHorrorClass;
};

// Check navigation styling
const checkNavigationStyling = () => {
  const navigation = document.querySelector('.mobile-navigation');
  const navButtons = document.querySelectorAll('.nav-button');

  console.log('Navigation element found:', !!navigation);
  console.log('Navigation buttons found:', navButtons.length);

  if (navigation) {
    const computedStyle = window.getComputedStyle(navigation);
    console.log('Navigation background:', computedStyle.background);
    console.log('Navigation border-top:', computedStyle.borderTop);
  }

  navButtons.forEach((button, index) => {
    const computedStyle = window.getComputedStyle(button);
    console.log(`Button ${index} background:`, computedStyle.background);
    console.log(`Button ${index} color:`, computedStyle.color);
  });
};

// Run tests
setTimeout(() => {
  checkHorrorTheme();
  checkNavigationStyling();
}, 1000);

// Also run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      checkHorrorTheme();
      checkNavigationStyling();
    }, 500);
  });
} else {
  setTimeout(() => {
    checkHorrorTheme();
    checkNavigationStyling();
  }, 500);
}
