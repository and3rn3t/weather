/**
 * Native API Integration Demo Component
 * 
 * This component demonstrates the enhanced native capabilities
 * available when running on mobile devices through Capacitor.
 */

import React from 'react';
import { useNativeGeolocation, useNativeHaptics, useWeatherNotifications, useNetworkStatus } from './useNativeApi';
import type { ThemeColors } from './themeConfig';

interface NativeStatusProps {
  theme: ThemeColors;
  isMobile: boolean;
}

export const NativeStatusDisplay: React.FC<NativeStatusProps> = ({ theme, isMobile }) => {
  const nativeGeo = useNativeGeolocation();
  const nativeHaptics = useNativeHaptics();
  const notifications = useWeatherNotifications();
  const network = useNetworkStatus();

  const statusStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    margin: '4px',
    display: 'inline-block',
  };

  const getStatusColor = (isAvailable: boolean) => ({
    backgroundColor: isAvailable ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
    color: isAvailable ? '#4CAF50' : '#9e9e9e',
    border: `1px solid ${isAvailable ? '#4CAF50' : '#9e9e9e'}`,
  });

  if (!isMobile) {
    return null; // Hide on desktop
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      backgroundColor: theme.cardBackground,
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '8px',
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: theme.cardShadow,
      fontSize: '10px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ ...statusStyle, ...getStatusColor(nativeGeo.isNative) }}>
          🛰️ GPS: {nativeGeo.isNative ? 'Native' : 'Web'}
        </div>
        <div style={{ ...statusStyle, ...getStatusColor(nativeHaptics.isAvailable) }}>
          📳 Haptics: {nativeHaptics.isAvailable ? 'Native' : 'Web'}
        </div>
        <div style={{ ...statusStyle, ...getStatusColor(notifications.isNative) }}>
          🔔 Push: {notifications.isNative ? 'Native' : 'Web'}
        </div>
        <div style={{ ...statusStyle, ...getStatusColor(network.isOnline) }}>
          🌐 Net: {network.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

export default NativeStatusDisplay;
