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
            <div className="feature-row-copy">
              <span className="home-eyebrow">Dashboard</span>
              <h3>See where hiring momentum is accelerating.</h3>
              <p>Understand posting volume and trend direction at a glance, with a centralized view that keeps your team aligned.</p>
            </div>
            <div className="feature-row-illustration">
              <div className="illustration-block">
                <div className="illustration-pill large"></div>
                <div className="illustration-pill medium"></div>
                <div className="illustration-grid">
                  <div className="illustration-bar tall" />
                  <div className="illustration-bar medium" />
                  <div className="illustration-bar short" />
                  <div className="illustration-bar medium-light" />
                </div>
              </div>
            </div>
          </div>

          <div className="feature-row feature-row-2">
            <div className="feature-row-copy">
              <span className="home-eyebrow">Skills</span>
              <h3>Highlight the skills employers are chasing right now.</h3>
              <p>Spot rising talent demand and skill gaps with a visual experience designed for fast decision making.</p>
            </div>
            <div className="feature-row-illustration">
              <div className="illustration-block">
                <div className="illustration-pill medium"></div>
                <div className="illustration-pill small"></div>
                <div className="illustration-grid skill-mode">
                  <div className="illustration-dot" />
                  <div className="illustration-dot active" />
                  <div className="illustration-dot" />
                  <div className="illustration-line" />
                </div>
              </div>
            </div>
          </div>

          <div className="feature-row feature-row-3">
            <div className="feature-row-copy">
              <span className="home-eyebrow">Postings</span>
              <h3>Browse the freshest roles with hiring context.</h3>
              <p>Surface recent job postings quickly so you can capture demand signals where they matter most.</p>
            </div>
            <div className="feature-row-illustration">
              <div className="illustration-block">
                <div className="illustration-pill medium"></div>
                <div className="illustration-pill tall"></div>
                <div className="illustration-grid posting-mode">
                  <div className="illustration-chip" />
                  <div className="illustration-chip" />
                  <div className="illustration-chip" />
                  <div className="illustration-chip" />
                </div>
              </div>
            </div>
          </div>

          <div className="feature-row feature-row-4">
            <div className="feature-row-copy">
              <span className="home-eyebrow">Salary</span>
              <h3>Understand compensation trends across the market.</h3>
              <p>Track how pay ranges are moving so your offers stay competitive and aligned to current demand.</p>
            </div>
            <div className="feature-row-illustration">
              <div className="illustration-block">
                <div className="illustration-pill medium"></div>
                <div className="illustration-pill small"></div>
                <div className="illustration-grid salary-mode">
                  <div className="illustration-bar short" />
                  <div className="illustration-bar medium" />
                  <div className="illustration-bar tall" />
                  <div className="illustration-circle" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
