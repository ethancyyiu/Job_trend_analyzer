import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AdviceRow, PageHero } from "../components/AdviceModules";
import "./Postings.css";

export function Postings({ cachedData }) {
  const postings = cachedData?.postings || [];
  const [selectedPosting, setSelectedPosting] = useState(null);
  const companies = new Set(postings.map((row) => row.company).filter(Boolean)).size;
  const freshTitle = postings[0]?.title || "a fresh role";
  return (
    <main className="page-shell">
      <PageHero
        eyebrow="Job postings"
        title="Roles worth a closer look."
        description="Use this list to find jobs that fit, then decide which ones are worth tailoring an application for."
        decision={`Take a look at ${freshTitle}.`}
        decisionDetail="It is one of the newer roles in your market."
      />
      <AdviceRow
        meaning={{
          title: "Freshness is an advantage.",
          body: `You have ${postings.length} recent roles across ${companies} employers to assess. Prioritize a small number of relevant, newly posted opportunities over broad, generic applications.`,
        }}
        actions={{
          title: "Your application sprint",
          items: [
            "Choose three roles where you meet most of the core requirements.",
            "Tailor the first third of your resume to each role.",
            "Apply within 48 hours, then save a follow-up reminder.",
          ],
        }}
      />
      <section className="metric-grid">
        <div className="metric-card">
          <span>Ready to review</span>
          <strong>{postings.length}</strong>
          <p>Most recent opportunities</p>
        </div>
        <div className="metric-card">
          <span>Employers hiring</span>
          <strong>{companies}</strong>
          <p>Distinct companies in this set</p>
        </div>
        <div className="metric-card">
          <span>Market depth</span>
          <strong>{cachedData?.total_postings ?? "—"}</strong>
          <p>Total postings collected</p>
        </div>
      </section>
      <section className="data-card">
        <div className="chart-card-header">
          <div>
            <div className="module-kicker">Your action queue</div>
            <h2>Recent roles to assess</h2>
            <p>
              Open each role with a specific story you can tell about your fit.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="postings-table">
            <thead>
              <tr>
                <th className="postings-title">Role to target</th>
                <th className="postings-employer">Employer</th>
                <th className="postings-location">Location</th>
                <th className="postings-date">Posted</th>
                <th className="postings-link">Posting</th>
              </tr>
            </thead>
            <tbody>
              {postings.map((row, i) => (
                <tr key={`${row.title}-${i}`}>
                  <td className="postings-title">
                    <div className="job-title">{row.title}</div>
                  </td>
                  <td className="postings-employer">{row.company}</td>
                  <td className="postings-location">{row.location}</td>
                  <td className="postings-date">
                    {row.date_posted || row.date || "Recent"}
                  </td>
                  <td className="postings-link">
                    <button className="view-role-button" onClick={() => setSelectedPosting(row)}>
                      View role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {selectedPosting && (
        <PostingDetailsModal posting={selectedPosting} onClose={() => setSelectedPosting(null)} />
      )}
    </main>
  );
}

function formatSalary(amount) {
  if (!Number.isFinite(Number(amount))) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function PostingDetailsModal({ posting, onClose }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${API_BASE}/postings/${posting.id}`, { signal: controller.signal })
      .then((response) => setJob(response.data))
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") setError("Role details could not be loaded.");
      });
    return () => controller.abort();
  }, [API_BASE, posting.id]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const salary = job?.salary_min != null || job?.salary_max != null
    ? [formatSalary(job.salary_min), formatSalary(job.salary_max)].filter(Boolean).join(" – ") + (job.salary_type ? ` ${job.salary_type}` : "")
    : "Salary not listed";
  const description = job?.description || "A description was not provided for this posting.";
  const descriptionIsLong = description.length > 700;
  const displayedDescription = showFullDescription || !descriptionIsLong
    ? description
    : `${description.slice(0, 700).trim()}…`;

  return createPortal(
    <div className="posting-details-backdrop" onMouseDown={onClose} role="presentation">
      <section className="posting-details-modal" role="dialog" aria-modal="true" aria-labelledby="posting-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="posting-details-close" onClick={onClose} aria-label="Close role details">×</button>
        <div className="posting-details-content">
          {!job && !error && <p className="posting-details-state">Loading role details…</p>}
          {error && <p className="posting-details-state">{error}</p>}
          {job && <>
            <span className="module-kicker">Role details</span>
            <h2 id="posting-details-title">{job.title}</h2>
            <p className="posting-details-company">{job.company || "Company not listed"}</p>
            <div className="posting-details-meta">
              <div><span>Location</span><strong>{job.location || "Not listed"}</strong></div>
              <div><span>Posted</span><strong>{job.date_posted || "Recent"}</strong></div>
              <div><span>Salary</span><strong>{salary}</strong></div>
            </div>
            <div className="posting-details-description">
              <h3>About this role</h3>
              <p>{displayedDescription}</p>
              {descriptionIsLong && (
                <button className="posting-description-toggle" onClick={() => setShowFullDescription((visible) => !visible)}>
                  {showFullDescription ? "View less ↑" : "View more ↓"}
                </button>
              )}
            </div>
            {job.posting_url ? (
              <a className="posting-details-link" href={job.posting_url} target="_blank" rel="noreferrer">View job posting <span aria-hidden="true">↗</span></a>
            ) : (
              <span className="posting-details-link posting-details-link-disabled">Job link not available</span>
            )}
          </>}
        </div>
      </section>
    </div>,
    document.body,
  );
}
