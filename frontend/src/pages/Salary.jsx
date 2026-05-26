import React from "react"
import Nav from "../components/Nav"

export function Salary({setPage, page}) {
  return (
    <div className="page-root">
      <Nav page={page} setPage={setPage} />
      <div className="page-header">
        <h2>Salary / Pay</h2>
        <p>Analyze salary ranges, medians, and compensation trends to inform hiring and salary benchmarking.</p>
      </div>

      <main className="page-content">
        <div style={{background:'#fff', padding:20, borderRadius:10, boxShadow:'0 6px 18px rgba(10,26,47,0.04)'}}>
          <h3>Coming Soon</h3>
          <p>Graphs and filters for compensation data will be available here.</p>
        </div>
      </main>
    </div>
  )
}

export default Salary
