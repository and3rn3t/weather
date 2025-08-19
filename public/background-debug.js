/**
 * Debug Script for Background Color Issue
 *
 * This script helps identify what's causing the background to change
 * when clicking anywhere on the screen.
 */

console.log('🔍 Background Color Change Debugger');
console.log('==================================');

// Track theme context changes
let themeChangeCount = 0;
let backgroundChangeCount = 0;

// Override console.log to track theme changes
const originalLog = console.log;
console.log = function (...args) {
  if (
    args[0] &&
    args[0].includes &&
    args[0].includes('Theme background changing')
  ) {
    themeChangeCount++;
    backgroundChangeCount++;
    console.error(`🚨 BACKGROUND CHANGE #${backgroundChangeCount}:`, ...args);
    console.trace('Background change stack trace:');
  }
  return originalLog.apply(console, args);
};

// Track all click events globally
document.addEventListener(
  'click',
  function (event) {
    const target = event.target;
    const targetInfo = {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      closest: {
        button: target.closest('button'),
        nav: target.closest('nav'),
        themeToggle: target.closest('.theme-toggle-btn'),
        autocomplete: target.closest('[class*="autocomplete"]'),
      },
    };

    console.log('👆 CLICK EVENT:', targetInfo);

    // Check if this is a theme toggle click
    if (targetInfo.closest.themeToggle) {
      console.log('✅ Valid theme toggle click');
    } else {
      console.log('❓ Non-theme click - should NOT change background');
    }
  },
  true
);

// Monitor DOM mutations that might affect background
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (
      mutation.type === 'attributes' &&
      mutation.attributeName === 'style' &&
      mutation.target === document.body
    ) {
      console.log('🎨 BODY STYLE CHANGED:', document.body.style.background);
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['style', 'class'],
});

// Track theme context re-renders
let themeRenderCount = 0;
const originalUseEffect = React.useEffect;
if (typeof React !== 'undefined') {
  React.useEffect = function (effect, deps) {
    if (
      deps &&
      deps.some &&
      deps.some(
        dep =>
          typeof dep === 'string' &&
          (dep.includes('rgb') ||
            dep.includes('#') ||
            dep.includes('background'))
      )
    ) {
      themeRenderCount++;
      console.log(`🔄 THEME EFFECT TRIGGER #${themeRenderCount}:`, deps);
    }
    return originalUseEffect(effect, deps);
  };
}

console.log(
  '✅ Debug script loaded. Click around and watch for unexpected background changes.'
);
console.log(
  '🎯 Expected: Background should ONLY change when clicking the theme toggle (☀️/🌙)'
);
console.log(
  "🚨 Issue: If background changes on ANY click, there's a bug to fix."
);

export {};
