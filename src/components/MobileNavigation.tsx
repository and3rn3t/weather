import React, { useCallback, useEffect, useState } from 'react';
import '../styles/mobileEnhancements.css';
import { useHaptic } from '../utils/hapticHooks';

export type NavigationScreen =
  | 'Home'
  | 'Weather'
  | 'Settings'
  | 'Search'
  | 'Favorites';

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
  { id: 'Search', icon: '🔍', label: 'Search', activeIcon: '🔎' },
  { id: 'Favorites', icon: '⭐', label: 'Cities', activeIcon: '🌟' },
  { id: 'Settings', icon: '⚙️', label: 'Settings', activeIcon: '🔧' },
];

/**
 * MobileNavigation - iOS26 HIG Compliant Navigation
 *
 * Features:
 * - iOS26 liquid glass navigation with authentic Apple glassmorphism
 * - Follows Apple Human Interface Guidelines
 * - Zero inline styles - all styling handled by liquid-glass-navigation.css
 * - Haptic feedback on navigation
 * - Accessibility compliance with proper ARIA attributes
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentScreen,
  onNavigate,
  className = '',
}) => {
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

  return (
    <nav
      className={`mobile-navigation ${className}`}
      aria-label="Main navigation"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const displayIcon =
          isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

        return (
          <div
            key={tab.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Navigate to ${tab.label}`}
            aria-current={isActive ? 'page' : undefined}
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
            <div className="nav-icon">{displayIcon}</div>
            <span className="nav-label">{tab.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
