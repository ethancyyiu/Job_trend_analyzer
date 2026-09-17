// Layout.jsx
import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import '../styles/layout.css'

export default function Layout({ page, setPage, lastScrapedAt, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`app-shell ${page === 'Overview' || page === 'Postings' ? 'overview-shell' : ''}`}>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar page={page} lastScrapedAt={lastScrapedAt} setPage={(p) => { setPage(p); setSidebarOpen(false) }} />
      </aside>
      <div className="app-main">
        <TopBar page={page} lastScrapedAt={lastScrapedAt} onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="app-content">{children}</div>
      </div>
    </div>
  )
}
