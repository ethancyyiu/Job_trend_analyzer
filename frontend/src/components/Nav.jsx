import React from 'react'

export function Nav({page, setPage}){
  return (
    <header className="top-nav">
      <div className="nav-inner">
        <div className="nav-brand" onClick={() => setPage("Home")}>
          <div className="nav-logo" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="10" fill="#06B6D4" />
              <path d="M18 38 L28 24 L38 38 Z" fill="#0A1A2F" opacity="0.95" />
            </svg>
          </div>
          <div className="nav-title">Job Trend Analyzer</div>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <button className={page==="Home"?"active":""} onClick={() => setPage("Home")}>Home</button>
          <button className={page==="Dashboard"?"active":""} onClick={() => setPage("Dashboard")}>Dashboard</button>
          <button className={page==="SkillsView"?"active":""} onClick={() => setPage("SkillsView")}>Skills</button>
          <button className={page==="Postings"?"active":""} onClick={() => setPage("Postings")}>Postings</button>
          <button className={page==="Salary"?"active":""} onClick={() => setPage("Salary")}>Salary/Pay</button>
        </nav>
      </div>
    </header>
  )
}

export default Nav
