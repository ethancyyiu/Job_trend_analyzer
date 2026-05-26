import React from "react"
import "./Home.css"
import Nav from "../components/Nav"

export function Home({setPage, page}) {
  return (
    <div className="page-root home-root">
      <Nav page={page} setPage={setPage} />

      <section className="intro">
        <h1>Understand Job Market Trends at a Glance</h1>
        <p>Visualize postings, discover top skills, and monitor salary trends to make 
            data‑driven career and hiring decisions. randome stuff randome stuff randome stuff randome stuff
            randome stuffrandome stuffrandome stuffrandome stuffrandome stuff randome stuff
            randome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuff
            randome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuff
            randome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuff
            randome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuffrandome stuff
            randome stuffrandome stuffrandome stuffrandome stuff</p>
      </section>

      <section className="features-grid page-content">
        <article className="feature">
          <h3>Dashboard</h3>
          <p>Interactive time series showing job postings and trends across roles and locations.</p>
          <button onClick={() => setPage("Dashboard")} className="feature-btn">Explore Dashboard</button>
        </article>

        <article className="feature">
          <h3>Skills</h3>
          <p>See which skills are most in demand and how their popularity changes over time.</p>
          <button onClick={() => setPage("SkillsView")} className="feature-btn">View Skills</button>
        </article>

        <article className="feature">
          <h3>Postings</h3>
          <p>Browse recent job postings and analyze hiring activity by company and region.</p>
          <button onClick={() => setPage("Postings")} className="feature-btn">Browse Postings</button>
        </article>

        <article className="feature">
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
