import { useEffect, useState } from "react"
import axios from "axios"
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
const API_BASE = import.meta.env.VITE_API_URL || ''
export function SkillsView({ setPage, page }) {
    const [data, setData] = useState([])

    useEffect(function () {
        axios.get(`${API_BASE}/skills`).then(function (answer) {
            return setData(answer.data)
        }).catch(function () {
            setData([])
        })
    }, [])

    let topSkill;

    if (data.length > 0) {
        const copy = data.slice(); // copy array
        copy.sort((a, b) => b.count - a.count); // sort descending
        topSkill = copy[0].skill; // first element's skill
    } else {
        topSkill = "N/A";
    }

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
                    <p>The highest-demand skill in the current dataset.</p>
                </div>
                <div className="metric-card">
                    <span>Skills tracked</span>
                    <strong>{data.length}</strong>
                    <p>Unique skills included in the current analysis.</p>
                </div>
                <div className="metric-card">
                    <span>Market view</span>
                    <strong>Demand-driven</strong>
                    <p>See which skill areas are heating up so you can focus your talent pipeline.</p>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Skill demand by volume</h3>
                    <p>Compare the most sought-after skills in a clean bar chart designed for quick interpretation.</p>
                </div>
                <div style={{ height: 420 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="skill" />
                            <YAxis />
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="count" fill="#C86541">
                                {data.map((entry, index) => (
                                  <Cell key={`cell-${entry.skill}`} fill={index < 5 ? 'var(--accent)' : 'var(--accent-mid)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <p className="section-note">Use this page to identify the skill categories driving demand today, so your team can invest in the right talent and training.</p>
        </div>
    )
}

