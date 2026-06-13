import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ initialValue = '', onSearch, placeholder = 'Search organizations, offerings, or claims...' }) {
  const [value, setValue] = useState(initialValue)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(value)
    } else {
      navigate(`/search?q=${encodeURIComponent(value)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-0">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field flex-1"
        style={{ borderRight: 'none' }}
      />
      <button type="submit" className="btn-primary px-6 whitespace-nowrap">
        Search
      </button>
    </form>
  )
}
