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
          className="mobile-back-button"
          onClick={() => navigate('home')}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.2)',
            color: theme.primaryText,
            border: `1px solid ${theme.primaryText}30`,
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Back
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
          <div style={{
            width: screenInfo.isVerySmallScreen ? '100px' : '120px',
            height: screenInfo.isVerySmallScreen ? '100px' : '120px',
            background: theme.primaryGradient,
            borderRadius: adaptiveBorders.large,
            margin: `0 auto ${adaptiveSpacing.sectionGap}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: theme.buttonShadow
          }}>
            <WeatherIcon code={0} size={screenInfo.isVerySmallScreen ? 48 : 64} animated={true} />
            <div style={{ position: 'absolute', top: '-10px', right: '-10px' }}>
              <WeatherIcon code={61} size={screenInfo.isVerySmallScreen ? 18 : 24} animated={true} />
            </div>
            <div style={{ position: 'absolute', bottom: '-8px', left: '-8px' }}>
              <WeatherIcon code={3} size={screenInfo.isVerySmallScreen ? 16 : 20} animated={true} />
            </div>
          </div>
          
          <h1 className="mobile-title" style={{ color: theme.primaryText }}>
            Mobile Weather App
          </h1>
          
          <p className="mobile-body" style={{ color: theme.secondaryText, textAlign: 'center' }}>
            Testing mobile optimizations for better usability on mobile devices
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: adaptiveSpacing.elementGap,
            marginBottom: adaptiveSpacing.sectionGap,
            flexWrap: 'wrap'
          }}>
            {[
              { code: 0, label: 'Sunny' },
              { code: 61, label: 'Rainy' },
              { code: 71, label: 'Snow' },
              { code: 95, label: 'Storms' }
            ].map(({ code, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <WeatherIcon code={code} size={screenInfo.isVerySmallScreen ? 24 : 32} animated={true} />
                <div style={{ 
                  fontSize: adaptiveFonts.bodySmall, 
                  color: theme.secondaryText, 
                  marginTop: '4px' 
                }}>{label}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <button
              className="mobile-button mobile-button-large"
              style={{
                background: theme.primaryGradient,
                color: theme.inverseText,
                boxShadow: theme.buttonShadow
              }}
              onClick={() => alert('Weather functionality will be added!')}
            >
              Check Weather →
            </button>
            
            <button
              className="mobile-button"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: theme.primaryText,
                border: `1px solid ${theme.primaryText}30`
              }}
              onClick={() => navigate('test')}
            >
              🔧 Test Mobile UI
            </button>
          </div>
        </div>
      </div>
      
      <MobileDebug enabled={true} position="bottom-right" />
    </div>
  );
};

export default SimpleMobileApp;
