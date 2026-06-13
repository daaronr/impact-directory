import React from 'react'
import { NavLink, Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white border-b border-[#D0D9E4] shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <span className="font-mono text-xs tracking-widest uppercase text-[#1D5FA6]">Impact</span>
            <span className="text-[#D0D9E4]">|</span>
            <span className="font-semibold text-[#1A2332] text-sm">Directory</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Search
            </NavLink>
            <NavLink
              to="/sources"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Coverage
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              FAQ
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              About
            </NavLink>
            <NavLink
              to="/feedback"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Report inaccuracy
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}
