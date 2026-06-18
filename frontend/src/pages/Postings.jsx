export function Postings({ cachedData }) {
    const data = cachedData || { postings: [], total_postings: 0 }
    const postings = data.postings
    const totalPostings = data.total_postings;

    const recentPostings = postings.length
    const companies = postings.map(function (row) {
        return row.company;
    })

    const uniqueCompanies = new Set(companies);
    const companyCount = uniqueCompanies.size;


    return (
        <div className="card">
            <div className="page-header">
                <h2>Postings</h2>
                {/* <p>Browse recently indexed job postings to understand employer demand and opportunities.</p> */}
            </div>

            <div className="page-panel-row">
                <div className="metric-card">
                    <span>Most Recent Postings</span>
                    <strong>{recentPostings}</strong>
                    <p>Top 50 postings from the dataset</p>
                </div>
                <div className="metric-card">
                    <span>unique Companies</span>
                    <strong>{companyCount}</strong>
                    <p>Distinct employers represented in the latest postings</p>
                </div>
                <div className="metric-card">
                    <span>Total Postings</span>
                    <strong>{totalPostings}</strong>
                    <p>Keep attention on the freshest roles driving hiring activity</p>
                </div>
            </div>

            <div className="chart-card">
                <div style={{ overflowX: 'auto', marginTop: 20 }}>
                    <table className="postings-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Location</th>
                                <th className="postings-date-header">Date Posted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {postings.map(function (row, i) {
                                return (
                                    <tr key={i} className="postings-row animate-row" style={{ animationDelay: `${i * 55}ms` }}>
                                        <td className="postings-cell title-cell">
                                            <div className="job-title">{row.title}</div>
                                        </td>
                                        <td className="postings-cell">{row.company}</td>
                                        <td className="postings-cell">{row.location}</td>
                                        <td className="postings-cell postings-date">{row.date_posted || row.date}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

