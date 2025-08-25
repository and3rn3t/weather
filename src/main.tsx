import { createRoot } from 'react-dom/client';
import './index.css';

// Lightweight dev runtime logger overlay
function ensureDevOverlay(): HTMLElement | null {
  if (import.meta.env.MODE === 'production') return null;
  let el = document.getElementById('dev-runtime-log');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dev-runtime-log';
    el.setAttribute('data-allow-overlay', 'true');
    const styles =
      'position:fixed;left:0;bottom:0;max-height:40vh;overflow:auto;z-index:2147483647;' +
      'background:rgba(17,17,17,0.9);color:#fff;font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'padding:6px 8px;box-shadow:0 -2px 8px rgba(0,0,0,0.3);pointer-events:auto;width:100%';
    el.setAttribute('style', styles);
    document.body.appendChild(el);
  }
  return el;
}

const devOverlay = typeof document !== 'undefined' ? ensureDevOverlay() : null;
const log = (...args: unknown[]) => {
  if (!devOverlay) return;
  const line = document.createElement('div');
  const parts = args.map(v =>
    v instanceof Error ? v.stack || v.message : String(v),
  );
  const built = parts.join(' ');
  const time = new Date().toLocaleTimeString();
  line.textContent = `[${time}] ${built}`;
  devOverlay.appendChild(line);
  // Mirror to console for guaranteed visibility
  // eslint-disable-next-line no-console
  console.log('[dev-log]', ...args);
  // Also reflect latest boot stage in the document title for guaranteed visibility
  try {
    const msg = args
      .map(v => (v instanceof Error ? v.message : String(v)))
      .join(' ');
    const trimmed = msg.length > 60 ? `${msg.slice(0, 60)}…` : msg;
    if (typeof document !== 'undefined') {
      document.title = `[DEV] ${trimmed}`;
    }
  } catch {
    // no-op
  }
};

if (typeof window !== 'undefined' && import.meta.env.MODE !== 'production') {
  window.addEventListener('error', e => {
    log('window.onerror:', e.message);
  });
  window.addEventListener('unhandledrejection', (e: unknown) => {
    // Basic narrow: try to access reason field defensively
    const reason =
      typeof e === 'object' && e !== null && 'reason' in e
        ? (e as Record<string, unknown>).reason
        : undefined;
    log('unhandledrejection:', String(reason));
  });
}

log('boot:start');

// Development/preview safety: purge any existing service worker on localhost
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1';

  if (isLocalhost) {
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          await Promise.all(regs.map(r => r.unregister()));
          if ('caches' in window) {
            const keys = await caches.keys();
            const deletable = keys.filter(
              (k: string) =>
                k.startsWith('weather-') ||
                k.includes('vite') ||
                k.includes('workbox') ||
                k.includes('static'),
            );
            await Promise.all(deletable.map((k: string) => caches.delete(k)));
          }
          if (!sessionStorage.getItem('sw:purged')) {
            sessionStorage.setItem('sw:purged', '1');
            log('sw:purged -> reloading');
            // Reload once to ensure the page is fully detached from any SW control
            window.location.reload();
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Service worker purge failed:', e);
        log('sw:purge failed', String(e));
      }
    })();
  }
}

// Tag the document for development-only CSS overrides and immediately hide banner if present
if (typeof document !== 'undefined' && import.meta.env.MODE !== 'production') {
  document.documentElement.setAttribute('data-env', 'dev');
  const nukeBannerNow = () => {
    const b = document.getElementById('dev-boot-banner');
    b?.parentElement?.removeChild(b);
  };
  nukeBannerNow();
  // Watch for late insertions of the banner
  try {
    const mo = new MutationObserver(() => nukeBannerNow());
    mo.observe(document.body, { childList: true, subtree: true });
    // Stop observing after app boot settles
    setTimeout(() => mo.disconnect(), 5000);
  } catch {
    // ignore
  }
}

// Minimal fallback to confirm mounting in case React render fails
const rootElement = document.getElementById('root');
if (rootElement) {
  log('root:found');

  // Render a minimal dev shell first to prove React can render
  const root = createRoot(rootElement);
  const DevShell = () => (
    <div className="dev-shell-strip" data-allow-overlay="true">
      DEV SHELL: React root mounted. Loading App…
    </div>
  );
  root.render(<DevShell />);
  log('shell:rendered');

  let appRendered = false;
  // Timed fallback: if App import is slow or fails silently, render a diagnostic shell
  if (import.meta.env.MODE !== 'production') {
    setTimeout(async () => {
      if (!appRendered) {
        log('fallback:diagnostic-render:start');
        try {
          const diag = await import('./App-diagnostic');
          const DiagApp = diag.default as React.ComponentType;
          root.render(<DiagApp />);
          log('fallback:diagnostic-render:done');
        } catch (e) {
          log('fallback:diagnostic-render:error', String(e));
        }
      }
    }, 2500);
  }

  (async () => {
    try {
      const mod = await import('./App');
      log('app:imported');
      const App = mod.default;
      root.render(<App />);
      appRendered = true;
      log('app:rendered');

      // Auto-hide dev banner and runtime overlay once the app is up
      try {
        const killBanner = () => {
          const banner = document.getElementById('dev-boot-banner');
          const removed = !!banner?.parentElement?.removeChild?.(banner);
          return removed;
        };

        // Try immediate removal, then retry shortly in case of late hydration
        if (!killBanner()) {
          setTimeout(killBanner, 100);
          setTimeout(killBanner, 500);
          setTimeout(killBanner, 1500);
        }

        // CSS kill-switch as last resort
        const styleTag = document.createElement('style');
        styleTag.setAttribute('data-dev-hide', 'banner');
        styleTag.textContent =
          '#dev-boot-banner{display:none!important;visibility:hidden!important}';
        document.head.appendChild(styleTag);

        const overlayEl = document.getElementById('dev-runtime-log');
        if (overlayEl) {
          overlayEl.style.transition = 'opacity 300ms ease';
          overlayEl.style.opacity = '0';
          overlayEl.style.pointerEvents = 'none';
          setTimeout(() => {
            overlayEl?.parentElement?.removeChild(overlayEl);
          }, 500);
        }
        // Restore title
        document.title = 'Weather App - Premium Weather Forecasts';
      } catch {
        // no-op if elements not found
      }
    } catch (err) {
      log('app:render error', String(err));
      // Also surface visibly on screen
      const bar = document.createElement('div');
      bar.setAttribute(
        'style',
        'position:fixed;top:24px;left:0;right:0;z-index:2147483647;background:#fee2e2;color:#991b1b;' +
          'border-bottom:1px solid #fecaca;font:600 12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
          'padding:6px 10px;text-align:center',
      );
      bar.textContent = `DEV ERROR: ${String(err)}`;
      document.body.appendChild(bar);
      // rethrow to propagate to console listeners
      throw err;
    }
  })();
}
