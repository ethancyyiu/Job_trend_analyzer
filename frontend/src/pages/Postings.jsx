import { useEffect, useState } from "react"
import axios from "axios"
export function Postings({ setPage, page }) {
    const [data, setData] = useState([])

    useEffect(function () {
        axios.get(`${import.meta.env.VITE_API_URL}/trends`).then(function (answer) {
            setData(answer.data)
        })
    }, [])

    const totalPostings = data.length
    let companies = data.map(function (row) {
        return row.company;
    });

    let uniqueCompanies = new Set(companies);

    let companyCount = uniqueCompanies.size;


    return (
        <div className="card">
            <div className="page-header">
                <h2>Postings</h2>
                <p>Browse recently indexed job postings to understand employer demand and opportunities.</p>
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>Most Recent Postings</span>
                    <strong>{totalPostings}</strong>
                    <p>Records in the current postings dataset.</p>
                </div>
                <div className="metric-card">
                    <span>Companies</span>
                    <strong>{companyCount}</strong>
                    <p>Distinct employers represented in the latest postings.</p>
                </div>
                <div className="metric-card">
                    <span>Focus</span>
                    <strong>Recent & relevant</strong>
                    <p>Keep attention on the freshest roles driving hiring activity.</p>
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-card-header">
                    <h3>Recent posting snapshot</h3>
                    <p>Scan the latest roles and hiring locations in a neutral table with better spacing and visual structure.</p>
                </div>
                <div style={{ overflowX: 'auto', marginTop: 20 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Title</th>
                                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Company</th>
                                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Location</th>
                                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Date Posted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(function (row, i) {
                                return (
                                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "12px" }}>{row.title}</td>
                                        <td style={{ padding: "12px" }}>{row.company}</td>
                                        <td style={{ padding: "12px" }}>{row.location}</td>
                                        <td style={{ padding: "12px" }}>{row.date}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="section-note">This page helps you review fresh openings and see which companies and locations are actively hiring right now.</p>
        </div>
    )
}

