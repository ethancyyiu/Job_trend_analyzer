import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
export function SkillsView({ cachedData }) {
    const data = cachedData || { skills: [], concentration: 0 }
    let skills = data.skills

    let topSkill;

    if (skills.length > 0) {
        const copy = skills.slice(); 
        copy.sort((a, b) => b.count - a.count); 
        topSkill = copy[0].skill; 
    } else {
        topSkill = "N/A";
    }

    const concentration = Math.round(data.concentration);

    return (
        <div className="card">
            <div className="page-header">
                <h2>Skills</h2>
                <p>Track the most requested skills to guide hiring, training, and career planning.</p>
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>Top skill</span>
                    <strong>{topSkill}</strong>
                    <p>The highest-demand skill in the current dataset</p>
                </div>
                <div className="metric-card">
                    <span>Skills tracked</span>
                    <strong>{skills.length}</strong>
                    <p>Unique skills included in the current analysis</p>
                </div>
                <div className="metric-card">
                    <span>Concentration Index</span>
                    <strong>{concentration}%</strong>
                    <p>Top 3 Skills = {concentration}% of all demand</p>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Skill demand by volume</h3>
                    <p>Compare the most sought-after skills in a clean bar chart designed for quick interpretation.</p>
                </div>
                <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={skills}>
                            <XAxis dataKey="skill" />
                            <YAxis />
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="count" fill="#C86541">
                                {skills.map((entry, index) => (
                                  <Cell key={`cell-${entry.skill}`} fill={index < 5 ? 'var(--accent)' : 'var(--accent-mid)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

