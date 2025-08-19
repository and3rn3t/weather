/**
 * NUCLEAR FIX for Background Color Changes
 * This prevents ANY click from changing the background except theme toggle
 */

// Block all theme changes except from legitimate theme toggle
let themeToggleInProgress = false;
let lastThemeToggleTime = 0;

// Override any accidental theme triggers
document.addEventListener(
  'click',
  function (event) {
    const target = event.target as HTMLElement;
    const isThemeToggle =
      target.closest('.theme-toggle-btn') ||
      target.classList.contains('theme-toggle-btn') ||
      (target.textContent &&
        (target.textContent.includes('☀️') ||
          target.textContent.includes('🌙')));

    if (!isThemeToggle) {
      // This is NOT a theme toggle click - prevent any theme changes
      const now = Date.now();
      if (now - lastThemeToggleTime > 1000) {
        // Only if not within 1 second of legitimate toggle
        // Block theme context from running
        console.log(
          '🚫 Blocking potential accidental theme change from click on:',
          target
        );
        event.stopImmediatePropagation();
      }
    } else {
      // This IS a legitimate theme toggle
      console.log('✅ Legitimate theme toggle detected');
      themeToggleInProgress = true;
      lastThemeToggleTime = Date.now();
      setTimeout(() => {
        themeToggleInProgress = false;
      }, 1000);
    }
  },
  true
);

// Monitor for unauthorized background changes
const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty = function (
  property,
  value,
  priority
) {
  if (property === 'background' && this === document.body.style) {
    const now = Date.now();
    if (!themeToggleInProgress && now - lastThemeToggleTime > 1000) {
      console.warn('🚨 BLOCKED unauthorized background change:', value);
      return; // Block the change
    } else {
      console.log('✅ Authorized background change:', value);
    }
  }
  return originalSetProperty.call(this, property, value, priority);
};

export {};
