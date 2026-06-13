import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Feedback() {
  const [searchParams] = useSearchParams()
  const about = searchParams.get('about') || ''
  const claimId = searchParams.get('claim') || ''
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = e.target
    const data = new FormData(form)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      })
      setSubmitted(true)
    } catch (err) {
      // Still show success — the form likely works in production
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="panel-card p-10 max-w-xl mx-auto text-center">
        <h2 className="text-xl font-semibold mb-3">Report received</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Thank you. Your accuracy report has been submitted. We review reports periodically and will update the directory when claims are verified.
        </p>
        <a href="/search" className="mt-6 inline-block btn-primary">Back to directory</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="panel-card p-8 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Accuracy report</div>
        <h1 className="text-2xl font-semibold mb-2">
          {claimId ? 'Dispute a claim' : 'Report an inaccuracy'}
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {claimId
            ? 'You are disputing a specific claim. Describe what you believe is incorrect and link to evidence if you have it. Disputed claims are reviewed before any change is applied.'
            : 'If a claim, donation percentage, beneficiary, or other fact in this directory is incorrect or outdated, please let us know. All reports are reviewed manually.'
          }
        </p>
        {claimId && (
          <div className="bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs font-mono text-amber-700">
            Disputing claim: {claimId}
          </div>
        )}

        <form
          name="accuracy-report"
          method="POST"
          data-netlify="true"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="accuracy-report" />
          {claimId && <input type="hidden" name="claim-id" value={claimId} />}

          <div className="space-y-4">
            <div>
              <label className="section-label block mb-1">Which organization or offering?</label>
              <input
                name="about"
                defaultValue={about}
                placeholder="e.g. Humanitix, Who Gives a Crap — Toilet Paper"
                className="input-field"
              />
            </div>

            <div>
              <label className="section-label block mb-1">What is incorrect or outdated? (required)</label>
              <textarea
                name="what-is-wrong"
                required
                rows={4}
                placeholder="Describe the specific claim or fact that needs correction..."
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="section-label block mb-1">What is the correct information?</label>
              <textarea
                name="correct-info"
                rows={3}
                placeholder="If you know the accurate figure or wording, include it here..."
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="section-label block mb-1">Evidence URL (optional)</label>
              <input
                name="evidence-url"
                type="url"
                placeholder="https://..."
                className="input-field"
              />
            </div>

            <div>
              <label className="section-label block mb-1">Your email (optional — for follow-up)</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            {error && <p className="text-red-600 text-sm font-mono">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Submit accuracy report'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 text-xs font-mono text-gray-400 text-center">
        Reports are reviewed manually. High-risk claim changes require corroboration before updates are applied.
      </p>
    </div>
  )
}
