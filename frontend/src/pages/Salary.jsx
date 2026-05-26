import React from "react"
export function Salary({setPage, page}) {
  return (
    <div className="card">
      <div className="page-header">
        <h2>Salary / Pay</h2>
        <p>Analyze salary ranges, medians, and compensation trends to inform hiring and salary benchmarking.</p>
      </div>

      <div className="salary-hero">
        <div>
          <h3>Salary insights for modern talent teams</h3>
          <p>Get a smarter, simpler look at compensation movement so you can benchmark offers and keep pace with market demand.</p>
        </div>
        <div className="salary-hero-visual">
          <div className="salary-graphic">
            <div className="salary-dot" />
          </div>
        </div>
      </div>

      <div className="page-panel-row">
        <div className="metric-card">
          <span>Median pay</span>
          <strong>$N/A</strong>
          <p>Example bench for the most active roles in the current market.</p>
        </div>
        <div className="metric-card">
          <span>Growth</span>
          <strong>+N/A%</strong>
          <p>Year-over-year movement across the compensation dataset.</p>
        </div>
        <div className="metric-card">
          <span>Competitive</span>
          <strong>N/A</strong>
          <p>Signals that pay should be aligned with today’s high-demand roles.</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Compensation snapshot</h3>
          <p>We’re building the full salary trend chart now. This page will show pay ranges and movement alongside market context.</p>
        </div>
        <div style={{paddingTop:18}}>
          <p style={{margin:0, color:'var(--muted)', lineHeight:1.8}}>
            In the meantime, this preview emphasizes the structure of a polished salary page: strong header, data summary, and an illustrated insights panel.
          </p>
        </div>
      </div>

      <p className="section-note">Salary insights are essential for competitive offer construction. This page will be the place to compare pay ranges and adjust hiring plans accordingly.</p>
    </div>
  )
}

export default Salary
