import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'

// ----- Static roadmap data -----

const ACTIVE_SOURCES = [
  {
    id: 'src-gwwc-company-pledge',
    name: 'GWWC Company Pledge',
    url: 'https://www.givingwhatwecan.org/get-involved/company-pledge',
    description: 'Companies that have pledged to donate at least 10% of net profits to highly effective charities via Giving What We Can.',
    method: 'Live API (Sanity CMS)',
    refreshCycle: 'Monthly',
    commitment_tier: 'substantial',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'src-profit-for-good-alliance',
    name: 'Profit for Good Alliance',
    url: 'https://profitforgood.com',
    description: 'Partners of the Profit for Good Alliance (founded by Peter Singer & Julia van Boven, June 2025). 2 founding partners (Rituals, Who Gives a Crap) plus 11 first members including Newman\'s Own, Humanitix, Albion East, and Postcode Loterij. All commit meaningful portions of profits to charity.',
    method: 'Homepage scraper (verified external links + hardcoded partner list)',
    refreshCycle: 'Monthly',
    commitment_tier: 'substantial',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'src-good-store',
    name: 'Good Store',
    url: 'https://good.store',
    description: 'Online shop selling products (Awesome Socks Club, Awesome Coffee Club) that donate 100% of profits to charity.',
    method: 'Shopify product API',
    refreshCycle: 'Weekly',
    commitment_tier: 'substantial',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'src-founders-pledge',
    name: 'Founders Pledge',
    url: 'https://founderspledge.com/members',
    description: 'Public Founders Pledge members — entrepreneurs who have committed to give a significant portion of their personal proceeds to highly effective charities. Note: this is a personal pledge by the founder, not a company-level commitment.',
    method: 'HTML scraper (public members page)',
    refreshCycle: 'Quarterly',
    commitment_tier: 'moderate',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'src-ea-services',
    name: 'EA Services Directory',
    url: 'https://ea-services.org',
    description: 'Service providers (consulting, coaching, legal, design, etc.) who work with EA organisations and are EA-aligned.',
    method: 'Static HTML scraper',
    refreshCycle: 'Quarterly',
    commitment_tier: 'moderate',
    lastCrawled: '2026-04-10',
  },
  {
    id: 'src-pledge-1pct',
    name: 'Pledge 1% — member showcase',
    url: 'https://www.pledge1percent.org/pledge-1-members/',
    description: '~1,841 companies in the Pledge 1% showcase. Members commit to give 1% of equity, product, and/or employee time for social impact (the original Salesforce "1/1/1 model"). Shown at Moderate or better filter level.',
    method: 'WordPress REST API (wp-json/pledge-one/v1/logos-search)',
    refreshCycle: 'Quarterly',
    commitment_tier: 'moderate',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'src-1pct-planet',
    name: '1% for the Planet — member businesses',
    url: 'https://directories.onepercentfortheplanet.org/?accountType=business',
    description: '~1,000 certified member businesses that commit to donating at least 1% of annual gross sales to approved environmental nonprofits. Hidden by default in search (minimal commitment tier) — enable via "All levels" filter.',
    method: 'Paginated JSON API (AWS API Gateway, accountType=business)',
    refreshCycle: 'Quarterly',
    commitment_tier: 'minimal',
    lastCrawled: '2026-04-11',
  },
  {
    id: 'manual',
    name: 'Manually curated',
    url: null,
    description: 'Hand-curated entries for major organisations (Patagonia, Humanitix, Newman\'s Own, etc.) with individually verified claim text.',
    method: 'Manual research',
    refreshCycle: 'As needed',
    commitment_tier: 'substantial',
    lastCrawled: '2026-04-10',
  },
]

const PLANNED_SOURCES = [
  {
    name: 'B Corp directory',
    url: 'https://www.bcorporation.net/en-us/find-a-b-corp/',
    description: 'Certified B Corporations — companies meeting high standards of social and environmental performance, accountability, and transparency.',
    status: 'planned',
    statusNote: 'Large dataset (~8,000 companies). Will require paginated scraping. B Corp certification is a broad standard; not all B Corps have strong giving commitments.',
    commitment_tier: 'moderate',
    estimatedTimeline: 'Q3 2026',
  },
  {
    name: 'Social Enterprise UK',
    url: 'https://www.socialenterprise.org.uk',
    description: 'UK-based social enterprises — businesses that trade for social or environmental purpose and reinvest profits accordingly.',
    status: 'planned',
    statusNote: 'Member directory exists but may require authentication or scraping.',
    commitment_tier: 'moderate',
    estimatedTimeline: 'Q4 2026',
  },
  {
    name: 'Moral Ambition company network',
    url: 'https://moralambition.org',
    description: 'Companies in the Moral Ambition network (Rutger Bregman\'s initiative). Overlaps with PFG Alliance founding partners.',
    status: 'watching',
    statusNote: 'No structured company directory yet. Will add when a searchable directory is available.',
    commitment_tier: 'substantial',
    estimatedTimeline: 'TBD',
  },
  {
    name: 'Library of Things network',
    url: 'https://www.libraryofthings.co.uk',
    description: 'Sharing/lending libraries with social enterprise models. Cross-reference with existing Library of Things directory data.',
    status: 'watching',
    statusNote: 'Potential cross-reference with our sister Library of Things project.',
    commitment_tier: 'moderate',
    estimatedTimeline: 'TBD',
  },
]

const STATUS_STYLES = {
  'in-progress': { label: 'In progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'planned': { label: 'Planned', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'watching': { label: 'Watching', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
}

const TIER_STYLES = {
  substantial: { label: 'Substantial', bg: 'bg-green-50', text: 'text-green-700' },
  moderate: { label: 'Moderate', bg: 'bg-blue-50', text: 'text-blue-700' },
  minimal: { label: 'Minimal', bg: 'bg-gray-100', text: 'text-gray-600' },
}

function TierBadge({ tier }) {
  const style = TIER_STYLES[tier]
  if (!style) return null
  return (
    <span className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

export default function Sources({ data }) {
  const { organizations = [], sources = [], meta = {} } = data || {}

  // Compute org counts per source
  const orgCountBySource = useMemo(() => {
    const counts = {}
    for (const org of organizations) {
      for (const sid of (org.source_ids || [])) {
        counts[sid] = (counts[sid] || 0) + 1
      }
    }
    return counts
  }, [organizations])

  const generatedAt = meta.generated_at || 'unknown'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="panel-card p-6 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Data Coverage</div>
        <h1 className="text-xl font-semibold text-[#1A2332] mb-2 mt-1">What we've indexed, and what's next</h1>
        <p className="text-sm text-gray-600 mb-3">
          This directory is built from automated crawls of public data sources, plus hand-curated entries.
          Below you can see exactly which sources are live, how often they're refreshed, and what we plan to add.
        </p>
        <p className="text-xs font-mono text-gray-400">
          Data last consolidated: {generatedAt} &nbsp;&middot;&nbsp;{' '}
          {organizations.length} organisations indexed
        </p>
      </div>

      {/* Commitment tier explainer */}
      <div className="panel-card p-5 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Commitment levels</div>
        <div className="grid md:grid-cols-3 gap-4 mt-1">
          <div className="border border-green-200 bg-green-50 p-3 rounded">
            <div className="font-mono text-xs font-semibold text-green-700 mb-1">Substantial</div>
            <p className="text-xs text-gray-600">
              Structural, hard-to-reverse commitment: 100% profit-for-good ownership model, GWWC Company Pledge (10%+ net profits), or complete ownership transfer to charity.
            </p>
          </div>
          <div className="border border-blue-200 bg-blue-50 p-3 rounded">
            <div className="font-mono text-xs font-semibold text-blue-700 mb-1">Moderate</div>
            <p className="text-xs text-gray-600">
              Meaningful but personal or softer commitment: Pledge 1% members (1% of equity/product/time), Founders Pledge (personal wealth pledge by founder), EA-aligned service providers.
            </p>
          </div>
          <div className="border border-gray-200 bg-gray-50 p-3 rounded">
            <div className="font-mono text-xs font-semibold text-gray-600 mb-1">Minimal</div>
            <p className="text-xs text-gray-600">
              Token commitment, typically 1% of sales or revenue. Includes 1% for the Planet certified businesses. Hidden by default — reveal via "All levels" in the Commitment filter.
            </p>
          </div>
        </div>
      </div>

      {/* Active sources */}
      <div className="panel-card p-5 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Currently indexed</div>
        <div className="divide-y divide-[#E8EDF2] mt-2">
          {ACTIVE_SOURCES.map(src => {
            const count = src.id === 'manual'
              ? organizations.filter(o => (o.source_ids || []).some(s => ['src-official-site', 'src-profit-for-good'].includes(s))).length
              : orgCountBySource[src.id] || 0
            return (
              <div key={src.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1A2332]">
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1D5FA6]">
                          {src.name}
                        </a>
                      ) : src.name}
                    </span>
                    <TierBadge tier={src.commitment_tier} />
                    <span className="text-xs font-mono text-[#1D5FA6] font-semibold">
                      {count > 0 ? `${count} orgs` : ''}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    Last crawled: {src.lastCrawled} &middot; Refresh: {src.refreshCycle}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{src.description}</p>
                <span className="text-xs font-mono text-gray-400">Method: {src.method}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Planned sources */}
      <div className="panel-card p-5 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Planned sources</div>
        <p className="text-xs text-gray-500 font-mono mb-4 mt-2">
          These sources are on our roadmap. Statuses are updated as work progresses.
        </p>
        <div className="divide-y divide-[#E8EDF2]">
          {PLANNED_SOURCES.map(src => {
            const style = STATUS_STYLES[src.status]
            return (
              <div key={src.name} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1A2332]">
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1D5FA6]">
                          {src.name}
                        </a>
                      ) : src.name}
                    </span>
                    <TierBadge tier={src.commitment_tier} />
                    <span className={`text-xs font-mono px-2 py-0.5 border rounded ${style.bg} ${style.text} ${style.border}`}>
                      {style.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">Est: {src.estimatedTimeline}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{src.description}</p>
                <p className="text-xs font-mono text-gray-400">{src.statusNote}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Refresh schedule & methodology */}
      <div className="panel-card p-5 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Methodology</div>
        <div className="mt-2 space-y-3 text-sm text-gray-600">
          <p>
            Data is collected by automated importers in <code className="font-mono text-xs bg-gray-100 px-1">scripts/importers/</code>.
            Each importer fetches a source (API, HTML page, or Shopify endpoint), maps it to the canonical schema,
            and writes static JSON files. The <code className="font-mono text-xs bg-gray-100 px-1">consolidate.py</code> script
            merges all sources into a single <code className="font-mono text-xs bg-gray-100 px-1">all_data.json</code> file
            served to the client.
          </p>
          <p>
            <span className="font-semibold text-[#1A2332]">Claim text</span> is always the exact original wording from
            the source — never paraphrased. Each claim has a confidence score (0–1) and risk level (low/medium/high).
          </p>
          <p>
            <span className="font-semibold text-[#1A2332]">Re-crawl schedule:</span> GWWC and PFG Alliance are refreshed
            monthly; Founders Pledge and EA Services quarterly; Good Store weekly. Full re-runs are triggered manually
            before each deploy.
          </p>
          <p>
            See something wrong?{' '}
            <Link to="/feedback" className="text-[#1D5FA6] hover:underline">Report an inaccuracy</Link>
            {' '}or annotate directly on the page using the Hypothesis sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}
