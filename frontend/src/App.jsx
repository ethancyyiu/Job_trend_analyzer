import { useState } from 'react'
import {dashboard} from "./pages/dashboard"
import {skills_view} from "./pages/skills_view"

export default function App() {
  const [page, setPage] = useState("dashboard")

  return (
    <div style = {{fontFamily: "sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto"}}>
      <h1>Job Trend Analyzer</h1>
      <nav style = {{marginBottom : "20px"}}>
        <button onClick = {
          function() {
            setPage("dashboard")
          }}
          style = {{marginRight: "10px"}}>Trends</button>
        <button onClick = {
          function() {
            setPage("skills_view")
          }
        }></button>
      </nav>

    </div>
  )
}

