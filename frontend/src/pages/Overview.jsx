import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './Overview.css'

const ranges = [30, 60]

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

export default function Overview({ trends, skills, postings }) {
  const [days, setDays] = useState(60)
  const chartData = useMemo(() => {
    const allRows = Array.isArray(trends) ? trends : []
    const newestTimestamp = Math.max(...allRows.map((row) => new Date(row.date).getTime()).filter(Number.isFinite))
    const cutoff = Number.isFinite(newestTimestamp) ? newestTimestamp - days * 86400000 : -Infinity
    return allRows.filter((row) => {
      const timestamp = new Date(row.date).getTime()
      return Number.isNaN(timestamp) || timestamp >= cutoff
    })
    .map((row) => ({ ...row, label: formatDate(row.date) }))
  }, [trends, days])
  const recentPostings = postings?.postings || []
  const topSkills = (skills?.skills || []).slice(0, 8)
  const highestSkillCount = Math.max(...topSkills.map((skill) => Number(skill.count) || 0), 1)
  const companyCount = new Set(recentPostings.map((posting) => posting.company).filter(Boolean)).size
  const latest = chartData.at(-1)?.count || 0
  const prior = chartData.at(-2)?.count || 0
  const momentum = prior ? ((latest - prior) / prior) * 100 : null

  return (
    <main className="overview-page">
      <header className="overview-header">
        <div>
          <h1>Overview</h1>
          <p>Live snapshot of the job market from your tracked listings.</p>
        </div>
        <div className="overview-range" aria-label="Trend date range">
          {ranges.map((range) => <button key={range} className={days === range ? 'active' : ''} onClick={() => setDays(range)}>Last {range} days</button>)}
        </div>
      </header>

      <section className="overview-stats" aria-label="Market statistics">
        <Stat label="Recent postings" value={postings ? formatNumber(postings.total_postings) : '—'} note="posted in the last 30 days" />
        <Stat label="Recent companies" value={postings ? formatNumber(companyCount) : '—'} note="among the latest 50 roles" />
        <Stat label="Latest activity" value={Array.isArray(trends) ? formatNumber(latest) : '—'} note={momentum === null ? 'new postings in the latest period' : `${momentum >= 0 ? '+' : ''}${momentum.toFixed(1)}% vs prior period`} accent />
      </section>

      <section className="overview-chart-section">
        <SectionHeading title="Job postings over time" caption={`Last ${days} days · daily totals`} />
        <div className="overview-chart" aria-busy={trends === undefined}>
          {trends === undefined ? <div className="overview-state">Loading posting activity…</div> : chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><defs><linearGradient id="overview-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D97706" stopOpacity={0.14} /><stop offset="100%" stopColor="#D97706" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#E4E4E7" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={28} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip formatter={(value) => [`${formatNumber(value)} postings`, 'Activity']} /><Area type="monotone" dataKey="count" stroke="#D97706" strokeWidth={1.5} fill="url(#overview-area-gradient)" dot={false} activeDot={{ r: 3 }} /></AreaChart></ResponsiveContainer> : <div className="overview-state">No trend data is available yet.</div>}
        </div>
      </section>

      <section className="overview-bottom-grid">
        <div><SectionHeading title="Most in-demand skills" caption="By posting count · tracked listings" />
          <div className="overview-skills">{skills === undefined ? <div className="overview-state">Loading skills…</div> : topSkills.length ? topSkills.map((skill) => <div className="overview-skill" key={skill.skill}><div><span>{String(skill.skill).toUpperCase()}</span><small>{formatNumber(skill.count)}</small></div><i><b style={{ width: `${(Number(skill.count) / highestSkillCount) * 100}%` }} /></i></div>) : <div className="overview-state">No skill data is available yet.</div>}</div>
        </div>
        <div><SectionHeading title="Recent job postings" caption="Latest additions · sorted by posted date" />
          <div className="overview-table-wrap"><table className="overview-table"><thead><tr><th>Role</th><th>Company</th><th>Location</th><th>Posted</th></tr></thead><tbody>{postings === undefined ? <tr><td colSpan="4" className="overview-empty">Loading recent postings…</td></tr> : recentPostings.length ? recentPostings.slice(0, 7).map((posting) => <tr key={posting.id}><td>{posting.title}</td><td>{posting.company || '—'}</td><td>{posting.location || '—'}</td><td>{posting.date_posted ? formatDate(posting.date_posted) : '—'}</td></tr>) : <tr><td colSpan="4" className="overview-empty">No recent postings are available yet.</td></tr>}</tbody></table></div>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value, note, accent = false }) { return <article><span>{label}</span><div><strong className={accent ? 'accent' : ''}>{value}</strong><small>{note}</small></div></article> }
function SectionHeading({ title, caption }) { return <div className="overview-section-heading"><h2>{title}</h2><p>{caption}</p></div> }
