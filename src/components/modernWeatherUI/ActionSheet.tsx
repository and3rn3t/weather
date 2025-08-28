/**
 * iOS Action Sheet Component
 *
 * A modal component that presents a list of actions in a bottom sheet
 * following iOS Human Interface Guidelines:
 * - Smooth slide-up animation from bottom
 * - Backdrop blur effect
 * - Haptic feedback on interactions
 * - Accessible keyboard navigation
 * - Cancel action automatically included
 */

import React, { useEffect, useRef } from 'react';
import { useDash0Telemetry } from '../../dash0/hooks/useDash0Telemetry';
import type { ThemeColors } from '../../utils/themeConfig';

interface ActionSheetAction {
  title: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  theme: ThemeColors;
  cancelText?: string;
  isDark?: boolean;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isVisible,
  onClose,
  title,
  message,
  actions,
  theme,
  cancelText = 'Cancel',
  isDark = false,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const telemetry = useDash0Telemetry();

  useEffect(() => {
    if (isVisible) {
      // Track action sheet display
      telemetry.trackUserInteraction({
        action: 'action_sheet_opened',
        component: 'ActionSheet',
        metadata: {
          title: title || 'untitled',
          actionCount: actions.length,
          hasMessage: !!message,
          isDarkMode: isDark,
        },
      });

      document.body.style.overflow = 'hidden';
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible, title, message, actions.length, isDark, telemetry]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    pointerEvents: 'none', // don't block page interactions outside the sheet
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '16px',
    animation: 'iosModalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const sheetStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
    borderRadius: '16px 16px 0 0',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(0)',
    animation: 'iosModalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto', // re-enable interaction inside the sheet
  };

  const headerBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';
  const headerStyle: React.CSSProperties = {
    padding: '20px 16px 8px',
    borderBottom: title || message ? `1px solid ${headerBorderColor}` : 'none',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: theme.secondaryText,
    textAlign: 'center',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: '400',
    color: theme.primaryText,
    textAlign: 'center',
    margin: 0,
    lineHeight: '22px',
  };

  const actionsContainerStyle: React.CSSProperties = {
    padding: '8px',
    maxHeight: '60vh',
    overflowY: 'auto',
  };

  const getActionColor = (action: ActionSheetAction) => {
    if (action.destructive) return '#FF3B30';
    if (action.disabled) return theme.secondaryText;
    return theme.primaryText;
  };

  const actionStyle = (action: ActionSheetAction): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '12px',
    width: '100%',
    fontSize: '17px',
    fontWeight: '400',
    color: getActionColor(action),
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    opacity: action.disabled ? 0.5 : 1,
    transition: 'background-color 0.2s ease',
    textAlign: 'left',
  });

  const cancelButtonStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    margin: '8px',
    fontSize: '17px',
    fontWeight: '600',
    color: '#007AFF',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const handleActionPress = (action: ActionSheetAction) => {
    if (!action.disabled) {
      // Track action selection
      telemetry.trackUserInteraction({
        action: 'action_sheet_selection',
        component: 'ActionSheet',
        metadata: {
          actionTitle: action.title,
          isDestructive: !!action.destructive,
          hasIcon: !!action.icon,
          sheetTitle: title || 'untitled',
        },
      });

      telemetry.trackMetric({
        name: 'action_sheet_interaction',
        value: 1,
        tags: {
          action: action.title,
          destructive: String(!!action.destructive),
          sheet_title: title || 'untitled',
        },
      });

      action.onPress();
      onClose();
    } else {
      // Track disabled action attempt
      telemetry.trackUserInteraction({
        action: 'action_sheet_disabled_attempt',
        component: 'ActionSheet',
        metadata: {
          actionTitle: action.title,
          reason: 'action_disabled',
        },
      });
    }
  };

  return (
    <div style={backdropStyle} className="ios-action-sheet-backdrop">
      <div ref={sheetRef} style={sheetStyle} className="ios-action-sheet">
        {(title || message) && (
          <div style={headerStyle}>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {message && <p style={messageStyle}>{message}</p>}
          </div>
        )}

        <div style={actionsContainerStyle}>
          {actions.map((action, index) => (
            <button
              key={`action-${action.title}-${index}`}
              style={actionStyle(action)}
              onClick={() => handleActionPress(action)}
              disabled={action.disabled}
              className="ios-action-button"
              onMouseEnter={e => {
                if (!action.disabled) {
                  (e.target as HTMLElement).style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }}
              aria-label={action.title}
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.title}</span>
            </button>
          ))}
        </div>

        <button
          style={cancelButtonStyle}
          onClick={onClose}
          className="ios-cancel-button"
          onMouseEnter={e => {
            (e.target as HTMLElement).style.backgroundColor = isDark
              ? '#3A3A3C'
              : '#F0F0F0';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.backgroundColor = isDark
              ? '#2C2C2E'
              : '#FFFFFF';
          }}
          aria-label={cancelText}
        >
          {cancelText}
        </button>
      </div>
    </div>
  );
};
