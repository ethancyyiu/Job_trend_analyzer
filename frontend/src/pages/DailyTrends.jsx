import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./DailyTrends.css";

const categories = ["software engineer", "data engineer", "machine learning engineer", "data scientist", "data analyst", "others"];
const colors = { "software engineer": "#D97706", "data engineer": "#71717A", "machine learning engineer": "#A16207", "data scientist": "#52525B", "data analyst": "#A1A1AA", others: "#D4D4D8" };
const label = (category) => category.replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date); };

export function DailyTrends({ cachedData, forecastData }) {
  const [active, setActive] = useState(categories.slice(0, 3));
  const data = useMemo(() => [...(Array.isArray(cachedData) ? cachedData : [])].sort((a, b) => new Date(a.date) - new Date(b.date)).map((row) => ({ ...row, label: formatDate(row.date), actual: Number(row.count) || 0 })), [cachedData]);
  const forecast = Array.isArray(forecastData?.forecast) ? forecastData.forecast : [];
  const last = data.at(-1);
  const previous = data.at(-2);
  const change = previous?.actual ? ((last.actual - previous.actual) / previous.actual) * 100 : null;
  const chartData = [...data.map((row, index) => ({ ...row, forecast: index === data.length - 1 ? row.actual : null })), ...forecast.map((row) => ({ label: formatDate(row.ds || row.date), actual: null, forecast: row.yhat == null ? null : Number(row.yhat) }))];
  const toggleCategory = (category) => setActive((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);

  return <main className="trends-page">
    <header className="trends-header"><h1>Trends</h1><p>Hiring activity and the near-term outlook from your tracked postings.</p></header>
    <section className="trends-summary" aria-label="Trend summary"><Summary label="Latest activity" value={last ? last.actual.toLocaleString() : "-"} note="new postings in the latest period" /><Summary label="Momentum" value={change == null ? "-" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`} note="compared with the prior period" accent /><Summary label="History" value={data.length || "-"} note="days of available activity" /></section>
    <section className="trends-chart-section"><Heading title="Hiring activity" caption="Daily posting totals, with a directional forecast" />
      <div className="trends-filters" aria-label="Visible role categories">{categories.map((category) => <button key={category} className={active.includes(category) ? "active" : ""} onClick={() => toggleCategory(category)}>{label(category)}</button>)}</div>
      <div className="trends-chart">{cachedData === undefined ? <div className="trends-state">Loading market activity...</div> : data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E4E4E7" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={26} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="actual" name="Total postings" stroke="#111" strokeWidth={1.6} dot={false} connectNulls /><Line type="monotone" dataKey="forecast" name="Forecast" stroke="#D97706" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />{active.map((category) => <Line key={category} type="monotone" dataKey={category} name={label(category)} stroke={colors[category]} strokeWidth={1.35} dot={false} />)}</LineChart></ResponsiveContainer> : <div className="trends-state">No trend data is available yet.</div>}</div>
      <div className="trends-legend"><span><i className="actual" />Actual activity</span><span><i className="forecast" />Forecast</span></div>
    </section>
  </main>;
}

function Summary({ label: summaryLabel, value, note, accent = false }) { return <article><span>{summaryLabel}</span><div><strong className={accent ? "accent" : ""}>{value}</strong><small>{note}</small></div></article>; }
function Heading({ title, caption }) { return <div className="trends-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }
