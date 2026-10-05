import { useEffect } from 'react'

// Fixed aggregate labels only. No query, item URL, IDs, body or cookies.
const LABELS = new Set(['search_submit', 'filter_change', 'organization_open',
  'offering_open', 'website_open', 'evidence_open'])

export function useInteractionTracking() {
  useEffect(() => {
    let engaged = false
    const send = (label, first) => {
      fetch('/__engagement/action/' + label + (first ? '?engaged=1' : ''), {
        method: 'POST', credentials: 'omit', referrer: '', referrerPolicy: 'strict-origin', keepalive: true,
      }).catch(() => {})
    }
    const record = (label, event) => {
      if (!event.isTrusted || !LABELS.has(label) || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return
      const first = !engaged
      engaged = true
      send(label, first)
    }
    const click = event => {
      if (event.type === 'auxclick' && event.button !== 1) return
      const target = event.target.closest?.('[data-engagement]')
      if (target) record(target.dataset.engagement, event)
    }
    const submit = event => {
      if (event.target.matches?.('form[data-engagement-search]')) record('search_submit', event)
    }
    const change = event => {
      if (event.target.closest?.('[data-engagement-filter]')) record('filter_change', event)
    }
    document.addEventListener('click', click)
    document.addEventListener('auxclick', click)
    document.addEventListener('submit', submit)
    document.addEventListener('change', change)
    return () => {
      document.removeEventListener('click', click)
      document.removeEventListener('auxclick', click)
      document.removeEventListener('submit', submit)
      document.removeEventListener('change', change)
    }
  }, [])
}
