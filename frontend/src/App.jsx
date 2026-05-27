import {useState} from 'react'
import {Dashboard} from "./pages/Dashboard.jsx"
import {SkillsView} from "./pages/SkillsView.jsx"
import {Postings} from "./pages/Postings.jsx"
import Home from "./pages/Home.jsx"
import {Salary} from "./pages/Salary.jsx"
import Layout from "./components/Layout.jsx"

export default function App() {
  const [page, setPage] = useState("Home")

  let showing_page
  if (page === "Home") showing_page = <Home setPage={setPage} page={page} />
  else if (page === "Dashboard") showing_page = <Dashboard setPage={setPage} page={page} />
  else if (page === "SkillsView") showing_page = <SkillsView setPage={setPage} page={page} />
  else if (page === "Salary") showing_page = <Salary setPage={setPage} page={page} />
  else showing_page = <Postings setPage={setPage} page={page} />

  return (
    <div style = {{fontFamily: "Inter, sans-serif", padding: "0", width: "100%"}}>
      <Layout page={page} setPage={setPage}>{showing_page}</Layout>
    </div>
  )
}
