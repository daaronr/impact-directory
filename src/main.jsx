import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// Keep build-time content visible while the catalogue loads. A single fetch
// supplies React; successful startup never flashes an empty loading screen.
function mount(initialData, initialError = null) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App initialData={initialData} initialError={initialError} />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>,
  )
}
fetch('/data/all_data.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load data')
    return response.json()
  })
  .then(data => mount(data))
  .catch(error => mount(null, error.message))
