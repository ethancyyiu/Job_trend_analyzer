import React from "react"
import "./Home.css"

export default function Home({ setPage, page }) {
  return (
    <div className="card">

      <div className="page-header">
        <h2>Welcome</h2>
        <p>Overview of the site: visualize trends, explore top skills, recent postings, and salary insights.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Dashboard</h3>
          <p>Interactive time series showing job postings and trends.</p>
          <button onClick={() => setPage("Dashboard")} className="feature-btn">
            Explore Dashboard
          </button>
        </div>

        <div className="card">
          <h3>Skills</h3>
          <p>See which skills are most in demand and how their popularity changes over time.</p>
          <button onClick={() => setPage("SkillsView")} className="feature-btn">
            View Skills
          </button>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="grid-2">
        <div className="card">
          <h3>Postings</h3>
          <p>Browse recent job postings and analyze hiring activity by company and region.</p>
          <button onClick={() => setPage("Postings")} className="feature-btn">
            Browse Postings
          </button>
        </div>

        <div className="card">
          <h3>Salary / Pay</h3>
          <p>Monitor salary ranges and compensation trends across roles.</p>
          <button onClick={() => setPage("Salary")} className="feature-btn">
            Salary Insights
          </button>
        </div>
      </div>

      <footer className="contact">
        <h4>Contact Me</h4>
        <p>
          Questions, feedback or data requests? Email{" "}
          <a href="mailto:hello@example.com">hello@example.com</a>.
        </p>
      </footer>

    </div>
  )
}