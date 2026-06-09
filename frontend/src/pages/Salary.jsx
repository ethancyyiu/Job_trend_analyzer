import React from "react"

export function Salary({ cachedData }) {
  const data = cachedData || {
    sample: [],
    coverage_percentage: 0,
    coverage_count: 0,
    median_min: 0,
    median_max: 0,
    hourly_count: 0,
    yearly_count: 0,
    hourly_percentage: 0,
    yearly_percentage: 0,
    each_category_median: [],
    total_postings: 0
  }

  const coverage_percentage = Math.round(data.coverage_percentage)
  const coverage_count = data.coverage_count

  const median_min = data.median_min;
  const median_max = data.median_max;  

  const hourly_percentage = Math.round(data.hourly_percentage);
  const yearly_percentage = Math.round(data.yearly_percentage);

  return (
    <div className="card">
      <div className="page-header">
        <h2>Salary / Pay</h2>
        <p>Analyze salary ranges, medians, and compensation trends to inform hiring and salary benchmarking.</p>
      </div>

      <div className="salary-hero">
        <div>
          <div className="salary-badge">Coming soon</div>
          <h3>Salary insights for modern talent teams</h3>
          <p>Get a smarter, simpler look at compensation movement so you can benchmark offers and keep pace with market demand.</p>
        </div>
        <div className="salary-hero-visual">
          <div className="salary-preview-wireframe">
            <div className="salary-bar short"></div>
            <div className="salary-bar medium"></div>
            <div className="salary-bar tall"></div>
          </div>
        </div>
      </div>

      <div className="page-panel-row">
        <div className="metric-card">
          <span>Coverage</span>
          <strong>{coverage_percentage}% ({coverage_count})</strong>
          <p>{coverage_percentage}% postings has salary data</p>
        </div>
          <div className="metric-card">
          <span>Median pay</span>
          <strong>${median_min} - ${median_max}/year</strong>
          <p>The median of salary floor (low-end to high-end)</p>
        </div>
        <div className="metric-card">
          <span>Pay structure</span>
          <strong>{yearly_percentage}% / {hourly_percentage}%</strong>
          <p>{yearly_percentage}% Salaried - {hourly_percentage}% Hourly </p>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Compensation snapshot</h3>
          <p>We’re building the full salary trend chart now. This page will show pay ranges and movement alongside market context.</p>
        </div>
        <div style={{ paddingTop: 18 }}>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
            In the meantime, this preview emphasizes the structure of a polished salary page: strong header, data summary, and an illustrated insights panel.
          </p>
        </div>
      </div>

      <p className="section-note">Salary insights are essential for competitive offer construction. This page will be the place to compare pay ranges and adjust hiring plans accordingly.</p>
    </div>
  )
}

export default Salary
