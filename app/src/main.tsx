import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SiteImagesProvider } from './content/SiteImagesContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteImagesProvider>
        <App />
      </SiteImagesProvider>
    </BrowserRouter>
  </StrictMode>,
)
