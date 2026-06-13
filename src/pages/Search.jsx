import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import OfferingCard from '../components/OfferingCard'
import OrgCard from '../components/OrgCard'
import { buildSearchIndex, search, applyFilters, applyOrgFilters } from '../utils/search'

const DEFAULT_FILTERS = {
  impactScope: [],
  sources: [],
  type: [],
  minDonationPct: 0,
  exactness: [],
  confidence: 'all',
  commitmentTier: 'moderate',  // hides "minimal" (1%FP) by default; user can reveal with "All levels"
}

function parseArray(params, key) {
  const val = params.get(key)
  if (!val) return []
  return val.split(',').filter(Boolean)
}

function filtersFromParams(params) {
  return {
    impactScope: parseArray(params, 'scope'),
    sources: parseArray(params, 'src'),
    type: parseArray(params, 'type'),
    minDonationPct: Number(params.get('pct') || 0),
    exactness: parseArray(params, 'exactness'),
    confidence: params.get('confidence') || 'all',
    commitmentTier: params.get('tier') || 'moderate',
  }
}

function hasActiveFilters(filters) {
  return (
    filters.impactScope.length > 0 ||
    filters.sources.length > 0 ||
    filters.type.length > 0 ||
    filters.minDonationPct > 0 ||
    filters.exactness.length > 0 ||
    filters.confidence !== 'all' ||
    filters.commitmentTier !== 'moderate'  // moderate is the default; flag other values as "active"
  )
}

const FEATURED_PRODUCT_SLUGS = [
  'awesome-socks-club-subscription',
  'who-gives-a-crap-toilet-paper',
  'newmans-own-foods',
  'patagonia-apparel',
  'awesome-coffee-club-subscription',
  'divine-chocolate-bars',
]

const FEATURED_SERVICE_SLUGS = [
  'humanitix-event-ticketing',
  'waking-up-app',
]

const SERVICE_TYPES = new Set(['service', 'platform'])
// 'company' and 'nonprofit' offerings are org-level pledge records; shown via Orgs tab, not Products
const PRODUCT_TYPES = new Set(['product', 'product_family', 'bundle'])

// Quick type-mode toggle — stored in URL as ?mode=products|services|all
function modeFromParams(params) {
  const v = params.get('mode')
  return v === 'products' || v === 'services' || v === 'orgs' ? v : 'all'
}

const COMMITMENT_TIER_OPTS = [
  { value: 'moderate', label: 'Moderate or better (default)' },
  { value: 'substantial', label: 'Substantial only' },
  { value: 'all', label: 'All levels (incl. 1% for the Planet)' },
]

export default function Search({ data }) {
  const loading = !data
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const mode = modeFromParams(searchParams)
  const browseAll = searchParams.get('all') === '1'

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams))

  // Sync filters back to URL params
  const updateFilters = (newFilters) => {
    setFilters(newFilters)
    setSearchParams(params => {
      if (newFilters.impactScope.length > 0) params.set('scope', newFilters.impactScope.join(','))
      else params.delete('scope')
      if (newFilters.sources.length > 0) params.set('src', newFilters.sources.join(','))
      else params.delete('src')
      if (newFilters.type.length > 0) params.set('type', newFilters.type.join(','))
      else params.delete('type')
      if (newFilters.minDonationPct > 0) params.set('pct', String(newFilters.minDonationPct))
      else params.delete('pct')
      if (newFilters.exactness.length > 0) params.set('exactness', newFilters.exactness.join(','))
      else params.delete('exactness')
      if (newFilters.confidence !== 'all') params.set('confidence', newFilters.confidence)
      else params.delete('confidence')
      if (newFilters.commitmentTier !== 'all') params.set('tier', newFilters.commitmentTier)
      else params.delete('tier')
      return params
    })
  }

  const clearFilters = () => {
    updateFilters({ ...DEFAULT_FILTERS })
    setSearchParams(p => { p.delete('all'); return p })
  }

  const setMode = (m) => {
    setSearchParams(params => {
      if (m === 'all') params.delete('mode')
      else params.set('mode', m)
      return params
    })
  }

  const { organizations = [], offerings = [], claims = [], sources = [], meta = {} } = data || {}

  // Build unified search index
  const searchIndex = useMemo(() => {
    if (!data) return null
    return buildSearchIndex(data)
  }, [data])

  const { offeringResults, orgResults, featuredProducts, featuredServices } = useMemo(() => {
    if (!data) return { offeringResults: [], orgResults: [], featuredProducts: [], featuredServices: [] }

    const showFeatured = !q && !hasActiveFilters(filters) && mode === 'all' && !browseAll

    if (showFeatured) {
      const fp = FEATURED_PRODUCT_SLUGS.map(slug => offerings.find(o => o.slug === slug)).filter(Boolean)
      const fs = FEATURED_SERVICE_SLUGS.map(slug => offerings.find(o => o.slug === slug)).filter(Boolean)
      return { offeringResults: [], orgResults: [], featuredProducts: fp, featuredServices: fs }
    }

    let rawOfferings, rawOrgs

    if (q && searchIndex) {
      const results = search(searchIndex, q)
      rawOfferings = results.filter(r => r.type === 'offering').map(r => r.item)
      rawOrgs = results.filter(r => r.type === 'organization').map(r => r.item)
    } else {
      rawOfferings = [...offerings]
      rawOrgs = [...organizations]
    }

    rawOfferings = applyFilters(rawOfferings, claims, filters, organizations)
    rawOrgs = applyOrgFilters(rawOrgs, claims, filters)

    // Mode filter overrides type filter for products/services/orgs split
    if (mode === 'products') {
      rawOfferings = rawOfferings.filter(o => PRODUCT_TYPES.has(o.offering_type))
      rawOrgs = []
    } else if (mode === 'services') {
      rawOfferings = rawOfferings.filter(o => SERVICE_TYPES.has(o.offering_type))
      rawOrgs = []
    } else if (mode === 'orgs') {
      rawOfferings = []
    } else if (filters.type.length > 0) {
      rawOrgs = []
      rawOfferings = rawOfferings.filter(o => filters.type.includes(o.offering_type))
    }

    return { offeringResults: rawOfferings, orgResults: rawOrgs, featuredProducts: [], featuredServices: [] }
  }, [q, filters, mode, offerings, organizations, claims, searchIndex, data])

  const showFeatured = !q && !hasActiveFilters(filters) && mode === 'all' && !browseAll

  // Split non-featured results into products vs services; company/nonprofit offering types
  // are org-level pledge records and don't render under Products — they appear via Orgs tab
  const serviceResults = offeringResults.filter(o => SERVICE_TYPES.has(o.offering_type))
  const productResults = offeringResults.filter(o => PRODUCT_TYPES.has(o.offering_type))
  const totalResults = productResults.length + serviceResults.length + orgResults.length

  const handleSearch = (val) => {
    setSearchParams(params => {
      if (val) params.set('q', val)
      else params.delete('q')
      return params
    })
  }

  if (loading) {
    return (
      <div className="panel-card p-12 text-center">
        <p className="text-gray-500 font-mono text-sm">Loading directory data...</p>
      </div>
    )
  }

  const productCount = offerings.filter(o => PRODUCT_TYPES.has(o.offering_type)).length
  const serviceCount = offerings.filter(o => SERVICE_TYPES.has(o.offering_type)).length

  return (
    <div>
      <div className="panel-card p-6 mb-4 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Search</div>
        <SearchBar initialValue={q} onSearch={handleSearch} />
        <div className="mt-3 pt-3 border-t border-[#E8EDF2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="section-label">Commitment level</span>
            <select
              value={filters.commitmentTier}
              onChange={e => updateFilters({ ...filters, commitmentTier: e.target.value })}
              className="border border-[#D0D9E4] px-2 py-1 text-sm font-mono bg-white"
            >
              {COMMITMENT_TIER_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {showFeatured && (
            <button
              onClick={() => setSearchParams(p => { p.set('all', '1'); return p })}
              className="text-xs font-mono text-[#1D5FA6] hover:underline"
            >
              Browse all {offerings.length + organizations.length} entries &rarr;
            </button>
          )}
          {!showFeatured && !q && (
            <span className="text-xs font-mono text-gray-400">
              <span className="text-[#1D5FA6] font-semibold">{totalResults}</span> entries match current filters
            </span>
          )}
          {!showFeatured && q && (
            <span className="text-xs font-mono text-gray-400">
              <span className="text-[#1D5FA6] font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            </span>
          )}
        </div>
      </div>

      {/* Products / Services / Orgs toggle */}
      <div className="flex flex-wrap gap-1 mb-4">
        {[
          { key: 'all', label: `All (${offerings.length + organizations.length})` },
          { key: 'products', label: `Products (${productCount})` },
          { key: 'services', label: `Services (${serviceCount})` },
          { key: 'orgs', label: `Organizations (${organizations.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 border transition-all ${
              mode === key
                ? key === 'services'
                  ? 'bg-[#5B21B6] text-white border-[#5B21B6]'
                  : 'bg-[#1A2332] text-white border-[#1A2332]'
                : 'bg-white text-gray-600 border-[#D0D9E4] hover:border-[#1A2332]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showFeatured && (
        <div className="bg-[#F4F6F8] border border-[#D0D9E4] px-4 py-2.5 mb-4 text-sm text-gray-600 flex flex-wrap items-center justify-between gap-3">
          <span>
            Showing <strong>featured</strong> entries &mdash;{' '}
            <span className="text-[#1D5FA6] font-semibold">{productCount}</span> products and{' '}
            <span className="text-[#5B21B6] font-semibold">{serviceCount}</span> services indexed across{' '}
            <span className="text-[#1D5FA6] font-semibold">{organizations.length}</span> organisations.
          </span>
          <button
            onClick={() => setSearchParams(p => { p.set('all', '1'); return p })}
            className="font-mono text-xs text-[#1D5FA6] hover:underline whitespace-nowrap"
          >
            Browse all entries &rarr;
          </button>
        </div>
      )}

      <FilterPanel filters={filters} onChange={updateFilters} onClear={clearFilters} sources={sources} />

      {/* Annotation prompt */}
      <div className="bg-[#E8F0FB] border border-[#1D5FA6] border-opacity-30 px-4 py-3 mb-4 text-sm text-gray-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>See an error or missing entry?</strong> Highlight any text and annotate using the Hypothes.is sidebar (the arrow tab on the right edge of your screen) — corrections are reviewed and applied within a few days.
        </span>
        <Link to="/feedback" className="font-mono text-xs text-[#1D5FA6] hover:underline uppercase tracking-wider whitespace-nowrap">
          Feedback form
        </Link>
      </div>

      {!showFeatured && (
        <div className="text-sm font-mono text-gray-500 mb-4">
          {q ? (
            <>
              <span className="text-[#1D5FA6] font-semibold">{totalResults}</span>
              {' '}result{totalResults !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            </>
          ) : (
            <>Showing all <span className="text-[#1D5FA6] font-semibold">{totalResults}</span> entries</>
          )}
        </div>
      )}

      {/* Org results */}
      {orgResults.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
            Organizations ({orgResults.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgResults.map(org => {
              const orgOfferings = offerings.filter(o => o.org_id === org.id)
              const orgClaims = claims.filter(c => c.org_id === org.id)
              return (
                <OrgCard key={org.id} org={org} offeringCount={orgOfferings.length} claimCount={orgClaims.length} />
              )
            })}
          </div>
        </section>
      )}

      {/* Featured view: separate Products and Services */}
      {showFeatured && (
        <>
          {featuredProducts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
                Featured Products
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredProducts.map(offering => {
                  const org = organizations.find(o => o.id === offering.org_id)
                  return <OfferingCard key={offering.id} offering={offering} org={org} claims={claims} />
                })}
              </div>
            </section>
          )}
          {featuredServices.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-mono uppercase tracking-wider text-[#5B21B6] mb-3">
                Featured Services
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredServices.map(offering => {
                  const org = organizations.find(o => o.id === offering.org_id)
                  return <OfferingCard key={offering.id} offering={offering} org={org} claims={claims} />
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Search/filter results: split products + services */}
      {!showFeatured && (
        <>
          {productResults.length > 0 && mode !== 'services' && (
            <section className="mb-8">
              <h2 className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
                Products ({productResults.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productResults.map(offering => {
                  const org = organizations.find(o => o.id === offering.org_id)
                  return <OfferingCard key={offering.id} offering={offering} org={org} claims={claims} />
                })}
              </div>
            </section>
          )}

          {serviceResults.length > 0 && mode !== 'products' && (
            <section className="mb-8">
              <h2 className="text-sm font-mono uppercase tracking-wider text-[#5B21B6] mb-3">
                Services ({serviceResults.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceResults.map(offering => {
                  const org = organizations.find(o => o.id === offering.org_id)
                  return <OfferingCard key={offering.id} offering={offering} org={org} claims={claims} />
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Data coverage footer */}
      <div className="mt-8 pt-4 border-t border-[#D0D9E4] text-xs font-mono text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          {sources.length} source{sources.length !== 1 ? 's' : ''} indexed
          &nbsp;&middot;&nbsp;
          {organizations.length} organisations
          &nbsp;&middot;&nbsp;
          Last updated: {meta.generated_at || 'unknown'}
        </span>
        <Link to="/sources" className="text-[#1D5FA6] hover:underline">
          View coverage roadmap
        </Link>
      </div>

      {totalResults === 0 && !showFeatured && (
        <div className="panel-card p-8 text-center">
          <h3 className="text-lg font-semibold mb-2 text-[#1A2332]">No results found</h3>
          {q ? (
            <p className="text-gray-600 mb-4 text-sm">
              No matches for &ldquo;{q}&rdquo;. Try a broader search term, or clear filters.
            </p>
          ) : (
            <p className="text-gray-600 mb-4 text-sm">
              No entries match the current filters.
            </p>
          )}
          <div className="flex gap-3 justify-center">
            {q && (
              <button onClick={() => handleSearch('')} className="btn-secondary">Clear search</button>
            )}
            {hasActiveFilters(filters) && (
              <button onClick={clearFilters} className="btn-secondary">Clear filters</button>
            )}
            {mode !== 'all' && (
              <button onClick={() => setMode('all')} className="btn-secondary">Show all types</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
