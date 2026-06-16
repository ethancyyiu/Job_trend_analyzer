import {useState, useEffect} from 'react'
import {DailyTrends} from "./pages/DailyTrends.jsx"
import {SkillsView} from "./pages/SkillsView.jsx"
import {Postings} from "./pages/Postings.jsx"
import Home from "./pages/Home.jsx"
import {Salary} from "./pages/Salary.jsx"
import Layout from "./components/Layout.jsx"
import axios from 'axios'
import {Analytics} from "@vercel/analytics/react"

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [page, setPage] = useState("Home")
  const [cache, setCache] = useState({})

  useEffect(() => {
    const endpoints = ['/home', '/trends', '/skills', '/postings', '/salary']
    endpoints.forEach((endpoint) => {
      axios.get(`${API_BASE}${endpoint}`).then(function (res) {
        setCache((prev) => ({ ...prev, [endpoint]: res.data }))
      }).catch(function (error) {
        console.warn(`API fetch failed for ${endpoint}:`, error?.message || error)
        setCache((prev) => ({ ...prev, [endpoint]: null }))
      })
    })
  }, [])

  let showing_page
  if (page === "Home") showing_page = <Home setPage={setPage} cachedData={cache['/home']} />
  else if (page === "DailyTrends") showing_page = <DailyTrends cachedData={cache['/trends']} />
  else if (page === "SkillsView") showing_page = <SkillsView cachedData={cache['/skills']} />
  else if (page === "Salary") showing_page = <Salary cachedData={cache['/salary']} />
  else showing_page = <Postings cachedData={cache['/postings']} />

  return (
    <div style = {{fontFamily: "Inter, sans-serif", padding: "0", width: "100%"}}>
      <Layout page={page} setPage={setPage}>{showing_page}</Layout>
      <Analytics />
    </div>
  )
}
