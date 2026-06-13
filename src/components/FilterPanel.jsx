import React from 'react'
import MultiSelectDropdown from './MultiSelectDropdown'

const IMPACT_SCOPE_OPTIONS = [
  { value: 'ea', label: 'EA-aligned / high-impact', note: 'LMIC, animal welfare, GCR/AI safety, GWWC pledge' },
  { value: 'environment', label: 'Environmental / climate' },
  { value: 'general', label: 'General / domestic charities' },
]

const SOURCE_OPTIONS = [
  { value: 'src-gwwc-company-pledge', label: 'GWWC Company Pledge', shortLabel: 'GWWC Company' },
  { value: 'src-founders-pledge', label: 'Founders Pledge', shortLabel: 'Founders Pledge' },
  { value: 'src-profit-for-good-alliance', label: 'Profit for Good Alliance', shortLabel: 'PfG Alliance' },
  { value: 'src-good-store', label: 'Good Store', shortLabel: 'Good Store' },
  { value: 'src-pledge-1pct', label: 'Pledge 1%', shortLabel: 'Pledge 1%' },
  { value: 'src-1pct-planet', label: '1% for the Planet', shortLabel: '1%FP' },
  { value: 'src-ea-services', label: 'EA Services Directory', shortLabel: 'EA Services' },
  { value: 'src-b-corp', label: 'B Corp Directory', shortLabel: 'B Corp' },
  { value: 'src-official-site', label: 'Official site / direct', shortLabel: 'Official' },
]

const TYPE_OPTIONS = [
  { value: 'service', label: 'Service' },
  { value: 'product_family', label: 'Product family' },
  { value: 'product', label: 'Individual product' },
]

const DONATION_PCT_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1%+' },
  { value: 10, label: '10%+' },
  { value: 50, label: '50%+' },
  { value: 100, label: '100%' },
]

const EXACTNESS_OPTIONS = [
  { value: 'exact', label: 'Exact' },
  { value: 'collection', label: 'Collection' },
  { value: 'inferred', label: 'Inferred' },
]

const EXACTNESS_TOOLTIP =
  'Exact: a specific product or service with a direct giving claim. Collection: a product family where individual items may vary. Inferred: the giving commitment is stated at the organization level, not this specific product.'

const CONFIDENCE_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'high', label: 'High (0.9+)' },
  { value: 'medium', label: 'Medium (0.7+)' },
]

const COMMITMENT_TIER_OPTIONS = [
  { value: 'moderate', label: 'Moderate or better (default)', note: 'Pledge 1%, Founders Pledge, ownership models. Hides 1%FP token entries.' },
  { value: 'substantial', label: 'Substantial only', note: 'Ownership model, GWWC 10%+ pledge, 100% profits to charity' },
  { value: 'all', label: 'All levels (incl. 1%FP)', note: 'Also shows 1% for the Planet certified businesses (1% of sales)' },
]

const COMMITMENT_TIER_TOOLTIP =
  'Substantial: structural commitment — ownership model, 10%+ profits pledge, or 100% profits donation. Moderate: personal pledge by founder/executive (e.g. Founders Pledge). Minimal: token commitment (e.g. 1% of sales) — hidden by default.'

export default function FilterPanel({ filters, onChange, onClear, sources }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="panel-card p-4 mb-6 relative">
      <div className="section-label absolute -top-2.5 left-4 bg-[#F4F6F8] px-2">Advanced filters</div>

      {/* Row 1: Beneficiary scope + Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <MultiSelectDropdown
          label="Beneficiary scope"
          options={IMPACT_SCOPE_OPTIONS}
          values={filters.impactScope}
          onChange={val => set('impactScope', val)}
        />

        <MultiSelectDropdown
          label="Source"
          options={SOURCE_OPTIONS}
          values={filters.sources}
          onChange={val => set('sources', val)}
        />
      </div>

      {/* Row 2: Min donation % + Exactness + Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <div>
          <label className="section-label block mb-1">Min donation %</label>
          <select
            value={filters.minDonationPct}
            onChange={e => set('minDonationPct', Number(e.target.value))}
            className="w-full border border-[#D0D9E4] px-2 py-1.5 text-sm font-mono bg-white"
          >
            {DONATION_PCT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <MultiSelectDropdown
          label="Exactness"
          options={EXACTNESS_OPTIONS}
          values={filters.exactness}
          onChange={val => set('exactness', val)}
          tooltip={EXACTNESS_TOOLTIP}
        />

        <div>
          <label className="section-label block mb-1">Confidence</label>
          <select
            value={filters.confidence}
            onChange={e => set('confidence', e.target.value)}
            className="w-full border border-[#D0D9E4] px-2 py-1.5 text-sm font-mono bg-white"
          >
            {CONFIDENCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button onClick={onClear} className="btn-secondary text-xs py-1 px-3">
          Clear filters
        </button>
      </div>
    </div>
  )
}
