import { useEffect, useState } from "react"
import axios from "axios"
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
const API_BASE = import.meta.env.VITE_API_URL || ''
export function SkillsView({ setPage, page }) {
    const [data, setData] = useState({skills: [], concentration: 0})

    useEffect(function () {
        axios.get(`${API_BASE}/skills`).then(function (answer) {
            return setData(answer.data)
        }).catch(function () {
            setData({ skills: [], concentration: 0 })
        })
    }, [])

    let skills = data.skills;

    let topSkill;

    if (skills.length > 0) {
        const copy = skills.slice(); 
        copy.sort((a, b) => b.count - a.count); 
        topSkill = copy[0].skill; 
    } else {
        topSkill = "N/A";
    }

    const concentration = Math.round(data.concentration);

    // Get top 5 skills for leaderboard
    const topFiveSkills = skills.length > 0 
        ? skills.slice().sort((a, b) => b.count - a.count).slice(0, 5)
        : [];

    return (
        <div className="card">
            <div className="page-header">
                <h2>Skills</h2>
                <p>Track the most requested skills to guide hiring, training, and career planning.</p>
            </div>

            <div className="skills-two-column">
                <div className="skills-chart-column">
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

                <div className="skills-sidebar">
                    <div className="skills-leaderboard">
                        <div className="leaderboard-header">
                            <h3>Top 5 skills</h3>
                        </div>
                        <div className="leaderboard-list">
                            {topFiveSkills.length > 0 ? (
                                topFiveSkills.map((skill, index) => (
                                    <div key={index} className="leaderboard-item">
                                        <div className="leaderboard-rank">#{index + 1}</div>
                                        <div className="leaderboard-content">
                                            <div className="leaderboard-skill">{skill.skill}</div>
                                            <div className="leaderboard-count">{skill.count} postings</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="leaderboard-empty">No skills data available</div>
                            )}
                        </div>

                        <div className="skills-stats">
                            <div className="stat-item">
                                <span>Total skills</span>
                                <strong>{skills.length}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Concentration</span>
                                <strong>{concentration}%</strong>
                                <p className="stat-note">Top 3 of all demand</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="section-note">Use this page to identify the skill categories driving demand today, so your team can invest in the right talent and training.</p>
        </div>
    )
}

