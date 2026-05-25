import {useEffect, useState} from "react"
import axios from "axios"
import {Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts"

export function SkillsView() {
    const [data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/skills").then(
                function(answer) {
                    return setData(answer.data)})}, [])

    return (
        <div>
            <h2>Top Skills In Demand</h2>
            <BarChart width = {800} height = {400} data = {data}>
                <XAxis dataKey = "skill" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
        </div>
    )
}

