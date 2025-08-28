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

// Lightweight production boot marker to prove JS is executing in all builds
function ensureProdBootMarker(): HTMLElement | null {
  try {
    if (import.meta.env.MODE !== 'production') return null;
    let marker = document.getElementById('prod-boot-marker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'prod-boot-marker';
      marker.setAttribute('data-allow-overlay', 'true');
      marker.setAttribute(
        'style',
        [
          'position:fixed',
          'top:12px',
          'left:12px',
          'z-index:2147483647',
          'background:#bbf7d0', // green-200
          'color:#064e3b', // emerald-900
          'border:1px solid #86efac',
          'border-radius:8px',
          'padding:6px 10px',
          'font:600 12px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
          'box-shadow:0 2px 8px rgba(0,0,0,.2)',
        ].join(';')
      );
      marker.textContent = 'BOOT: start';
      document.body.appendChild(marker);
    }
    return marker;
  } catch {
    return null;
  }
}
// Defer DOM-dependent work until the document is ready
const onReady = (cb: () => void) => {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', cb, {
      once: true,
    } as EventListenerOptions);
  } else {
    cb();
  }
};

let devOverlay: HTMLElement | null = null;
let prodMarker: HTMLElement | null = null;

const log = (...args: unknown[]) => {
  const parts = args.map(v =>
    v instanceof Error ? v.stack || v.message : String(v)
  );
  const built = parts.join(' ');
  const time = new Date().toLocaleTimeString();

  // Always mirror to console in all modes
  // eslint-disable-next-line no-console
  console.log('[boot]', ...args);

  // Dev overlay line item
  if (devOverlay) {
    const line = document.createElement('div');
    line.textContent = `[${time}] ${built}`;
    devOverlay.appendChild(line);
  }

  // Update production boot marker text if present
  if (prodMarker) {
    prodMarker.textContent = built ? `BOOT: ${built}` : 'BOOT: …';
  }

  // Reflect latest boot stage in the document title for guaranteed visibility (dev only)
  try {
    const msg = args
      .map(v => (v instanceof Error ? v.message : String(v)))
      .join(' ');
    const trimmed = msg.length > 60 ? `${msg.slice(0, 60)}…` : msg;
    if (
      typeof document !== 'undefined' &&
      import.meta.env.MODE !== 'production'
    ) {
      document.title = `[DEV] ${trimmed}`;
    }
  } catch {
    // no-op
  }
};

// Declare a global marker to detect successful module execution
declare global {
  interface Window {
    __APP_BOOTED?: boolean;
  }
}

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

// Service worker safety: in development skip purge/reload; only purge in production (one-time per session)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1';

  // Skip purge entirely on localhost to avoid dev reload delays
  if (!isLocalhost) {
    const shouldPurgeProd = !sessionStorage.getItem('sw:purged:prod');
    if (shouldPurgeProd) {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            await Promise.all(regs.map(r => r.unregister()));
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            const deletable = keys.filter(
              (k: string) =>
                k.startsWith('weather-') ||
                k.includes('vite') ||
                k.includes('workbox') ||
                k.includes('static')
            );
            await Promise.all(deletable.map((k: string) => caches.delete(k)));
          }
          sessionStorage.setItem('sw:purged:prod', '1');
          log('sw:purged -> reloading');
          // Reload once to ensure the page is fully detached from any SW control
          window.location.reload();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Service worker purge failed:', e);
          log('sw:purge failed', String(e));
        }
      })();
    }
  }
}

onReady(() => {
  // Create overlays/markers once DOM exists
  if (import.meta.env.MODE !== 'production') {
    devOverlay = ensureDevOverlay();
  }
  prodMarker = ensureProdBootMarker();

  // Remove early boot marker injected by index.html, if present
  try {
    const early = document.getElementById('early-boot-marker');
    if (early) {
      early.style.transition = 'opacity 250ms ease';
      early.style.opacity = '0';
      setTimeout(() => early.parentElement?.removeChild(early), 400);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('early-boot-marker cleanup error', e);
  }

  // Tag the document for development-only CSS overrides and immediately hide banner if present
  if (import.meta.env.MODE !== 'production') {
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
  if (!rootElement) {
    log('root:not-found(waiting)');
    return;
  }
  log('root:found');

  const root = createRoot(rootElement);
  // Render a minimal dev shell first to prove React can render (development only)
  if (import.meta.env.MODE !== 'production') {
    const DevShell = () => (
      <div className="dev-shell-strip" data-allow-overlay="true">
        DEV SHELL: React root mounted. Loading App…
      </div>
    );
    root.render(<DevShell />);
    log('shell:rendered');
  }

  let appRendered = false;
  // Timed fallback: if App import is slow or fails silently, render a diagnostic shell
  setTimeout(async () => {
    if (!appRendered) {
      log('fallback:diagnostic-render:start');
      try {
        const diag = await import('./App-diagnostic');
        const DiagApp = diag.default as React.ComponentType;
        root.render(<DiagApp />);
        log('fallback:diagnostic-render:done');
        // Keep the marker small and subtle once diagnostic is visible
        if (prodMarker) prodMarker.style.opacity = '0.6';
      } catch (e) {
        log('fallback:diagnostic-render:error', String(e));
      }
    }
  }, 1800);

  (async () => {
    try {
      const mod = await import('./App');
      log('app:imported');
      const App = mod.default;
      root.render(<App />);
      appRendered = true;
      window.__APP_BOOTED = true;
      log('app:rendered');

      // If the HTML fallback is still present shortly after rendering App, show diagnostic
      setTimeout(async () => {
        try {
          const fallback = document.getElementById('html-fallback');
          if (fallback?.isConnected) {
            log('fallback:html-still-present -> rendering diagnostic app');
            const diag = await import('./App-diagnostic');
            const DiagApp = diag.default as React.ComponentType;
            root.render(<DiagApp />);
          }
        } catch (e) {
          log('fallback:html-check-error', String(e));
        }
      }, 600);

      // Post-render watchdog: if the app content remains invisible, apply a rescue stylesheet
      setTimeout(async () => {
        try {
          const rootRect = rootElement.getBoundingClientRect();
          const hasChild = !!rootElement.firstElementChild;
          const computed = getComputedStyle(document.body);
          const bodyBg = computed.backgroundColor || computed.backgroundImage;

          // Check if there is content and if the root has a height
          const invisible =
            (!hasChild || rootRect.height < 40) &&
            document.visibilityState === 'visible';

          if (invisible) {
            log('watchdog:invisible -> applying rescue css');
            const style = document.createElement('style');
            style.setAttribute('data-dev-hide', 'full-overlays');
            style.textContent = `
              html[data-env='dev'] body > *[style*="position:fixed"]:not([data-allow-overlay='true']){display:none!important;visibility:hidden!important;opacity:0!important}
              html[data-env='dev'] .film-grain-overlay,html[data-env='dev'] .horror-quote-overlay{display:none!important}
              html[data-env='dev'] #root{min-height:60vh!important}
            `;
            document.head.appendChild(style);

            // As an extra visibility guarantee, show the diagnostic app
            try {
              const diag = await import('./App-diagnostic');
              const DiagApp = diag.default as React.ComponentType;
              root.render(<DiagApp />);
              log('watchdog:diagnostic-rendered');
            } catch (e) {
              log('watchdog:diag-import-failed', String(e));
            }
          } else {
            log('watchdog:visible ok', `bodyBg=${String(bodyBg)}`);
          }
        } catch (e) {
          log('watchdog:error', String(e));
        }
      }, 1200);

      // Remove production marker shortly after successful render
      if (prodMarker) {
        try {
          prodMarker.style.transition = 'opacity 300ms ease';
          prodMarker.style.opacity = '0';
          setTimeout(
            () => prodMarker?.parentElement?.removeChild(prodMarker),
            600
          );
        } catch {
          // ignore
        }
      }

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
          'padding:6px 10px;text-align:center'
      );
      bar.textContent = `DEV ERROR: ${String(err)}`;
      document.body.appendChild(bar);
      // rethrow to propagate to console listeners
      throw err;
    }
  })();
});
