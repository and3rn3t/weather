/**
 * Service Worker Registration and PWA Utilities
 * Handles PWA installation, updates, and offline functionality
 */

import React from 'react';

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
export const usePWAInstall = (): PWAInstallPrompt => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Check if PWA is supported
  const isSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'manifest' in document;
  };

  // Check if app is already installed
  const isInstalled = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
  };

  // Listen for beforeinstallprompt event
  const setupInstallPrompt = (): void => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      deferredPrompt = null;
    });
  };

  // Prompt user to install PWA
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('PWA: Install prompt outcome:', outcome);
      deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Install prompt failed', error);
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
    checkInstallStatus: isInstalled
  };
};

/**
 * Service Worker Registration and Management
 */
export const useServiceWorker = (): ServiceWorkerStatus => {
  let registration: ServiceWorkerRegistration | null = null;

  // Check if service workers are supported
  const isSupported = (): boolean => {
    return 'serviceWorker' in navigator;
  };

  // Register service worker
  const register = async (): Promise<void> => {
    if (!isSupported()) {
      console.log('Service Worker: Not supported');
      return;
    }

    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('Service Worker: Registered successfully', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker: Update found');
        
        const newWorker = registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Service Worker: Update available');
              // Notify app about update
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Service Worker: Message received', event.data);
        
        if (event.data.type === 'CONNECTIVITY_RESTORED') {
          window.dispatchEvent(new CustomEvent('connectivity-restored'));
        }
      });

    } catch (error) {
      console.error('Service Worker: Registration failed', error);
    }
  };

  // Check for service worker updates
  const checkForUpdates = async (): Promise<void> => {
    if (registration) {
      try {
        await registration.update();
        console.log('Service Worker: Update check completed');
      } catch (error) {
        console.error('Service Worker: Update check failed', error);
      }
    }
  };

  // Skip waiting and activate new service worker
  const skipWaiting = (): void => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('Service Worker: Skip waiting triggered');
    }
  };

  // Initialize service worker
  if (typeof window !== 'undefined') {
    register();
  }

  return {
    isSupported: isSupported(),
    isRegistered: !!registration,
    isControlling: !!navigator.serviceWorker?.controller,
    updateAvailable: false, // This would be updated via event listeners
    checkForUpdates,
    skipWaiting
  };
};

/**
 * Online/Offline Status Management
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      setIsOnline(false);
    };

    const handleConnectivityRestored = () => {
      console.log('Network: Connectivity restored via service worker');
      setIsOnline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connectivity-restored', handleConnectivityRestored);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectivity-restored', handleConnectivityRestored);
    };
  }, []);

  return { isOnline };
};

/**
 * PWA Update Notification Hook
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
    applyUpdate
  };
};
