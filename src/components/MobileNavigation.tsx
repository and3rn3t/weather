import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../utils/useTheme';
import { useHaptic } from '../utils/hapticHooks';

export type NavigationScreen = 'Home' | 'Weather' | 'Settings' | 'Search' | 'Favorites';

interface MobileNavigationProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  className?: string;
}

interface TabConfig {
  id: NavigationScreen;
  icon: string;
  label: string;
  activeIcon?: string;
}

const tabs: TabConfig[] = [
  { id: 'Home', icon: '🏠', label: 'Home', activeIcon: '🏡' },
  { id: 'Weather', icon: '🌤️', label: 'Weather', activeIcon: '☀️' },
  { id: 'Favorites', icon: '⭐', label: 'Cities', activeIcon: '🌟' },
  { id: 'Search', icon: '🔍', label: 'Search', activeIcon: '🔎' },
  { id: 'Settings', icon: '⚙️', label: 'Settings', activeIcon: '🔧' }
];

/**
 * MobileNavigation - Modern bottom tab navigation for mobile devices
 * 
 * Features:
 * - iOS-style bottom tab navigation
 * - Smooth animations and transitions
 * - Haptic feedback on navigation
 * - Adaptive sizing for different screen sizes
 * - Glassmorphism design consistent with app theme
 * - Accessibility support with proper labels and keyboard navigation
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentScreen,
  onNavigate,
  className = ''
}) => {
  const { theme } = useTheme();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState<NavigationScreen>(currentScreen);

  // Update active tab when currentScreen changes
  useEffect(() => {
    setActiveTab(currentScreen);
  }, [currentScreen]);

  const handleTabPress = useCallback((tabId: NavigationScreen) => {
    if (tabId === activeTab) {
      // Double tap on active tab - could trigger scroll to top or refresh
      haptic.buttonPress();
      return;
    }

    // Haptic feedback for navigation
    haptic.buttonPress();
    
    // Update active state immediately for visual feedback
    setActiveTab(tabId);
    
    // Navigate to new screen
    onNavigate(tabId);
  }, [activeTab, onNavigate, haptic]);

  const getTabStyle = useCallback((_tab: TabConfig, isActive: boolean) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px 12px 4px',
    minHeight: '64px',
    cursor: 'pointer',
    borderRadius: '12px',
    margin: '4px 2px',
    background: isActive 
      ? `linear-gradient(135deg, ${theme.primaryGradient}15, ${theme.primaryGradient}10)`
      : 'transparent',
    border: isActive 
      ? `1px solid ${theme.primaryGradient}20` 
      : '1px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isActive 
      ? `0 4px 12px ${theme.primaryGradient}20, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    
    // Touch optimizations
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none' as const,
    
    // Accessibility
    outline: 'none',
    
    // Hover effects for desktop
    ':hover': {
      background: isActive 
        ? `linear-gradient(135deg, ${theme.primaryGradient}25, ${theme.primaryGradient}15)`
        : `${theme.primaryGradient}08`,
      transform: 'translateY(-1px)'
    },
    
    // Active state for better touch feedback
    ':active': {
      transform: 'translateY(0)',
      background: `${theme.primaryGradient}15`
    }
  }), [theme]);

  const getIconStyle = useCallback((isActive: boolean) => ({
    fontSize: '24px',
    marginBottom: '4px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isActive ? 'scale(1.1)' : 'scale(1)',
    filter: isActive ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' : 'none'
  }), []);

  const getLabelStyle = useCallback((isActive: boolean) => ({
    fontSize: '11px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? theme.primaryText : theme.secondaryText,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isActive ? 1 : 0.8,
    letterSpacing: '0.3px'
  }), [theme]);

  const navigationStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    background: `linear-gradient(180deg, ${theme.cardBackground}95, ${theme.cardBackground}98)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: `1px solid ${theme.weatherCardBorder}40`,
    boxShadow: `
      0 -4px 20px rgba(0, 0, 0, 0.1),
      0 -2px 10px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    padding: '4px 8px 0px 8px',
    minHeight: '80px',
    
    // Safe area support for notched devices
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    
    // Performance optimizations
    willChange: 'transform',
    backfaceVisibility: 'hidden' as const,
    
    // Smooth animations
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <nav 
      className={`mobile-navigation ${className}`}
      style={navigationStyle}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const displayIcon = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`Navigate to ${tab.label}`}
            tabIndex={isActive ? 0 : -1}
            style={getTabStyle(tab, isActive)}
            onClick={() => handleTabPress(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabPress(tab.id);
              }
            }}
          >
            <div style={getIconStyle(isActive)}>
              {displayIcon}
            </div>
            <span style={getLabelStyle(isActive)}>
              {tab.label}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: theme.primaryGradient,
                  boxShadow: `0 0 8px ${theme.primaryGradient}60`,
                  animation: 'fadeIn 0.3s ease-out'
                }}
              />
            )}
          </button>
        );
      })}
      
      {/* Background pattern overlay for enhanced glassmorphism */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, ${theme.primaryGradient}05, transparent 70%),
            radial-gradient(circle at 80% 50%, ${theme.secondaryGradient || theme.primaryGradient}05, transparent 70%)
          `,
          pointerEvents: 'none',
          borderRadius: '0',
          zIndex: -1
        }}
      />
    </nav>
  );
};

export default MobileNavigation;
