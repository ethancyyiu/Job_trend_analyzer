import {useEffect, useState} from "react"
import axios from "axios"
import {LineChart, Line, XAxis, YAxis, ToolTip, CartesianGrid} from "recharts"

export function dashboard() {
    const [data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/trends").then(
                function(answer) {
                    return setData(answer)})}, [])

    return (
        <div>
            <h2>Postings Over Time</h2>
            <LineChart width = {800} height = {400} data = {data}>
                <XAxis dateKey = "date" />
                <YAxis />
                <Line type = "monotone" dataKey = "count" stroke = "#8884d8" />
                <CartesianGrid strokeDasharray = "3 3" />
                <ToolTip />
            </LineChart>
        </div>
    )
}

