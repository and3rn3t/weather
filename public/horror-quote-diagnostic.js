// Horror Quote Coverage Diagnostic Script
// Run this in browser console to identify why quote is covering content

console.log('🎃 Horror Quote Coverage Diagnostic Starting...\n');

function diagnoseQuoteCoverage() {
  console.log('=== HORROR QUOTE COVERAGE DIAGNOSIS ===\n');

  // Find quote elements
  const quoteOverlay = document.querySelector('.horror-quote-overlay');
  const quoteWeather = document.querySelector('.horror-weather-quote');
  const quote = quoteOverlay || quoteWeather;

  if (!quote) {
    console.log('❌ No horror quote found - theme may not be active');
    return false;
  }

  console.log('✅ Quote element found:', quote.className);

  // Check element positioning and dimensions
  const rect = quote.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(quote);

  console.log('\n📐 ELEMENT DIMENSIONS:');
  console.log(`   Width: ${rect.width}px (${computedStyle.width})`);
  console.log(`   Height: ${rect.height}px (${computedStyle.height})`);
  console.log(`   Position: top=${rect.top}, left=${rect.left}`);
  console.log(
    `   Viewport coverage: ${(
      ((rect.width * rect.height) / (window.innerWidth * window.innerHeight)) *
      100
    ).toFixed(1)}%`
  );

  console.log('\n🎯 POSITIONING ANALYSIS:');
  console.log(`   Position: ${computedStyle.position}`);
  console.log(`   Z-index: ${computedStyle.zIndex}`);
  console.log(`   Margin: ${computedStyle.margin}`);
  console.log(`   Padding: ${computedStyle.padding}`);
  console.log(`   Display: ${computedStyle.display}`);

  // Check for coverage issues
  let coverageIssues = [];

  // Issue 1: Taking up too much screen space
  const coveragePercent =
    ((rect.width * rect.height) / (window.innerWidth * window.innerHeight)) *
    100;
  if (coveragePercent > 50) {
    coverageIssues.push(
      `Takes up ${coveragePercent.toFixed(1)}% of screen (should be <50%)`
    );
  }

  // Issue 2: Full width
  if (rect.width > window.innerWidth * 0.95) {
    coverageIssues.push('Quote width covers nearly full screen width');
  }

  // Issue 3: High z-index
  const zIndex = parseInt(computedStyle.zIndex) || 0;
  if (zIndex > 10) {
    coverageIssues.push(`Z-index too high: ${zIndex} (should be ≤10)`);
  }

  // Issue 4: Fixed positioning
  if (
    computedStyle.position === 'fixed' ||
    computedStyle.position === 'absolute'
  ) {
    coverageIssues.push(
      `Using ${computedStyle.position} positioning (should be relative)`
    );
  }

  // Issue 5: Parent container issues
  const parent = quote.parentElement;
  if (parent) {
    const parentStyle = window.getComputedStyle(parent);
    const parentRect = parent.getBoundingClientRect();

    console.log('\n📦 PARENT CONTAINER:');
    console.log(`   Tag: ${parent.tagName.toLowerCase()}`);
    console.log(`   Class: ${parent.className}`);
    console.log(`   Display: ${parentStyle.display}`);
    console.log(`   Position: ${parentStyle.position}`);
    console.log(`   Size: ${parentRect.width}x${parentRect.height}`);

    if (
      parentStyle.position === 'fixed' ||
      parentStyle.position === 'absolute'
    ) {
      coverageIssues.push('Parent container using absolute/fixed positioning');
    }
  }

  // Check for overlapping elements
  console.log('\n🔍 OVERLAPPING ELEMENT CHECK:');
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const elementAtCenter = document.elementFromPoint(centerX, centerY);

  if (elementAtCenter === quote || quote.contains(elementAtCenter)) {
    console.log('✅ Quote is top element at its center position');
  } else {
    console.log(
      '⚠️ Another element is on top:',
      elementAtCenter?.tagName,
      elementAtCenter?.className
    );
  }

  // Screen size analysis
  console.log('\n📱 SCREEN SIZE ANALYSIS:');
  console.log(`   Viewport: ${window.innerWidth}x${window.innerHeight}`);
  console.log(`   Device pixel ratio: ${window.devicePixelRatio}`);
  console.log(`   Screen size: ${screen.width}x${screen.height}`);

  const isMobile = window.innerWidth < 768;
  console.log(`   Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

  // Resolution-specific issues
  if (window.innerWidth < 400) {
    coverageIssues.push('Very small screen - quote may appear oversized');
  }

  if (window.innerHeight < 600) {
    coverageIssues.push('Short screen - quote may push content off-screen');
  }

  // Report issues
  console.log('\n🚨 COVERAGE ISSUES DETECTED:');
  if (coverageIssues.length === 0) {
    console.log('✅ No obvious coverage issues found');
  } else {
    coverageIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  return coverageIssues;
}

function applyScreenSizeSpecificFix() {
  console.log('\n🔧 Applying screen-size specific fix...');

  const quote = document.querySelector(
    '.horror-quote-overlay, .horror-weather-quote'
  );
  if (!quote) {
    console.log('❌ No quote to fix');
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 768;
  const isSmallScreen = viewportWidth < 400 || viewportHeight < 600;

  // Create responsive fix
  let fixCSS = `
        .horror-quote-overlay,
        .horror-weather-quote {
            position: relative !important;
            display: block !important;
            max-width: ${isSmallScreen ? '95%' : '90%'} !important;
            width: auto !important;
            margin: ${
              isSmallScreen ? '15px auto 80px auto' : '30px auto 120px auto'
            } !important;
            padding: ${isSmallScreen ? '15px' : '20px 24px'} !important;
            z-index: 1 !important;

            /* Force normal flow */
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;

            /* Limit height */
            max-height: ${isSmallScreen ? '200px' : '300px'} !important;
            overflow: ${isSmallScreen ? 'hidden' : 'visible'} !important;

            /* Responsive font sizing */
            font-size: ${isSmallScreen ? '14px' : '16px'} !important;
        }

        .horror-weather-quote .quote-text {
            font-size: ${isSmallScreen ? '14px' : '16px'} !important;
            line-height: 1.4 !important;
            margin: 0 !important;
        }

        .horror-weather-quote .quote-attribution {
            font-size: ${isSmallScreen ? '12px' : '14px'} !important;
            margin-top: ${isSmallScreen ? '8px' : '10px'} !important;
        }

        /* Mobile specific adjustments */
        @media (max-width: 400px) {
            .horror-quote-overlay,
            .horror-weather-quote {
                margin: 10px auto 60px auto !important;
                padding: 12px !important;
                max-height: 150px !important;
            }
        }

        /* Very short screens */
        @media (max-height: 600px) {
            .horror-quote-overlay,
            .horror-weather-quote {
                margin: 10px auto 40px auto !important;
                max-height: 120px !important;
            }
        }
    `;

  // Apply the fix
  let styleElement = document.getElementById('horror-quote-responsive-fix');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'horror-quote-responsive-fix';
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = fixCSS;

  console.log(`✅ Applied fix for ${isMobile ? 'mobile' : 'desktop'} screen`);
  console.log(`   Viewport: ${viewportWidth}x${viewportHeight}`);
  console.log(`   Small screen mode: ${isSmallScreen}`);

  // Test the fix
  setTimeout(() => {
    console.log('\n🔄 Re-testing after responsive fix...');
    const issues = diagnoseQuoteCoverage();
    if (issues.length === 0) {
      console.log('🎉 Coverage issues resolved!');
    } else {
      console.log('⚠️ Some issues may remain');
    }
  }, 500);
}

// Run diagnosis automatically
const issues = diagnoseQuoteCoverage();

if (issues.length > 0) {
  console.log('\n💡 Applying responsive fix...');
  applyScreenSizeSpecificFix();
} else {
  console.log('\n🎉 Quote positioning appears correct!');
}

// Make functions available for manual use
window.horrorQuoteDiagnostic = {
  diagnose: diagnoseQuoteCoverage,
  fix: applyScreenSizeSpecificFix,
};

console.log('\n🔧 Manual controls:');
console.log('   window.horrorQuoteDiagnostic.diagnose() - Run diagnosis');
console.log('   window.horrorQuoteDiagnostic.fix() - Apply responsive fix');
