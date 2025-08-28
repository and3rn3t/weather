import React, { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import LoadingProvider from './utils/LoadingProvider';
import { ThemeProvider } from './utils/themeContext';

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
      'padding:6px 8px;box-shadow:0 -2px 8px rgba(0,0,0,0.3);pointer-events:none;width:100%';
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

// Dev-only error boundary (safe to define in all modes; renders children in production)
type EBState = { hasError: boolean; message?: string; stack?: string };
class DevErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: unknown): EBState {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    };
  }
  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      log('DevErrorBoundary:caught', String(error));
    }
  }
  render() {
    if (import.meta.env.DEV && this.state.hasError) {
      return (
        <div className="dev-error-block" data-allow-overlay="true">
          <div className="dev-error-title">Render Error</div>
          <div className="dev-error-msg">{this.state.message}</div>
          {this.state.stack && (
            <pre className="dev-error-stack">{this.state.stack}</pre>
          )}
          <button
            className="dev-boot-btn"
            onClick={() => this.setState({ hasError: false })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

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

// Service worker safety
// 1) DEV or explicit disable flag -> Unregister all SWs and clear caches now
// 2) PROD -> One-time purge per session to avoid stale caches after deploy
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isDev = import.meta.env.MODE !== 'production';
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const disableFlag =
    (env && env.VITE_DISABLE_SW === '1') ||
    (() => {
      try {
        return localStorage.getItem('disableSW') === '1';
      } catch {
        return false;
      }
    })();

  // DEV or explicit disable: unregister and clear caches immediately
  if (isDev || disableFlag) {
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
          await Promise.all(regs.map(r => r.unregister()));
          log('sw:disable: unregistered all');
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
          if (deletable.length) {
            await Promise.all(deletable.map((k: string) => caches.delete(k)));
            log('sw:disable: caches cleared', deletable.length);
          }
        }
        // Persist an explicit local disable so any PWA helpers also stay off
        try {
          localStorage.setItem('disableSW', '1');
        } catch {
          // ignore storage errors
        }
        // If this page is still controlled by a SW, force a one-time reload to detach
        try {
          const alreadyReloaded =
            sessionStorage.getItem('sw:disabled:reloaded') === '1';
          if (navigator.serviceWorker.controller && !alreadyReloaded) {
            sessionStorage.setItem('sw:disabled:reloaded', '1');
            log('sw:disable: reloading to detach controller');
            window.location.reload();
          } else if (!navigator.serviceWorker.controller && alreadyReloaded) {
            // Clean up the marker once detached
            sessionStorage.removeItem('sw:disabled:reloaded');
          }
        } catch {
          // ignore
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('SW disable failed:', e);
        log('sw:disable failed', String(e));
      }
    })();
  }

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1';

  // Skip purge entirely on localhost to avoid dev reload delays
  if (!isLocalhost && !isDev) {
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

  // Insert a sentinel so #root is never visually empty in DEV (removes :empty banner)
  try {
    if (
      import.meta.env.MODE !== 'production' &&
      !rootElement.firstElementChild
    ) {
      const sentinel = document.createElement('div');
      sentinel.setAttribute('data-dev-sentinel', 'true');
      sentinel.setAttribute(
        'style',
        'padding:8px;margin:8px;border:1px dashed #93c5fd;color:#1e3a8a;background:#eff6ff;font:600 12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;'
      );
      sentinel.textContent = 'DEV: React mounting…';
      rootElement.appendChild(sentinel);
    }
  } catch {
    // ignore
  }

  const root = createRoot(rootElement);
  // Shared reference to the DEV mount function so later helpers can call it safely
  let mountAppDevRef: (() => Promise<void>) | null = null;
  // Track if the app has rendered yet (declared early so all paths can update it)
  let appRendered = false;
  // Render a visible dev bootstrap panel immediately so root is never empty
  if (import.meta.env.DEV) {
    const mountAppDev = async () => {
      try {
        const mod = await import('./navigation/AppNavigator');
        const App = mod.default;
        root.render(
          <StrictMode>
            <ThemeProvider>
              <LoadingProvider>
                <DevErrorBoundary>
                  <App />
                </DevErrorBoundary>
              </LoadingProvider>
            </ThemeProvider>
          </StrictMode>
        );
        appRendered = true;
        window.__APP_BOOTED = true;
        log('dev-boot:app mounted');
      } catch (err) {
        log('dev-boot:load failed', String(err));
      }
    };
    mountAppDevRef = mountAppDev;

    const DevBootstrap = () => (
      <div className="dev-boot-panel" data-allow-overlay="true">
        <div className="dev-boot-title">Dev Bootstrap</div>
        <div className="dev-boot-sub">Root mounted. Preparing app…</div>
        <button className="dev-boot-btn" onClick={mountAppDev}>
          Load App
        </button>
      </div>
    );
    root.render(
      <StrictMode>
        <DevBootstrap />
      </StrictMode>
    );
    // Auto-attempt to load after a brief delay
    setTimeout(() => {
      void mountAppDev();
    }, 60);
    log('dev-boot:panel rendered');
  }

  let diagTimerId: number | null = null;
  // Timed fallback: if App import is slow or fails silently, render a diagnostic shell
  if (import.meta.env.PROD) {
    diagTimerId = window.setTimeout(async () => {
      if (!appRendered) {
        log('fallback:diagnostic-render:start');
        try {
          const diag = await import('./App-diagnostic');
          const DiagApp = diag.default as React.ComponentType;
          root.render(
            <StrictMode>
              <DiagApp />
            </StrictMode>
          );
          log('fallback:diagnostic-render:done');
          // Keep the marker small and subtle once diagnostic is visible
          if (prodMarker) prodMarker.style.opacity = '0.6';
        } catch (e) {
          log('fallback:diagnostic-render:error', String(e));
        }
      }
    }, 1800);
  }

  (async () => {
    try {
      // Dynamically import AppNavigator (safe in dev and prod)
      const mod = await import('./navigation/AppNavigator');
      log('app:imported');
      const App = mod.default;
      root.render(
        <StrictMode>
          <ThemeProvider>
            <LoadingProvider>
              {import.meta.env.DEV ? (
                <DevErrorBoundary>
                  <App />
                </DevErrorBoundary>
              ) : (
                <App />
              )}
            </LoadingProvider>
          </ThemeProvider>
        </StrictMode>
      );
      appRendered = true;
      window.__APP_BOOTED = true;
      // Remove any HTML fallback node that might have been injected before React mounted
      try {
        const htmlFallback = document.getElementById('html-fallback');
        if (htmlFallback) {
          htmlFallback.parentElement?.removeChild(htmlFallback);
        }
      } catch (e) {
        log('html-fallback:cleanup-failed', String(e));
      }
      log('app:rendered');

      // Cancel any pending diagnostic fallback once app has rendered
      if (diagTimerId) {
        clearTimeout(diagTimerId);
        diagTimerId = null;
      }
      // Dev-only visibility watchdog: if content height is tiny, re-surface Dev Bootstrap
      if (import.meta.env.DEV) {
        setTimeout(() => {
          try {
            const rect = rootElement.getBoundingClientRect();
            const hasChild = !!rootElement.firstElementChild;
            if (
              (!hasChild || rect.height < 40) &&
              document.visibilityState === 'visible'
            ) {
              log('dev-watchdog:root-invisible -> showing bootstrap');
              const DevBootstrap = () => (
                <div className="dev-boot-panel" data-allow-overlay="true">
                  <div className="dev-boot-title">Dev Bootstrap</div>
                  <div className="dev-boot-sub">Retry loading app…</div>
                  <button
                    className="dev-boot-btn"
                    onClick={async () => {
                      if (mountAppDevRef) {
                        await mountAppDevRef();
                      }
                    }}
                  >
                    Load App
                  </button>
                </div>
              );
              root.render(
                <StrictMode>
                  <DevBootstrap />
                </StrictMode>
              );
            }
          } catch (e) {
            log('dev-watchdog:error', String(e));
          }
        }, 800);
      }
      // In production, if HTML fallback is still present shortly after rendering App, show diagnostic only if app didn't render
      if (import.meta.env.PROD) {
        setTimeout(async () => {
          try {
            const fallback = document.getElementById('html-fallback');
            if (!appRendered && fallback?.isConnected) {
              log('fallback:html-still-present -> rendering diagnostic app');
              const diag = await import('./App-diagnostic');
              const DiagApp = diag.default as React.ComponentType;
              root.render(
                <StrictMode>
                  <DiagApp />
                </StrictMode>
              );
            }
          } catch (e) {
            log('fallback:html-check-error', String(e));
          }
        }, 600);
      }

      // Post-render watchdog (production-only): if the app content remains invisible, apply a rescue stylesheet
      if (import.meta.env.PROD) {
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

            if (!appRendered && invisible) {
              log('watchdog:invisible -> applying rescue css');
              const style = document.createElement('style');
              style.setAttribute('data-dev-hide', 'full-overlays');
              style.textContent = `
                html[data-env='dev'] body > *[style*="position:fixed"]:not([data-allow-overlay='true']){display:none!important;visibility:hidden!important;opacity:0!important}
                html[data-env='dev'] .film-grain-overlay{display:none!important}
                html[data-env='dev'] #root{min-height:60vh!important}
              `;
              document.head.appendChild(style);

              // As an extra visibility guarantee, show the diagnostic app
              try {
                const diag = await import('./App-diagnostic');
                const DiagApp = diag.default as React.ComponentType;
                root.render(
                  <StrictMode>
                    <DiagApp />
                  </StrictMode>
                );
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
      }

      // Dev-only rescue UI: if still not rendered after 1200ms, surface a local stub
      if (import.meta.env.DEV) {
        setTimeout(() => {
          if (!appRendered) {
            log('dev-rescue:render');
            const Retry: React.FC = () => {
              return (
                <div className="dev-rescue-container">
                  <h1 className="dev-rescue-title">Dev Rescue UI</h1>
                  <p className="dev-rescue-text">
                    App not ready yet. Click retry to load the navigator.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const mod2 = await import('./navigation/AppNavigator');
                        const App2 = mod2.default;
                        root.render(
                          <StrictMode>
                            <ThemeProvider>
                              <LoadingProvider>
                                <App2 />
                              </LoadingProvider>
                            </ThemeProvider>
                          </StrictMode>
                        );
                        appRendered = true;
                        log('dev-rescue:success');
                      } catch (err) {
                        log('dev-rescue:retry-failed', String(err));
                      }
                    }}
                    className="dev-rescue-button"
                  >
                    Retry
                  </button>
                </div>
              );
            };
            root.render(
              <StrictMode>
                <Retry />
              </StrictMode>
            );
          }
        }, 1200);
      }

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
      bar.setAttribute('data-allow-overlay', 'true');
      bar.textContent = `DEV ERROR: ${String(err)}`;
      document.body.appendChild(bar);
      // rethrow to propagate to console listeners
      throw err;
    }
  })();
});
