import React from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import SearchBar from '../components/SearchBar'
import Disclaimer from '../components/Disclaimer'
import OrgCard from '../components/OrgCard'
import OfferingCard from '../components/OfferingCard'

export default function Home({ data }) {
  if (!data) return null

  const { meta, organizations = [], offerings = [], claims = [], sources = [] } = data

  return (
    <div>
      <Seo path="/" />
      <Disclaimer />

      {/* Hero */}
      <div className="panel-card p-8 md:p-12 mt-6 mb-8 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">
          Impact Products and Services Directory
        </div>

        <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-4">
          Find products and services{' '}
          <span className="hero-highlight">
            that do good
          </span>
        </h1>

        <p className="text-lg leading-relaxed max-w-2xl mb-6 text-gray-700">
          A searchable directory of organizations and offerings with meaningful social
          or environmental commitments — with verified impact claims, not just branding.
          We track the exact wording, confidence level, and source for every claim.
        </p>

        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Stats */}
        {meta && (
          <div className="flex flex-wrap gap-8 pt-6 border-t-2 border-dashed border-[#D0D9E4] items-end">
            <StatItem value={meta.total_organizations} label="organizations" />
            <StatItem value={meta.total_offerings} label="offerings" />
            <StatItem value={meta.total_claims} label="giving commitments" />
            {meta.generated_at && (
              <span className="text-xs font-mono text-gray-400 ml-auto self-end pb-1">
                Data last updated: {meta.generated_at}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Trust model explanation */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <ExplainerCard
          title="Exact claims"
          badge="exact"
          description="The offering itself makes a specific, verifiable commitment — e.g., a product line where 100% of profits go to a named charity."
        />
        <ExplainerCard
          title="Collection claims"
          badge="collection"
          description="A product family or brand where the parent organization's commitment applies, but not all individual products may be covered."
        />
        <ExplainerCard
          title="Inferred claims"
          badge="inferred"
          description="An organizational commitment that likely extends to this offering, but is not explicitly stated for this specific product or service."
        />
      </div>

      {/* Organizations */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Organizations</h2>
          <Link to="/search?mode=orgs" className="text-sm font-mono text-[#1D5FA6] hover:underline">
            See all
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {organizations.slice(0, 3).map(org => {
            const orgOfferings = offerings.filter(o => o.org_id === org.id)
            const orgClaims = claims.filter(c => c.org_id === org.id)
            return (
              <OrgCard
                key={org.id}
                org={org}
                offeringCount={orgOfferings.length}
                claimCount={orgClaims.length}
              />
            )
          })}
        </div>
      </section>

      {/* Offerings */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Offerings</h2>
          <Link to="/search" className="text-sm font-mono text-[#1D5FA6] hover:underline">
            See all
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offerings.slice(0, 6).map(offering => {
            const org = organizations.find(o => o.id === offering.org_id)
            return (
              <OfferingCard
                key={offering.id}
                offering={offering}
                org={org}
                claims={claims}
              />
            )
          })}
        </div>
      </section>

      {/* About section */}
      <div className="panel-card p-6 mb-4 bg-[#E8F0FB]">
        <h2 className="text-lg font-semibold mb-2">How this directory works</h2>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          Every entry in this directory includes at least one <strong>claim</strong> — a
          specific, sourced statement about the organization's commitment. We record the
          exact wording (never paraphrased), the source, our confidence in its accuracy,
          and the date range it covers.
        </p>
        <Link to="/about" className="text-sm font-mono text-[#1D5FA6] hover:underline uppercase tracking-wider">
          Read the full methodology
        </Link>
      </div>

      {/* Community feedback callout */}
      <div className="panel-card p-6 mb-8 border-l-4 border-[#1D5FA6] bg-white">
        <h2 className="text-base font-semibold mb-2">Help keep this directory accurate</h2>
        <p className="text-sm leading-relaxed text-gray-700 mb-3">
          See something wrong, outdated, or missing?{' '}
          <strong>Highlight any text on this page</strong> and leave an annotation using
          the Hypothes.is sidebar (the arrow tab on the right edge of your screen).
          We monitor all annotations and incorporate well-sourced corrections — typically within a few days.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          To flag a specific change for implementation, include{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">#implement</code>{' '}
          in your annotation. For example:{' '}
          <span className="italic text-gray-500">"Percentage is now 15% per their 2024 report — source: [url] #implement"</span>
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-mono">
          <Link to="/feedback" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
            Feedback form
          </Link>
          <Link to="/about" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
            How corrections work
          </Link>
        </div>
      </div>

      {/* See also */}
      <div className="panel-card p-4 mb-6 bg-[#F7F9FC] text-sm text-gray-600">
        <span className="font-mono text-xs uppercase tracking-wider text-gray-400 mr-2">See also:</span>
        <a
          href="https://masslibraryofthings.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1D5FA6] hover:underline"
        >
          Library of Things USA
        </a>
        {' '}&mdash; a companion directory of borrowable items (tools, gear, tech) across US public libraries and tool libraries. Same ethos: find what you need without buying new.
      </div>

      <footer className="text-center text-xs font-mono text-gray-400 py-6 border-t border-[#D0D9E4]">
        <p className="mb-1">
          Independent directory. Not affiliated with any listed organization.{' '}
          <span className="text-gray-400">
            Highlight any text to annotate and suggest changes via Hypothes.is.
          </span>
        </p>
        <p>
          Compiled and maintained by David Reinstein, founder of{' '}
          <a href="https://unjournal.org" target="_blank" rel="noopener noreferrer"
             className="underline hover:text-[#1D5FA6]">
            Unjournal.org
          </a>
        </p>
      </footer>
    </div>
  )
}

function StatItem({ value, label }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-semibold text-[#1D5FA6]">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}

function ExplainerCard({ title, badge, description }) {
  const badgeClass = badge === 'exact' ? 'badge-exact'
    : badge === 'collection' ? 'badge-collection'
    : 'badge-inferred'

  return (
    <div className="panel-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`badge ${badgeClass}`}>{badge}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
