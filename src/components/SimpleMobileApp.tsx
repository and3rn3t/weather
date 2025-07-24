/**
 * Simplified AppNavigator for Mobile Testing
 * 
 * Clean version focused on mobile optimization testing
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { getScreenInfo, getAdaptiveFontSizes, getAdaptiveSpacing, getAdaptiveBorderRadius } from '../utils/mobileScreenOptimization';
import ThemeToggle from '../utils/ThemeToggle';
const MobileTest = React.lazy(() => import('../components/MobileTest'));
const MobileDebug = React.lazy(() => import('../utils/MobileDebug'));
const WeatherIcon = React.lazy(() => import('../utils/weatherIcons'));

const SimpleMobileApp: React.FC = () => {
  // const { theme } = useTheme();
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
      <div className="safe-area-container" style={{ background: 'var(--primary-gradient)', minHeight: '100vh' }}>
        <Suspense fallback={null}>
          <MobileTest />
        </Suspense>
        <button 
          className="mobile-back-button fixed-top-left glass-blur"
          onClick={() => navigate('home')}
          aria-label="Go back to home screen"
          style={{
            background: 'var(--toggle-background)',
            color: 'var(--primary-text)',
            border: '1px solid var(--toggle-border)'
          }}
        >
          Back
        </button>
        <Suspense fallback={null}>
          <MobileDebug enabled={true} position="bottom-right" />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="safe-area-container" style={{ background: 'var(--primary-gradient)', minHeight: '100vh' }}>
      <ThemeToggle />
      
      <div className="mobile-container fade-in">
        <div className="mobile-card weather-display">
          <Suspense fallback={null}>
            <div
              className="flex-center-col custom-shadow"
              style={{
                width: screenInfo.isVerySmallScreen ? '100px' : '120px',
                height: screenInfo.isVerySmallScreen ? '100px' : '120px',
                background: 'var(--primary-gradient)',
                borderRadius: adaptiveBorders.large,
                margin: `0 auto ${adaptiveSpacing.sectionGap}`,
                boxShadow: 'var(--button-shadow)'
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
          </Suspense>
          
          <h1 className="mobile-title custom-font">
            Mobile Weather App
          </h1>
          
          <p className="mobile-body custom-font text-center">
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
                <Suspense fallback={null}>
                  <WeatherIcon code={code} size={screenInfo.isVerySmallScreen ? 24 : 32} animated={true} />
                </Suspense>
                <div className="custom-font" style={{ fontSize: adaptiveFonts.bodySmall, color: 'var(--secondary-text)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex-center-col">
            <button
              className="mobile-button mobile-button-large custom-shadow"
              style={{
                background: 'var(--button-gradient)',
                color: 'var(--inverse-text)',
                boxShadow: 'var(--button-shadow)'
              }}
              onClick={() => alert('Weather functionality will be added!')}
              aria-label="Check weather (demo button)"
            >
              Check Weather 
            </button>
            
            <button
              className="mobile-button custom-shadow"
              style={{
                background: 'var(--toggle-background)',
                color: 'var(--primary-text)',
                border: '1px solid var(--toggle-border)'
              }}
              onClick={() => navigate('test')}
              aria-label="Test mobile UI"
            >
              Test Mobile UI
            </button>
          </div>
        </div>
      </div>
      
      <Suspense fallback={null}>
        <MobileDebug enabled={true} position="bottom-right" />
      </Suspense>
    </div>
  );
};

export default SimpleMobileApp;
