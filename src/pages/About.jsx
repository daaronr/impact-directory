import React from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import Disclaimer from '../components/Disclaimer'

export default function About() {
  return (
    <div className="max-w-3xl">
      <Seo title="About" description="How the Impact Directory works: exactness levels, confidence scores, and how impact claims are sourced and verified." path="/about" />
      <Disclaimer />

      <div className="panel-card p-8 mt-6 mb-6 relative">
        <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Methodology</div>
        <h1 className="text-3xl font-semibold mb-4">About this directory</h1>
        <p className="text-base leading-relaxed text-gray-700">
          The Impact Products and Services Directory is an independent, non-commercial catalog
          of organizations and offerings that make meaningful commitments to social or environmental causes.
          It is not affiliated with, sponsored by, or endorsed by any listed entity. We receive no
          affiliate revenue and have no commercial relationship with any organization in the directory.
        </p>
      </div>

      <Section title="What this directory is">
        <p>
          A structured, searchable catalog of <strong>impact claims</strong> — specific, sourced statements
          that organizations make about how their revenue, profits, or ownership structure benefits
          social or environmental causes.
        </p>
        <p className="mt-3">
          We focus on verifiable commitments: donation percentages, ownership structures, certification
          schemes, and pledges. We do not include vague corporate social responsibility statements or
          unverifiable marketing claims.
        </p>
      </Section>

      <Section title="What this directory is not">
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Not an endorsement of any listed organization or product</li>
          <li>Not financial, investment, or purchasing advice</li>
          <li>Not a comprehensive list — we include what we can verify</li>
          <li>Not a substitute for your own due diligence</li>
        </ul>
      </Section>

      <Section title="The claim system">
        <p>
          Every entry links to one or more <strong>claims</strong>. Each claim records:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
          <li>The <strong>exact original wording</strong> of the commitment — never paraphrased</li>
          <li>The <strong>source</strong> (URL and source directory)</li>
          <li>A <strong>confidence score</strong> (0&ndash;1) reflecting how reliable we consider the source and claim</li>
          <li>A <strong>risk level</strong> (low / medium / high) reflecting potential for the commitment to change</li>
          <li>The <strong>date range</strong> the claim is known to be active</li>
          <li>The <strong>beneficiary</strong> — who or what receives the committed funds or benefit</li>
          <li>The <strong>cause area</strong> (e.g., Education, Environment / Climate, Global Health)</li>
        </ul>
      </Section>

      <Section title="Exactness levels">
        <div className="space-y-3">
          <div className="border-l-4 border-green-600 pl-3">
            <p className="font-semibold text-sm">Exact</p>
            <p className="text-sm text-gray-600">
              The specific product or service has its own explicit commitment. The claim names this offering directly.
            </p>
          </div>
          <div className="border-l-4 border-blue-600 pl-3">
            <p className="font-semibold text-sm">Collection</p>
            <p className="text-sm text-gray-600">
              A product family or brand where the organizational commitment applies broadly, but individual
              items are not each named explicitly.
            </p>
          </div>
          <div className="border-l-4 border-amber-600 pl-3">
            <p className="font-semibold text-sm">Inferred</p>
            <p className="text-sm text-gray-600">
              The parent organization has a commitment that logically extends to this offering, but the
              offering itself is not explicitly mentioned.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Confidence scores">
        <p>
          Confidence scores reflect our assessment of how reliable a claim is, based on:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
          <li>Source quality (official organizational statements score higher than third-party summaries)</li>
          <li>Specificity of the claim (vague claims score lower)</li>
          <li>Corroboration by multiple independent sources</li>
          <li>Age of the claim (recent claims generally score higher)</li>
        </ul>
        <p className="mt-3 text-sm text-gray-500 font-mono">
          High: 0.90+ | Medium: 0.70&ndash;0.89 | Low: below 0.70
        </p>
      </Section>

      <Section title="Data sources">
        <p>Data is currently aggregated from:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
          <li>
            <a href="https://www.profitforgood.com" target="_blank" rel="noopener noreferrer"
               className="text-[#1D5FA6] hover:underline">
              Profit for Good
            </a>
            {' '}— directory of companies donating substantial profits to charity
          </li>
          <li>
            <a href="https://www.givingwhatwecan.org/get-involved/company-pledge" target="_blank" rel="noopener noreferrer"
               className="text-[#1D5FA6] hover:underline">
              Giving What We Can Company Pledge
            </a>
            {' '}— companies pledging at least 10% of profits to effective charities
          </li>
          <li>
            <a href="https://good.store" target="_blank" rel="noopener noreferrer"
               className="text-[#1D5FA6] hover:underline">
              Good Store
            </a>
            {' '}— curated brands where all profits go to charity
          </li>
          <li>
            <a href="https://ea-services.org" target="_blank" rel="noopener noreferrer"
               className="text-[#1D5FA6] hover:underline">
              EA Services Directory
            </a>
            {' '}— directory of service providers aligned with effective altruism principles
          </li>
          <li>Direct organizational disclosures and annual reports</li>
        </ul>
      </Section>

      <Section title="How to suggest corrections and additions">
        <p>
          The easiest way to flag an error or suggest a change is to{' '}
          <strong>highlight any text on this site and annotate it using the Hypothes.is sidebar</strong>{' '}
          (click the arrow tab on the right edge of your screen, or select any text to see the annotation toolbar).
        </p>
        <p className="mt-3">
          To request a specific change, include{' '}
          <code className="bg-gray-100 px-1 rounded font-mono text-sm">#implement</code>{' '}
          in your annotation and describe the correction. For example:{' '}
          <span className="italic text-gray-600">"This percentage is outdated — should be 15% per their 2024 report. #implement"</span>
        </p>
        <p className="mt-3">
          We monitor annotations from the public and will review suggested changes. Annotations tagged{' '}
          <code className="bg-gray-100 px-1 rounded font-mono text-sm">#implement</code>{' '}
          are periodically reviewed and applied if supported by a primary source.
          You can also{' '}
          <Link to="/feedback" className="text-[#1D5FA6] hover:underline">
            submit feedback via the feedback form
          </Link>
          {' '}or file a{' '}
          <a href="https://github.com/daaronr/impact-products-services-directory/issues" target="_blank" rel="noopener noreferrer"
             className="text-[#1D5FA6] hover:underline">
            GitHub issue
          </a>
          .
        </p>
      </Section>

      <Section title="v2 roadmap">
        <p className="text-sm text-gray-600">
          The current version uses static JSON files — no database, no backend. A planned v2
          will add community features (corrections, user submissions) via a lightweight API.
          The static Vite + React frontend will remain unchanged.
        </p>
      </Section>

      <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
        <Link to="/" className="btn-primary inline-block">
          Back to directory
        </Link>
        <Link to="/faq" className="btn-secondary inline-block">
          FAQ
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="panel-card p-6 mb-4">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="text-base leading-relaxed text-gray-700">{children}</div>
    </div>
  )
}
