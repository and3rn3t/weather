import React, { useCallback, useEffect, useState } from 'react';
import '../styles/mobileEnhancements.css';
import { useHaptic } from '../utils/hapticHooks';
import { useTheme } from '../utils/useTheme';

export type NavigationScreen =
  | 'Home'
  | 'Weather'
  | 'Settings'
  | 'Search'
  | 'Favorites'
  | 'iOS26';

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
  { id: 'iOS26', icon: '📱', label: 'iOS 26', activeIcon: '✨' },
  { id: 'Favorites', icon: '⭐', label: 'Cities', activeIcon: '🌟' },
  { id: 'Settings', icon: '⚙️', label: 'Settings', activeIcon: '🔧' },
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
  className = '',
}) => {
  const { theme } = useTheme();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState<NavigationScreen>(currentScreen);

  // Update active tab when currentScreen changes
  useEffect(() => {
    setActiveTab(currentScreen);
  }, [currentScreen]);

  const handleTabPress = useCallback(
    (tabId: NavigationScreen, event?: React.MouseEvent | React.TouchEvent) => {
      // Prevent any default browser behavior that might cause styling
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

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
    },
    [activeTab, onNavigate, haptic]
  );

  const getTabStyle = useCallback(
    (_tab: TabConfig, isActive: boolean) => ({
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
      // Remove problematic background gradients and effects
      background: isActive ? `${theme.primaryText}10` : 'transparent',
      border: isActive
        ? `1px solid ${theme.primaryText}20`
        : '1px solid transparent',
      transition: 'all 0.2s ease',
      // Remove transform effects that cause movement
      transform: 'none',
      // Remove all shadows and effects
      boxShadow: 'none',

      // Touch optimizations
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      userSelect: 'none' as const,

      // Accessibility
      outline: 'none',
    }),
    [theme.primaryText]
  );

  const getIconStyle = useCallback(
    (isActive: boolean) => ({
      fontSize: '24px',
      marginBottom: '4px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isActive ? 'scale(1.1)' : 'scale(1)',
      // Remove dark drop-shadow that causes the persistent dark effect
      filter: 'none',
    }),
    []
  );

  const getLabelStyle = useCallback(
    (isActive: boolean) => ({
      fontSize: '11px',
      fontWeight: isActive ? '600' : '500',
      color: isActive ? theme.primaryText : theme.secondaryText,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isActive ? 1 : 0.8,
      letterSpacing: '0.3px',
    }),
    [theme]
  );

  const navigationStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    top: 'auto', // Explicitly prevent top positioning
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: '80px',
    maxHeight: '80px',
    minHeight: '80px',

    // Use theme background but ensure it's visible
    background: `${theme.appBackground}F0`, // 94% opacity for better blending
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderTop: `1px solid ${theme.primaryText}15`, // Subtle border using theme color
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',

    // Clean shadow that adapts to theme
    boxShadow: `0 -2px 20px ${theme.primaryText}08`,
    padding: '8px 16px',
    boxSizing: 'border-box',

    // Safe area support for notched devices
    paddingBottom: 'max(8px, calc(8px + env(safe-area-inset-bottom, 0)))',

    // Performance optimizations
    willChange: 'transform',
    backfaceVisibility: 'hidden' as const,

    // CRITICAL: Prevent any transform or positioning that could move it
    transform: 'none',
    margin: '0',
    float: 'none',

    // Smooth animations
    transition: 'background-color 0.2s ease',
  };

  return (
    <nav
      className={`mobile-navigation ${className}`}
      style={navigationStyle}
      aria-label="Main navigation"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const displayIcon =
          isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            aria-label={`Navigate to ${tab.label}`}
            aria-pressed={isActive}
            style={{
              ...getTabStyle(tab, isActive),
              // NUCLEAR INLINE OVERRIDE - should beat any CSS
              background: isActive ? 'rgba(120, 97, 255, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(120, 97, 255, 0.2)' : 'none',
              outline: 'none',
              boxShadow: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              textDecoration: 'none',
              transform: 'none',
              filter: 'none',
              opacity: 1,
            }}
            onClick={e => handleTabPress(tab.id, e)}
            onTouchStart={e => {
              // Prevent touch highlighting
              e.preventDefault();
            }}
            onMouseDown={e => {
              // Prevent mouse down styling
              e.preventDefault();
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabPress(tab.id);
              }
            }}
          >
            <div style={getIconStyle(isActive)}>{displayIcon}</div>
            <span style={getLabelStyle(isActive)}>{tab.label}</span>

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
                  animation: 'fadeIn 0.3s ease-out',
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
            radial-gradient(circle at 20% 50%, ${
              theme.primaryGradient
            }05, transparent 70%),
            radial-gradient(circle at 80% 50%, ${
              theme.secondaryGradient || theme.primaryGradient
            }05, transparent 70%)
          `,
          pointerEvents: 'none',
          borderRadius: '0',
          zIndex: -1,
        }}
      />
    </nav>
  );
};

export default MobileNavigation;
