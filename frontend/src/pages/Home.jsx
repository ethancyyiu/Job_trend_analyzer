import React from "react"
import "./Home.css"

export default function Home({ setPage, page }) {
  return (
    <div className="page-root">
      <div className="page-content">
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="home-eyebrow">Job Trend Analyzer</span>
            <h1>Build hiring strategy with real market signal, not guesswork.</h1>
            <p>
              Track the latest posting momentum, skill demand, and salary movement in one clean product experience. Job Trend Analyzer helps talent teams stay ahead of market shifts so they can hire faster, smarter, and with confidence.
            </p>
            <div className="home-hero-actions">
              <button className="feature-btn" onClick={() => setPage("Dashboard")}>View Dashboard</button>
              <button className="feature-btn feature-btn-secondary" onClick={() => setPage("SkillsView")}>Explore Skills</button>
            </div>
          </div>

          <aside className="home-hero-panel">
            <div className="home-hero-panel-card">
              <p className="home-hero-panel-label">Live product overview</p>
              <h3>One dashboard to monitor trends, talent demand, postings, and compensation.</h3>
              <p>Everything teams need to spot high-growth roles, skill gaps, and salary pressure without switching between reports.</p>
            </div>
          </aside>
        </section>

        <section className="home-value">
          <div className="home-value-copy">
            <span className="home-value-eyebrow">Why it matters</span>
            <h2>Stop reacting to hiring noise. Start responding to real demand.</h2>
            <p>
              Many teams rely on outdated spreadsheets and disconnected reports. Job Trend Analyzer brings the job market into a single, modern dashboard so hiring decisions happen with clarity and speed.
            </p>
          </div>
        </section>

        <section className="home-features">
          <div className="feature-row feature-row-1">
            <div>
              <h3>Dashboard</h3>
              <p>See hiring momentum, posting volume, and time trends in one polished view so you can spot shifts before they become a problem.</p>
            </div>
            <button className="feature-btn" onClick={() => setPage("Dashboard")}>Open Dashboard</button>
          </div>

          <div className="feature-row feature-row-2">
            <div>
              <h3>Skills</h3>
              <p>Discover the skills employers are demanding most, ranked by growth and volume, so you can prioritize training and sourcing.</p>
            </div>
            <button className="feature-btn" onClick={() => setPage("SkillsView")}>View Skills</button>
          </div>

          <div className="feature-row feature-row-3">
            <div>
              <h3>Postings</h3>
              <p>Browse recently indexed roles with company, location, and date context to understand where hiring activity is concentrated.</p>
            </div>
            <button className="feature-btn" onClick={() => setPage("Postings")}>Browse Postings</button>
          </div>

          <div className="feature-row feature-row-4">
            <div>
              <h3>Salary</h3>
              <p>Track compensation trends across roles so you can align offers with market movement and stay competitive.</p>
            </div>
            <button className="feature-btn" onClick={() => setPage("Salary")}>See Salary</button>
          </div>
        </section>
      </div>
    </div>
  )
}
