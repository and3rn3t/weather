/**
 * Mobile Test Component
 * 
 * Simple test component to verify mobile optimizations work
 */

import React from 'react';
import { useTheme } from '../utils/useTheme';
import { getScreenInfo, getAdaptiveFontSizes } from '../utils/mobileScreenOptimization';
import '../styles/mobile-fixes.css';

export const MobileTest: React.FC = () => {
  const { theme } = useTheme();
  const screenInfo = getScreenInfo();
  const adaptiveFonts = getAdaptiveFontSizes(screenInfo);

  const getScreenSizeDescription = () => {
    if (screenInfo.isVerySmallScreen) return 'Very Small';
    if (screenInfo.isSmallScreen) return 'Small';
    return 'Normal';
  };

  return (
    <div className="mobile-container fade-in" style={{ background: theme.primaryGradient }}>
      <div className="mobile-card weather-display">
        <h1 className="mobile-title custom-font" style={{ color: theme.primaryText }}>
          Mobile Test
        </h1>
        <p className="mobile-body custom-font" style={{ color: theme.secondaryText }}>
          This is a test of the mobile optimizations. The text should be readable and buttons should be touch-friendly.
        </p>
        
        <div className="weather-details mt-20">
          <div className="weather-detail-item custom-font" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Screen</div>
            <div>{screenInfo.width} × {screenInfo.height}</div>
          </div>
          <div className="weather-detail-item custom-font" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Size</div>
            <div>{getScreenSizeDescription()}</div>
          </div>
          <div className="weather-detail-item custom-font" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Safe Area</div>
            <div>T:{screenInfo.safeAreaTop} B:{screenInfo.safeAreaBottom}</div>
          </div>
        </div>

        <div className="flex-row-wrap-center mt-24" style={{ gap: '12px' }}>
          <button 
            className="mobile-button custom-shadow"
            style={{ 
              background: theme.primaryGradient, 
              color: theme.inverseText 
            }}
            onClick={() => alert('Button 1 pressed!')}
            aria-label="Test Button 1"
          >
            Test Button 1
          </button>
          <button 
            className="mobile-button mobile-button-large custom-shadow"
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: theme.primaryText,
              border: `1px solid ${theme.primaryText}30`
            }}
            onClick={() => alert('Button 2 pressed!')}
            aria-label="Large Button"
          >
            Large Button
          </button>
          <button 
            className="mobile-button mobile-button-small custom-shadow"
            style={{ 
              background: 'rgba(255, 100, 100, 0.8)', 
              color: 'white'
            }}
            onClick={() => alert('Button 3 pressed!')}
            aria-label="Small Button"
          >
            Small
          </button>
        </div>

        <div className="mt-24" style={{ textAlign: 'left' }}>
          <h3 className="custom-font" style={{ color: theme.primaryText, fontSize: adaptiveFonts.sectionTitle }}>
            Mobile Features Test:
          </h3>
          <ul className="custom-font" style={{ color: theme.secondaryText, fontSize: adaptiveFonts.bodyMedium }}>
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
