import {useEffect, useState} from "react"
import axios from "axios"
import {LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts"
import Nav from "../components/Nav"

export function Dashboard({setPage, page}) {
        const [data, setData] = useState([])

        useEffect(function() {
                axios.get("http://localhost:8000/trends").then(function(answer){
                        return setData(answer.data)
                })
        }, [])

        return (
                <div className="page-root">
                    <Nav page={page} setPage={setPage} />
                    <div className="page-header">
                        <h2>Dashboard</h2>
                        <p>Explore posting trends over time to identify hiring momentum and market shifts.</p>
                    </div>

                    <main className="page-content">
                        <div style={{height:400}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} />
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </main>
                </div>
        )
}

