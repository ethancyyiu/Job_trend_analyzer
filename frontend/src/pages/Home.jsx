import React from "react"
import "./Home.css"

export function Home({setPage}) {
  return (
    <div className="home-root">
      <header className="home-header">
        <div className="logo-wrap" onClick={() => setPage("Dashboard")}>
          <svg className="logo" width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0" stopColor="#7dd3fc" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="12" fill="url(#g)" />
            <path d="M18 38 L28 24 L38 38 Z" fill="white" opacity="0.92" />
            <circle cx="44" cy="20" r="6" fill="white" opacity="0.9" />
          </svg>
          <div className="brand">
            <span className="brand-title">Job Trend Analyzer</span>
            <span className="brand-sub">Insights for hiring & skills</span>
          </div>
        </div>
        <nav className="home-nav">
          <button onClick={() => setPage("Dashboard")}>Dashboard</button>
          <button onClick={() => setPage("SkillsView")}>Skills</button>
          <button onClick={() => setPage("Postings")}>Postings</button>
          <button onClick={() => setPage("Salary")}>Salary/Pay</button>
        </nav>
      </header>

      <section className="intro">
        <h1>Understand Job Market Trends at a Glance</h1>
        <p>Visualize postings, discover top skills, and monitor salary trends to make data‑driven career and hiring decisions.</p>
      </section>

      <section className="features-grid">
        <article className="feature" style={{"--i":0}}>
          <h3>Dashboard</h3>
          <p>Interactive time series showing job postings and trends across roles and locations.</p>
          <button onClick={() => setPage("Dashboard")} className="feature-btn">Explore Dashboard</button>
        </article>

        <article className="feature" style={{"--i":1}}>
          <h3>Skills</h3>
          <p>See which skills are most in demand and how their popularity changes over time.</p>
          <button onClick={() => setPage("SkillsView")} className="feature-btn">View Skills</button>
        </article>

        <article className="feature" style={{"--i":2}}>
          <h3>Postings</h3>
          <p>Browse recent job postings and analyze hiring activity by company and region.</p>
          <button onClick={() => setPage("Postings")} className="feature-btn">Browse Postings</button>
        </article>

        <article className="feature" style={{"--i":3}}>
          <h3>Salary / Pay</h3>
          <p>Monitor salary ranges and compensation trends across roles (coming soon).</p>
          <button onClick={() => setPage("Salary")} className="feature-btn">Salary Insights</button>
        </article>
      </section>

      <footer className="contact">
        <h4>Contact Me</h4>
        <p>Questions, feedback or data requests? Email <a href="mailto:hello@example.com">hello@example.com</a>.</p>
      </footer>
    </div>
  )
}

export default Home
