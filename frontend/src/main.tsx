import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './styles/main.css'

// Prevent broken-image icons on legacy views without substituting fake photographs.
document.addEventListener('error', event => {
  const image = event.target
  if (image instanceof HTMLImageElement) {
    image.removeAttribute('src')
    image.style.visibility = 'hidden'
    event.stopPropagation()
  }
}, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></StrictMode>
)
