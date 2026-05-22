import {useState} from 'react'
import {Dashboard} from "./pages/Dashboard"
import {SkillsView} from "./pages/SkillsView"

export default function App() {
  const [page, setPage] = useState("Dashboard")

  let showing_page
  if (page === "Dashboard") {
    showing_page = <Dashboard />
  }
  else {
    showing_page = <SkillsView />
  }

  return (
    <div style = {{fontFamily: "sans-serif", padding: "20px", maxWidth: "1000px", margin: "0 auto"}}>
      <h1>Job Trend Analyzer</h1>
      <nav style = {{marginBottom : "20px"}}>
        <button onClick = {
          function() {
            setPage("Dashboard")
          }}
          style = {{marginRight: "10px"}}>Trends</button>
        <button onClick = {
          function() {
            setPage("SkillsView")
          }
        }>Skills</button>
      </nav>
        {showing_page}
    </div>
  )
}

