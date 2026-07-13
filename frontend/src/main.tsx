import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter: URL'yi izleyip doğru sayfayı gösteren kök bileşen */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
