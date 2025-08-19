/**
 * Enhanced Mobile Button Component
 *
 * A high-quality mobile button with:
 * - Proper touch targets (44px minimum)
 * - Haptic feedback
 * - Smooth animations
 * - Accessibility features
 * - Multiple variants and sizes
 */

import React, { useState, useRef } from 'react';
import { useTheme } from '../utils/useTheme';
import { useHaptic } from '../utils/hapticHooks';

interface EnhancedMobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

const EnhancedMobileButton: React.FC<EnhancedMobileButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  style = {},
  ariaLabel,
  type = 'button',
}) => {
  const { theme } = useTheme();
  const haptic = useHaptic();
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (disabled || loading) return;

    // Haptic feedback
    haptic.buttonPress();

    // Call the onClick handler
    if (onClick) {
      onClick();
    }
  };

  const handleTouchStart = () => {
    if (disabled || loading) return;
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: '36px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
        };
      case 'large':
        return {
          minHeight: '52px',
          padding: '16px 24px',
          fontSize: '18px',
          fontWeight: 600,
        };
      default: // medium
        return {
          minHeight: '44px',
          padding: '12px 20px',
          fontSize: '16px',
          fontWeight: 600,
        };
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: theme.cardBackground || 'rgba(255, 255, 255, 0.1)',
          color: theme.primaryText,
          border: `1px solid ${theme.cardBorder || 'rgba(255, 255, 255, 0.2)'}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        };
      case 'glass':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          color: theme.primaryText,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: theme.primaryText,
          border: `2px solid ${theme.primaryText}`,
          boxShadow: 'none',
        };
      default: // primary
        return {
          background:
            theme.primaryGradient ||
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        };
    }
  };

  const baseStyles = {
    ...getSizeStyles(),
    ...getVariantStyles(),
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? '8px' : '0',
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontFamily: 'inherit',
    lineHeight: 1.2,
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative' as const,
    overflow: 'hidden' as const,

    // Animation states
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

    // Disabled state
    opacity: disabled ? 0.6 : 1,

    // Loading state adjustments
    ...(loading && {
      cursor: 'wait',
      pointerEvents: 'none' as const,
    }),
  };

  const combinedStyles = {
    ...baseStyles,
    ...style,
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
        />
      );
    }
    return icon;
  };

  const renderContent = () => {
    if (loading && !icon) {
      return (
        <>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              marginRight: '8px',
            }}
          />
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          {renderIcon()}
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {renderIcon()}
        </>
      );
    }

    return children;
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`mobile-button-enhanced ${className}`}
      style={combinedStyles}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
    >
      {/* Ripple effect overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          opacity: isPressed ? 1 : 0,
          transform: isPressed ? 'scale(1)' : 'scale(0)',
          transition: 'all 0.2s ease',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Button content */}
      <span style={{ position: 'relative', zIndex: 1 }}>{renderContent()}</span>
    </button>
  );
};

export default EnhancedMobileButton;
