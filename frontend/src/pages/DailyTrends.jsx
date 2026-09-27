import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./DailyTrends.css";

const categories = ["software engineer", "data engineer", "machine learning engineer", "data scientist", "data analyst", "others"];
const colors = { "software engineer": "#D97706", "data engineer": "#71717A", "machine learning engineer": "#A16207", "data scientist": "#52525B", "data analyst": "#A1A1AA", others: "#D4D4D8" };
const label = (category) => category.replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date); };
const categoryPredictionKey = (category) => `category-prediction-${category}`;

export function DailyTrends({ cachedData, forecastData }) {
  const [active, setActive] = useState(categories.slice(0, 3));
  const data = useMemo(() => [...(Array.isArray(cachedData) ? cachedData : [])].sort((a, b) => new Date(a.date) - new Date(b.date)).map((row) => ({ ...row, label: formatDate(row.date), actual: Number(row.count) || 0 })), [cachedData]);
  const forecast = Array.isArray(forecastData?.forecast) ? forecastData.forecast : [];
  const categoryForecasts = forecastData?.category_forecasts && typeof forecastData.category_forecasts === "object" ? forecastData.category_forecasts : {};
  const forecastReady = forecast.length > 0;
  const forecastChartData = forecast.map((row) => ({ label: formatDate(row.ds || row.date), prediction: Number(row.yhat) || 0 }));
  const last = data.at(-1);
  const previous = data.at(-2);
  const change = previous?.actual ? ((last.actual - previous.actual) / previous.actual) * 100 : null;
  const latestWeek = data.slice(-7).reduce((sum, row) => sum + row.actual, 0);
  const priorWeek = data.slice(-14, -7).reduce((sum, row) => sum + row.actual, 0);
  const weekChange = priorWeek ? ((latestWeek - priorWeek) / priorWeek) * 100 : null;
  const forecastSummary = forecastData?.summary;
  const forecastStatus = forecastReady ? `${forecastSummary?.trend || "Forecast ready"} - ${forecastSummary?.confidence || "Model"} confidence` : "Forecast is being generated";
  const chartData = useMemo(() => {
    const lastHistoricalIndex = data.length - 1;
    const historical = data.map((row, index) => {
      const point = { ...row, forecast: index === lastHistoricalIndex ? row.actual : null };
      categories.forEach((category) => {
        if (Array.isArray(categoryForecasts[category]) && categoryForecasts[category].length) {
          point[categoryPredictionKey(category)] = index === lastHistoricalIndex ? Number(row[category]) || 0 : null;
        }
      });
      return point;
    });
    const futureByDate = new Map();
    const addFuturePoint = (row, key, value) => {
      const date = row.ds || row.date;
      if (!date) return;
      const point = futureByDate.get(date) || { label: formatDate(date), actual: null };
      point[key] = value;
      futureByDate.set(date, point);
    };

    forecast.forEach((row) => addFuturePoint(row, "forecast", row.yhat == null ? null : Number(row.yhat)));
    categories.forEach((category) => {
      const categoryForecast = categoryForecasts[category];
      if (!Array.isArray(categoryForecast)) return;
      categoryForecast.forEach((row) => addFuturePoint(row, categoryPredictionKey(category), row.yhat == null ? null : Number(row.yhat)));
    });

    return [...historical, ...[...futureByDate.entries()].sort(([left], [right]) => new Date(left) - new Date(right)).map(([, point]) => point)];
  }, [data, forecast, categoryForecasts]);
  const toggleCategory = (category) => setActive((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);

  if (cachedData === undefined || forecastData === undefined) return <TrendsLoading />;

  return <main className="trends-page">
    <header className="trends-header"><h1>Trends</h1><p>Hiring activity and the near-term outlook from your tracked postings.</p></header>
    <section className="trends-summary" aria-label="Trend summary"><Summary label="Latest activity" value={last ? last.actual.toLocaleString() : "-"} note="new postings in the latest period" /><Summary label="Momentum" value={change == null ? "-" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`} note="compared with the prior period" accent /><Summary label="History" value={data.length || "-"} note="days of available activity" /></section>
    <section className="trends-chart-section"><Heading title="Hiring activity" caption="Daily posting totals and category forecasts" />
      <div className="trends-filters" aria-label="Visible role categories">{categories.map((category) => <button key={category} className={active.includes(category) ? "active" : ""} onClick={() => toggleCategory(category)}>{label(category)}</button>)}</div>
      <div className="trends-chart">{data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E4E4E7" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={26} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="actual" name="Total postings" stroke="#111" strokeWidth={1.6} dot={false} connectNulls />{forecastReady && <Line type="monotone" dataKey="forecast" name="Total forecast" stroke="#D97706" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />}{active.map((category) => <Line key={category} type="monotone" dataKey={category} name={label(category)} stroke={colors[category]} strokeWidth={1.35} dot={false} />)}{active.map((category) => Array.isArray(categoryForecasts[category]) && categoryForecasts[category].length ? <Line key={`${category}-prediction`} type="monotone" dataKey={categoryPredictionKey(category)} name={`${label(category)} forecast`} stroke={colors[category]} strokeWidth={1.35} strokeDasharray="5 4" dot={false} connectNulls /> : null)}</LineChart></ResponsiveContainer> : <div className="trends-state">No trend data is available yet.</div>}</div>
      <div className="trends-legend"><span><i className="actual" />Observed activity</span>{forecastReady ? <span><i className="forecast" />Dotted lines show forecasts, including selected categories</span> : <span className="trends-forecast-status">Forecast is being generated</span>}</div>
    </section>
    <section className="trends-comparison" aria-label="Period comparison">
      <article><span>Latest 7 days</span><strong>{latestWeek.toLocaleString()}</strong><small>postings recorded</small></article>
      <article><span>Prior 7 days</span><strong>{data.length >= 14 ? priorWeek.toLocaleString() : "-"}</strong><small>postings recorded</small></article>
      <article><span>Period change</span><strong className={weekChange == null ? "" : weekChange >= 0 ? "positive" : "negative"}>{weekChange == null ? "-" : `${weekChange >= 0 ? "+" : ""}${weekChange.toFixed(1)}%`}</strong><small>latest versus prior</small></article>
      <article><span>Forecast status</span><strong className={forecastReady ? "forecast-ready" : ""}>{forecastReady ? forecastSummary?.confidence || "Ready" : "Pending"}</strong><small>{forecastStatus}</small></article>
    </section>
    <section className="trends-prediction-section">
      <Heading title="Predicted posting volume" caption="Daily forecast for the next available forecast period" />
      <div className="trends-prediction-chart">{forecastReady ? <ResponsiveContainer width="100%" height="100%"><BarChart data={forecastChartData} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E4E4E7" /><XAxis dataKey="label" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip formatter={(value) => [Number(value).toLocaleString(), "Predicted postings"]} cursor={{ fill: "#F1F1F3" }} /><Bar dataKey="prediction" name="Predicted postings" fill="#D97706" fillOpacity={0.82} radius={[2, 2, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer> : <div className="trends-prediction-state">Prediction data will appear when the forecast is ready.</div>}</div>
    </section>
  </main>;
}

function Summary({ label: summaryLabel, value, note, accent = false }) { return <article><span>{summaryLabel}</span><div><strong className={accent ? "accent" : ""}>{value}</strong><small>{note}</small></div></article>; }
function Heading({ title, caption }) { return <div className="trends-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }
function TrendsLoading() { return <main className="trends-page trends-loading" aria-busy="true"><div className="trends-loading-line title" /><div className="trends-loading-line subtitle" /><div className="trends-loading-stats">{[1, 2, 3].map((item) => <span key={item} />)}</div><div className="trends-loading-chart" /></main>; }
