/**
 * Simple iOS HIG Components for Weather App
 *
 * A lightweight implementation of key iOS Human Interface Guidelines components
 * that integrates seamlessly with your existing theme system.
 */

import React, { useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';

// ============================================================================
// SIMPLE SEGMENTED CONTROL
// ============================================================================

interface SimpleSegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  theme: ThemeColors;
}

export const SimpleSegmentedControl: React.FC<SimpleSegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  theme,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: '4px',
    border: `1px solid ${theme.cardBorder}`,
    backdropFilter: 'blur(20px)',
    gap: '2px',
  };

  const segmentStyle = (index: number): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: '600',
    color: selectedIndex === index ? '#FFFFFF' : theme.secondaryText,
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backgroundColor: selectedIndex === index ? '#007AFF' : 'transparent',
    border: 'none',
  });

  return (
    <div style={containerStyle} className="simple-segmented-control">
      {segments.map((segment, index) => (
        <button
          key={segment}
          style={segmentStyle(index)}
          onClick={() => onChange(index)}
          aria-pressed={selectedIndex === index}
          aria-label={`Select ${segment} view`}
        >
          {segment}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// SIMPLE ACTIVITY INDICATOR
// ============================================================================

interface SimpleActivityIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  theme: ThemeColors;
  text?: string;
}

export const SimpleActivityIndicator: React.FC<
  SimpleActivityIndicatorProps
> = ({ size = 'medium', theme, text }) => {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48,
  };

  const indicatorSize = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  };

  const spinnerStyle: React.CSSProperties = {
    width: indicatorSize,
    height: indicatorSize,
    animation: 'spin 1s linear infinite',
    borderRadius: '50%',
    border: `3px solid ${theme.cardBorder}`,
    borderTopColor: '#007AFF',
  };

  const textStyle: React.CSSProperties = {
    fontSize: size === 'small' ? '14px' : '16px',
    color: theme.secondaryText,
    fontWeight: '500',
  };

  return (
    <div style={containerStyle} className="simple-activity-indicator">
      <div style={spinnerStyle} />
      {text && <span style={textStyle}>{text}</span>}
    </div>
  );
};

// ============================================================================
// SIMPLE STATUS BADGE
// ============================================================================

interface SimpleStatusBadgeProps {
  text: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
}

export const SimpleStatusBadge: React.FC<SimpleStatusBadgeProps> = ({
  text,
  variant = 'info',
}) => {
  const variantColors = {
    info: { bg: 'rgba(0, 122, 255, 0.2)', text: '#007AFF' },
    warning: { bg: 'rgba(255, 149, 0, 0.2)', text: '#FF9500' },
    error: { bg: 'rgba(255, 59, 48, 0.2)', text: '#FF3B30' },
    success: { bg: 'rgba(52, 199, 89, 0.2)', text: '#34C759' },
  };

  const colors = variantColors[variant];

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: colors.bg,
    color: colors.text,
    border: 'none',
    cursor: 'default',
    userSelect: 'none',
  };

  return <span style={badgeStyle}>{text}</span>;
};

// ============================================================================
// SIMPLE ENHANCED BUTTON
// ============================================================================

interface SimpleEnhancedButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  theme: ThemeColors;
  disabled?: boolean;
}

export const SimpleEnhancedButton: React.FC<SimpleEnhancedButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  theme,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: '#007AFF', text: '#FFFFFF' };
      case 'secondary':
        return { bg: theme.cardBackground, text: theme.primaryText };
      case 'destructive':
        return { bg: '#FF3B30', text: '#FFFFFF' };
      default:
        return { bg: '#007AFF', text: '#FFFFFF' };
    }
  };

  const colors = getButtonColors();

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    backgroundColor: colors.bg,
    color: colors.text,
    border: variant === 'secondary' ? `1px solid ${theme.cardBorder}` : 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    boxShadow:
      variant === 'primary' ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none',
  };

  return (
    <button
      style={buttonStyle}
      onClick={onPress}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="simple-enhanced-button"
      aria-label={title}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
    </button>
  );
};

// ============================================================================
// SIMPLE CARD CONTAINER
// ============================================================================

interface SimpleCardProps {
  children: React.ReactNode;
  theme: ThemeColors;
  onPress?: () => void;
  title?: string;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({
  children,
  theme,
  onPress,
  title,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBackground,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.cardShadow,
    transition: 'all 0.2s ease',
    transform: isPressed ? 'scale(0.99)' : 'scale(1)',
    cursor: onPress ? 'pointer' : 'default',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: '0 0 16px 0',
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const cardElement = onPress ? (
    <button
      style={{ ...cardStyle, border: 'none', textAlign: 'left' }}
      className="simple-card"
      onClick={handlePress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      aria-label={title}
    >
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </button>
  ) : (
    <div style={cardStyle} className="simple-card">
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </div>
  );

  return cardElement;
};

// ============================================================================
// SIMPLE PROGRESS BAR
// ============================================================================

interface SimpleProgressBarProps {
  progress: number; // 0-100
  theme: ThemeColors;
  showPercentage?: boolean;
  color?: string;
}

export const SimpleProgressBar: React.FC<SimpleProgressBarProps> = ({
  progress,
  theme,
  showPercentage = false,
  color = '#007AFF',
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  };

  const trackStyle: React.CSSProperties = {
    flex: 1,
    height: '6px',
    backgroundColor: theme.cardBorder,
    borderRadius: '3px',
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.max(0, Math.min(100, progress))}%`,
    backgroundColor: color,
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  };

  const percentageStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.secondaryText,
    minWidth: '40px',
    textAlign: 'right',
  };

  return (
    <div style={containerStyle} className="simple-progress-bar">
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
      {showPercentage && (
        <span style={percentageStyle}>{Math.round(progress)}%</span>
      )}
    </div>
  );
};
