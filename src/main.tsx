import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './utils/themeContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  </React.StrictMode>,
)
