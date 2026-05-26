import React from 'react'
import Nav from './Nav'

export function Sidebar({page, setPage}){
  return (
    <div className="sidebar-root">
      <div className="sidebar-brand" onClick={() => setPage('Home')}>
        <div className="brand-logo">
          <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#06B6D4" />
            <path d="M18 38 L28 24 L38 38 Z" fill="#0A1A2F" opacity="0.95" />
          </svg>
        </div>
        <div className="brand-name">Job Trend</div>
      </div>

      <nav className="sidebar-nav">
        <Nav page={page} setPage={setPage} />
      </nav>

      <div className="sidebar-footer">
        <small>© {new Date().getFullYear()} Job Trend Analyzer</small>
      </div>
    </div>
  )
}

export default Sidebar
