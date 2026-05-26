import {useEffect, useState} from "react"
import axios from "axios"
import {LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts"
export function Dashboard({setPage, page}) {
        const [data, setData] = useState([])

        useEffect(function() {
                axios.get("http://localhost:8000/trends").then(function(answer){
                        return setData(answer.data)
                })
        }, [])

        return (
                <div className="card">
                    <div className="page-header">
                        <h2>Dashboard</h2>
                        <p>Explore posting trends over time to identify hiring momentum and market shifts.</p>
                    </div>

                    <div style={{height:420}}>
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
                </div>
        )
}

