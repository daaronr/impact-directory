import React from 'react'
import { Link } from 'react-router-dom'

const ORG_TYPE_LABELS = {
  company: 'Company',
  nonprofit: 'Nonprofit',
  cooperative: 'Cooperative',
  foundation: 'Foundation',
  other: 'Other',
}

export default function OrgCard({ org, offeringCount = 0, claimCount = 0 }) {
  return (
    <div className="result-card h-full flex flex-col">
      <Link to={`/org/${org.slug}`} className="block p-4 flex-1 no-underline">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#1A2332] leading-snug">
            {org.name}
          </h3>
          {org.verified && (
            <span className="badge badge-exact flex-shrink-0 text-xs">Verified</span>
          )}
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="text-xs font-mono bg-[#F4F6F8] border border-[#D0D9E4] px-1.5 py-0.5 text-gray-500 uppercase">
            {ORG_TYPE_LABELS[org.org_type] || org.org_type}
          </span>
          {org.country && (
            <span className="text-xs font-mono bg-[#F4F6F8] border border-[#D0D9E4] px-1.5 py-0.5 text-gray-500">
              {org.country}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
          {org.description}
        </p>

        <div className="flex gap-4 text-xs font-mono text-gray-400 border-t border-[#D0D9E4] pt-2">
          <span>{offeringCount} offering{offeringCount !== 1 ? 's' : ''}</span>
          <span>{claimCount} claim{claimCount !== 1 ? 's' : ''}</span>
        </div>
      </Link>

      {org.website && (
        <a
          href={org.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-3 text-center text-xs font-mono uppercase tracking-wider text-white bg-[#1A2332] hover:bg-[#1D5FA6] transition-colors"
        >
          Visit website &#8594;
        </a>
      )}
    </div>
  )
}
