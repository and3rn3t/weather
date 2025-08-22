import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log(
          '🌤️ Weather App PWA: Service Worker registered successfully'
        );
        console.log('📱 PWA features now available:', {
          scope: registration.scope,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          active: !!registration.active,
        });
      })
      .catch(error => {
        console.warn('❌ Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
