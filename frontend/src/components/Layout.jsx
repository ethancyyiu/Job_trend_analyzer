import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import '../styles/layout.css'

export function Layout({page, setPage, children}){
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Sidebar page={page} setPage={setPage} />
      </aside>

      <div className="app-main">
        <TopBar />
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
