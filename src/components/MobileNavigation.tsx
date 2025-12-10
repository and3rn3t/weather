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

import { NavigationIcons } from './modernWeatherUI/NavigationIcons';

interface TabConfig {
  id: NavigationScreen;
  icon: React.ReactNode;
  label: string;
  activeIcon?: React.ReactNode;
}

const tabs: TabConfig[] = [
  {
    id: 'Home',
    icon: <NavigationIcons.Home />,
    label: 'Home',
    activeIcon: <NavigationIcons.Home />,
  },
  {
    id: 'Weather',
    icon: <NavigationIcons.Sun />,
    label: 'Weather',
    activeIcon: <NavigationIcons.Sun />,
  },
  {
    id: 'Search',
    icon: <NavigationIcons.Search />,
    label: 'Search',
    activeIcon: <NavigationIcons.Search />,
  },
  {
    id: 'Favorites',
    icon: <NavigationIcons.Favorites />,
    label: 'Cities',
    activeIcon: <NavigationIcons.Favorites />,
  },
  {
    id: 'Settings',
    icon: <NavigationIcons.Settings />,
    label: 'Settings',
    activeIcon: <NavigationIcons.Settings />,
  },
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
        aria-label="Primary navigation"
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
              aria-current={isActive ? 'page' : undefined}
              data-selected={isActive ? 'true' : 'false'}
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
              <div className="nav-icon-wrapper">
                <div className="nav-icon">{displayIcon}</div>
                {isActive && <div className="nav-active-indicator" />}
              </div>
              <span className="nav-label">{tab.label}</span>
              {isActive && <div className="nav-underline" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
