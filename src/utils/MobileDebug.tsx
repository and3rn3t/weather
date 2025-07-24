/**
 * Mobile Debug Component
 * 
 * Shows mobile viewport information and identifies touch issues
 */

import React, { useState, useEffect } from 'react';
import { getScreenInfo } from './mobileScreenOptimization';

interface MobileDebugProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const MobileDebug: React.FC<MobileDebugProps> = ({ 
  enabled = true, 
  position = 'bottom-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [screenInfo, setScreenInfo] = useState(getScreenInfo());
  const [touchCount, setTouchCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const updateScreenInfo = () => {
      setScreenInfo(getScreenInfo());
    };

    const handleTouch = () => {
      setTouchCount(prev => prev + 1);
    };

    // Update screen info on resize/orientation change
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);
    
    // Track touch events
    document.addEventListener('touchstart', handleTouch);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [enabled]);

  if (!enabled) return null;

  const getScreenSizeDescription = () => {
    if (screenInfo.isVerySmallScreen) return 'Very Small';
    if (screenInfo.isSmallScreen) return 'Small';
    return 'Normal';
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 10000,
      padding: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontSize: '10px',
      fontFamily: 'monospace',
      borderRadius: '4px',
      maxWidth: '200px',
      wordWrap: 'break-word' as const,
      cursor: 'pointer',
      transition: 'opacity 0.3s ease',
      opacity: isVisible ? 1 : 0.3,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '10px', right: '10px' };
    }
  };

  return (
    <button
      style={getPositionStyles()}
      onClick={() => setIsVisible(!isVisible)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsVisible(!isVisible);
        }
      }}
      title="Click to toggle mobile debug info"
      aria-label="Toggle mobile debug information"
    >
      <div>📱 Mobile Debug</div>
      {isVisible && (
        <>
          <div>Screen: {screenInfo.width}×{screenInfo.height}</div>
          <div>Pixel Ratio: {screenInfo.pixelRatio}</div>
          <div>Orientation: {screenInfo.isLandscape ? 'Landscape' : 'Portrait'}</div>
          <div>Size: {getScreenSizeDescription()}</div>
          <div>Safe Area: T:{screenInfo.safeAreaTop} B:{screenInfo.safeAreaBottom}</div>
          <div>Has Notch: {screenInfo.hasNotch ? 'Yes' : 'No'}</div>
          <div>Touches: {touchCount}</div>
          <div>Viewport: {window.innerWidth}×{window.innerHeight}</div>
          <div>DPR: {window.devicePixelRatio}</div>
          <div>UA: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '4px', borderTop: '1px solid #666', paddingTop: '4px' }}>
              <div>Zoom: {Math.round((window.outerWidth / window.innerWidth) * 100)}%</div>
              <div>Available: {screen.availWidth}×{screen.availHeight}</div>
              <div>Color Depth: {screen.colorDepth}</div>
            </div>
          )}
        </>
      )}
    </button>
  );
};

export default MobileDebug;
