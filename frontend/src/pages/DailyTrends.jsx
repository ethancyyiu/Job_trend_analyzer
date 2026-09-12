import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { CategoryToggle } from "../components/CategoryToggle";
import { AdviceRow, PageHero } from "../components/AdviceModules";

export function DailyTrends({ cachedData, forecastData }) {
  const [active, setActive] = useState([
    "software engineer",
    "data engineer",
    "machine learning engineer",
    "data scientist",
    "data analyst",
    "others",
  ]);
  const data = Array.isArray(cachedData) ? cachedData : [];
  const isLoading = cachedData === undefined;
  const latest = Number(data.at(-1)?.count || 0);
  const previous = Number(data.at(-2)?.count || 0);
  const change = previous
    ? Math.round(((latest - previous) / previous) * 100)
    : 0;
  const forecast = Array.isArray(forecastData?.forecast)
    ? forecastData.forecast
    : [];
  const categoryForecasts = forecastData?.category_forecasts ?? {};
  const lastDataIndex = data.length - 1;
  const forecastKey = (category) => `${category}Forecast`;
  const chartData = [
    ...data.map((row, index) => ({
      ...row,
      actualCount: Number(row.count ?? 0),
      forecastCount: index === lastDataIndex ? Number(row.count ?? 0) : null,
      ...Object.fromEntries(
        Object.keys(categoryForecasts).map((category) => [
          forecastKey(category),
          index === lastDataIndex ? Number(row[category] ?? 0) : null,
        ]),
      ),
    })),
    ...forecast.map((row) => {
      const date = row.ds ? row.ds.slice(0, 10) : row.date;
      return {
        date,
        actualCount: null,
        forecastCount: row.yhat == null ? null : Number(row.yhat),
        ...Object.fromEntries(
          Object.entries(categoryForecasts).map(([category, forecasts]) => {
            const categoryForecast = forecasts.find(
              (item) => (item.ds ? item.ds.slice(0, 10) : item.date) === date,
            );
            return [
              forecastKey(category),
              categoryForecast ? Number(categoryForecast.yhat ?? 0) : null,
            ];
          }),
        ),
      };
    }),
  ];
  const markerDate = data.at(-1)?.date ?? null;

  if (isLoading) {
    return <DailyTrendsLoading />;
  }

  return (
    <main className="page-shell">
      <PageHero
        eyebrow="Market outlook"
        title="Read the market, then make your move."
        description="A daily pulse of hiring momentum, translated into a decision about where to put your effort."
        decision={
          change >= 0
            ? "Keep your search active—demand is holding or growing."
            : "Be more selective and tailor every application."
        }
        decisionDetail={`${Math.abs(change)}% movement from the prior day is a signal to adjust your pace, not panic.`}
      />
      <AdviceRow
        meaning={{
          title:
            change >= 0
              ? "Hiring activity is moving in a useful direction."
              : "The market is quieter, so quality matters more.",
          body: `There are ${latest} newly tracked postings in the latest period. Use momentum to choose your application volume and follow-up cadence.`,
        }}
        actions={{
          title: "Move with the signal",
          items: [
            "Pick one role family to prioritize this week.",
            "Use Skills to sharpen your application story.",
            "Review fresh Roles to target before applying broadly.",
          ],
        }}
      />
      <section className="metric-grid">
        <div className="metric-card">
          <span>Latest activity</span>
          <strong>{latest}</strong>
          <p>New postings in the latest period</p>
        </div>
        <div className="metric-card">
          <span>Momentum</span>
          <strong>
            {change > 0 ? "+" : ""}
            {change}%
          </strong>
          <p>Change from the prior period</p>
        </div>
        <div className="metric-card">
          <span>Signal history</span>
          <strong>{data.length}</strong>
          <p>Days available to compare</p>
        </div>
      </section>
      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="module-kicker">Market signal</div>
            <h2>Hiring activity and the near-term outlook</h2>
            <p>Use the dotted line as a directional guide, not a guarantee.</p>
          </div>
        </div>
        {cachedData === undefined ? (
          <div className="chart-loading">Loading market activity…</div>
        ) : (
          <>
            <CategoryToggle
              activeCategories={active}
              setActiveCategories={setActive}
            />
            <div style={{ height: 390, marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#dce5ef" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="actualCount"
                    name="Total Postings"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    connectNulls
                    animationDuration={4500}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    name="Total Postings prediction"
                    dataKey="forecastCount"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    connectNulls
                    animationDuration={3000}
                    dot={{ r: 3 }}
                  />
                  {active.includes("software engineer") && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="software engineer"
                        name="Software Engineer"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Software Engineer prediction"
                        dataKey="software engineerForecast"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {active.includes("data engineer") && (
                    <>
                      <Line
                        type="monotone"
                        name="Data Engineer"
                        dataKey="data engineer"
                        stroke="#22C55E"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Data Engineer prediction"
                        dataKey="data engineerForecast"
                        stroke="#22C55E"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {active.includes("machine learning engineer") && (
                    <>
                      <Line
                        type="monotone"
                        name="Machine Learning"
                        dataKey="machine learning engineer"
                        stroke="#16A34A"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Machine Learning Engineer prediction"
                        dataKey="machine learning engineerForecast"
                        stroke="#16A34A"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {active.includes("data scientist") && (
                    <>
                      <Line
                        type="monotone"
                        name="Data Scientist"
                        dataKey="data scientist"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Data Scientist prediction"
                        dataKey="data scientistForecast"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {active.includes("data analyst") && (
                    <>
                      <Line
                        type="monotone"
                        name="Data Analyst"
                        dataKey="data analyst"
                        stroke="#D97706"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Data Analyst prediction"
                        dataKey="data analystForecast"
                        stroke="#D97706"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {active.includes("others") && (
                    <>
                      <Line
                        type="monotone"
                        name="Others"
                        dataKey="others"
                        stroke="#334155"
                        strokeWidth={2}
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        name="Other Categories prediction"
                        dataKey="othersForecast"
                        stroke="#334155"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        connectNulls
                        animationDuration={3000}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                  {markerDate && (
                    <ReferenceLine
                      x={markerDate}
                      stroke="#06B6D4"
                      strokeDasharray="4 4"
                      label={{
                        value: "Latest",
                        position: "insideTopRight",
                        fill: "#06B6D4",
                        fontSize: 12,
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function DailyTrendsLoading() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="Loading market outlook">
      <section className="page-hero loading-page-hero">
        <div className="loading-copy">
          <span className="loading-line loading-eyebrow" />
          <span className="loading-line loading-title" />
          <span className="loading-line loading-title short" />
          <span className="loading-line loading-description" />
        </div>
        <div className="loading-decision">
          <span className="loading-line loading-eyebrow" />
          <span className="loading-line loading-decision-title" />
          <span className="loading-line loading-description" />
        </div>
      </section>
      <section className="metric-grid">
        {["activity", "momentum", "history"].map((key) => (
          <div className="metric-card loading-metric" key={key}>
            <span className="loading-line loading-eyebrow" />
            <span className="loading-line loading-value" />
            <span className="loading-line loading-description" />
          </div>
        ))}
      </section>
      <section className="chart-card loading-chart-card">
        <span className="loading-line loading-eyebrow" />
        <span className="loading-line loading-chart-title" />
        <span className="loading-line loading-description" />
        <div className="loading-chart-area"><span className="loading-chart-wave" /></div>
      </section>
    </main>
  );
}
