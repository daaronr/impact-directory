import React from 'react'
import { useParams, Link } from 'react-router-dom'
import Seo from '../components/Seo'
import ClaimBlock from '../components/ClaimBlock'
import OfferingCard from '../components/OfferingCard'
import Disclaimer from '../components/Disclaimer'

const ORG_TYPE_LABELS = {
  company: 'Company',
  nonprofit: 'Nonprofit',
  cooperative: 'Cooperative',
  foundation: 'Foundation',
  other: 'Other',
}

export default function OrgDetail({ data }) {
  const { slug } = useParams()
  const { organizations = [], offerings = [], claims = [], sources = [] } = data || {}

  const org = organizations.find(o => o.slug === slug)

  if (!org) {
    return (
      <div className="panel-card p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Organization not found</h1>
        <Link to="/" className="text-[#1D5FA6] hover:underline">Back to home</Link>
      </div>
    )
  }

  const orgOfferings = offerings.filter(o => o.org_id === org.id)
  const orgClaims = claims.filter(c => c.org_id === org.id)
  const orgSources = sources.filter(s => org.source_ids?.includes(s.id))

  return (
    <div>
      <Seo
        title={org.name}
        description={`${org.name}: ${(org.description || '').slice(0, 150)}`.trim()}
        path={`/org/${org.slug}`}
      />
      <Disclaimer />

      <div className="mt-6 mb-2">
        <Link to="/" className="text-xs font-mono text-gray-400 hover:text-[#1D5FA6] uppercase tracking-wider">
          Home
        </Link>
        <span className="text-gray-300 mx-2">/</span>
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{org.name}</span>
      </div>

      <div className="panel-card p-8 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Organization</div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{org.name}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="badge text-xs font-mono px-2 py-0.5 border border-[#D0D9E4] uppercase tracking-wider text-gray-500">
                {ORG_TYPE_LABELS[org.org_type] || org.org_type}
              </span>
              {org.country && (
                <span className="badge text-xs font-mono px-2 py-0.5 border border-[#D0D9E4] uppercase tracking-wider text-gray-500">
                  {org.country}
                </span>
              )}
              {org.verified && (
                <span className="badge badge-exact text-xs font-mono px-2 py-0.5">Verified</span>
              )}
            </div>
          </div>
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs whitespace-nowrap"
            >
              Visit website
            </a>
          )}
        </div>

        <p className="text-base leading-relaxed text-gray-700 mb-4">{org.description}</p>

        {org.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {org.tags.map(tag => (
              <span key={tag} className="text-xs font-mono bg-[#F4F6F8] border border-[#D0D9E4] px-2 py-0.5 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {orgSources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#D0D9E4]">
            <p className="section-label mb-1">Data sources</p>
            <div className="flex flex-wrap gap-3">
              {orgSources.map(s => (
                s.url ? (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#1D5FA6] hover:underline"
                  >
                    {s.name}
                  </a>
                ) : (
                  <span key={s.id} className="text-xs font-mono text-gray-500">
                    {s.name}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Claims */}
      {orgClaims.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Impact claims ({orgClaims.length})
          </h2>
          {orgClaims.map(claim => (
            <ClaimBlock key={claim.id} claim={claim} sources={sources} />
          ))}
        </section>
      )}

      {/* Offerings */}
      {orgOfferings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Offerings ({orgOfferings.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgOfferings.map(offering => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                org={org}
                claims={claims}
              />
            ))}
          </div>
        </section>
      )}

      <div className="panel-card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
        Listing this organization is not an endorsement. Always verify claims independently
        before making purchasing or donation decisions.
      </div>

      <div className="mt-8 pt-6 border-t border-[#D0D9E4]">
        <p className="text-xs font-mono text-gray-400">
          Something incorrect?{' '}
          <Link to={`/feedback?about=${org.slug}`} className="underline hover:text-[#1D5FA6]">
            Report an inaccuracy
          </Link>
        </p>
      </div>
    </div>
  )
}
