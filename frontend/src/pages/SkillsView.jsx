import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import "./SkillsView.css";

const formatNumber = (value) => Number(value || 0).toLocaleString();

export function SkillsView({ cachedData }) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const ranked = [...(cachedData?.skills || [])].sort((a, b) => Number(b.count) - Number(a.count)).map((item) => ({ skill: String(item.skill), count: Number(item.count) || 0 }));
  const chartSkills = ranked.slice(0, 10);
  const detailSkills = showAllSkills ? ranked : chartSkills;
  const total = Number(cachedData?.total_mentions) || ranked.reduce((sum, skill) => sum + skill.count, 0);
  const concentration = cachedData?.concentration == null ? null : Number(cachedData.concentration);
  const momentum = cachedData?.momentum || { rising: [], falling: [] };
  const topThreeCount = ranked.slice(0, 3).reduce((sum, skill) => sum + skill.count, 0);
  const distribution = total ? [{ name: "Top 3 skills", value: topThreeCount }, { name: "All other skills", value: Math.max(total - topThreeCount, 0) }] : [];

  return <main className="skills-page">
    <header className="skills-header"><h1>Skills</h1><p>Demand across the skills found in your tracked job postings.</p></header>
    <section className="skills-summary" aria-label="Skills summary">
      <Summary label="Top skill" value={ranked[0]?.skill?.toUpperCase() || "-"} note="highest posting count" />
      <Summary label="Skills tracked" value={cachedData ? ranked.length : "-"} note="in the current ranking" />
      <Summary label="Top-three share" value={concentration == null ? "-" : `${concentration.toFixed(1)}%`} note="of tracked demand" />
    </section>
    <section className="skills-grid">
      <div><Heading title="Demand by skill" caption="Posting count for each tracked skill" />
        <div className="skills-chart">{cachedData === undefined ? <div className="skills-state">Loading skills...</div> : ranked.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartSkills} layout="vertical" margin={{ top: 0, right: 18, left: 0, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#E4E4E7" /><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><YAxis type="category" dataKey="skill" axisLine={false} tickLine={false} tickFormatter={(value) => String(value).toUpperCase()} width={100} /><Tooltip formatter={(value) => [formatNumber(value), "Postings"]} cursor={{ fill: "#F1F1F3" }} /><Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={16}>{chartSkills.map((skill, index) => <Cell key={skill.skill} fill={index === 0 ? "#D97706" : "#A1A1AA"} fillOpacity={index === 0 ? 1 : 0.62} />)}</Bar></BarChart></ResponsiveContainer> : <div className="skills-state">No skill data is available yet.</div>}</div>
      </div>
      <div><Heading title="Skill details" caption={showAllSkills ? "Share of all tracked skill mentions" : "Top 10 skills - share of tracked mentions"} />
        <div className="skills-table-wrap"><table className="skills-table"><thead><tr><th>Skill</th><th>Postings</th><th>Share</th></tr></thead><tbody>{detailSkills.map((skill) => <tr key={skill.skill}><td>{skill.skill.toUpperCase()}</td><td>{formatNumber(skill.count)}</td><td>{total ? `${((skill.count / total) * 100).toFixed(1)}%` : "-"}</td></tr>)}</tbody></table></div>
        {ranked.length > 10 && <button className="skills-toggle" type="button" onClick={() => setShowAllSkills((visible) => !visible)}>{showAllSkills ? "Show top 10" : `View all ${ranked.length} skills`}</button>}
      </div>
    </section>
    <section className="skills-insights" aria-label="Skill insights">
      <article className="skills-insight-card"><Heading title="Skill momentum" caption="Latest 30 days vs. prior 30 days" />
        {cachedData === undefined ? <div className="skills-insight-state">Loading momentum...</div> : <div className="skills-momentum"><MomentumList title="Rising" items={momentum.rising} direction="up" /><MomentumList title="Falling" items={momentum.falling} direction="down" /></div>}
      </article>
      <article className="skills-insight-card skills-distribution"><Heading title="Demand concentration" caption="Top 3 skills compared with all others" />
        {cachedData === undefined ? <div className="skills-insight-state">Loading distribution...</div> : distribution.length ? <div className="skills-distribution-content"><div className="skills-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={2} stroke="none">{distribution.map((segment, index) => <Cell key={segment.name} fill={index === 0 ? "#D97706" : "#E4E4E7"} />)}</Pie></PieChart></ResponsiveContainer></div><div><strong>{concentration?.toFixed(1) || "0.0"}%</strong><span>of skill mentions are in the top 3</span></div></div> : <div className="skills-insight-state">No skill data is available yet.</div>}
      </article>
    </section>
  </main>;
}

function Summary({ label, value, note }) { return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Heading({ title, caption }) { return <div className="skills-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }
function MomentumList({ title, items = [], direction }) { return <div className={`skills-momentum-list ${direction}`}><h3>{title}</h3>{items.length ? items.map((item) => <div key={item.skill}><span>{String(item.skill).toUpperCase()}</span><strong>{direction === "up" ? "+" : ""}{formatNumber(item.change)}</strong></div>) : <p>No changes recorded</p>}</div>; }
