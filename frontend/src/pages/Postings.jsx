import { useEffect, useState } from "react"
import axios from "axios"
const API_BASE = import.meta.env.VITE_API_URL || ''
export function Postings({ setPage, page }) {
    const [data, setData] = useState([])

    useEffect(function () {
        axios.get(`${API_BASE}/postings`).then(function (answer) {
            setData(answer.data)
        }).catch(function () {
            setData([])
        })
    }, [])

    const totalPostings = data.length
    let companies = data.map(function (row) {
        return row.company;
    });

    let uniqueCompanies = new Set(companies);

    let companyCount = uniqueCompanies.size;

    const formatAge = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const elapsed = Math.floor((Date.now() - date.getTime()) / 86400000);
        return `${elapsed} day${elapsed === 1 ? '' : 's'} ago`;
    }

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
                    <table className="postings-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Location</th>
                                <th>Date Posted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(function (row, i) {
                                const dateValue = row.date_posted || row.date || ''
                                const ageLabel = formatAge(dateValue)
                                return (
                                    <tr key={i}>
                                        <td>{row.title}</td>
                                        <td>{row.company}</td>
                                        <td>{row.location}</td>
                                        <td>{dateValue} {ageLabel ? `· ${ageLabel}` : ''}</td>
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

