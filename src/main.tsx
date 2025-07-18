import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './utils/themeContext';
import { HapticFeedbackProvider } from './utils/hapticContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HapticFeedbackProvider>
        <AppNavigator />
      </HapticFeedbackProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
