import {useState, useEffect, useLayoutEffect} from 'react'
import {DailyTrends} from "./pages/DailyTrends.jsx"
import {SkillsView} from "./pages/SkillsView.jsx"
import {Postings} from "./pages/Postings.jsx"
import {Salary} from "./pages/Salary.jsx"
import Layout from "./components/Layout.jsx"
import axios from 'axios'
import {Analytics} from "@vercel/analytics/react"
import {ResumeAnalyzer} from "./pages/Resume.jsx"


const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  // The dashboard is the product's primary job-to-be-done, so users arrive
  // directly at the market signal instead of a promotional landing page.
  const [page, setPage] = useState("DailyTrends")
  const [cache, setCache] = useState({})

  // Do not let a direct revisit restore the scroll position from a previous
  // dashboard session. This is restored when the app unmounts.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined

    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  // Pages are swapped in place rather than through URL routes. Reset once
  // immediately and once after the browser has finished its initial layout.
  useLayoutEffect(() => {
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)
    return () => window.cancelAnimationFrame(frame)
  }, [page])

  useEffect(() => {
    const endpoints = ['/trends', '/trends/forecast', '/skills', '/postings', '/salary', '/metadata']
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
  if (page === "DailyTrends") showing_page = <DailyTrends cachedData={cache['/trends']} forecastData={cache['/trends/forecast']} />
  else if (page === "SkillsView") showing_page = <SkillsView cachedData={cache['/skills']} />
  else if (page === "Salary") showing_page = <Salary cachedData={cache['/salary']} />
  else if (page === "ResumeAnalyzer") showing_page = <ResumeAnalyzer />
  else showing_page = <Postings cachedData={cache['/postings']} />

  return (
    <div style = {{fontFamily: "Inter, sans-serif", padding: "0", width: "100%"}}>
      <Layout page={page} setPage={setPage} lastScrapedAt={cache['/metadata']?.last_scraped_at}>
        {showing_page}
      </Layout>
      <Analytics />
    </div>
  )
}
