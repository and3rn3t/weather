import React from 'react';
import { useTheme } from './useTheme';
import { useHaptic } from './hapticHooks';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  const haptic = useHaptic();

  const handleThemeToggle = () => {
    haptic.settingsChange(); // Haptic feedback for theme change
    toggleTheme();
  };

  return (
    <button
      onClick={handleThemeToggle}
      className={`theme-toggle-btn${className ? ' ' + className : ''}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
