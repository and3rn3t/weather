import React from 'react';

interface DeploymentStatusProps {
  theme: 'light' | 'dark';
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderRadius: '12px',
      padding: '12px 16px',
      color: isDark ? '#ffffff' : '#1e293b',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        animation: 'pulse 2s infinite'
      }} />
      
      <span style={{ fontWeight: 500 }}>
        Deployed on Cloudflare Pages
      </span>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
    </div>
  );
};

export default DeploymentStatus;
