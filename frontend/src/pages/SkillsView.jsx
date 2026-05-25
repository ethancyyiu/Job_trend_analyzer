import {useEffect, useState} from "react"
import axios from "axios"
import {Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts"

function SkillBar({ skill, count, max }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 0",
        borderBottom: "0.5px solid rgba(0,0,0,0.07)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          width: 100,
          flexShrink: 0,
        }}
      >
        {skill}
      </span>
 
      <div
        style={{
          flex: 1,
          height: 4,
          background: "rgba(0,0,0,0.06)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#378ADD",
            borderRadius: 2,
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
 
      <span
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          width: 40,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {count.toLocaleString()}
      </span>
    </div>
  )
}

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

