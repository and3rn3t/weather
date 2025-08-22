import React from 'react';

interface PWAStatusProps {
  pwaInstall: {
    canInstall: boolean;
    install: () => Promise<void>;
    isInstalled: boolean;
  };
  serviceWorker: {
    isSupported: boolean;
    isRegistered: boolean;
    isInstalling: boolean;
    isWaiting: boolean;
    isControlling: boolean;
    skipWaiting: () => void;
  };
  isOnline: boolean;
  updateAvailable: boolean;
  applyUpdate: () => void;
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PWAStatus: React.FC<PWAStatusProps> = ({
  pwaInstall,
  serviceWorker,
  isOnline,
  updateAvailable,
  applyUpdate,
  enabled = true,
  position = 'top-right',
}) => {
  if (!enabled) return null;

  const positionStyles = {
    'top-left': { top: '80px', left: '20px' },
    'top-right': { top: '80px', right: '20px' },
    'bottom-left': { bottom: '100px', left: '20px' },
    'bottom-right': { bottom: '100px', right: '20px' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        backgroundColor: 'rgba(16, 33, 62, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        minWidth: '280px',
        color: 'white',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
          fontWeight: '600',
        }}
      >
        🌤️ PWA Status
      </div>

      {/* Network Status */}
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}
      >
        <span style={{ marginRight: '8px' }}>{isOnline ? '🌐' : '📱'}</span>
        <span style={{ color: isOnline ? '#10b981' : '#f59e0b' }}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>
      </div>

      {/* Service Worker Status */}
      {serviceWorker.isSupported && (
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}
        >
          <span style={{ marginRight: '8px' }}>
            {serviceWorker.isControlling ? '🔧' : '⚙️'}
          </span>
          <span
            style={{
              color: serviceWorker.isControlling ? '#10b981' : '#6b7280',
            }}
          >
            {serviceWorker.isControlling ? 'SW Active' : 'SW Installing'}
          </span>
        </div>
      )}

      {/* Installation Status */}
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
      >
        <span style={{ marginRight: '8px' }}>
          {pwaInstall.isInstalled ? '📱' : '⬇️'}
        </span>
        <span style={{ color: pwaInstall.isInstalled ? '#10b981' : '#6b7280' }}>
          {pwaInstall.isInstalled ? 'Installed' : 'Not Installed'}
        </span>
      </div>

      {/* Install Button */}
      {pwaInstall.canInstall && !pwaInstall.isInstalled && (
        <button
          onClick={pwaInstall.install}
          style={{
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '6px',
          }}
        >
          📱 Install App
        </button>
      )}

      {/* Update Button */}
      {updateAvailable && (
        <button
          onClick={applyUpdate}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '6px',
          }}
        >
          🔄 Update Available
        </button>
      )}

      {/* Skip Waiting Button */}
      {serviceWorker.isWaiting && (
        <button
          onClick={serviceWorker.skipWaiting}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          ⚡ Activate Update
        </button>
      )}
    </div>
  );
};

export default PWAStatus;
