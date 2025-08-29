/**
 * iOS Navigation Bar Component
 *
 * A premium navigation bar following iOS Human Interface Guidelines:
 * - Large and standard title modes
 * - Blur background effects
 * - Leading and trailing button support
 * - Search integration
 * - Smooth transitions and animations
 */

import React from 'react';
import type { ThemeColors } from '../../utils/themeConfig';

interface NavigationBarProps {
  title: string;
  subtitle?: string;
  largeTitle?: boolean;
  transparent?: boolean;
  leadingButton?: {
    icon: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  trailingButton?: {
    icon: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  searchBar?: React.ReactNode;
  theme: ThemeColors;
  isDark?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  title,
  subtitle,
  largeTitle = false,
  transparent = false,
  leadingButton,
  trailingButton,
  searchBar,
  theme: _theme,
  isDark = false,
}) => {
  const buttonClass = 'ios26-button-base ios26-button-plain';

  return (
    <nav
      className={`ios26-navigation-bar ios26-liquid-glass ios26-navigation-bar--app${transparent ? ' ios26-liquid-transparent' : ''}`}
      aria-label="Top navigation"
      data-theme-mode={isDark ? 'dark' : 'light'}
      data-large-title={largeTitle ? 'true' : 'false'}
    >
      <div className="ios26-navigation-inner">
        <div className="ios26-navigation-side ios26-navigation-side--start">
          {leadingButton && (
            <button
              className={buttonClass}
              onClick={leadingButton.onPress}
              aria-label={leadingButton.title || 'Navigation button'}
            >
              {leadingButton.icon}
              {leadingButton.title && <span>{leadingButton.title}</span>}
            </button>
          )}
        </div>

        <div className="ios26-navigation-title-container">
          <h1 className="ios26-navigation-title ios26-text-primary">{title}</h1>
          {subtitle && (
            <p className="ios26-navigation-subtitle ios26-text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        <div className="ios26-navigation-side ios26-navigation-side--end">
          {trailingButton && (
            <button
              className={buttonClass}
              onClick={trailingButton.onPress}
              aria-label={trailingButton.title || 'Navigation button'}
            >
              {trailingButton.icon}
              {trailingButton.title && <span>{trailingButton.title}</span>}
            </button>
          )}
        </div>
      </div>

      {searchBar && <div className="ios26-navigation-search">{searchBar}</div>}
    </nav>
  );
};
