// Horror Theme Layout Test Script
// Copy and paste this into the browser console to test the fixes

console.log('🎃 Horror Theme Layout Test Starting...');

// Function to activate horror theme and test layout
function testHorrorLayout() {
  console.log('1. Activating horror theme...');

  // Add horror theme class to body
  document.body.classList.add('horror-theme');

  // Wait a moment for effects to apply
  setTimeout(() => {
    console.log('2. Checking for layout issues...');

    // Check if any elements are cut off at the top
    const topElements = document.querySelectorAll('*');
    let cutoffElements = [];

    topElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < 0 && rect.height > 0) {
        cutoffElements.push({
          element:
            el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
          top: rect.top,
          height: rect.height,
        });
      }
    });

    console.log('3. Elements with negative top positions:', cutoffElements);

    // Check for fixed positioning issues
    const fixedElements = Array.from(document.querySelectorAll('*')).filter(
      el => {
        const style = window.getComputedStyle(el);
        return style.position === 'fixed';
      }
    );

    console.log(
      '4. Fixed position elements:',
      fixedElements.map(el => ({
        element:
          el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
        position: window.getComputedStyle(el).position,
        top: window.getComputedStyle(el).top,
        zIndex: window.getComputedStyle(el).zIndex,
      }))
    );

    // Check viewport height usage
    const viewportHeight = window.innerHeight;
    const bodyHeight = document.body.scrollHeight;

    console.log('5. Viewport info:', {
      viewportHeight,
      bodyHeight,
      scrollable: bodyHeight > viewportHeight,
      currentScroll: window.scrollY,
    });

    // Test scroll to top to check if content is accessible
    window.scrollTo(0, 0);
    setTimeout(() => {
      const topVisible = document.elementFromPoint(window.innerWidth / 2, 50);
      console.log(
        '6. Element visible at top center (50px from top):',
        topVisible?.tagName,
        topVisible?.className
      );

      console.log('✅ Horror theme layout test complete!');
      console.log('👀 Check the console output above for any issues');
      console.log('🎯 Key things to verify:');
      console.log('   - No elements should have negative top positions');
      console.log(
        '   - Fixed elements should be minimal and have z-index < 100'
      );
      console.log('   - Content should be visible and accessible at the top');
    }, 500);
  }, 1000);
}

// Function to deactivate horror theme
function deactivateHorrorTheme() {
  document.body.classList.remove('horror-theme');
  console.log('🌅 Horror theme deactivated');
}

// Run the test
testHorrorLayout();

console.log('🧪 Test functions available:');
console.log('   - testHorrorLayout() - Run the layout test');
console.log('   - deactivateHorrorTheme() - Turn off horror theme');
