/**
 * Floating Action Button Component
 * Modern FAB with haptic feedback and smooth animations
 */

import React from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = '🔄',
  label,
  disabled = false,
  className = '',
  variant = 'primary',
}) => {
  const { buttonPress } = useHapticFeedback();

  const handleClick = async () => {
    if (disabled) return;
    
    await buttonPress();
    onClick();
  };

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: `calc(24px + env(safe-area-inset-bottom))`,
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    zIndex: 1000,
    boxShadow: disabled 
      ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
      : '0 8px 24px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    animation: 'fadeInScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both',
    opacity: disabled ? 0.6 : 1,
    transform: disabled ? 'scale(0.9)' : 'scale(1)',
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    secondary: {
      background: 'var(--card-background, rgba(255, 255, 255, 0.9))',
      color: 'var(--primary-text)',
      border: '1px solid var(--border-color, rgba(0, 0, 0, 0.1))',
    },
  };

  return (
    <>
      <button
        className={`fab ${className}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={label || 'Floating action button'}
        style={{
          ...baseStyle,
          ...variantStyles[variant],
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
          }
        }}
        onTouchStart={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
        onTouchEnd={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {icon}
      </button>

      <style>{`
        @keyframes fadeInScale {
          from { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .fab:active {
          animation: buttonPress 0.15s ease;
        }
        
        @keyframes buttonPress {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default FloatingActionButton;
