import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Shim window.storage → localStorage so the app works in the browser
;(window as any).storage = {
  get: (key: string) => {
    const v = localStorage.getItem(key)
    return Promise.resolve(v ? { value: v } : null)
  },
  set: (key: string, value: string) => {
    localStorage.setItem(key, value)
    return Promise.resolve()
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
