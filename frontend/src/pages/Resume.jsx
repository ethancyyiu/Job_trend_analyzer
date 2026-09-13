import { useEffect, useState } from "react";
import axios from "axios";
import "./Resume.css";

export function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (results) window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [results]);

  const upload = async () => {
    if (!file) return setError("Please select a PDF file first.");
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await axios.post(`${API_BASE}/resume_upload`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (results)
    return <ResumeResults results={results} onReset={() => setResults(null)} />;
  return (
    <div className="resume-page resume-upload-page">
      <div className="resume-upload-container">
        <section className="upload-hero">
          <div className="upload-hero-copy">
            <span className="upload-eyebrow">
              <i /> Career intelligence, personalized
            </span>
            <h1>Find the roles your resume is already built for.</h1>
            <p>
              Upload your resume and we’ll turn it into a clear job-search
              strategy: where you fit, what you’re missing, and the next move
              worth making.
            </p>
            <div className="upload-proof">
              <span className="proof-avatars">
                <b>J</b>
                <b>M</b>
                <b>A</b>
              </span>
              Built from live market signals—not generic advice.
            </div>
          </div>
          <div
            className="report-preview"
            aria-label="Preview of your career fit report"
          >
            <div className="preview-topline">
              <span>Your career fit report</span>
              <b>Live market data</b>
            </div>
            <div className="preview-score">
              <div>
                <small>Strongest role match</small>
                <h3>Senior Product Designer</h3>
                <p>Based on your experience</p>
              </div>
              <strong>
                86<small>%</small>
              </strong>
            </div>
            <div className="preview-meter">
              <span />
            </div>
            <div className="preview-insight">
              <em>↗</em>
              <div>
                <small>Your edge</small>
                <b>Product strategy + research</b>
                <p>Skills employers are actively seeking</p>
              </div>
            </div>
            <div className="preview-stats">
              <div>
                <strong>12</strong>
                <span>skills found</span>
              </div>
              <div>
                <strong>28</strong>
                <span>matching roles</span>
              </div>
              <div>
                <strong>4</strong>
                <span>growth moves</span>
              </div>
            </div>
          </div>
        </section>
        <div className="card resume-card upload-panel">
          <div className="page-header resume-page-header">
            <h2>Start with your resume</h2>
          </div>
          <div className="upload-section">
            <label htmlFor="file-input" className="upload-box upload-label">
              <div className="upload-icon">📄</div>
              <p>Drop your resume here or click to browse</p>
              <span className="upload-hint">PDF only</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(event) => {
                const selected = event.target.files[0];
                if (selected?.type === "application/pdf") {
                  setFile(selected);
                  setError(null);
                } else setError("Please select a PDF file.");
              }}
              id="file-input"
              style={{ display: "none" }}
            />
            {file && <p className="selected-file">✓ {file.name}</p>}
            {error && <p className="error-message">{error}</p>}
            <button
              onClick={upload}
              disabled={!file || loading}
              className="upload-button"
            >
              {loading ? "Building your career fit report…" : "Analyze Resume"}
            </button>
          </div>
        </div>
        <div className="three-boxes-row">
          <InfoCard
            label="Missing"
            title="Top Missing Skills"
            copy="See the valuable skills you can build next."
            icon="↗"
          />
          <InfoCard
            label="Matches"
            title="Matched Jobs"
            copy="See roles where your current experience already fits."
            icon="◎"
            accent
          />
          <InfoCard
            label="Signals"
            title="Job Matches Per Skill"
            copy="Connect your existing skills to real market demand."
            icon="⌁"
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, title, copy, icon, accent }) {
  return (
    <div className="three-box">
      <div className="box-topline">
        <span className={`box-badge ${accent ? "accent" : ""}`}>{label}</span>
      </div>
      <h4>{title}</h4>
      <p>{copy}</p>
      <div className="box-microstats">
        <span>Career signal</span>
        <span className="box-icon">{icon}</span>
      </div>
    </div>
  );
}

function ResumeResults({ results, onReset }) {
  const {
    resume_skills = [],
    matched_jobs = [],
    top_missing_skills = {},
    skill_opportunities = {},
    market_snapshot = {},
  } = results;
  const gaps = Object.entries(top_missing_skills);
  const top = matched_jobs[0];
  const fit = top
    ? Math.round((top.matched_skills / top.total_skills) * 100)
    : 0;
  return (
    <div className="resume-page resume-results-page">
      <div className="resume-results-container">
        <section className="resume-report-hero">
          <div className="report-hero-copy">
            <span className="report-eyebrow">Your career fit report</span>
            <h1>Turn your experience into your next opportunity.</h1>
            <p>
              We mapped your resume against the market and isolated the moves
              most likely to improve your outcomes.
            </p>
          </div>
          <div className="report-hero-score">
            <span>Highest salary role you qualify for </span>
            <strong>{fit}%</strong>
            <p>{top?.title || "Your top opportunity"}</p>
          </div>
          <div className="report-stat-grid">
            <div>
              <strong>{resume_skills.length}</strong>
              <span>skills recognized</span>
            </div>
            <div>
              <strong>{matched_jobs.length}</strong>
              <span>roles to explore</span>
            </div>
            <div>
              <strong>{gaps.length}</strong>
              <span>high-value missing skills</span>
            </div>
          </div>
        </section>
        <MarketSnapshot snapshot={market_snapshot} />
        <div className="resume-report-layout">
          <div className="resume-report-main">
            <section className="report-section report-section-dark">
              <div className="report-section-heading">
                <div>
                  <span className="report-eyebrow">Recommended actions</span>
                  <h2>Make these moves first</h2>
                </div>
              </div>
              <div className="report-action-grid">
                <Action
                  number="01"
                  title="Apply with intention"
                  copy="Start with your strongest-fit roles and tailor your opening resume bullets."
                />
                <Action
                  number="02"
                  title="Close one strategic gap"
                  copy="Build one in-demand skill into a visible portfolio proof point."
                />
                <Action
                  number="03"
                  title="Lead with your edge"
                  copy="Move your strongest matching skills to the top of your resume."
                />
              </div>
            </section>
            <section className="report-section">
              <div className="report-section-heading">
                <div>
                  <span className="report-eyebrow">Ready now</span>
                  <h2>Roles where you already have momentum</h2>
                </div>
                <span className="report-count">
                  Top {Math.min(matched_jobs.length, 6)} matches
                </span>
              </div>
              <div className="job-cards report-job-cards">
                {matched_jobs.slice(0, 6).map((job, index) => (
                  <JobCard
                    job={job}
                    index={index}
                    key={`${job.title}-${index}`}
                  />
                ))}
              </div>
            </section>
            <section className="report-section">
              <div className="report-section-heading">
                <div>
                  <span className="report-eyebrow">Growth plan</span>
                  <h2>Skills with the highest return</h2>
                </div>
                <p>
                  Focus your learning where the market is already signaling
                  demand.
                </p>
              </div>
              <div className="gap-skills report-gap-skills">
                {gaps.slice(0, 8).map(([skill, count], index) => (
                  <article className="gap-item report-gap-item" key={skill}>
                    <span className="gap-priority">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="skill-name">{skill}</span>
                    <span className="skill-count">{count} roles</span>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <aside className="resume-report-rail">
            <section className="report-rail-card skill-inventory">
              <span className="report-eyebrow">Your advantage</span>
              <h2>Skills already on your side</h2>
              <div className="skill-tags">
                {resume_skills.slice(0, 18).map((skill) => (
                  <span key={skill} className="skill-tag-yours">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
            <section className="report-rail-card next-step-card">
              <span className="report-eyebrow">What you should do next</span>
              <h2>Build a shortlist of three roles.</h2>
              <p>
                Choose high-fit roles, then tailor one strong proof point for
                each application.
              </p>
              <button
                onClick={onReset}
                className="report-reset-button"
                data-tooltip="Upload a new PDF to create another report"
              >
                Analyze another resume
              </button>
            </section>
            {Object.keys(skill_opportunities).length > 0 && (
              <section className="report-rail-card opportunity-card">
                <span className="report-eyebrow">Market connection</span>
                <h2>Where your skills lead</h2>
                {Object.entries(skill_opportunities)
                  .slice(0, 3)
                  .map(([skill, jobs]) => (
                    <div className="skill-opportunity" key={skill}>
                      <h4>{skill}</h4>
                      <p>
                        {jobs
                          .slice(0, 2)
                          .map((job) => `${job.title} · ${job.company}`)
                          .join("\n")}
                      </p>
                    </div>
                  ))}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function MarketSnapshot({ snapshot }) {
  const {
    market_total = 0,
    matching_job_count = 0,
    top_gap: topGap,
    salary,
  } = snapshot;
  const matchRate = market_total
    ? ((matching_job_count / market_total) * 100).toFixed(1)
    : null;

  return (
    <section className="market-snapshot" aria-label="Your market snapshot">
      <div className="market-snapshot-heading">
        <span className="report-eyebrow">Your market snapshot</span>
        <h2>Where you stand, and what to do next.</h2>
      </div>
      <div className="market-snapshot-grid">
        <article>
          <span>Matching roles</span>
          <strong>{matching_job_count.toLocaleString()}</strong>
          <p>
            {matchRate
              ? `${matchRate}% of ${market_total.toLocaleString()} tracked roles match at least three of your skills.`
              : "No matching roles are available yet."}
          </p>
        </article>
        <article>
          <span>Highest-impact gap</span>
          <strong>{topGap?.skill?.toUpperCase() || "No clear gap"}</strong>
          <p>
            {topGap
              ? `It appears in ${topGap.matching_roles.toLocaleString()} roles that otherwise fit your profile.`
              : "Your current skills cover the available matched roles well."}
          </p>
        </article>
        <article>
          <span>Listed pay in matching roles</span>
          <strong>
            {salary
              ? `${formatCompensation(salary.median_min)}–${formatCompensation(salary.median_max)}`
              : "Not enough data"}
          </strong>
          <p>
            {salary
              ? `Median listed range across ${salary.sample_size.toLocaleString()} matching roles with salary data.`
              : "Shown once at least five matching roles include both salary bounds."}
          </p>
        </article>
      </div>
      {topGap && (
        <div className="market-snapshot-action">
          <span className="market-snapshot-action-label">Best next move</span>
          <p>
            Prioritize <strong>{topGap.skill.toUpperCase()}</strong>, it could expand the roles you can target most quickly.
          </p>
        </div>
      )}
    </section>
  );
}

function Action({ number, title, copy }) {
  return (
    <article>
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
function formatCompensation(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  if (amount >= 1_000_000) {
    return `${Number((amount / 1_000_000).toFixed(1))}M`;
  }
  return `${Math.round(amount / 1000)}k`;
}

function JobCard({ job, index }) {
  const fit = Math.round((job.matched_skills / job.total_skills) * 100);
  return (
    <article className="job-card-result report-job-card">
      <div className="job-header">
        <div>
          <span className="job-rank">Best fit #{index + 1}</span>
          <h4>{job.title}</h4>
        </div>
        <span className="match-score">{fit}% fit</span>
      </div>
      <p className="company">{job.company}</p>
      <div className="match-meter">
        <span style={{ width: `${fit}%` }} />
      </div>
      <div className="job-card-footer">
        <span>
          {job.matched_skills} of {job.total_skills} skills matched
        </span>
        {job.salary_min && job.salary_max && (
          <strong>
            {formatCompensation(job.salary_min)} –{" "}
            {formatCompensation(job.salary_max)}
          </strong>
        )}
      </div>
    </article>
  );
}
