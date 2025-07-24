/**
 * Simplified AppNavigator for Mobile Testing
 * 
 * Clean version focused on mobile optimization testing
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../utils/useTheme';
import { getScreenInfo, getAdaptiveFontSizes, getAdaptiveSpacing, getAdaptiveBorderRadius } from '../utils/mobileScreenOptimization';
import ThemeToggle from '../utils/ThemeToggle';
import MobileTest from '../components/MobileTest';
import MobileDebug from '../utils/MobileDebug';
import WeatherIcon from '../utils/weatherIcons';
import '../styles/mobile-fixes.css';

const SimpleMobileApp: React.FC = () => {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'test'>('home');
  const screenInfo = useMemo(() => getScreenInfo(), []);
  const adaptiveFonts = useMemo(() => getAdaptiveFontSizes(screenInfo), [screenInfo]);
  const adaptiveSpacing = useMemo(() => getAdaptiveSpacing(screenInfo), [screenInfo]);
  const adaptiveBorders = useMemo(() => getAdaptiveBorderRadius(screenInfo), [screenInfo]);

  // Navigation function
  const navigate = useCallback((screen: 'home' | 'test') => {
    setCurrentScreen(screen);
  }, []);

  if (currentScreen === 'test') {
    return (
      <div className="safe-area-container" style={{ background: theme.primaryGradient, minHeight: '100vh' }}>
        <MobileTest />
        <button 
          className="mobile-back-button fixed-top-left glass-blur"
          onClick={() => navigate('home')}
          aria-label="Go back to home screen"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: theme.primaryText,
            border: `1px solid ${theme.primaryText}30`,
          }}
        >
           Back
        </button>
        <MobileDebug enabled={true} position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="safe-area-container" style={{ background: theme.primaryGradient, minHeight: '100vh' }}>
      <ThemeToggle />
      
      <div className="mobile-container fade-in">
        <div className="mobile-card weather-display">
          <div
            className="flex-center-col custom-shadow"
            style={{
              width: screenInfo.isVerySmallScreen ? '100px' : '120px',
              height: screenInfo.isVerySmallScreen ? '100px' : '120px',
              background: theme.primaryGradient,
              borderRadius: adaptiveBorders.large,
              margin: `0 auto ${adaptiveSpacing.sectionGap}`,
              boxShadow: theme.buttonShadow
            }}
          >
            <WeatherIcon code={0} size={screenInfo.isVerySmallScreen ? 48 : 64} animated={true} />
            <div className="abs-top-right">
              <WeatherIcon code={61} size={screenInfo.isVerySmallScreen ? 18 : 24} animated={true} />
            </div>
            <div className="abs-bottom-left">
              <WeatherIcon code={3} size={screenInfo.isVerySmallScreen ? 16 : 20} animated={true} />
            </div>
          </div>
          
          <h1 className="mobile-title custom-font" style={{ color: theme.primaryText }}>
            Mobile Weather App
          </h1>
          
          <p className="mobile-body custom-font text-center" style={{ color: theme.secondaryText }}>
            Testing mobile optimizations for better usability on mobile devices
          </p>
          
          <div className="flex-row-wrap-center" style={{ gap: adaptiveSpacing.elementGap, marginBottom: adaptiveSpacing.sectionGap }}>
            {[
              { code: 0, label: 'Sunny' },
              { code: 61, label: 'Rainy' },
              { code: 71, label: 'Snow' },
              { code: 95, label: 'Storms' }
            ].map(({ code, label }) => (
              <div key={label} className="text-center">
                <WeatherIcon code={code} size={screenInfo.isVerySmallScreen ? 24 : 32} animated={true} />
                <div className="custom-font" style={{ fontSize: adaptiveFonts.bodySmall, color: theme.secondaryText, marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex-center-col">
            <button
              className="mobile-button mobile-button-large custom-shadow"
              style={{
                background: theme.primaryGradient,
                color: theme.inverseText,
                boxShadow: theme.buttonShadow
              }}
              onClick={() => alert('Weather functionality will be added!')}
              aria-label="Check weather (demo button)"
            >
              Check Weather 
            </button>
            
            <button
              className="mobile-button custom-shadow"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: theme.primaryText,
                border: `1px solid ${theme.primaryText}30`
              }}
              onClick={() => navigate('test')}
              aria-label="Test mobile UI"
            >
               Test Mobile UI
            </button>
          </div>
        </div>
      </div>
      
      <MobileDebug enabled={true} position="bottom-right" />
    </div>
  );
};

export default SimpleMobileApp;
