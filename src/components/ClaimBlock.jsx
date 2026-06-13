import React from 'react'
import { Link } from 'react-router-dom'

function confidenceLabel(score) {
  if (score >= 0.9) return { label: 'High confidence', cls: 'badge-high-confidence' }
  if (score >= 0.7) return { label: 'Medium confidence', cls: 'badge-medium-confidence' }
  return { label: 'Low confidence', cls: 'badge-low-confidence' }
}

function riskLabel(level) {
  const map = {
    low: { label: 'Low risk', cls: 'text-green-700 bg-green-50 border-green-300' },
    medium: { label: 'Medium risk', cls: 'text-amber-700 bg-amber-50 border-amber-300' },
    high: { label: 'High risk', cls: 'text-red-700 bg-red-50 border-red-300' },
  }
  return map[level] || map.medium
}

function claimTypeLabel(type) {
  const map = {
    donation_percentage: 'Donation %',
    ownership: 'Ownership structure',
    product_donation: 'Product donation',
    pro_bono: 'Pro bono / free service',
    revenue_pledge: 'Revenue pledge',
    pledge: 'Pledge',
    certification: 'Certification',
    policy: 'Policy',
  }
  return map[type] || type
}

export default function ClaimBlock({ claim, sources = [] }) {
  const conf = confidenceLabel(claim.confidence)
  const risk = riskLabel(claim.risk_level)
  const source = sources.find(s => s.id === claim.source_id)

  const validFrom = claim.valid_from ? new Date(claim.valid_from).getFullYear() : null
  const validUntil = claim.valid_until ? new Date(claim.valid_until).getFullYear() : null

  return (
    <div className="border border-[#D0D9E4] bg-white p-4 mb-3">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <span className="badge text-xs font-mono px-2 py-0.5 border border-[#D0D9E4] uppercase tracking-wider text-gray-500">
          {claimTypeLabel(claim.claim_type)}
        </span>
        <span className={`badge text-xs font-mono px-2 py-0.5 border uppercase tracking-wider ${risk.cls}`}>
          {risk.label}
        </span>
        {claim.cause_area && (
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            {claim.cause_area}
          </span>
        )}
        {claim.beneficiary && (
          <span className="text-xs text-gray-500 italic">
            &rarr; {claim.beneficiary}
          </span>
        )}
      </div>

      <blockquote className="claim-blockquote">
        {claim.claim_text}
      </blockquote>

      <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-gray-500">
        <span className={conf.cls}>{conf.label}</span>
        {source && (
          <span>
            Source:{' '}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer"
                 className="underline hover:text-[#1D5FA6]">
                {source.name}
              </a>
            ) : (
              <span>{source.name}</span>
            )}
          </span>
        )}
        {validFrom && (
          <span>
            Valid: {validFrom}{validUntil ? `\u2013${validUntil}` : '+'}
          </span>
        )}
        <Link
          to={`/feedback?claim=${claim.id}&about=${claim.org_id}`}
          className="ml-auto text-gray-400 hover:text-[#1D5FA6] underline"
        >
          Dispute
        </Link>
      </div>
    </div>
  )
}
