import {useEffect, useState} from "react"
import axios from "axios"
import {LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts"
export function Dashboard({setPage, page}) {
        const [data, setData] = useState([])

        useEffect(function() {
                axios.get("http://localhost:8000/trends").then(function(answer){
                        return setData(answer.data)
                })
        }, [])

        const latest = data.length ? data[data.length - 1].count : 0
        const previous = data.length > 1 ? data[data.length - 2].count : 0
        const change = previous ? Math.round(((latest - previous) / previous) * 100) : 0
        const changeLabel = data.length > 1 ? `${change > 0 ? "+" : ""}${change}%` : "—"

        return (
                <div className="card">
                    <div className="page-header">
                        <h2>Dashboard</h2>
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
                            <strong>{changeLabel}</strong>
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
                        <div style={{height:420}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} />
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

