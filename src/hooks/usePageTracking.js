import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Fires a Cloudflare Web Analytics page_view beacon on every route change.
 * The Cloudflare beacon script auto-detects History API navigation, but this
 * hook provides an explicit fallback for React Router's client-side routing.
 *
 * No-op when VITE_CF_ANALYTICS_TOKEN is not set (local dev / preview deploys).
 */
export function usePageTracking() {
  const location = useLocation()
  useEffect(() => {
    if (window.cfBotManData || window.__cfBeacon) {
      // Cloudflare beacon is active — it handles navigation automatically
      return
    }
    // Fallback: if beacon loaded, trigger it manually
    if (typeof window.cf !== 'undefined' && typeof window.cf.beacon === 'function') {
      window.cf.beacon({ type: 'page_view', path: location.pathname })
    }
  }, [location.pathname])
}
