import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index-core.css'; // Use optimized core CSS instead of full index.css

// Phase 4A: Bundle Optimization Integration
import { bundleOptimizer } from './utils/bundleOptimizationClean';

// Dash0 Telemetry Initialization - Initialize early for complete app coverage
import { initializeDash0 } from './dash0/config/dash0ConfigReal';
import { initializeCSSOptimization } from './utils/cssOptimization';
import { initializePerformanceMonitoring } from './utils/enhancedPerformanceMonitoring';
import { initializeServiceWorkerEnhancements } from './utils/serviceWorkerEnhancements';

// Initialize Dash0 SDK before app starts
const dash0Result = initializeDash0();
if (dash0Result.enabled) {
  // eslint-disable-next-line no-console
  console.log('🔭 Dash0 telemetry activated for weather app');
} else {
  // eslint-disable-next-line no-console
  console.log('📊 Dash0 telemetry in fallback mode:', dash0Result.reason);
}

// Phase 4A: Initialize Bundle Optimization
bundleOptimizer.initializeBundleOptimization().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize bundle optimization:', error);
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        // eslint-disable-next-line no-console
        console.log(
          '🌤️ Weather App PWA: Service Worker registered successfully',
        );
        // eslint-disable-next-line no-console
        console.log('📱 PWA features now available:', {
          scope: registration.scope,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          active: !!registration.active,
        });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.warn('❌ Service Worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Initialize CSS optimization system
initializeCSSOptimization().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize CSS optimization:', error);
});

// Initialize enhanced service worker
initializeServiceWorkerEnhancements();

// Initialize performance monitoring
initializePerformanceMonitoring();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
