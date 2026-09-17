import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./SkillsView.css";

const formatNumber = (value) => Number(value || 0).toLocaleString();

export function SkillsView({ cachedData }) {
  const ranked = [...(cachedData?.skills || [])].sort((a, b) => Number(b.count) - Number(a.count)).map((item) => ({ skill: String(item.skill), count: Number(item.count) || 0 }));
  const chartSkills = ranked.slice(0, 10);
  const total = ranked.reduce((sum, skill) => sum + skill.count, 0);
  const concentration = cachedData?.concentration == null ? null : Number(cachedData.concentration);

  return <main className="skills-page">
    <header className="skills-header"><h1>Skills</h1><p>Demand across the skills found in your tracked job postings.</p></header>
    <section className="skills-summary" aria-label="Skills summary">
      <Summary label="Top skill" value={ranked[0]?.skill || "-"} note="highest posting count" />
      <Summary label="Skills tracked" value={cachedData ? ranked.length : "-"} note="in the current ranking" />
      <Summary label="Top-three share" value={concentration == null ? "-" : `${concentration.toFixed(1)}%`} note="of tracked demand" />
    </section>
    <section className="skills-grid">
      <div><Heading title="Demand by skill" caption="Posting count for each tracked skill" />
        <div className="skills-chart">{cachedData === undefined ? <div className="skills-state">Loading skills...</div> : ranked.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartSkills} layout="vertical" margin={{ top: 0, right: 18, left: 0, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#E4E4E7" /><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><YAxis type="category" dataKey="skill" axisLine={false} tickLine={false} width={100} /><Tooltip formatter={(value) => [formatNumber(value), "Postings"]} cursor={{ fill: "#F1F1F3" }} /><Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={16}>{chartSkills.map((skill, index) => <Cell key={skill.skill} fill={index === 0 ? "#D97706" : "#A1A1AA"} fillOpacity={index === 0 ? 1 : 0.62} />)}</Bar></BarChart></ResponsiveContainer> : <div className="skills-state">No skill data is available yet.</div>}</div>
      </div>
      <div><Heading title="Skill details" caption="Share of tracked skill mentions" />
        <div className="skills-table-wrap"><table className="skills-table"><thead><tr><th>Skill</th><th>Postings</th><th>Share</th></tr></thead><tbody>{ranked.map((skill) => <tr key={skill.skill}><td>{skill.skill}</td><td>{formatNumber(skill.count)}</td><td>{total ? `${((skill.count / total) * 100).toFixed(1)}%` : "-"}</td></tr>)}</tbody></table></div>
      </div>
    </section>
  </main>;
}

function Summary({ label, value, note }) { return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Heading({ title, caption }) { return <div className="skills-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }
