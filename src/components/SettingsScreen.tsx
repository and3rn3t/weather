import React, { useState } from 'react';
import { useTheme } from '../utils/useTheme';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';
import type { ScreenInfo } from '../utils/mobileScreenOptimization';

interface SettingsScreenProps {
  theme: ThemeColors;
  screenInfo: ScreenInfo;
  onBack: () => void;
}

/**
 * SettingsScreen - Modern settings interface for mobile devices
 *
 * Features:
 * - Clean, mobile-first design
 * - Grouped settings sections
 * - Touch-friendly controls
 * - Theme integration
 * - Haptic feedback
 */
const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  screenInfo,
  onBack,
}) => {
  const { themeName, toggleTheme } = useTheme();
  const haptic = useHaptic();
  const [notifications, setNotifications] = useState(true);
  const [units, setUnits] = useState('imperial');
  const [refreshInterval, setRefreshInterval] = useState('5min');

  const handleToggleChange = (id: string, value: boolean) => {
    haptic.buttonPress();

    switch (id) {
      case 'theme':
        toggleTheme();
        break;
      case 'notifications':
        setNotifications(value);
        break;
    }
  };

  const handleSelectionChange = (id: string, value: string) => {
    haptic.buttonPress();

    switch (id) {
      case 'units':
        setUnits(value);
        break;
      case 'refresh':
        setRefreshInterval(value);
        break;
    }
  };

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Toggle between light and dark themes',
          icon: themeName === 'dark' ? '🌙' : '☀️',
          type: 'toggle' as const,
          value: themeName === 'dark',
        },
      ],
    },
    {
      title: 'Weather',
      items: [
        {
          id: 'units',
          title: 'Temperature Units',
          subtitle: 'Choose between Celsius and Fahrenheit',
          icon: '🌡️',
          type: 'selection' as const,
          value: units,
          options: ['imperial', 'metric'],
        },
        {
          id: 'refresh',
          title: 'Auto Refresh',
          subtitle: 'How often to update weather data',
          icon: '🔄',
          type: 'selection' as const,
          value: refreshInterval,
          options: ['1min', '5min', '15min', '30min', 'manual'],
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Weather Alerts',
          subtitle: 'Get notified about severe weather',
          icon: '🔔',
          type: 'toggle' as const,
          value: notifications,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'Version',
          subtitle: '1.0.0',
          icon: 'ℹ️',
          type: 'action' as const,
          action: () => {
            haptic.buttonPress();
            // Could show version details
          },
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: '💬',
          type: 'action' as const,
          action: () => {
            haptic.buttonPress();
            // Could open feedback form
          },
        },
      ],
    },
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.appBackground,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: `linear-gradient(180deg, ${theme.appBackground}95, ${theme.appBackground}85)`,
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${theme.weatherCardBorder}30`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minHeight: '60px',
  };

  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    color: theme.primaryText,
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: screenInfo.isVerySmallScreen ? '20px' : '24px',
    fontWeight: '700',
    color: theme.primaryText,
    margin: 0,
    letterSpacing: '-0.5px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '0 16px 100px 16px', // Bottom padding for navigation
    paddingTop: '8px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    marginLeft: '4px',
  };

  const itemContainerStyle: React.CSSProperties = {
    background: theme.cardBackground,
    borderRadius: '16px',
    border: `1px solid ${theme.weatherCardBorder}30`,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: `1px solid ${theme.weatherCardBorder}20`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent',
    minHeight: '64px',
  };

  const toggleStyle: React.CSSProperties = {
    position: 'relative',
    width: '50px',
    height: '30px',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const renderToggle = (isOn: boolean, onChange: (value: boolean) => void) => (
    <button
      style={{
        ...toggleStyle,
        background: isOn ? theme.primaryGradient : theme.toggleBackground,
        border: `2px solid ${isOn ? 'transparent' : theme.toggleBorder}`,
      }}
      onClick={() => onChange(!isOn)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!isOn);
        }
      }}
      aria-checked={isOn}
      role="switch"
      aria-label={`Toggle ${isOn ? 'off' : 'on'}`}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: isOn ? '22px' : '2px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          pointerEvents: 'none',
        }}
      />
    </button>
  );

  const formatOptionText = (option: string): string => {
    if (option === 'imperial') return 'Fahrenheit';
    if (option === 'metric') return 'Celsius';
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  const renderSelection = (
    value: string,
    options: string[],
    onChange: (value: string) => void
  ) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: theme.cardBackground,
        border: `1px solid ${theme.weatherCardBorder}`,
        borderRadius: '8px',
        padding: '8px 12px',
        color: theme.primaryText,
        fontSize: '14px',
        minWidth: '100px',
        cursor: 'pointer',
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {formatOptionText(option)}
        </option>
      ))}
    </select>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <button
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${theme.primaryGradient}15`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 style={titleStyle}>Settings</h1>
      </header>

      {/* Content */}
      <div style={contentStyle}>
        {settingsSections.map(section => (
          <div key={section.title} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{section.title}</h2>
            <div style={itemContainerStyle}>
              {section.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    ...itemStyle,
                    borderBottom:
                      index === section.items.length - 1
                        ? 'none'
                        : itemStyle.borderBottom,
                  }}
                >
                  <div style={{ fontSize: '24px', marginRight: '16px' }}>
                    {item.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: theme.primaryText,
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        style={{
                          fontSize: '14px',
                          color: theme.secondaryText,
                          lineHeight: '1.3',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '16px' }}>
                    {item.type === 'toggle' &&
                      renderToggle(item.value as boolean, value =>
                        handleToggleChange(item.id, value)
                      )}
                    {item.type === 'selection' &&
                      item.options &&
                      renderSelection(
                        item.value as string,
                        item.options,
                        value => handleSelectionChange(item.id, value)
                      )}
                    {item.type === 'action' && (
                      <div
                        style={{
                          fontSize: '18px',
                          color: theme.secondaryText,
                        }}
                      >
                        →
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsScreen;
