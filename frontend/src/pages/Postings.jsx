import {useEffect, useState} from "react"
import axios from "axios"

export function Postings() {
    const[data, setData] = useState([])

    useEffect(
        function() {
            axios.get("http://localhost:8000/postings").then(
                function(answer) {
                    setData(answer.data)
                }
            )
        }, [])
    
    return(
        <div>
            <h2>Recent Postings</h2>
            <table style = {{width: "100%", borderCollapse: "collapse"}}>
                <thead>
                    <tr>
                        <th style = {{textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px"}}>Title</th>
                        <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Company</th>
                        <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Location</th>
                        <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(function(row, i) {
                        return (
                            <tr key={i} style={{borderBottom: "1px solid #eee"}}>
                                <td style={{padding: "8px"}}>{row.title}</td>
                                <td style={{padding: "8px"}}>{row.company}</td>
                                <td style={{padding: "8px"}}>{row.location}</td>
                                <td style={{padding: "8px"}}>{row.date}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

