import React, { useState, useRef, useEffect } from 'react'

export default function MultiSelectDropdown({ label, options, values, onChange, tooltip }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const toggle = (val) => {
    if (values.includes(val)) onChange(values.filter(v => v !== val))
    else onChange([...values, val])
  }

  const allSelected = values.length === 0
  const buttonLabel = allSelected
    ? 'All'
    : options.filter(o => values.includes(o.value)).map(o => o.shortLabel || o.label).join(', ')

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 mb-1">
        <span className="section-label">{label}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-[#D0D9E4] px-2 py-1.5 text-sm font-mono bg-white text-left flex justify-between items-center gap-2 hover:border-[#1D5FA6] transition-colors"
      >
        <span className="truncate text-[#1A2332]">{buttonLabel}</span>
        <span className="text-gray-400 flex-shrink-0 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-[#D0D9E4] border-t-0 shadow-lg max-h-64 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <input
                type="checkbox"
                checked={values.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="mt-0.5 flex-shrink-0 accent-[#1D5FA6]"
              />
              <div className="min-w-0">
                <span className="text-sm font-mono text-[#1A2332] block">{opt.label}</span>
                {opt.note && (
                  <span className="text-xs text-gray-400 leading-tight block">{opt.note}</span>
                )}
              </div>
            </label>
          ))}
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-2 text-xs font-mono text-gray-400 hover:text-[#1D5FA6] border-t border-gray-100"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Tooltip({ text }) {
  return (
    <span className="relative group inline-flex">
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-mono text-gray-400 border border-gray-300 rounded-full cursor-help leading-none">?</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-[#1A2332] text-white text-xs font-mono leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-40 shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A2332]" />
      </span>
    </span>
  )
}
