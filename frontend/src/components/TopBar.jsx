import React from 'react'

export default function TopBar({ page, onMenuClick }) {
  return (
    <div className="topbar-root">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="menu-btn" onClick={onMenuClick}>☰</button>
          <div className="topbar-page">{page}</div>
        </div>
        <div className="topbar-sync">Synced once a day</div>
      </div>
    </div>
  )
}
