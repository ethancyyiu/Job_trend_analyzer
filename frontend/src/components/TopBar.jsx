import React from 'react'

export function TopBar({ onMenuClick }) {
  return (
    <div className="topbar-root">
      <div className="topbar-inner">
        <button className="menu-btn" onClick={onMenuClick}>☰</button>
      </div>
    </div>
  )
}
