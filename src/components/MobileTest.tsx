/**
 * Mobile Test Component
 * 
 * Simple test component to verify mobile optimizations work
 */

import React from 'react';
import { useTheme } from '../utils/useTheme';
import { getScreenInfo, getAdaptiveFontSizes, getAdaptiveSpacing } from '../utils/mobileScreenOptimization';
import '../styles/mobile-fixes.css';

export const MobileTest: React.FC = () => {
  const { theme } = useTheme();
  const screenInfo = getScreenInfo();
  const adaptiveFonts = getAdaptiveFontSizes(screenInfo);
  const adaptiveSpacing = getAdaptiveSpacing(screenInfo);

  return (
    <div className="mobile-container fade-in" style={{ background: theme.primaryGradient }}>
      <div className="mobile-card weather-display">
        <h1 className="mobile-title" style={{ color: theme.primaryText }}>
          Mobile Test
        </h1>
        <p className="mobile-body" style={{ color: theme.secondaryText }}>
          This is a test of the mobile optimizations. The text should be readable and buttons should be touch-friendly.
        </p>
        
        <div className="weather-details" style={{ marginTop: '20px' }}>
          <div className="weather-detail-item" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Screen</div>
            <div>{screenInfo.width} × {screenInfo.height}</div>
          </div>
          <div className="weather-detail-item" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Size</div>
            <div>{screenInfo.isVerySmallScreen ? 'Very Small' : screenInfo.isSmallScreen ? 'Small' : 'Normal'}</div>
          </div>
          <div className="weather-detail-item" style={{ background: theme.cardBackground, color: theme.primaryText }}>
            <div>Safe Area</div>
            <div>T:{screenInfo.safeAreaTop} B:{screenInfo.safeAreaBottom}</div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="mobile-button"
            style={{ 
              background: theme.primaryGradient, 
              color: theme.inverseText 
            }}
            onClick={() => alert('Button 1 pressed!')}
          >
            Test Button 1
          </button>
          <button 
            className="mobile-button mobile-button-large"
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: theme.primaryText,
              border: `1px solid ${theme.primaryText}30`
            }}
            onClick={() => alert('Button 2 pressed!')}
          >
            Large Button
          </button>
          <button 
            className="mobile-button mobile-button-small"
            style={{ 
              background: 'rgba(255, 100, 100, 0.8)', 
              color: 'white'
            }}
            onClick={() => alert('Button 3 pressed!')}
          >
            Small
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          <h3 style={{ color: theme.primaryText, fontSize: adaptiveFonts.sectionTitle }}>
            Mobile Features Test:
          </h3>
          <ul style={{ color: theme.secondaryText, fontSize: adaptiveFonts.bodyMedium }}>
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
