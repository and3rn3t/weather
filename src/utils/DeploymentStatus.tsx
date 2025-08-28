import React from 'react';
import './DeploymentStatus.css';

interface DeploymentStatusProps {
  theme: 'light' | 'dark';
}

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';
  const commit =
    (typeof __BUILD_COMMIT__ !== 'undefined' && __BUILD_COMMIT__) || '';
  const short = commit ? commit.slice(0, 8) : '';
  const time = (typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__) || '';
  const when = (() => {
    try {
      return time ? new Date(time).toLocaleString() : '';
    } catch {
      return time;
    }
  })();

  return (
    <button
      type="button"
      className={`deployment-status ${isDark ? 'dark' : 'light'}`}
      aria-label={
        when ? `Deployment Live • ${short} • ${when}` : 'Deployment Live'
      }
      title={when ? `Deployed ${when} • ${commit}` : 'Live'}
      onClick={async () => {
        try {
          if (commit) await navigator.clipboard?.writeText(commit);
        } catch {
          // ignore clipboard errors
        }
      }}
    >
      <div className="dot" />

      <span className="label">Live{short ? ` • ${short}` : ''}</span>
    </button>
  );
};

export default DeploymentStatus;
