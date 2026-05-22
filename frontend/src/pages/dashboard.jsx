import {useEffect, useState} from "react"
import axios from "axios"
import {LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts"

export function Dashboard() {
    const [data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/trends").then(
                function(answer) {
                    return setData(answer.data)})}, [])

    return (
        <div>
            <h2>Postings Over Time</h2>
            <LineChart width = {800} height = {400} data = {data}>
                <XAxis dataKey = "date" />
                <YAxis />
                <Line type = "monotone" dataKey = "count" stroke = "#8884d8" />
                <CartesianGrid strokeDasharray = "3 3" />
                <Tooltip />
            </LineChart>
        </div>
    )
}

