/**
 * BreadcrumbNavigation - Breadcrumb navigation component
 * Shows current navigation path and allows quick navigation
 */

import React from 'react';
import { NavigationIcons } from '../modernWeatherUI/NavigationIcons';
import './BreadcrumbNavigation.css';

export type NavigationScreen =
  | 'Home'
  | 'Weather'
  | 'Search'
  | 'Favorites'
  | 'Settings';

interface BreadcrumbItem {
  screen: NavigationScreen;
  label: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavigationProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  className?: string;
}

const screenLabels: Record<NavigationScreen, string> = {
  Home: 'Home',
  Weather: 'Weather',
  Search: 'Search',
  Favorites: 'Favorites',
  Settings: 'Settings',
};

const screenIcons: Record<NavigationScreen, React.ReactNode> = {
  Home: <NavigationIcons.Home />,
  Weather: <NavigationIcons.Sun />,
  Search: <NavigationIcons.Search />,
  Favorites: <NavigationIcons.Favorites />,
  Settings: <NavigationIcons.Settings />,
};

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentScreen,
  onNavigate,
  className = '',
}) => {
  // Build breadcrumb path (simplified - just show main screens)
  const breadcrumbs: BreadcrumbItem[] = [
    {
      screen: 'Home',
      label: screenLabels.Home,
      icon: screenIcons.Home,
    },
  ];

  if (currentScreen !== 'Home') {
    breadcrumbs.push({
      screen: currentScreen,
      label: screenLabels[currentScreen],
      icon: screenIcons[currentScreen],
    });
  }

  return (
    <nav
      className={`breadcrumb-navigation ${className}`}
      aria-label="Breadcrumb navigation"
    >
      <ol className="breadcrumb-list" role="list">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.screen} className="breadcrumb-item" role="listitem">
              {!isLast ? (
                <>
                  <button
                    className="breadcrumb-link"
                    onClick={() => onNavigate(crumb.screen)}
                    aria-label={`Navigate to ${crumb.label}`}
                    type="button"
                  >
                    <span className="breadcrumb-icon">{crumb.icon}</span>
                    <span className="breadcrumb-label">{crumb.label}</span>
                  </button>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    <NavigationIcons.ChevronRight />
                  </span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  <span className="breadcrumb-icon">{crumb.icon}</span>
                  <span className="breadcrumb-label">{crumb.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbNavigation;
