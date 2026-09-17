import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./Postings.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function Postings({ cachedData }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      axios.get(`${API_BASE}/postings`, { params: { days: 30, limit: 50, search: search || undefined, location: location || undefined }, signal: controller.signal })
        .then((response) => setData(response.data))
        .catch((error) => { if (error.code !== "ERR_CANCELED") setLoadError("Job postings could not be loaded."); })
        .finally(() => setLoading(false));
    }, search || location ? 250 : 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [search, location]);

  const postings = data?.postings || [];
  const locations = ["", ...new Set(postings.map((posting) => posting.location).filter(Boolean))];
  const loadMore = () => {
    if (!data?.next_cursor || loading) return;
    setLoading(true);
    axios.get(`${API_BASE}/postings`, { params: { days: 30, limit: 50, search: search || undefined, location: location || undefined, cursor: data.next_cursor } })
      .then((response) => setData((current) => ({ ...response.data, postings: [...(current?.postings || []), ...response.data.postings] })))
      .catch(() => setLoadError("More postings could not be loaded."))
      .finally(() => setLoading(false));
  };

  return <main className="jobs-page">
    <header className="jobs-header"><h1>Job Postings</h1><p>{data ? `${data.total_postings.toLocaleString()} roles posted in the last 30 days.` : "Loading tracked listings..."}</p></header>
    <section className="jobs-filters" aria-label="Filter job postings">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, company, location..." aria-label="Search job postings" />
      <select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Filter by location"><option value="">All locations</option>{locations.slice(1).map((option) => <option key={option}>{option}</option>)}</select>
    </section>
    {loadError && <p className="jobs-error">{loadError}</p>}
    <div className="jobs-table-wrap"><table className="jobs-table"><thead><tr><th>Role</th><th>Company</th><th>Location</th><th>Posted</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {loading && !data && <tr><td colSpan="5" className="jobs-empty">Loading job postings...</td></tr>}
      {!loading && data && postings.length === 0 && <tr><td colSpan="5" className="jobs-empty">No results match the current filters.</td></tr>}
      {postings.map((posting) => <tr key={posting.id} onClick={() => setSelectedPosting(posting)}><td>{posting.title}</td><td>{posting.company || "-"}</td><td>{posting.location || "-"}</td><td>{posting.date_posted || "Recent"}</td><td><button onClick={(event) => { event.stopPropagation(); setSelectedPosting(posting); }}>View role</button></td></tr>)}
    </tbody></table></div>
    {data?.next_cursor && <button className="jobs-load-more" onClick={loadMore} disabled={loading}>{loading ? "Loading..." : "Load more roles"}</button>}
    {selectedPosting && <PostingDetailsModal posting={selectedPosting} onClose={() => setSelectedPosting(null)} />}
  </main>;
}

function PostingDetailsModal({ posting, onClose }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${API_BASE}/postings/${posting.id}`, { signal: controller.signal }).then((response) => setJob(response.data)).catch((requestError) => { if (requestError.code !== "ERR_CANCELED") setError("Role details could not be loaded."); });
    return () => controller.abort();
  }, [posting.id]);
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);
  const description = job?.description || "A description was not provided for this posting.";
  const isLong = description.length > 700;
  const displayedDescription = showFullDescription || !isLong ? description : `${description.slice(0, 700).trim()}...`;
  return createPortal(<div className="posting-details-backdrop" onMouseDown={onClose} role="presentation"><section className="posting-details-modal" role="dialog" aria-modal="true" aria-labelledby="posting-details-title" onMouseDown={(event) => event.stopPropagation()}><button className="posting-details-close" onClick={onClose} aria-label="Close role details">x</button><div className="posting-details-content">{!job && !error && <p className="posting-details-state">Loading role details...</p>}{error && <p className="posting-details-state">{error}</p>}{job && <><span className="module-kicker">Role details</span><h2 id="posting-details-title">{job.title}</h2><p className="posting-details-company">{job.company || "Company not listed"}</p><div className="posting-details-meta"><div><span>Location</span><strong>{job.location || "Not listed"}</strong></div><div><span>Posted</span><strong>{job.date_posted || "Recent"}</strong></div></div><div className="posting-details-description"><h3>About this role</h3><p>{displayedDescription}</p>{isLong && <button className="posting-description-toggle" onClick={() => setShowFullDescription((visible) => !visible)}>{showFullDescription ? "View less" : "View more"}</button>}</div>{job.posting_url ? <a className="posting-details-link" href={job.posting_url} target="_blank" rel="noreferrer">View job posting</a> : <span className="posting-details-link posting-details-link-disabled">Job link not available</span>}</>}</div></section></div>, document.body);
}
