/**
 * Horror Quote Auto-Positioning Utility
 * Automatically fixes quote positioning issues on page load
 */

console.log('🎃 Loading Horror Quote Auto-Positioning...');

class HorrorQuotePositioner {
  constructor() {
    this.initialized = false;
    this.observer = null;
    this.init();
  }

  init() {
    if (this.initialized) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }

    this.initialized = true;
  }

  start() {
    console.log('🎃 Starting Horror Quote Positioning System...');

    // Initial positioning
    this.positionQuotes();

    // Set up observers for dynamic content
    this.setupObserver();

    // Reposition on window resize
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.positionQuotes(), 250);
    });

    // Periodic check for new quotes
    setInterval(() => this.positionQuotes(), 2000);

    console.log('✅ Horror Quote Positioning System active');
  }

  positionQuotes() {
    const quotes = document.querySelectorAll(
      '.horror-quote-overlay, .horror-weather-quote'
    );

    if (quotes.length === 0) {
      return; // No quotes to position
    }

    quotes.forEach(quote => this.positionSingleQuote(quote));
  }

  positionSingleQuote(quote) {
    if (!quote) return;

    console.log('🔧 Positioning horror quote...');

    // Check if it's already positioned
    if (quote.classList.contains('positioned')) {
      return;
    }

    // Get screen dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isSmallScreen = viewportWidth < 600 || viewportHeight < 600;

    // Remove any existing positioning classes
    quote.classList.remove('positioning-error', 'coverage-issue');

    // Apply safety positioning
    this.applySafetyStyles(quote, isSmallScreen);

    // Check if it's causing coverage issues
    setTimeout(() => {
      if (this.checkForCoverageIssues(quote)) {
        console.log('⚠️ Coverage issue detected, applying emergency fix...');
        this.applyEmergencyFix(quote);
      } else {
        // Mark as properly positioned
        quote.classList.add('positioned', 'horror-quote-auto-position');
        console.log('✅ Quote positioned successfully');
      }
    }, 100);
  }

  applySafetyStyles(quote, isSmallScreen) {
    // Reset any problematic styles
    quote.style.position = 'relative';
    quote.style.top = 'auto';
    quote.style.left = 'auto';
    quote.style.right = 'auto';
    quote.style.bottom = 'auto';
    quote.style.transform = 'none';
    quote.style.zIndex = '1';
    quote.style.display = 'block';
    quote.style.clear = 'both';

    // Apply responsive sizing
    if (isSmallScreen) {
      quote.style.maxWidth = '95%';
      quote.style.margin = '10px auto 60px auto';
      quote.style.padding = '8px 12px';
      quote.style.maxHeight = '80px';
      quote.style.fontSize = '12px';
    } else {
      quote.style.maxWidth = '80%';
      quote.style.margin = '20px auto 80px auto';
      quote.style.padding = '15px';
      quote.style.maxHeight = '120px';
      quote.style.fontSize = '14px';
    }

    // Ensure it has proper overflow handling
    quote.style.overflow = 'hidden';
    quote.style.boxSizing = 'border-box';
  }

  checkForCoverageIssues(quote) {
    const rect = quote.getBoundingClientRect();
    const viewportArea = window.innerWidth * window.innerHeight;
    const quoteArea = rect.width * rect.height;
    const coveragePercent = (quoteArea / viewportArea) * 100;

    // Check for various coverage issues
    const issues = [];

    if (coveragePercent > 20) {
      issues.push(`High coverage: ${coveragePercent.toFixed(1)}%`);
    }

    if (rect.width > window.innerWidth * 0.9) {
      issues.push('Width too wide');
    }

    if (rect.height > window.innerHeight * 0.3) {
      issues.push('Height too tall');
    }

    if (rect.top < 0 || rect.left < 0) {
      issues.push('Positioned off-screen');
    }

    if (issues.length > 0) {
      console.log(`🚨 Coverage issues: ${issues.join(', ')}`);
      return true;
    }

    return false;
  }

  applyEmergencyFix(quote) {
    // Nuclear option: apply minimal styles
    quote.style.cssText = `
            position: relative !important;
            display: block !important;
            margin: 10px auto 40px auto !important;
            max-width: 80% !important;
            width: auto !important;
            height: auto !important;
            max-height: 60px !important;
            padding: 8px !important;
            z-index: 1 !important;
            overflow: hidden !important;
            background: rgba(0, 0, 0, 0.8) !important;
            border: 1px solid #8b0000 !important;
            color: #ff6b6b !important;
            text-align: center !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
            border-radius: 4px !important;
            clear: both !important;
        `;

    // Add emergency class
    quote.classList.add('positioned', 'emergency-positioned');

    // Hide quotation marks if they're causing issues
    const style = document.createElement('style');
    style.textContent = `
            .emergency-positioned::before,
            .emergency-positioned::after {
                display: none !important;
            }
        `;
    document.head.appendChild(style);

    console.log('⚡ Emergency positioning applied');
  }

  setupObserver() {
    if (!window.MutationObserver) return;

    this.observer = new MutationObserver(mutations => {
      let shouldReposition = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Element node
            if (
              node.matches &&
              (node.matches('.horror-quote-overlay') ||
                node.matches('.horror-weather-quote') ||
                node.querySelector(
                  '.horror-quote-overlay, .horror-weather-quote'
                ))
            ) {
              shouldReposition = true;
            }
          }
        });
      });

      if (shouldReposition) {
        setTimeout(() => this.positionQuotes(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    clearTimeout(this.resizeTimeout);
  }
}

// Auto-initialize
const horrorQuotePositioner = new HorrorQuotePositioner();

// Export for manual control
window.horrorQuotePositioner = horrorQuotePositioner;

console.log('💡 Manual control: window.horrorQuotePositioner.positionQuotes()');
