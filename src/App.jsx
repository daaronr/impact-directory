import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { usePageTracking } from './hooks/usePageTracking'
import Header from './components/Header'
import Home from './pages/Home'
import Search from './pages/Search'
import OrgDetail from './pages/OrgDetail'
import OfferingDetail from './pages/OfferingDetail'
import About from './pages/About'
import Feedback from './pages/Feedback'
import Sources from './pages/Sources'
import FAQ from './pages/FAQ'

export default function App() {
  usePageTracking()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/data/all_data.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load data')
        return res.json()
      })
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D5FA6] mx-auto mb-4"></div>
          <p className="text-gray-500 font-mono uppercase tracking-wider text-xs">Loading directory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panel-card p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Unable to Load Directory</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home data={data} />} />
          <Route path="/search" element={<Search data={data} />} />
          <Route path="/org/:slug" element={<OrgDetail data={data} />} />
          <Route path="/offering/:slug" element={<OfferingDetail data={data} />} />
          <Route path="/about" element={<About />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/sources" element={<Sources data={data} />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>
    </div>
  )
}
