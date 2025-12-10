/**
 * Enhanced PWA Service Worker Manager
 * 
 * Provides intelligent service worker management with update notifications,
 * cache optimization, and offline status monitoring for better PWA experience.
 */

import React from 'react';
import { safeTelemetry } from './buildOptimizations';

interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration?: ServiceWorkerRegistration;
  lastUpdate?: Date;
}

class EnhancedPWAManager {
  private state: ServiceWorkerState = {
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
  };

  private listeners: Set<(state: ServiceWorkerState) => void> = new Set();
  private updateCheckInterval?: number;

  constructor() {
    this.initializeNetworkListeners();
    this.checkServiceWorkerSupport();
  }

  // Initialize network status monitoring
  private initializeNetworkListeners() {
    window.addEventListener('online', () => {
      this.updateState({ isOffline: false });
      safeTelemetry.trackEvent('pwa-online');
      this.checkForUpdates();
    });

    window.addEventListener('offline', () => {
      this.updateState({ isOffline: true });
      safeTelemetry.trackEvent('pwa-offline');
    });
  }

  // Check if service workers are supported
  private checkServiceWorkerSupport(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Register service worker with enhanced error handling
  async registerServiceWorker(swPath: string = '/sw.js'): Promise<boolean> {
    if (!this.checkServiceWorkerSupport()) return false;

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      
      this.updateState({ 
        isRegistered: true, 
        registration,
        lastUpdate: new Date()
      });

      safeTelemetry.trackEvent('pwa-sw-registered');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound(registration);
      });

      // Check for updates every 30 minutes
      this.updateCheckInterval = window.setInterval(() => {
        this.checkForUpdates();
      }, 30 * 60 * 1000);

      return true;
    } catch (error) {
      safeTelemetry.trackEvent('pwa-sw-error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // Handle service worker updates
  private handleUpdateFound(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New update available
        this.updateState({ isUpdateAvailable: true });
        safeTelemetry.trackEvent('pwa-update-available');
      }
    });
  }

  // Apply pending service worker update
  async applyUpdate(): Promise<boolean> {
    if (!this.state.registration) return false;

    try {
      await this.state.registration.update();
      
      // Reload to activate new service worker
      if (this.state.isUpdateAvailable) {
        window.location.reload();
        return true;
      }
    } catch (error) {
      safeTelemetry.trackEvent('pwa-update-error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return false;
  }

  // Check for service worker updates manually
  async checkForUpdates(): Promise<void> {
    if (this.state.registration) {
      try {
        await this.state.registration.update();
        this.updateState({ lastUpdate: new Date() });
      } catch {
        // Silently handle update check failures
      }
    }
  }

  // Get cache storage statistics
  async getCacheStats(): Promise<{ size: number; entries: number; } | null> {
    if (!('caches' in window)) return null;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalEntries = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        totalEntries += keys.length;

        // Estimate size (rough approximation)
        totalSize += keys.length * 1024; // Assume 1KB average per entry
      }

      return { size: totalSize, entries: totalEntries };
    } catch {
      return null;
    }
  }

  // Clear all caches
  async clearCaches(): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      safeTelemetry.trackEvent('pwa-cache-cleared');
      return true;
    } catch {
      return false;
    }
  }

  // Add state change listener
  addStateListener(listener: (state: ServiceWorkerState) => void) {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
  }

  // Remove state change listener
  removeStateListener(listener: (state: ServiceWorkerState) => void) {
    this.listeners.delete(listener);
  }

  // Update state and notify listeners
  private updateState(changes: Partial<ServiceWorkerState>) {
    this.state = { ...this.state, ...changes };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Get current state
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  // Cleanup resources
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const pwaManager = new EnhancedPWAManager();

// React hook for PWA state
export const usePWAState = () => {
  const [state, setState] = React.useState(pwaManager.getState());
  
  React.useEffect(() => {
    const handleStateChange = (newState: ServiceWorkerState) => {
      setState(newState);
    };

    pwaManager.addStateListener(handleStateChange);
    return () => pwaManager.removeStateListener(handleStateChange);
  }, []);

  return state;
};

// Export types
export type { ServiceWorkerState };