/**
 * iOS Human Interface Guidelines Components
 * 
 * Premium iOS-style UI components based on Apple's HIG:
 * - Segmented Controls for view switching
 * - Activity Indicators with enhanced animations
 * - Action Sheets for contextual actions
 * - Progress Indicators with smooth animations
 * - Status Badges for weather alerts
 * - Enhanced Lists with disclosure indicators
 * 
 * All components follow iOS design principles:
 * - Smooth 60fps animations
 * - Haptic feedback integration
 * - Accessibility compliance
 * - Dark/Light theme support
 */

import React, { useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';

// ============================================================================
// SEGMENTED CONTROL COMPONENT
// ============================================================================

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  theme: ThemeColors;
  disabled?: boolean;
  isDark?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  theme,
  disabled = false,
  isDark = false
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    padding: '2px',
    position: 'relative',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
    backdropFilter: 'blur(20px)',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto'
  };

  const getSegmentTextColor = (index: number) => {
    if (selectedIndex === index) {
      return isDark ? '#000' : '#fff';
    }
    return theme.secondaryText;
  };

  const getSegmentBackgroundColor = (index: number) => {
    if (selectedIndex === index) {
      return isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)';
    }
    return 'transparent';
  };

  const segmentStyle = (index: number): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: '600',
    color: getSegmentTextColor(index),
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    position: 'relative',
    zIndex: selectedIndex === index ? 2 : 1,
    backgroundColor: getSegmentBackgroundColor(index),
    boxShadow: selectedIndex === index 
      ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
      : 'none'
  });

  return (
    <div style={containerStyle} className="ios-segmented-control">
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
// ENHANCED ACTIVITY INDICATOR
// ============================================================================

interface ActivityIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  theme: ThemeColors;
  color?: string;
  text?: string;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  size = 'medium',
  theme,
  color,
  text
}) => {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48
  };

  const indicatorSize = sizeMap[size];
  const strokeWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  };

  const spinnerStyle: React.CSSProperties = {
    width: indicatorSize,
    height: indicatorSize,
    animation: 'iosSpinner 1s linear infinite'
  };

  const textStyle: React.CSSProperties = {
    fontSize: size === 'small' ? '14px' : '16px',
    color: theme.secondaryText,
    fontWeight: '500'
  };

  return (
    <div style={containerStyle} className="ios-activity-indicator">
      <svg
        style={spinnerStyle}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke={color || theme.primaryText}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="60"
          opacity="0.3"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke={color || theme.primaryText}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="0"
          transform="rotate(-90 16 16)"
        />
      </svg>
      {text && <span style={textStyle}>{text}</span>}
    </div>
  );
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

interface StatusBadgeProps {
  text: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
  theme: ThemeColors;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  variant = 'info',
  theme,
  size = 'medium'
}) => {
  // Detect dark mode from theme colors
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');
  
  const variantColors = {
    info: {
      bg: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)',
      border: isDark ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
      text: isDark ? '#64D2FF' : '#007AFF'
    },
    warning: {
      bg: isDark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.1)',
      border: isDark ? 'rgba(255, 149, 0, 0.4)' : 'rgba(255, 149, 0, 0.3)',
      text: isDark ? '#FFB340' : '#FF9500'
    },
    error: {
      bg: isDark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
      border: isDark ? 'rgba(255, 59, 48, 0.4)' : 'rgba(255, 59, 48, 0.3)',
      text: isDark ? '#FF6B6B' : '#FF3B30'
    },
    success: {
      bg: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)',
      border: isDark ? 'rgba(52, 199, 89, 0.4)' : 'rgba(52, 199, 89, 0.3)',
      text: isDark ? '#5DD683' : '#34C759'
    }
  };

  const colors = variantColors[variant];

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: size === 'small' ? '4px 8px' : '6px 12px',
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    fontSize: size === 'small' ? '12px' : '14px',
    fontWeight: '600',
    color: colors.text,
    backdropFilter: 'blur(10px)',
    userSelect: 'none'
  };

  return (
    <span style={badgeStyle} className="ios-status-badge">
      {text}
    </span>
  );
};

// ============================================================================
// ENHANCED LIST ITEM WITH DISCLOSURE
// ============================================================================

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  disclosure?: boolean;
  badge?: string;
  onPress?: () => void;
  theme: ThemeColors;
  disabled?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  disclosure = false,
  badge,
  onPress,
  theme,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Detect dark mode from theme colors
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: isPressed 
      ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
      : 'transparent',
    borderRadius: '12px',
    cursor: onPress && !disabled ? 'pointer' : 'default',
    transition: 'background-color 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none',
    gap: '12px'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: '400',
    color: theme.primaryText,
    margin: 0
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '15px',
    color: theme.secondaryText,
    margin: 0
  };

  const disclosureStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRight: `2px solid ${theme.secondaryText}`,
    borderTop: `2px solid ${theme.secondaryText}`,
    transform: 'rotate(45deg)',
    opacity: 0.6
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      onPress();
    }
  };

  return (
    <div
      style={containerStyle}
      className="ios-list-item"
      onClick={handlePress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={onPress ? "button" : "listitem"}
      tabIndex={onPress && !disabled ? 0 : -1}
      aria-label={`${title}${subtitle ? `, ${subtitle}` : ''}`}
    >
      {icon && (
        <div style={{ flexShrink: 0 }}>
          {icon}
        </div>
      )}
      
      <div style={contentStyle}>
        <div style={titleStyle}>{title}</div>
        {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
      </div>

      {badge && (
        <StatusBadge text={badge} theme={theme} size="small" />
      )}

      {disclosure && <div style={disclosureStyle} />}
    </div>
  );
};

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

interface ProgressIndicatorProps {
  progress: number; // 0-100
  theme: ThemeColors;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  color?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  theme,
  size = 'medium',
  showPercentage = false,
  color
}) => {
  // Detect dark mode from theme colors
  const isDark = theme.appBackground.includes('28, 28, 30') || theme.appBackground.includes('#1c1c1e');
  
  const sizeMap = {
    small: { height: 4, radius: 2 },
    medium: { height: 6, radius: 3 },
    large: { height: 8, radius: 4 }
  };

  const dimensions = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
  };

  const trackStyle: React.CSSProperties = {
    flex: 1,
    height: dimensions.height,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: dimensions.radius,
    overflow: 'hidden',
    position: 'relative'
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.max(0, Math.min(100, progress))}%`,
    backgroundColor: color || '#007AFF',
    borderRadius: dimensions.radius,
    transition: 'width 0.3s ease',
    position: 'relative'
  };

  const percentageStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.secondaryText,
    minWidth: '40px',
    textAlign: 'right'
  };

  return (
    <div style={containerStyle} className="ios-progress-indicator">
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
      {showPercentage && (
        <span style={percentageStyle}>{Math.round(progress)}%</span>
      )}
    </div>
  );
};
