import {useEffect, useState} from "react"
import axios from "axios"
import {Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts"
import Nav from "../components/Nav"

export function SkillsView({setPage, page}) {
        const [data, setData] = useState([])

        useEffect(function() {
                axios.get("http://localhost:8000/skills").then(function(answer){
                        return setData(answer.data)
                })
        }, [])

        return (
                <div className="page-root">
                    <Nav page={page} setPage={setPage} />
                    <div className="page-header">
                        <h2>Skills</h2>
                        <p>Track the most requested skills to guide hiring, training, and career planning.</p>
                    </div>

                    <main className="page-content" style={{height:420}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="skill" />
                                <YAxis />
                                <Tooltip />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Bar dataKey="count" fill="#06B6D4" />
                            </BarChart>
                        </ResponsiveContainer>
                    </main>
                </div>
        )
}

