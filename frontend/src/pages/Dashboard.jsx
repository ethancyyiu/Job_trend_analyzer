import { useEffect, useState } from "react"
import axios from "axios"
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts"
const API_BASE = import.meta.env.VITE_API_URL || ''
export function DailyTrends({ setPage, page }) {
    const [data, setData] = useState([])

    useEffect(function () {
        axios.get(`${API_BASE}/trends`).then(function (answer) {
            return setData(answer.data)
        }).catch(function () {
            setData([])
        })
    }, []) 

    let latest;
    if (data.length > 0) {
        latest = data[data.length - 1].count;
    } else {
        latest = 0;
    }

    let previous;
    if (data.length > 1) {
        previous = data[data.length - 2].count;
    } else {
        previous = 0;
    }

    let change;
    if (previous !== 0) {
        change = Math.round(((latest - previous) / previous) * 100);
    } else {
        change = 0;
    }

    let changeLabel;
    if (data.length > 1) {
        if (change > 0) {
            changeLabel = "+" + change + "%";
        } else {
            changeLabel = change + "%";
        }
    } else {
        changeLabel = "—";
    }

    const trendSymbol = change > 0 ? '▲' : change < 0 ? '▼' : '—'
    const markerDate = data.length > 0 ? data[data.length - 1].date : null

    return (
        <div className="card">
            <div className="page-header">
                <h2>Daily Trends</h2>
                <p>Explore posting trends over time to identify hiring momentum and market shifts.</p>
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>Recent volume</span>
                    <strong>{latest}</strong>
                    <p>Latest posting count from the current data stream.</p>
                </div>
                <div className="metric-card">
                    <span>Momentum</span>
                    <strong>
                      {changeLabel}
                      <span className={`trend-pill ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                        {trendSymbol}
                      </span>
                    </strong>
                    <p>Change from the prior period, so you know if demand is accelerating.</p>
                </div>
                <div className="metric-card">
                    <span>Data points</span>
                    <strong>{data.length}</strong>
                    <p>Total days of posting trends available for analysis.</p>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Real-time posting trend</h3>
                    <p>Track how job posting volume shifts over time so hiring teams can react to momentum sooner.</p>
                </div>
                <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Line type="monotone" dataKey="count" stroke="#C86541" strokeWidth={2} />
                            {markerDate ? (
                              <ReferenceLine x={markerDate} stroke="var(--accent-mid)" strokeDasharray="4 4" label={{ value: 'Latest', position: 'insideTopRight', fill: '#bf7a67', fontSize: 12 }} />
                            ) : null}
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <p className="section-note">Use this view to understand whether posting activity is growing, steady, or cooling, helping you prioritize hiring focus areas.</p>
        </div>
    )
}

