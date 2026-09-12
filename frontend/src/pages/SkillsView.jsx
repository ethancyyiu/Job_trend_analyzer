import {Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,} from "recharts";
import { AdviceRow, PageHero } from "../components/AdviceModules";

export function SkillsView({ cachedData }) {
  const skills = cachedData?.skills || [];
  const ranked = [...skills].sort((a, b) => Number(b.count) - Number(a.count));
  const topSkill = ranked[0]?.skill || "your strongest market skill";
  const concentration = cachedData?.concentration
    ? Number(cachedData.concentration).toFixed(1)
    : "—";
  return (
    <main className="page-shell">
      <PageHero
        eyebrow="Skill strategy"
        title="Build the skills that open more doors."
        description="Translate employer demand into a focused learning plan instead of chasing every trend."
        decision={`Prioritize ${topSkill} first.`}
        decisionDetail="It is the clearest current signal in the roles we’re tracking."
      />
      <AdviceRow
        meaning={{
          title: "Demand is concentrated—focus creates leverage.",
          body: `The top three skills represent ${concentration}% of tracked demand. A deliberate core skill stack will be more valuable than a long, unfocused list.`,
        }}
        actions={{
          title: "Make this week count",
          items: [
            `Audit your evidence of ${topSkill} on your resume.`,
            "Choose one adjacent skill to pair with your core expertise.",
            "Create one portfolio proof point before applying.",
          ],
        }}
      />
      <section className="metric-grid">
        <div className="metric-card">
          <span>Best next skill</span>
          <strong>{topSkill}</strong>
          <p>Highest demand in current roles</p>
        </div>
        <div className="metric-card">
          <span>Options to explore</span>
          <strong>{skills.length}</strong>
          <p>Distinct skills in the market</p>
        </div>
        <div className="metric-card">
          <span>Focus signal</span>
          <strong>{concentration}%</strong>
          <p>Demand held by the top three</p>
        </div>
      </section>
      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="module-kicker">Skill map</div>
            <h2>Where your learning effort will travel furthest</h2>
            <p>Use this as a prioritization guide, not a checklist.</p>
          </div>
        </div>
        <div style={{ height: 390 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ranked}
              margin={{ top: 8, right: 8, left: -22, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#dce5ef"
              />
              <XAxis dataKey="skill" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {ranked.map((entry, index) => (
                  <Cell
                    key={entry.skill}
                    fill={index < 3 ? "#06B6D4" : "#88ddea"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
