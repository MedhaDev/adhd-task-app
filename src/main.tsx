import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/fonts'
import './index.css'
import { applyVibe, readStoredVibe } from './theme/vibe'
import App from './App.tsx'

// Paint the remembered vibe before the first render, so there's no flash.
applyVibe(readStoredVibe())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
