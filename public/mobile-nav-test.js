/**
 * Mobile Navigation Testing Script
 * 
 * Quick test to verify the new mobile navigation system is working
 * Run this in the browser console on mobile device or mobile emulator
 */

console.log('🔍 Testing Mobile Navigation System...');

// Test mobile navigation detection
const checkMobileNavigation = () => {
  const mobileNav = document.querySelector('.mobile-navigation');
  const isMobile = window.innerWidth < 768;
  
  console.log('📱 Mobile viewport detected:', isMobile);
  console.log('🧭 Mobile navigation element:', mobileNav ? 'Found' : 'Not found');
  
  if (mobileNav && isMobile) {
    console.log('✅ Mobile navigation is properly displayed');
    
    // Test navigation buttons
    const navButtons = mobileNav.querySelectorAll('button[role="tab"]');
    console.log('🔘 Navigation buttons found:', navButtons.length);
    
    navButtons.forEach((button, index) => {
      const label = button.getAttribute('aria-label');
      const isSelected = button.getAttribute('aria-selected') === 'true';
      console.log(`  ${index + 1}. ${label} - ${isSelected ? 'Active' : 'Inactive'}`);
    });
    
    return true;
  }
  
  return false;
};

// Test screen transitions
const testScreenTransition = () => {
  const screenContainer = document.querySelector('.screen-container');
  const transitions = document.querySelectorAll('.screen-transition');
  
  console.log('🎬 Screen container:', screenContainer ? 'Found' : 'Not found');
  console.log('🎞️ Screen transitions:', transitions.length);
  
  transitions.forEach((transition, index) => {
    const state = transition.getAttribute('data-transition-state');
    const direction = transition.getAttribute('data-direction');
    console.log(`  Screen ${index + 1}: ${state} (${direction})`);
  });
};

// Test touch interactions
const testTouchSupport = () => {
  const touchSupported = 'ontouchstart' in window;
  const pointerSupported = 'onpointerdown' in window;
  
  console.log('👆 Touch events supported:', touchSupported);
  console.log('🖱️ Pointer events supported:', pointerSupported);
  
  // Test tap highlight removal
  const buttons = document.querySelectorAll('button');
  let tapHighlightDisabled = true;
  
  buttons.forEach(button => {
    const style = getComputedStyle(button);
    if (style.webkitTapHighlightColor !== 'rgba(0, 0, 0, 0)' && 
        style.webkitTapHighlightColor !== 'transparent') {
      tapHighlightDisabled = false;
    }
  });
  
  console.log('🚫 Tap highlights disabled:', tapHighlightDisabled);
};

// Test glassmorphism effects
const testGlassmorphism = () => {
  const mobileNav = document.querySelector('.mobile-navigation');
  if (mobileNav) {
    const style = getComputedStyle(mobileNav);
    const hasBackdropFilter = style.backdropFilter !== 'none';
    const hasBackground = style.background.includes('rgba');
    
    console.log('🔍 Backdrop filter applied:', hasBackdropFilter);
    console.log('🎨 Transparent background:', hasBackground);
  }
};

// Test safe area support
const testSafeArea = () => {
  const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
  const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
  
  console.log('📐 Safe area top:', safeAreaTop || 'Not set');
  console.log('📐 Safe area bottom:', safeAreaBottom || 'Not set');
};

// Run all tests
const runMobileNavigationTests = () => {
  console.log('\n=== Mobile Navigation Test Results ===');
  
  const mobileNavWorking = checkMobileNavigation();
  testScreenTransition();
  testTouchSupport();
  testGlassmorphism();
  testSafeArea();
  
  console.log('\n=== Test Summary ===');
  console.log('🚀 Mobile navigation system:', mobileNavWorking ? 'Working' : 'Needs attention');
  console.log('📱 Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('🔧 User agent:', navigator.userAgent.includes('Mobile') ? 'Mobile device' : 'Desktop/Emulator');
  
  return mobileNavWorking;
};

// Auto-run tests when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runMobileNavigationTests);
} else {
  runMobileNavigationTests();
}

// Export test function for manual testing
window.testMobileNavigation = runMobileNavigationTests;

console.log('💡 Run window.testMobileNavigation() to run tests again');
console.log('📱 Switch to mobile view in DevTools and reload to test mobile navigation');
