/**
 * Mobile Test Component
 * 
 * Simple test component to verify mobile optimizations work
 */

import React from 'react';
import { getScreenInfo, getAdaptiveFontSizes } from '../utils/mobileScreenOptimization';

export const MobileTest: React.FC = () => {
  // const { theme } = useTheme();
  const screenInfo = getScreenInfo();
  const adaptiveFonts = getAdaptiveFontSizes(screenInfo);

  const getScreenSizeDescription = () => {
    if (screenInfo.isVerySmallScreen) return 'Very Small';
    if (screenInfo.isSmallScreen) return 'Small';
    return 'Normal';
  };

  return (
    <div className="mobile-container fade-in" style={{ background: 'var(--primary-gradient)' }}>
      <div className="mobile-card weather-display">
        <h1 className="mobile-title custom-font">
          Mobile Test
        </h1>
        <p className="mobile-body custom-font">
          This is a test of the mobile optimizations. The text should be readable and buttons should be touch-friendly.
        </p>
        
        <div className="weather-details mt-20">
          <div className="weather-detail-item custom-font" style={{ background: 'var(--card-background)', color: 'var(--primary-text)' }}>
            <div>Screen</div>
            <div>{screenInfo.width} × {screenInfo.height}</div>
          </div>
          <div className="weather-detail-item custom-font" style={{ background: 'var(--card-background)', color: 'var(--primary-text)' }}>
            <div>Size</div>
            <div>{getScreenSizeDescription()}</div>
          </div>
          <div className="weather-detail-item custom-font" style={{ background: 'var(--card-background)', color: 'var(--primary-text)' }}>
            <div>Safe Area</div>
            <div>T:{screenInfo.safeAreaTop} B:{screenInfo.safeAreaBottom}</div>
          </div>
        </div>

        <div className="flex-row-wrap-center mt-24" style={{ gap: '12px' }}>
          <button 
            className="mobile-button custom-shadow"
            style={{ 
              background: 'var(--button-gradient)', 
              color: 'var(--inverse-text)'
            }}
            onClick={() => alert('Button 1 pressed!')}
            aria-label="Test Button 1"
          >
            Test Button 1
          </button>
          <button 
            className="mobile-button-glass"
            onClick={() => alert('Button 2 pressed!')}
            aria-label="Glass Button"
          >
            Glass Button
          </button>
          <button 
            className="mobile-button mobile-button-small custom-shadow"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              color: 'white'
            }}
            onClick={() => alert('Button 3 pressed!')}
            aria-label="Small Button"
          >
            Small
          </button>
        </div>

        <div className="mt-24" style={{ textAlign: 'left' }}>
          <h3 className="custom-font" style={{ fontSize: adaptiveFonts.sectionTitle }}>
            Mobile Features Test:
          </h3>
          <ul className="custom-font" style={{ fontSize: adaptiveFonts.bodyMedium }}>
            <li>✅ Touch-friendly buttons (44px minimum)</li>
            <li>✅ Responsive text sizing</li>
            <li>✅ Safe area handling</li>
            <li>✅ Proper viewport configuration</li>
            <li>✅ Glassmorphism effects</li>
            <li>✅ Smooth animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileTest;
