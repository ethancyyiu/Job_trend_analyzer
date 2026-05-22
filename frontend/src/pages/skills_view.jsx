import {useEffect, useState} from "react"
import axios from "axios"
import {Bar, BarChart, XAxis, YAxis, ToolTip, CartesianGrid} from "recharts"

export function skills_view() {
    const [data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/trends").then(
                function(answer) {
                    return setData(answer)})}, [])

    return (
        <div>
            <h2>Top Skills In Demand</h2>
            <BarChart width = {800} height = {400} data = {data}>
                <XAxis dateKey = "date" />
                <YAxis />
                <ToolTip />
                <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
        </div>
    )
}

