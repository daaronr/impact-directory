import React from 'react'
import { useParams, Link } from 'react-router-dom'
import Seo from '../components/Seo'
import ClaimBlock from '../components/ClaimBlock'
import Disclaimer from '../components/Disclaimer'

const EXACTNESS_EXPLANATIONS = {
  exact: 'This specific offering has a direct, explicit impact commitment — the claim applies precisely to this product or service.',
  collection: 'This is a product family or brand where the parent organization\'s commitment applies, but individual SKUs may vary.',
  inferred: 'The parent organization has a commitment that likely extends here, but this specific offering is not explicitly named in the claim.',
}

const OFFERING_TYPE_LABELS = {
  service: 'Service',
  product_family: 'Product family',
  product: 'Product',
  platform: 'Platform',
}

export default function OfferingDetail({ data }) {
  const { slug } = useParams()
  const { organizations = [], offerings = [], claims = [], sources = [] } = data || {}

  const offering = offerings.find(o => o.slug === slug)

  if (!offering) {
    return (
      <div className="panel-card p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Offering not found</h1>
        <Link to="/" className="text-[#1D5FA6] hover:underline">Back to home</Link>
      </div>
    )
  }

  const org = organizations.find(o => o.id === offering.org_id)
  const offeringClaims = claims.filter(c => c.offering_id === offering.id)
  const orgClaims = claims.filter(c => c.org_id === offering.org_id && !c.offering_id)

  const exactnessCls = offering.exactness === 'exact' ? 'badge-exact'
    : offering.exactness === 'collection' ? 'badge-collection'
    : 'badge-inferred'

  return (
    <div>
      <Seo
        title={org ? `${offering.name} — ${org.name}` : offering.name}
        description={`${offering.name}${org ? ` from ${org.name}` : ''}: impact commitment and verified claims.`}
        path={`/offering/${offering.slug}`}
      />
      <Disclaimer />

      <div className="mt-6 mb-2">
        <Link to="/" className="text-xs font-mono text-gray-400 hover:text-[#1D5FA6] uppercase tracking-wider">
          Home
        </Link>
        <span className="text-gray-300 mx-2">/</span>
        {org && (
          <>
            <Link to={`/org/${org.slug}`} className="text-xs font-mono text-gray-400 hover:text-[#1D5FA6] uppercase tracking-wider">
              {org.name}
            </Link>
            <span className="text-gray-300 mx-2">/</span>
          </>
        )}
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{offering.name}</span>
      </div>

      <div className="panel-card p-8 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Offering</div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{offering.name}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="badge text-xs font-mono px-2 py-0.5 border border-[#D0D9E4] uppercase tracking-wider text-gray-500">
                {OFFERING_TYPE_LABELS[offering.offering_type] || offering.offering_type}
              </span>
              <span className={`badge ${exactnessCls}`}>
                {offering.exactness}
              </span>
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                {offering.category}
              </span>
            </div>
          </div>
          {org?.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs whitespace-nowrap flex-shrink-0"
            >
              {offering.offering_type === 'service' || offering.offering_type === 'platform'
                ? 'Visit \u2192'
                : 'Shop \u2192'}
            </a>
          )}
        </div>

        {org && (
          <p className="text-sm font-mono text-[#1D5FA6] mb-3">
            <Link to={`/org/${org.slug}`} className="hover:underline">
              {org.name}
            </Link>
          </p>
        )}

        <p className="text-base leading-relaxed text-gray-700 mb-4">{offering.description}</p>

        {offering.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {offering.tags.map(tag => (
              <span key={tag} className="text-xs font-mono bg-[#F4F6F8] border border-[#D0D9E4] px-2 py-0.5 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Exactness explanation */}
      <div className="panel-card p-4 mb-6 border-l-4 border-[#1D5FA6] bg-[#E8F0FB]">
        <p className="section-label mb-1">What does &ldquo;{offering.exactness}&rdquo; mean?</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {EXACTNESS_EXPLANATIONS[offering.exactness]}
        </p>
      </div>

      {/* Offering-specific claims */}
      {offeringClaims.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Claims for this offering ({offeringClaims.length})
          </h2>
          {offeringClaims.map(claim => (
            <ClaimBlock key={claim.id} claim={claim} sources={sources} />
          ))}
        </section>
      )}

      {/* Org-level claims */}
      {orgClaims.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-1">
            Organization-level claims
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            These claims apply to {org?.name} as a whole and may or may not cover this specific offering.
          </p>
          {orgClaims.map(claim => (
            <ClaimBlock key={claim.id} claim={claim} sources={sources} />
          ))}
        </section>
      )}

      <div className="panel-card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
        Listing this offering is not an endorsement. Always verify claims independently
        before making purchasing or donation decisions.
      </div>

      {/* Data provenance */}
      <div className="panel-card p-4 mt-4 mb-4">
        <p className="section-label mb-2">Data provenance</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-gray-500">
          {offering.added && (
            <span>Added: {offering.added}</span>
          )}
          {offering.updated && (
            <span>Last updated: {offering.updated}</span>
          )}
          {org && !org.verified && (
            <span className="text-amber-600">Self-reported — not independently verified</span>
          )}
          {org && org.verified && (
            <span className="text-green-700">Externally verified</span>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[#D0D9E4]">
        <p className="text-xs font-mono text-gray-400">
          Something incorrect?{' '}
          <Link to={`/feedback?about=${offering.slug}`} className="underline hover:text-[#1D5FA6]">
            Report an inaccuracy
          </Link>
        </p>
      </div>
    </div>
  )
}
