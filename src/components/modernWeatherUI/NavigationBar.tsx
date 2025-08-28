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
  theme,
  isDark = false,
}) => {
  const containerStyle: React.CSSProperties = transparent
    ? { backgroundColor: 'transparent' }
    : {};

  const navBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: largeTitle ? '16px 20px 8px' : '16px 20px',
    minHeight: '44px',
  };

  const titleContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: largeTitle ? '34px' : '17px',
    fontWeight: largeTitle ? '700' : '600',
    color: theme.primaryText,
    margin: 0,
    letterSpacing: largeTitle ? '-0.02em' : '0',
    lineHeight: largeTitle ? '40px' : '22px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: '400',
    color: theme.secondaryText,
    margin: '4px 0 0 0',
    lineHeight: '20px',
  };

  const buttonClass = 'ios26-button-base ios26-button-plain';

  const searchContainerStyle: React.CSSProperties = {
    padding: '0 20px 16px',
    display: searchBar ? 'block' : 'none',
  };

  return (
    <div
      style={containerStyle}
      className={`ios26-navigation-bar ios26-liquid-glass${transparent ? ' ios26-liquid-transparent' : ''}`}
      role="navigation"
      aria-label="Top navigation"
      data-theme-mode={isDark ? 'dark' : 'light'}
    >
      <div style={navBarStyle}>
        <div
          style={{
            minWidth: '60px',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
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

        <div style={titleContainerStyle}>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>

        <div
          style={{
            minWidth: '60px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
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

      {searchBar && <div style={searchContainerStyle}>{searchBar}</div>}
    </div>
  );
};
