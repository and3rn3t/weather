import React, { useCallback, useEffect, useState } from 'react';
import '../styles/mobileEnhancements.css';
import { useHaptic } from '../utils/hapticHooks';
import {
  useInteractionFeedback,
  useWeatherAnnouncements,
} from '../utils/useMultiSensoryWeather';

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
 * - Zero inline styles - styling handled by styles/mobile.css
 * - Haptic feedback on navigation
 * - Accessibility compliance with proper ARIA attributes
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentScreen,
  onNavigate,
  className = '',
}) => {
  const haptic = useHaptic();
  const interactionFeedback = useInteractionFeedback();
  const weatherAnnouncements = useWeatherAnnouncements();
  const [activeTab, setActiveTab] = useState<NavigationScreen>(currentScreen);

  // Update active tab when currentScreen changes
  useEffect(() => {
    setActiveTab(currentScreen);
  }, [currentScreen]);

  const handleTabPress = useCallback(
    async (
      tabId: NavigationScreen,
      event?: React.MouseEvent | React.TouchEvent
    ) => {
      // Prevent any default browser behavior that might cause styling
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (tabId === activeTab) {
        // Double tap on active tab - could trigger scroll to top or refresh
        haptic.buttonPress();
        await interactionFeedback.onSuccess();
        return;
      }

      // Multi-sensory feedback for navigation
      haptic.buttonPress();
      await interactionFeedback.onSuccess();

      // Announce navigation change
      await weatherAnnouncements.announceStateChange(
        `Navigated to ${tabId} screen`
      );

      // Update active state immediately for visual feedback
      setActiveTab(tabId);

      // Navigate to new screen
      onNavigate(tabId);
    },
    [activeTab, onNavigate, haptic, interactionFeedback, weatherAnnouncements]
  );

  return (
    <nav
      className={`mobile-navigation ${className}`}
      aria-label="Main navigation"
      data-ui="ios26-liquid-glass"
    >
      <div
        role="tablist"
        aria-label="Primary tabs"
        className="mobile-navigation-safe-area"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const displayIcon =
            isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

          return (
            <button
              key={tab.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              type="button"
              aria-label={`Navigate to ${tab.label}`}
              role="tab"
              aria-selected={isActive ? 'true' : 'false'}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
