import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // Copy toast state
  const [copied, setCopied] = useState(false);
  const hideToastTimer = useRef<number | null>(null);

  // Version polling for update notifications
  const currentMeta = useMemo(() => ({ commit, time }), [commit, time]);

  useEffect(() => {
    // Only run in production; avoid dev noise
    if (import.meta.env.MODE !== 'production') return;

    let aborted = false;
    const controller = new AbortController();

    const poll = async () => {
      try {
        // Cache-busting param in case proxies ignore headers
        const url = `/version.json?ts=${Date.now()}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'cache-control': 'no-cache' },
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          commit?: string;
          shortCommit?: string;
          time?: string;
        };
        if (aborted) return;
        const serverCommit = json.commit || json.shortCommit || '';
        if (serverCommit && serverCommit !== currentMeta.commit) {
          // Show a lightweight prompt bar to refresh
          const bar = document.createElement('div');
          bar.className = `deploy-refresh-bar ${isDark ? 'dark' : 'light'}`;
          bar.role = 'status';
          bar.ariaLive = 'polite';
          bar.innerHTML =
            "A new version is available. <button type='button' class='deploy-refresh-button'>Refresh</button>";
          document.body.appendChild(bar);
          const btn = bar.querySelector('button.deploy-refresh-button');
          btn?.addEventListener('click', () => {
            try {
              // Force reload bypassing cache
              window.location.reload();
            } catch {
              // no-op
            }
          });
          // Stop polling once we know about a new version
          controller.abort();
        }
      } catch {
        // ignore network errors
      }
    };

    // Initial small delay to allow app to settle, then periodic checks
    const interval = setInterval(poll, 60_000); // every 60s
    // Do one early check after 5s
    const initial = setTimeout(poll, 5_000);

    return () => {
      aborted = true;
      controller.abort();
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [currentMeta.commit, isDark]);

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
          setCopied(true);
          if (hideToastTimer.current)
            window.clearTimeout(hideToastTimer.current);
          hideToastTimer.current = window.setTimeout(
            () => setCopied(false),
            1500
          );
        } catch {
          // ignore clipboard errors
        }
      }}
    >
      <div className="dot" />

      <span className="label">Live{short ? ` • ${short}` : ''}</span>

      {/* Copy toast (inline, tiny) */}
      {copied && (
        <output className="copy-toast" aria-live="polite">
          Copied
        </output>
      )}
    </button>
  );
};

export default DeploymentStatus;
