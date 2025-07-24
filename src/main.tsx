import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SimpleMobileApp from './components/SimpleMobileApp';
import { ThemeProvider } from './utils/themeContext';
import { HapticFeedbackProvider } from './utils/hapticContext';
import ErrorBoundary from './ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <HapticFeedbackProvider>
          <SimpleMobileApp />
        </HapticFeedbackProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
