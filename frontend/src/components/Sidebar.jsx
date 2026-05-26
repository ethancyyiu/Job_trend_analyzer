import React from 'react'
import Nav from './Nav'
import logo from '../assets/market_pulse_logo.png'


export default function Sidebar({ page, setPage }) {
    return (
        <div className="sidebar-root">
            <div className="sidebar-brand" onClick={() => setPage('Home')}>
                <div className="brand-logo">
                    <div className="brand-logo">
                        <img
                            src={logo}
                            alt="Market Pulse Logo"
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }}
                        />
                    </div>

                </div>
                <div className="brand-name">Job Trend</div>
            </div>

            <nav className="sidebar-nav">
                <Nav page={page} setPage={setPage} />
            </nav>

            <div className="sidebar-footer">
                <small>© {new Date().getFullYear()} Job Trend Analyzer</small>
            </div>
        </div>
    )
}
