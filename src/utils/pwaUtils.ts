/**
 * Service Worker Registration and PWA Utilities
 * Handles PWA installation, updates, and offline functionality
 */

import React from 'react';
import { preseedSearchCache } from './indexedDbPreseed';
import { logError, logInfo } from './logger';
import { popularCitiesCache } from './popularCitiesCache';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPrompt {
  isSupported: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
  checkInstallStatus: () => boolean;
}

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isControlling: boolean;
  updateAvailable: boolean;
  checkForUpdates: () => Promise<void>;
  skipWaiting: () => void;
}

/**
 * PWA Installation Management
 */
/**
 * usePWAInstall - Custom React hook for pwaUtils functionality
 */
/**
 * usePWAInstall - Custom React hook for pwaUtils functionality
 */
export const usePWAInstall = (): PWAInstallPrompt => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Check if PWA is supported
  const isSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'manifest' in document;
  };

  // Check if app is already installed
  const isInstalled = (): boolean => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true)
    );
  };

  // Listen for beforeinstallprompt event
  const setupInstallPrompt = (): void => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      logInfo('PWA: Install prompt available');
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      logInfo('PWA: App installed successfully');
      deferredPrompt = null;
    });
  };

  // Prompt user to install PWA
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      logInfo('PWA: No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      logInfo('PWA: Install prompt outcome:', outcome);
      deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      logError('PWA: Install prompt failed', error);
      return false;
    }
  };

  // Initialize install prompt handling
  if (typeof window !== 'undefined') {
    setupInstallPrompt();
  }

  return {
    isSupported: isSupported(),
    isInstalled: isInstalled(),
    canInstall: !!deferredPrompt,
    promptInstall,
    checkInstallStatus: isInstalled,
  };
};

/**
 * Service Worker Registration and Management
 */
/**
 * useServiceWorker - Custom React hook for pwaUtils functionality
 */
/**
 * useServiceWorker - Custom React hook for pwaUtils functionality
 */
export const useServiceWorker = (): ServiceWorkerStatus => {
  let registration: ServiceWorkerRegistration | null = null;

  // Global kill switch to fully disable service worker in dev or when configured
  const swDisabled = (): boolean => {
    try {
      // Disable by default in development
      if (import.meta.env.DEV) return true;
      // Env-based switch: VITE_DISABLE_SW='1'
      const env = (import.meta as unknown as { env?: Record<string, string> })
        .env;
      if (env && env.VITE_DISABLE_SW === '1') return true;
      // Local override: localStorage 'disableSW' = '1'
      if (typeof window !== 'undefined') {
        return localStorage.getItem('disableSW') === '1';
      }
    } catch {
      // ignore
    }
    return false;
  };

  // Check if service workers are supported
  const isSupported = (): boolean => {
    return 'serviceWorker' in navigator;
  };

  // Helper: determine if running on localhost
  const isLocalhost = (hostname: string): boolean => {
    return (
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    );
  };

  const isSecureContext = (): boolean => {
    // Allow HTTPS and production hostnames; skip localhost during dev to avoid SW caching issues
    const { protocol, hostname } = window.location;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1';
    return protocol === 'https:' || (!isLocal && protocol === 'http:');
  };

  // Register service worker
  const register = async (): Promise<void> => {
    if (swDisabled()) {
      logInfo('Service Worker: Disabled by configuration');
      return;
    }
    if (!isSupported()) {
      logInfo('Service Worker: Not supported');
      return;
    }

    // Skip SW registration on localhost/preview to avoid stale caches interfering with dev
    const { hostname } = window.location;
    const isLocal = isLocalhost(hostname);
    if (isLocal || !isSecureContext()) {
      logInfo('Service Worker: Skipped in development/localhost');
      return;
    }

    try {
      registration = await navigator.serviceWorker.register('/sw.js');

      logInfo('Service Worker: Registered successfully', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        logInfo('Service Worker: Update found');

        if (!registration) return;
        const installing = registration.installing;
        if (installing) {
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              logInfo('Service Worker: Update available');
              // Notify app about update
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        logInfo('Service Worker: Message received', event.data);

        if (event.data.type === 'CONNECTIVITY_RESTORED') {
          window.dispatchEvent(new CustomEvent('connectivity-restored'));
        }
      });

      // One-time prewarm: ask SW to preload a small set of popular cities
      try {
        const topCities = popularCitiesCache
          .getInstantSuggestions(8)
          .map(c => `${c.name}, ${c.country}`);

        // Wait until the SW is ready/controlling, then post the message
        const readyReg = await navigator.serviceWorker.ready;
        const target = readyReg.active || navigator.serviceWorker.controller;
        if (target && topCities.length > 0) {
          target.postMessage({
            type: 'PRELOAD_POPULAR_CITIES',
            payload: { cities: topCities },
          });
          logInfo('Service Worker: Prewarm requested for popular cities');
        }
      } catch (e) {
        logError('Service Worker: Prewarm failed', e);
      }

      // Also pre-seed IndexedDB cache with the same queries (longer TTL)
      try {
        await preseedSearchCache();
      } catch (e) {
        logError('PWA: IndexedDB pre-seed failed to start', e);
      }
    } catch (error) {
      logError('Service Worker: Registration failed', error);
    }
  };

  // Check for service worker updates
  const checkForUpdates = async (): Promise<void> => {
    if (registration) {
      try {
        await registration.update();
        logInfo('Service Worker: Update check completed');
      } catch (error) {
        logError('Service Worker: Update check failed', error);
      }
    }
  };

  // Skip waiting and activate new service worker
  const skipWaiting = (): void => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      logInfo('Service Worker: Skip waiting triggered');
    }
  };

  // Initialize service worker
  if (typeof window !== 'undefined' && !swDisabled()) {
    register();
  }

  return {
    isSupported: swDisabled() ? false : isSupported(),
    isRegistered: swDisabled() ? false : !!registration,
    isControlling: swDisabled() ? false : !!navigator.serviceWorker?.controller,
    updateAvailable: false, // updated via events when enabled
    checkForUpdates: swDisabled() ? async () => {} : checkForUpdates,
    skipWaiting: swDisabled() ? () => {} : skipWaiting,
  };
};

/**
 * Online/Offline Status Management
 */
/**
 * useNetworkStatus - Custom React hook for pwaUtils functionality
 */
/**
 * useNetworkStatus - Custom React hook for pwaUtils functionality
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      logInfo('Network: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      logInfo('Network: Offline');
      setIsOnline(false);
    };

    const handleConnectivityRestored = () => {
      logInfo('Network: Connectivity restored via service worker');
      setIsOnline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(
      'connectivity-restored',
      handleConnectivityRestored
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'connectivity-restored',
        handleConnectivityRestored
      );
    };
  }, []);

  return { isOnline };
};

/**
 * PWA Update Notification Hook
 */
/**
 * usePWAUpdate - Custom React hook for pwaUtils functionality
 */
/**
 * usePWAUpdate - Custom React hook for pwaUtils functionality
 */
export const usePWAUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const { skipWaiting } = useServiceWorker();

  React.useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const applyUpdate = () => {
    skipWaiting();
    window.location.reload();
  };

  return {
    updateAvailable,
    applyUpdate,
  };
};
