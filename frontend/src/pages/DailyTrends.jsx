import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { CategoryToggle } from "../components/CategoryToggle"

export function DailyTrends({ cachedData, forecastData }) {

    
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

    const forecastList = Array.isArray(forecastData?.forecast) ? forecastData.forecast : [];
    const categoryForecasts = forecastData?.category_forecasts ?? {};
    const lastDataIndex = data.length - 1;
    const categoryForecastKey = (category) => `${category}Forecast`;
    const chartData = [
        // Give the forecast series the final actual value as its first point. This
        // anchors the dotted segment exactly where the solid series ends.
        ...data.map((row, index) => ({
            ...row,
            actualCount: Number(row.count ?? 0),
            forecastCount: index === lastDataIndex ? Number(row.count ?? 0) : null,
            ...Object.fromEntries(
                Object.keys(categoryForecasts).map((category) => [
                    categoryForecastKey(category),
                    index === lastDataIndex ? Number(row[category] ?? 0) : null,
                ])
            ),
        })),
        ...forecastList.map((row) => {
            const date = row.ds ? row.ds.slice(0, 10) : row.date;
            return {
            date,
            actualCount: null,
            forecastCount: Number(row.yhat ?? 0),
            count: null,
            ...Object.fromEntries(
                Object.entries(categoryForecasts).map(([category, forecasts]) => {
                    const categoryForecast = forecasts.find((item) =>
                        (item.ds ? item.ds.slice(0, 10) : item.date) === date
                    );
                    return [categoryForecastKey(category), categoryForecast ? Number(categoryForecast.yhat ?? 0) : null];
                })
            ),
        }})
    ];

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
                </div>
                <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Line type="monotone" dataKey="actualCount" stroke="#C86541" strokeWidth={2} connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            <Line type="monotone" dataKey="forecastCount" stroke="#C86541" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            {activeCategories.includes("software engineer") && (
                                <Line type="monotone" dataKey="software engineer" stroke="#FF0000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("software engineer") && (
                                <Line type="monotone" dataKey="software engineerForecast" stroke="#FF0000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data engineer") && (
                                <Line type="monotone" dataKey="data engineer" stroke="#ffd700" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data engineer") && (
                                <Line type="monotone" dataKey="data engineerForecast" stroke="#ffd700" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("machine learning engineer") && (
                                <Line type="monotone" dataKey="machine learning engineer" stroke="#008000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("machine learning engineer") && (
                                <Line type="monotone" dataKey="machine learning engineerForecast" stroke="#008000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data scientist") && (
                                <Line type="monotone" dataKey="data scientist" stroke="#0000FF" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data scientist") && (
                                <Line type="monotone" dataKey="data scientistForecast" stroke="#0000FF" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data analyst") && (
                                <Line type="monotone" dataKey="data analyst" stroke="#800080" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data analyst") && (
                                <Line type="monotone" dataKey="data analystForecast" stroke="#800080" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("others") && (
                                <Line type="monotone" dataKey="others" stroke="#000000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("others") && (
                                <Line type="monotone" dataKey="othersForecast" stroke="#000000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
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

