import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { CategoryToggle } from "../components/CategoryToggle"

export function DailyTrends({ cachedData }) {
    const [activeCategories, setActiveCategories] = useState([
        "software engineer",
        "data engineer",
        "machine learning engineer",
        "data scientist",
        "data analyst",
        "others"
    ]);

    let data;
    if (Array.isArray(cachedData)) {
        data = cachedData;
    }
    else {
        data = [];
    }

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
                {/* <p>Explore posting trends over time to identify hiring momentum and market shifts.</p> */}
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>New postings today</span>
                    <strong>{latest}</strong>
                    <p>Number of postings whose date_posted is today</p>
                </div>
                <div className="metric-card">
                    <span>Momentum</span>
                    <strong>
                      {changeLabel}
                        <span className={`trend-pill ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                            {trendSymbol}
                        </span>
                    </strong>
                    <p>Change from the prior period, so you know if demand is accelerating</p>
                </div>
                <div className="metric-card">
                    <span>Number of Days</span>
                    <strong>{data.length}</strong>
                    <p>Data points available for analysis</p>
                </div>
            </div>

            <CategoryToggle 
                activeCategories={activeCategories}
                setActiveCategories={setActiveCategories}
            />

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Activity Trend by Date</h3>
                    {/* <p>Track how job posting volume shifts over time so hiring teams can react to momentum sooner.</p> */}
                </div>
                {/* <div className="toggle-row">
                    <button onClick={() => setPeriod("7d")}>7 days</button>
                    <button onClick={() => setPeriod("30d")}>30 days</button>
                    <button onClick={() => setPeriod("90d")}>90 days</button>
                    <button onClick={() => setPeriod("all")}>All time</button>
                </div> */}
                <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Line type="monotone" dataKey="count" stroke="#C86541" strokeWidth={2} />
                            <Line type="monotone" dataKey="software engineer" stroke="#FF0000" strokeWidth={2} />
                            <Line type="monotone" dataKey="data engineer" stroke="#FFD700" strokeWidth={2} />
                            <Line type="monotone" dataKey="machine learning engineer" stroke="#008000" strokeWidth={2} />
                            <Line type="monotone" dataKey="data scientist" stroke="#0000FF" strokeWidth={2} />
                            <Line type="monotone" dataKey="data analyst" stroke="#800080" strokeWidth={2} />
                            <Line type="monotone" dataKey="others" stroke="#000000" strokeWidth={2} />
                            {markerDate ? (
                              <ReferenceLine x={markerDate} stroke="var(--accent-mid)" strokeDasharray="4 4" label={{ value: 'Latest', position: 'insideTopRight', fill: '#bf7a67', fontSize: 12 }} />
                            ) : null}
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

