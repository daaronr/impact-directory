import React from 'react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    q: "Is this just a list of B Corps?",
    a: (
      <>
        <p>
          No — and the distinction matters. <strong>B Corp certification</strong> (issued by B Lab) is a broad
          standard for how a company <em>operates</em>: governance, worker treatment, environmental
          performance, community impact. It says nothing about whether profits go to charity.
          There are roughly 9,000 certified B Corps globally, and most do not donate their profits.
        </p>
        <p className="mt-2">
          <strong>This directory</strong> specifically tracks <em>giving commitments</em> — what percentage
          of profits, revenue, or equity is directed to social or charitable causes. That is a
          separate, often stronger standard. A company can donate 100% of profits without being a
          B Corp, and a B Corp can have no charitable giving at all.
        </p>
        <p className="mt-2">
          Some organizations appear in both: Rituals Cosmetics became a B Corp in 2022 and later
          introduced a 10% profit pledge. Who Gives a Crap and Patagonia are likely both. But
          B Corp status is neither required nor sufficient for inclusion here.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          B Corp directory is on our <Link to="/sources" className="text-[#1D5FA6] hover:underline">planned sources roadmap</Link> — we may add it in future as a separate tier.
        </p>
      </>
    ),
  },
  {
    q: "What makes a company qualify for this directory?",
    a: (
      <>
        <p>
          We require at least one specific, verifiable commitment linking the organization's
          commercial activity to social benefit. Qualifying examples:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>A stated percentage of profits, revenue, or equity donated to named charitable causes</li>
          <li>An ownership structure that structurally directs profits to charity (e.g. nonprofit-owned)</li>
          <li>Membership in a certification scheme that requires documented giving (GWWC Company Pledge, 1% for the Planet, Pledge 1%)</li>
          <li>A public founder pledge to donate personal proceeds (Founders Pledge)</li>
        </ul>
        <p className="mt-2">
          We do <em>not</em> include companies solely for ESG policies, sustainability reports,
          carbon offset purchases, vague "giving back" language, or general mission alignment
          without a specific, sourced commitment.
        </p>
      </>
    ),
  },
  {
    q: "What do the commitment tiers — substantial, moderate, minimal — mean?",
    a: (
      <>
        <dl className="space-y-3">
          <div>
            <dt className="font-semibold text-green-700">Substantial</dt>
            <dd className="text-gray-700 mt-0.5">
              A structural or hard-to-reverse commitment: 100% of profits to charity,
              nonprofit ownership model, or a formal pledge of 10%+ of net profits
              (e.g. the GWWC Company Pledge). This is the highest tier — the commitment
              is baked into the business model or legally binding.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-blue-700">Moderate</dt>
            <dd className="text-gray-700 mt-0.5">
              A meaningful but softer commitment. Includes Founders Pledge members
              (personal pledge by the founder to give a share of personal wealth),
              Pledge 1% members (1% of equity, product, or time), and EA-aligned
              service providers. Real but not structurally enforced.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">Minimal</dt>
            <dd className="text-gray-700 mt-0.5">
              A token or certified commitment, typically 1% of gross sales or revenue.
              Currently this tier includes 1% for the Planet certified businesses.
              These are hidden by default — change the Commitment filter to "All levels"
              to see them. The commitment is real but small relative to other entries.
            </dd>
          </div>
        </dl>
      </>
    ),
  },
  {
    q: "Why are some results hidden by default?",
    a: (
      <>
        <p>
          The search defaults to "Moderate or better" to avoid drowning out high-commitment
          organizations. The bulk of the directory (~1,000 entries) are 1% for the Planet
          certified businesses, whose commitment — while genuine — is 1% of gross annual
          sales. At typical retail margins, this is often less than 3–5% of profits.
        </p>
        <p className="mt-2">
          To see all entries including these, set the <strong>Commitment level</strong> filter
          to "All levels (incl. 1%FP)". To see only the strongest commitments, set it to
          "Substantial only."
        </p>
      </>
    ),
  },
  {
    q: "What's the difference between Pledge 1% and 1% for the Planet?",
    a: (
      <>
        <p>These are two completely separate programs with different origins and standards:</p>
        <dl className="mt-2 space-y-3">
          <div>
            <dt className="font-semibold">Pledge 1% <span className="font-normal text-gray-500">(moderate tier)</span></dt>
            <dd className="text-gray-700 mt-0.5">
              Founded by Salesforce in 2014. Companies commit to give 1% of
              <em> equity, product, and/or employee time</em> to social impact — the original
              "1/1/1 model." The equity pledge in particular can be very substantial for
              growing startups. ~19,000 companies have signed; this directory includes
              ~1,841 showcase members.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">1% for the Planet <span className="font-normal text-gray-500">(minimal tier)</span></dt>
            <dd className="text-gray-700 mt-0.5">
              Founded in 2002 by Yvon Chouinard (Patagonia) and Craig Mathews.
              Members commit to donate at least 1% of <em>annual gross sales</em> to
              approved environmental nonprofits. Revenue-based, not profit-based —
              so a company with thin margins might be donating 10–20% of actual profits.
              ~10,000+ members globally.
            </dd>
          </div>
        </dl>
      </>
    ),
  },
  {
    q: "Are Founders Pledge entries really company commitments?",
    a: (
      <>
        <p>
          Not exactly — and we try to be transparent about this. Founders Pledge is a
          <em> personal pledge</em> by an individual founder or executive to donate a
          significant portion of their personal wealth when they exit their company.
          The company itself has not pledged anything.
        </p>
        <p className="mt-2">
          We include these companies because they are run by people with a strong, public,
          accountability-backed commitment to giving — and choosing to work with or buy from
          these companies is a form of supporting that commitment. But the claim text is
          always clear that it is a founder's personal pledge, and these entries are rated
          "moderate" tier, not "substantial."
        </p>
      </>
    ),
  },
  {
    q: "How current is the data? Can I trust it?",
    a: (
      <>
        <p>
          Each source has its own refresh schedule (see the{' '}
          <Link to="/sources" className="text-[#1D5FA6] hover:underline">Coverage page</Link>
          ). Live sources like GWWC and Good Store are crawled monthly or weekly; others quarterly.
          The "last crawled" date is shown per source.
        </p>
        <p className="mt-2">
          Every claim has a <strong>confidence score</strong> and <strong>risk level</strong>.
          Risk level "medium" or "high" means the commitment may change — for example, a
          personal founder pledge (medium risk) is less structurally stable than a nonprofit
          ownership model (low risk).
        </p>
        <p className="mt-2">
          If you spot something outdated, please{' '}
          <strong>highlight the text on the relevant page and annotate via Hypothes.is</strong>,
          or use the{' '}
          <Link to="/feedback" className="text-[#1D5FA6] hover:underline">feedback form</Link>.
          Include a source URL if you have one.
        </p>
      </>
    ),
  },
  {
    q: "Does being listed mean I should buy from this company?",
    a: (
      <>
        <p>
          No. This directory only tracks giving and profit-sharing commitments. It says
          nothing about:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Product quality or value for money</li>
          <li>Labor practices and worker treatment</li>
          <li>Environmental footprint beyond giving</li>
          <li>Data privacy or business practices</li>
          <li>Whether the chosen charities are effective</li>
        </ul>
        <p className="mt-2">
          A company can donate 100% of profits and still have other serious problems.
          This directory is one input among many — not an endorsement. Do your own
          due diligence before purchasing.
        </p>
      </>
    ),
  },
  {
    q: "What about 'sustainable', 'ethical', or ESG-focused companies?",
    a: (
      <>
        <p>
          Generally not included unless they also have a specific giving commitment.
          "Sustainable," "ethical," "responsible," "carbon neutral," "ESG-aligned," and
          similar terms describe how a company operates — not whether it donates profits.
        </p>
        <p className="mt-2">
          We specifically exclude entries based solely on: sustainability certifications,
          carbon offset programs, fair-trade sourcing, ethical supply chains, B Corp
          status, recycled materials, or vague impact statements. These may be admirable,
          but they're a different thing from what this directory tracks.
        </p>
      </>
    ),
  },
  {
    q: "Why isn't [company] listed?",
    a: (
      <>
        <p>A few possible reasons:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Not yet in our sources:</strong> We have indexed{' '}
            <Link to="/sources" className="text-[#1D5FA6] hover:underline">a specific set of sources</Link>
            {' '}— B Corp, Social Enterprise UK, and others are on the roadmap.
          </li>
          <li>
            <strong>No verifiable giving commitment:</strong> The company may be mission-aligned
            but without a specific, sourced percentage or structural commitment.
          </li>
          <li>
            <strong>Hidden by default:</strong> 1% for the Planet businesses are hidden at
            the default filter level — check "All levels" in the Commitment filter.
          </li>
          <li>
            <strong>We simply missed it:</strong>{' '}
            <Link to="/feedback" className="text-[#1D5FA6] hover:underline">Submit it via the feedback form</Link>
            {' '}with a source URL and we'll review it.
          </li>
        </ul>
      </>
    ),
  },
]

export default function FAQ() {
  return (
    <div className="max-w-3xl">
      <div className="panel-card p-8 mt-6 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">FAQ</div>
        <h1 className="text-3xl font-semibold mb-2">Frequently asked questions</h1>
        <p className="text-base text-gray-600">
          Common questions about how this directory works, what qualifies, and how to interpret entries.
        </p>
      </div>

      <div className="space-y-2 mb-8">
        {FAQS.map(({ q, a }, i) => (
          <details key={i} className="panel-card group">
            <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none">
              <span className="font-semibold text-[#1A2332] pr-4">{q}</span>
              <span className="text-[#1D5FA6] text-lg flex-shrink-0 transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-gray-700 border-t border-[#E8EDF2] pt-4 space-y-2">
              {a}
            </div>
          </details>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-mono">
        <Link to="/about" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
          Full methodology
        </Link>
        <Link to="/sources" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
          Data coverage
        </Link>
        <Link to="/feedback" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
          Submit a correction
        </Link>
        <Link to="/search" className="text-[#1D5FA6] hover:underline uppercase tracking-wider text-xs">
          Search the directory
        </Link>
      </div>
    </div>
  )
}
