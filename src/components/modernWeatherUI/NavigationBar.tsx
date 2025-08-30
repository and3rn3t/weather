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

import React, { useEffect, useRef } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';
import { useTheme } from '../../utils/useTheme';

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
  const navRef = useRef<HTMLElement | null>(null);
  const { accessibilityMode, compactMode, compactDesktopOnly } = useTheme();

  // Toggle data-scrolled and drive a mild parallax variable based on scroll Y
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      const scrolled = (typeof window !== 'undefined' ? window.scrollY : 0) > 6;
      el.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
      // Parallax: map scrollY to 0%..100% softly. If reduced motion is preferred, keep 0%.
      if (prefersReducedMotion) {
        el.style.setProperty('--nav-parallax-pos', '0%');
      } else {
        const y = typeof window !== 'undefined' ? window.scrollY : 0;
        const clamped = Math.max(0, Math.min(600, y));
        const pct = (clamped / 600) * 100; // up to 100% shift over first ~600px
        el.style.setProperty('--nav-parallax-pos', `${pct}%`);
      }
    };

    // Initial state and listener
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <nav
      ref={navRef}
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
          {(accessibilityMode && accessibilityMode !== 'default') ||
          (compactMode && compactDesktopOnly) ? (
            <output className="ios26-navigation-badges" aria-live="polite">
              {accessibilityMode && accessibilityMode !== 'default' && (
                <span
                  className={`ios26-accessibility-badge ios26-accessibility-badge--${accessibilityMode}`}
                >
                  {accessibilityMode === 'high-contrast'
                    ? 'High Contrast'
                    : 'Reduced Transparency'}
                </span>
              )}
              {compactMode && compactDesktopOnly && (
                <span
                  className="ios26-accessibility-badge ios26-accessibility-badge--compact-desktop"
                  aria-label="Compact density applies on desktop only"
                >
                  Desktop Compact
                </span>
              )}
            </output>
          ) : null}
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
