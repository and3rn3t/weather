/**
 * iOS HIG Compliant Navigation Component
 *
 * This component follows strict iOS Human Interface Guidelines for:
 * - Touch targets (minimum 44px)
 * - Typography (SF Pro system)
 * - Accessibility (ARIA labels, screen reader support)
 * - Visual hierarchy (clear, deference, depth)
 * - Motion (realistic, meaningful animations)
 */

import React, { useCallback, useEffect, useState } from 'react';
import '../styles/ios-hig-enhancements.css';
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

interface IOSHIGNavigationProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  className?: string;
}

interface HIGTabConfig {
  id: NavigationScreen;
  icon: string;
  label: string;
  activeIcon?: string;
  sfSymbol?: string; // SF Symbol equivalent for future iOS app
}

// iOS HIG compliant tab configuration
const higTabs: HIGTabConfig[] = [
  {
    id: 'Home',
    icon: '🏠',
    label: 'Home',
    activeIcon: '🏡',
    sfSymbol: 'house',
  },
  {
    id: 'Weather',
    icon: '🌤️',
    label: 'Weather',
    activeIcon: '☀️',
    sfSymbol: 'sun.max',
  },
  {
    id: 'Search',
    icon: '🔍',
    label: 'Search',
    activeIcon: '🔎',
    sfSymbol: 'magnifyingglass',
  },
  {
    id: 'Favorites',
    icon: '⭐',
    label: 'Cities',
    activeIcon: '🌟',
    sfSymbol: 'star',
  },
  {
    id: 'Settings',
    icon: '⚙️',
    label: 'Settings',
    activeIcon: '🔧',
    sfSymbol: 'gearshape',
  },
];

/**
 * iOS HIG Compliant Navigation Component
 *
 * Features:
 * - 44px minimum touch targets per HIG
 * - SF Pro font family
 * - Proper ARIA labels and roles
 * - Semantic HTML structure
 * - Haptic feedback integration
 * - Screen reader announcements
 * - High contrast support
 * - Reduced motion support
 */
const IOSHIGNavigation: React.FC<IOSHIGNavigationProps> = ({
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
      event?: React.MouseEvent | React.TouchEvent,
    ) => {
      // Prevent any default browser behavior
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (tabId === activeTab) {
        // Double tap on active tab - scroll to top behavior (iOS standard)
        haptic.buttonPress();
        await interactionFeedback.onSuccess();

        // Announce scroll to top action for screen readers
        await weatherAnnouncements.announceStateChange(
          `${tabId} screen - scrolled to top`,
        );
        return;
      }

      // Multi-sensory feedback for navigation
      haptic.buttonPress();
      await interactionFeedback.onSuccess();

      // Announce navigation change with proper accessibility
      await weatherAnnouncements.announceStateChange(
        `Navigated to ${tabId} screen`,
      );

      // Update active state immediately for visual feedback
      setActiveTab(tabId);

      // Navigate to new screen
      onNavigate(tabId);
    },
    [activeTab, onNavigate, haptic, interactionFeedback, weatherAnnouncements],
  );

  // Keyboard navigation handler (iOS HIG accessibility requirement)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, tabId: NavigationScreen) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTabPress(tabId);
      }
    },
    [handleTabPress],
  );

  return (
    <>
      <nav
        className={`ios-hig-navigation ${className}`}
        aria-label="Main navigation"
      >
        {higTabs.map(tab => {
          const isActive = activeTab === tab.id;
          const displayIcon =
            isActive && tab.activeIcon ? tab.activeIcon : tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive ? 'true' : 'false'}
              aria-label={`${tab.label} navigation button${
                isActive ? ', currently selected' : ''
              }`}
              tabIndex={0}
              className="ios-hig-nav-tab"
              onClick={event => handleTabPress(tab.id, event)}
              onTouchStart={event => {
                // iOS-style touch feedback
                event.currentTarget.style.transform = 'scale(0.95)';
              }}
              onTouchEnd={event => {
                // Reset scale after touch
                event.currentTarget.style.transform = 'scale(1)';
              }}
              onKeyDown={event => handleKeyDown(event, tab.id)}
            >
              {/* Icon */}
              <span className="ios-hig-nav-icon" aria-hidden="true">
                {displayIcon}
              </span>

              {/* Label */}
              <span className="ios-hig-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Screen reader live region for navigation announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="ios-hig-sr-only"
        id="navigation-status"
      >
        Current screen: {currentScreen}
      </div>
    </>
  );
};

export default IOSHIGNavigation;
