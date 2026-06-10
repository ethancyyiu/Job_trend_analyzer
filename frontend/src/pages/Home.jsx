import React from "react"
import "./Home.css"

export default function Home({ setPage, cachedData }) {

  const momentumPercent = cachedData && typeof cachedData.momentum === 'number'
    ? `${Math.round(cachedData.momentum * 100)}%`
    : "+12%"
  const totalPostings = cachedData?.total || "2,400+"
  const skillsCount = "60+"
  const salaryRange = (cachedData && cachedData.rounded_median_min && cachedData.rounded_median_max)
    ? `${cachedData.rounded_median_min}–${cachedData.rounded_median_max}`
    : "$65k–$115k"

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
              <button className="feature-btn" onClick={() => setPage("DailyTrends")}>View Daily Trends</button>
              <button className="feature-btn feature-btn-secondary" onClick={() => setPage("SkillsView")}>Explore Skills</button>
            </div>
          </div>

          <aside className="home-hero-panel">
            <div className="home-hero-panel-card">
              <p className="home-hero-panel-label">Live product overview</p>
              <h3>One daily trends view to monitor talent demand, postings, and compensation.</h3>
              <p>Everything teams need to spot high-growth roles, skill gaps, and salary pressure without switching between reports.</p>
                <div className="home-hero-panel-stats">
                  <div className="hero-stat">
                    <strong>{totalPostings}</strong>
                    <span>Postings indexed</span>
                  </div>
                  <div className="hero-stat">
                    <strong>{skillsCount}</strong>
                    <span>Skills tracked</span>
                  </div>
                  <div className="hero-stat">
                    <strong>Once a day</strong>
                    <span>Updated automatically</span>
                  </div>
                </div>
            </div>
          </aside>
        </section>

        <section className="home-feature-grid" aria-label="Explore features">
          <div className="feature-card" onClick={() => setPage("DailyTrends")}>
            <div className="card-head">
              <span className="home-eyebrow">Daily Trends</span>
              <svg className="feature-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="10" width="3" height="11" rx="1" fill="var(--accent)" />
                <rect x="9" y="6" width="3" height="15" rx="1" fill="var(--accent)" />
                <rect x="15" y="2" width="3" height="19" rx="1" fill="var(--accent)" />
              </svg>
            </div>
            <h3>See where hiring momentum is accelerating</h3>
            <p>Quickly compare posting volume and trend direction to prioritize roles.</p>
            <div className="card-meta"><span className="meta-pill">Posting momentum</span><strong>{momentumPercent}</strong></div>
          </div>

          <div className="feature-card" onClick={() => setPage("SkillsView")}>
            <div className="card-head">
              <span className="home-eyebrow">Skills</span>
              <svg className="feature-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="7" cy="7" r="3" fill="var(--accent)" />
                <circle cx="17" cy="7" r="2" fill="var(--accent)" opacity="0.9" />
                <rect x="5" y="14" width="14" height="3" rx="1" fill="var(--accent)" />
              </svg>
            </div>
            <h3>Highlight the skills employers are chasing</h3>
            <p>Surface rising skills and gaps so your team can target hiring and training.</p>
            <div className="card-meta"><span className="meta-pill">Top skill</span><strong>{cachedData?.top_skill || 'React'}</strong></div>
          </div>

          <div className="feature-card" onClick={() => setPage("Postings")}>
            <div className="card-head">
              <span className="home-eyebrow">Postings</span>
              <svg className="feature-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="var(--accent)" strokeWidth="1.2" fill="none" />
                <path d="M8 9h8M8 13h5" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Browse the freshest roles with context</h3>
            <p>See recent postings with location and urgency signals to act fast.</p>
            <div className="card-meta"><span className="meta-pill">Detailed</span><strong>24h</strong></div>
          </div>

          <div className="feature-card" onClick={() => setPage("Salary")}>
            <div className="card-head">
              <span className="home-eyebrow">Salary</span>
              <svg className="feature-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 3v18" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M7 7h10M7 17h10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Understand compensation trends quickly</h3>
            <p>Track pay-range shifts so offers remain competitive across markets.</p>
            <div className="card-meta"><span className="meta-pill">Range</span><strong>{salaryRange}</strong></div>
          </div>
        </section>
      </div>
    </div>
  )
}
