import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { CategoryToggle } from "../components/CategoryToggle"

function MetricValue({ isLoading, children }) {
    if (isLoading) {
        return <span className="metric-value-skeleton" aria-label="Loading value" />
    }

    return <strong>{children}</strong>
}

export function DailyTrends({ cachedData, forecastData }) {

    
    const [activeCategories, setActiveCategories] = useState([
        "software engineer",
        "data engineer",
        "machine learning engineer",
        "data scientist",
        "data analyst",
        "others"
    ]);

    const isLoading = cachedData === undefined
    const hasLoadError = cachedData === null
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
                <p>Monitor the latest hiring activity and compare demand across roles.</p>
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>New postings today</span>
                    <MetricValue isLoading={isLoading}>{latest}</MetricValue>
                    <p>Number of postings whose date_posted is today</p>
                </div>
                <div className="metric-card">
                    <span>Momentum</span>
                    {isLoading ? <MetricValue isLoading /> : <strong>
                      {changeLabel}
                        <span className={`trend-pill ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                            {trendSymbol}
                        </span>
                    </strong>}
                    <p>Change from the prior period, so you know if demand is accelerating</p>
                </div>
                <div className="metric-card">
                    <span>Number of Days</span>
                    <MetricValue isLoading={isLoading}>{data.length}</MetricValue>
                    <p>Data points available for analysis</p>
                </div>
            </div>

            {!isLoading && !hasLoadError && <CategoryToggle 
              activeCategories={activeCategories}
              setActiveCategories={setActiveCategories}
            />}

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Activity Trend by Date</h3>
                </div>
                {isLoading ? (
                  <div className="chart-loading" role="status">Loading market activity…</div>
                ) : hasLoadError ? (
                  <div className="chart-loading chart-error" role="alert">We couldn’t load trend data. Please refresh and try again.</div>
                ) : <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Line type="monotone" dataKey="actualCount" name = "Total Postings" stroke="#C86541" strokeWidth={2} connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            <Line type="monotone" name="Total Postings prediction" dataKey="forecastCount" stroke="#C86541" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            {activeCategories.includes("software engineer") && (
                                <Line type="monotone" dataKey="software engineer" name="Software Engineer" stroke="#FF0000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("software engineer") && (
                                <Line type="monotone" name="Software Engineer prediction" dataKey="software engineerForecast" stroke="#FF0000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data engineer") && (
                                <Line type="monotone" name="Data Engineer" dataKey="data engineer" stroke="#ffd700" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data engineer") && (
                                <Line type="monotone" name="Data Engineer prediction" dataKey="data engineerForecast" stroke="#ffd700" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("machine learning engineer") && (
                                <Line type="monotone" name="Machine Learning" dataKey="machine learning engineer" stroke="#008000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("machine learning engineer") && (
                                <Line type="monotone" name="Machine Learning Engineer prediction" dataKey="machine learning engineerForecast" stroke="#008000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data scientist") && (
                                <Line type="monotone" name="Data Scientist" dataKey="data scientist" stroke="#0000FF" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data scientist") && (
                                <Line type="monotone" name="Data Scientist prediction" dataKey="data scientistForecast" stroke="#0000FF" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data analyst") && (
                                <Line type="monotone" name="Data Analyst" dataKey="data analyst" stroke="#800080" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("data analyst") && (
                                <Line type="monotone" name="Data Analyst prediction" dataKey="data analystForecast" stroke="#800080" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("others") && (
                                <Line type="monotone" anme = "Others" dataKey="others" stroke="#000000" strokeWidth={2} animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {activeCategories.includes("others") && (
                                <Line type="monotone" name="Other Categories prediction" dataKey="othersForecast" stroke="#000000" strokeWidth={2} strokeDasharray="6 6" connectNulls animationDuration={3000} dot={{ r: 3 }}/>
                            )}
                            {markerDate ? (
                              <ReferenceLine x={markerDate} stroke="var(--accent-mid)" strokeDasharray="4 4" label={{ value: 'Latest', position: 'insideTopRight', fill: '#bf7a67', fontSize: 12 }} />
                            ) : null}
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                </div>}
            </div>
        </div>
    )
}

