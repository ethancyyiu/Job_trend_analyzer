import React from "react"
import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts"

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

  const hourly_percentage = Math.round(data.hourly_percentage)
  const yearly_percentage = Math.round(data.yearly_percentage)

  // apply letter k so it is more compact
  const formatSalary = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A"
    const rounded = Math.round(Number(value) / 1000)
    return `$${rounded}k`
  }

  const categoryTitles = [
    "Software Engineer",
    "Data Engineer",
    "Machine Learning Engineer",
    "Other"
  ]

  // so that all category is in order
  const categoryLookup = (data.each_category_median || []).reduce((acc, item) => {
    acc[item.title] = item
    return acc
  }, {})

  // return the range of the salary
  const salaryRanges = categoryTitles.map((title) => {
    const item = categoryLookup[title] || {}
    const min = Number(item.median_minimum) || 0
    const max = Number(item.median_maximum) || 0
    const range = Math.max(0, max - min)
    const hasRange = min > 0 && max > 0 && range >= 0

    return {
      title,
      min,
      range,
      max,
      label: hasRange ? `${formatSalary(min)} – ${formatSalary(max)}` : "No salary range available"
    }
  })

  // to format the graph better
  const highestRangeValue = Math.max(...salaryRanges.map((item) => item.max), median_max || 0, 1)
  const xAxisMax = Math.ceil(highestRangeValue / 10000) * 10000

  // tooltip so when I hover over it, it has the card
  const SalaryTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const item = payload[0].payload
    return (
      <div className="custom-tooltip">
        <div className="tooltip-title">{item.title}</div>
        
        {item.max > 0 && <div>{formatSalary(item.min)} low - {formatSalary(item.max)} high / year</div>}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="page-header">
        <h2>Salary Overview</h2>
        <p>Use current salary data to benchmark pay, review coverage, and compare compensation structure across roles.</p>
      </div>

      <div className="page-panel-row">
        <div className="metric-card">
          <span>Coverage</span>
          <strong>{coverage_percentage}% ({coverage_count})</strong>
          <p>{coverage_percentage}% of Postings includes salary data</p>
        </div>
        <div className="metric-card">
          <span>Median pay</span>
          <strong>${median_min} - ${median_max}/year</strong>
          <p>The median of salary floor (low-end to high-end)</p>
        </div>
        <div className="metric-card">
          <span>Pay structure</span>
          <strong>{yearly_percentage}% / {hourly_percentage}%</strong>
          <p>{yearly_percentage}% Salaried - {hourly_percentage}% Hourly</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <h3>Compensation snapshot</h3>
          <p>Salary ranges by role show floating low-to-high compensation boundaries for current hiring data.</p>
        </div>
        <div className="salary-range-chart">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={salaryRanges}
              maxBarSize={45} 
              layout="vertical"
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                type="number"
                domain={[0, xAxisMax]}
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="title"
                axisLine={false}
                tickLine={false}
                width={170}
              />
              <Tooltip content={<SalaryTooltip />} cursor={{ fill: "rgba(16, 112, 241, 0.08)" }} />
              <Bar dataKey="min" stackId="a" fill="transparent" />
              <Bar dataKey="range" stackId="a" barSize={15} radius={10} fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Salary
