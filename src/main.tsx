import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { startTheme } from './theme/theme'
import App from './App.tsx'

// Paint paper or carbon (following the device) before the first render.
startTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
