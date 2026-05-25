import {useState} from 'react'
import {Dashboard} from "./pages/Dashboard"
import {SkillsView} from "./pages/SkillsView"
import {Postings} from "./pages/Postings"
import {Home} from "./pages/Home"
import {Salary} from "./pages/Salary"

export default function App() {
  const [page, setPage] = useState("Home")

  let showing_page
  if (page === "Home") {
    showing_page = <Home setPage={setPage} />
  }
  else if (page === "Dashboard") {
    showing_page = <Dashboard />
  }
  else if (page === "SkillsView") {
    showing_page = <SkillsView />
  }
  else if (page === "Salary"){
    showing_page = <Salary />
  }
  else {
    showing_page = <Postings />
  }

  return (
    <div style = {{fontFamily: "Inter, sans-serif", padding: "20px", maxWidth: "1200px", margin: "0 auto"}}>
      {showing_page}
    </div>
  )
}

