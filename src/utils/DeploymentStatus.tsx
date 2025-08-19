import React from 'react';

interface DeploymentStatusProps {
  theme: 'light' | 'dark';
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: isDark
          ? 'rgba(30, 30, 30, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: '8px',
        padding: '6px 10px',
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 41, 59, 0.7)',
        fontSize: '10px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.3s ease',
        opacity: 0.6,
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          animation: 'pulse 2s infinite',
        }}
      />

      <span style={{ fontWeight: 400, fontSize: '9px' }}>Live</span>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `,
        }}
      />
    </div>
  );
};

export default DeploymentStatus;
