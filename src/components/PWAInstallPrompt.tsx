import React, { useEffect, useState } from 'react';

interface PWAInstallPromptProps {
  canInstall: boolean;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  canInstall,
  onInstall,
  onDismiss,
}) => {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (canInstall) {
      // Show prompt after a short delay for better UX
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
      setShow(false);
    } catch {
      // Handle installation error
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    onDismiss();
  };

  if (!show || !canInstall) return null;

  return (
    <div
      className="pwa-install-prompt"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 10000,
        backgroundColor: 'rgba(16, 33, 62, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>

      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}
      >
        <span style={{ fontSize: '24px', marginRight: '12px' }}>🌤️</span>
        <div>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>
            Install Weather App
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
            Get instant access and offline features
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '13px',
          marginBottom: '16px',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        • Works offline with cached weather data
        <br />
        • Faster loading and native-like experience
        <br />• Home screen shortcut access
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            flex: 1,
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: installing ? 'not-allowed' : 'pointer',
            opacity: installing ? 0.7 : 1,
          }}
        >
          {installing ? '⏳ Installing...' : '📱 Install Now'}
        </button>

        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
