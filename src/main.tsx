import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppNavigator from './navigation/AppNavigator';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppNavigator />
  </React.StrictMode>,
)
