import {useEffect, useState} from "react"
import axios from "axios"
export function Postings({setPage, page}) {
    const[data, setData] = useState([])

    useEffect(function() {
        axios.get("http://localhost:8000/postings").then(function(answer){
            setData(answer.data)
        })
    }, [])
    
    return(
        <div className="card">
          <div className="page-header">
            <h2>Postings</h2>
            <p>Browse recently indexed job postings to understand employer demand and opportunities.</p>
          </div>

          <div style={{overflowX:'auto'}}>
            <table style = {{width: "100%", borderCollapse: "collapse", minWidth:700}}>
              <thead>
                  <tr>
                      <th style = {{textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px"}}>Title</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Company</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Location</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "12px" }}>Date Posted</th>
                  </tr>
              </thead>
              <tbody>
                  {data.map(function(row, i) {
                      return (
                          <tr key={i} style={{borderBottom: "1px solid #f1f5f9"}}>
                              <td style={{padding: "12px"}}>{row.title}</td>
                              <td style={{padding: "12px"}}>{row.company}</td>
                              <td style={{padding: "12px"}}>{row.location}</td>
                              <td style={{padding: "12px"}}>{row.date}</td>
                          </tr>
                      )
                  })}
              </tbody>
            </table>
          </div>
        </div>
    )
}

