import Fuse from 'fuse.js'

// Score cutoff for search results — Fuse.js weighted multi-key composite scores can exceed
// the internal threshold even when individual key matches are poor. Manually filter to this.
const SCORE_CUTOFF = 0.40

const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.28 },
    { name: 'description', weight: 0.19 },
    { name: 'tags', weight: 0.24 },      // boosted: tags are curated keywords, most reliable
    { name: 'org_name', weight: 0.20 },  // boosted: searching a company name should surface its products
    { name: 'category', weight: 0.06 },
    { name: 'cause_area', weight: 0.02 },
    { name: 'claim_text', weight: 0.01 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 3,  // require at least 3 chars to match — reduces "co" → "coffee" false triggers
  ignoreLocation: true,   // match anywhere in string, not just near position 0
}

/**
 * Build a unified Fuse.js search index from all_data collections.
 * Each document is either an offering (with parent org fields merged in)
 * or an organization, annotated with a `_type` field.
 */
export function buildSearchIndex(data) {
  const { organizations = [], offerings = [], claims = [] } = data

  const orgMap = {}
  for (const org of organizations) {
    orgMap[org.id] = org
  }

  // Build offering documents: merge in org fields + claim text + impact_scopes
  const offeringDocs = offerings.map(off => {
    const org = orgMap[off.org_id] || {}
    const offClaims = claims.filter(c => c.offering_id === off.id)
    const orgClaims = claims.filter(c => c.org_id === off.org_id && !c.offering_id)
    const allClaims = [...offClaims, ...orgClaims]
    return {
      ...off,
      _type: 'offering',
      org_name: org.name || '',
      org_country: org.country || '',
      cause_area: allClaims.map(c => c.cause_area).filter(Boolean).join(' '),
      claim_text: allClaims.map(c => c.claim_text).join(' '),
      impact_scopes: [...new Set(allClaims.map(c => c.impact_scope).filter(Boolean))],
      tags: [...new Set([...(off.tags || []), ...(org.tags || [])])],  // deduplicated
    }
  })

  // Build org documents: include org-level claim text + impact_scopes
  const orgDocs = organizations.map(org => {
    const orgClaims = claims.filter(c => c.org_id === org.id)
    return {
      ...org,
      _type: 'organization',
      cause_area: orgClaims.map(c => c.cause_area).filter(Boolean).join(' '),
      claim_text: orgClaims.map(c => c.claim_text).join(' '),
      impact_scopes: [...new Set(orgClaims.map(c => c.impact_scope).filter(Boolean))],
    }
  })

  const allDocs = [...offeringDocs, ...orgDocs]
  return new Fuse(allDocs, fuseOptions)
}

/**
 * Search the index and return typed results.
 * Returns array of { type, score, item } objects.
 */
export function search(index, query) {
  if (!query || !query.trim()) return []
  return index.search(query)
    .filter(r => r.score < SCORE_CUTOFF)
    .map(r => ({
      type: r.item._type,
      score: r.score,
      item: r.item,
    }))
}

// Impact scopes that count as "EA-aligned / high-impact"
const EA_SCOPES = new Set(['lmic', 'gwwc', 'animal', 'gcr'])

function matchesScope(itemScopes, selectedScopes) {
  if (!selectedScopes || selectedScopes.length === 0) return true
  return selectedScopes.some(sel => {
    if (sel === 'ea') return itemScopes.some(s => EA_SCOPES.has(s))
    if (sel === 'general') return itemScopes.some(s => s === 'domestic' || s === 'general')
    return itemScopes.includes(sel)
  })
}

// Org id → commitment_tier lookup used by offering filters
function buildTierMap(organizations) {
  const map = {}
  for (const org of organizations) {
    map[org.id] = org.commitment_tier || null
  }
  return map
}

function meetsTierFilter(tier, filterTier) {
  if (!filterTier || filterTier === 'all') return true
  // null-tier entries are always shown (they haven't been assessed, not excluded)
  if (!tier) return filterTier !== 'substantial'
  if (filterTier === 'moderate') return tier !== 'minimal'
  if (filterTier === 'substantial') return tier === 'substantial'
  return true
}

/**
 * Apply structured filters to a list of offerings.
 * Fuse.js handles text search; this handles structured filters.
 */
export function applyFilters(offerings, claims, filters, organizations = []) {
  const tierMap = buildTierMap(organizations)
  return offerings.filter(offering => {
    // Exactness filter (array)
    if (filters.exactness && filters.exactness.length > 0) {
      if (!filters.exactness.includes(offering.exactness)) return false
    }

    // Offering type filter (array) — handled in Search.jsx, skip here to avoid double-filtering
    // (Search.jsx applies type filter after this function)

    // Minimum donation % filter — check claims for this offering
    if (filters.minDonationPct > 0) {
      const offeringClaims = claims.filter(
        c => c.offering_id === offering.id || c.org_id === offering.org_id
      )
      const hasDonationClaim = offeringClaims.some(c => {
        if (c.claim_type !== 'donation_percentage') return false
        const pct = c.parsed_value?.percentage
        return typeof pct === 'number' && pct >= filters.minDonationPct
      })
      if (!hasDonationClaim) return false
    }

    // Confidence filter
    if (filters.confidence !== 'all') {
      const offeringClaims = claims.filter(
        c => c.offering_id === offering.id || c.org_id === offering.org_id
      )
      const maxConf = Math.max(...offeringClaims.map(c => c.confidence || 0), 0)
      if (filters.confidence === 'high' && maxConf < 0.9) return false
      if (filters.confidence === 'medium' && maxConf < 0.7) return false
    }

    // Sources filter (array): match if any claim source OR discovery source matches
    if (filters.sources && filters.sources.length > 0) {
      const offeringClaims = claims.filter(
        c => c.offering_id === offering.id || c.org_id === offering.org_id
      )
      const claimSourceMatch = offeringClaims.some(c => filters.sources.includes(c.source_id))
      const offeringSourceMatch = (offering.source_ids || []).some(s => filters.sources.includes(s))
      if (!claimSourceMatch && !offeringSourceMatch) return false
    }

    // Impact scope filter (array)
    if (filters.impactScope && filters.impactScope.length > 0) {
      const offeringClaims = claims.filter(
        c => c.offering_id === offering.id || c.org_id === offering.org_id
      )
      const scopes = [...new Set(offeringClaims.map(c => c.impact_scope).filter(Boolean))]
      if (!matchesScope(scopes, filters.impactScope)) return false
    }

    // Commitment tier filter (minimum tier)
    if (filters.commitmentTier && filters.commitmentTier !== 'all') {
      const tier = tierMap[offering.org_id] || null
      if (!meetsTierFilter(tier, filters.commitmentTier)) return false
    }

    return true
  })
}

/**
 * Apply filters to organizations.
 */
export function applyOrgFilters(organizations, claims, filters) {
  return organizations.filter(org => {
    // Minimum donation % filter
    if (filters.minDonationPct > 0) {
      const orgClaims = claims.filter(c => c.org_id === org.id)
      const hasDonationClaim = orgClaims.some(c => {
        if (c.claim_type !== 'donation_percentage') return false
        const pct = c.parsed_value?.percentage
        return typeof pct === 'number' && pct >= filters.minDonationPct
      })
      if (!hasDonationClaim) return false
    }

    // Confidence filter
    if (filters.confidence !== 'all') {
      const orgClaims = claims.filter(c => c.org_id === org.id)
      const maxConf = Math.max(...orgClaims.map(c => c.confidence || 0), 0)
      if (filters.confidence === 'high' && maxConf < 0.9) return false
      if (filters.confidence === 'medium' && maxConf < 0.7) return false
    }

    // Sources filter (array)
    if (filters.sources && filters.sources.length > 0) {
      const orgClaims = claims.filter(c => c.org_id === org.id)
      const hasMatchingSource = orgClaims.some(c => filters.sources.includes(c.source_id))
      if (!hasMatchingSource) return false
    }

    // Impact scope filter (array)
    if (filters.impactScope && filters.impactScope.length > 0) {
      const orgClaims = claims.filter(c => c.org_id === org.id)
      const scopes = [...new Set(orgClaims.map(c => c.impact_scope).filter(Boolean))]
      if (!matchesScope(scopes, filters.impactScope)) return false
    }

    // Commitment tier filter (minimum tier)
    if (filters.commitmentTier && filters.commitmentTier !== 'all') {
      if (!meetsTierFilter(org.commitment_tier || null, filters.commitmentTier)) return false
    }

    return true
  })
}
