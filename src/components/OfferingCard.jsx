import React from 'react'
import { Link } from 'react-router-dom'

function exactnessBadgeClass(exactness) {
  if (exactness === 'exact') return 'badge-exact'
  if (exactness === 'collection') return 'badge-collection'
  return 'badge-inferred'
}

function topClaim(claims) {
  if (!claims || claims.length === 0) return null
  const sorted = [...claims].sort((a, b) => b.confidence - a.confidence)
  return sorted[0]
}

const CONFIDENCE_LABEL = c =>
  c >= 0.9 ? 'High confidence' : c >= 0.7 ? 'Medium confidence' : 'Low confidence'

export default function OfferingCard({ offering, org, claims = [] }) {
  const isService = offering.offering_type === 'service' || offering.offering_type === 'platform'
  const offeringClaims = claims.filter(c => c.offering_id === offering.id)
  const relevantClaims = offeringClaims.length > 0
    ? offeringClaims
    : claims.filter(c => c.org_id === offering.org_id && !c.offering_id)
  const claim = topClaim(relevantClaims)
  const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '\u2026' : str

  return (
    <div className={`${isService ? 'service-card' : 'result-card'} h-full flex flex-col`}>
      <Link to={`/offering/${offering.slug}`} className="block p-4 flex-1 no-underline">

        {/* Service type indicator */}
        {isService && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="badge badge-service text-xs">Service</span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              {offering.category}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#1A2332] leading-snug text-sm">
            {offering.name}
          </h3>
          <span className={`badge flex-shrink-0 ${exactnessBadgeClass(offering.exactness)}`}>
            {offering.exactness}
          </span>
        </div>

        {org && (
          <p className={`text-xs font-mono mb-2 uppercase tracking-wider ${isService ? 'text-[#5B21B6]' : 'text-[#1D5FA6]'}`}>
            {org.name}
          </p>
        )}

        {!isService && (
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
            {offering.category}
          </p>
        )}

        {claim && (
          <p className={`text-sm text-gray-700 leading-relaxed mb-2 italic border-l-2 pl-2 ${isService ? 'border-[#5B21B6]' : 'border-[#1D5FA6]'}`}>
            {truncate(claim.claim_text, 120)}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {offering.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs font-mono bg-[#F4F6F8] border border-[#D0D9E4] px-1.5 py-0.5 text-gray-500">
              {tag}
            </span>
          ))}
          {claim && (
            <span className="text-xs font-mono text-gray-400 ml-auto">
              {CONFIDENCE_LABEL(claim.confidence)}
            </span>
          )}
        </div>
      </Link>

      {org?.website && (
        <a
          href={org.website}
          target="_blank"
          rel="noopener noreferrer"
          className={`block py-3 text-center text-xs font-mono uppercase tracking-wider text-white transition-colors ${
            isService
              ? 'bg-[#5B21B6] hover:bg-[#7C3AED]'
              : 'bg-[#1A2332] hover:bg-[#1D5FA6]'
          }`}
        >
          {isService ? 'Visit \u2192' : 'Shop \u2192'}
        </a>
      )}
    </div>
  )
}
