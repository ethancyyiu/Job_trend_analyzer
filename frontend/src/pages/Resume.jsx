import React, { useState } from "react"
import axios from "axios"
import "../pages/Resume.css"

export function ResumeAnalyzer() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || ''

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setError(null)
    } else {
      setError("Please select a PDF file")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post(`${API_BASE}/resume_upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })


      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!results) {
    return (
      <div className="resume-upload-container">
        <div className="card">
          <div className="page-header">
            <h2>Resume Skill Analyzer</h2>
            <p>Upload your resume to see skill gaps and job matches in the market.</p>
          </div>

          <div className="upload-section">
            <div className="upload-box">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                id="file-input"
                style={{ display: "none" }}
              />
              <label htmlFor="file-input" className="upload-label">
                <div className="upload-icon">📄</div>
                <p>Drop your resume here or click to browse</p>
                <span className="upload-hint">.pdf only</span>
              </label>
            </div>

            {file && <p className="selected-file">✓ {file.name}</p>}

            {error && <p className="error-message">{error}</p>}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="upload-button"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show results
  return <ResumeResults results={results} onReset={() => setResults(null)} />
}

function ResumeResults({ results, onReset }) {
  const { resume_skills, matched_jobs, top_missing_skills, skill_opportunities } = results

  return (
    <div className="resume-results-container">
      <div className="card">
        <div className="page-header">
          <h2>Your Skill Analysis</h2>
          <button onClick={onReset} className="reset-button">
            ← Upload New Resume
          </button>
        </div>

        {/* Your Skills */}
        <div className="section">
          <h3>Your Skills ({resume_skills.length})</h3>
          <div className="skill-tags">
            {resume_skills.map((skill) => (
              <span key={skill} className="skill-tag-yours">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Matched Jobs */}
        <div className="section">
          <h3>Jobs You Can Apply For Now</h3>
          <div className="job-cards">
            {matched_jobs.slice(0, 10).map((job, idx) => (
              <div key={idx} className="job-card-result">
                <div className="job-header">
                  <h4>{job.title}</h4>
                  <span className="match-score">
                    {job.matched_skills}/{job.total_skills} skills match
                  </span>
                </div>
                <p className="company">{job.company}</p>
                {job.salary_min && job.salary_max && (
                  <p className="salary">
                    ${Math.round(job.salary_min / 1000)}k – ${Math.round(job.salary_max / 1000)}k/yr
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Missing Skills */}
        <div className="section">
          <h3>Top Skills to Learn (Most in-demand)</h3>
          <div className="gap-skills">
            {Object.entries(top_missing_skills)
              .slice(0, 8)
              .map(([skill, count]) => (
                <div key={skill} className="gap-item">
                  <span className="skill-name">{skill}</span>
                  <span className="skill-count">{count} postings</span>
                </div>
              ))}
          </div>
        </div>

        {/* Skill Opportunities */}
        {Object.keys(skill_opportunities).length > 0 && (
          <div className="section">
            <h3>Jobs for Each of Your Skills</h3>
            {Object.entries(skill_opportunities)
              .slice(0, 5)
              .map(([skill, jobs]) => (
                <div key={skill} className="skill-opportunity">
                  <h4>{skill}</h4>
                  <div className="opportunity-jobs">
                    {jobs.slice(0, 3).map((job, idx) => (
                      <p key={idx}>
                        {job.title} @ {job.company}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}