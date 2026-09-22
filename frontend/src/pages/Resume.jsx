import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./Resume.css";

const EMPTY_PREFERENCES = {
  target_job_titles: "",
  preferred_locations: "",
  prioritized_skills: "",
  remote_preference: "no_preference",
  work_authorization: "no_preference",
  minimum_salary: "",
  salary_type: "yearly",
};

const ADVISOR_WORKFLOW_STEPS = [
  { title: "Upload & confirm resume content" },
  { title: "Choose your preferences" },
  { title: "View recommendations" },
];

function splitPreferenceList(value) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function AdvisorWorkflow({ currentStep }) {
  const activeIndex = currentStep === "preferences" ? 1 : currentStep === "results" ? 2 : 0;

  return (
    <section className="advisor-workflow" aria-label="Recommendation process">
      {ADVISOR_WORKFLOW_STEPS.map((label, index) => {
        const state = index === activeIndex ? "is-active" : index < activeIndex ? "is-complete" : "";
        return (
          <article className={`advisor-workflow-step ${state}`} key={label.title} aria-current={index === activeIndex ? "step" : undefined}>
            <span>Step {String(index + 1).padStart(2, "0")}</span>
            <strong>{label.title}</strong>
          </article>
        );
      })}
    </section>
  );
}

export function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [step, setStep] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const uploadResume = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await axios.post(`${API_BASE}/resume_documents`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocument(response.data);
      setResumeText(response.data.raw_text);
      setReviewError(null);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmResumeText = async () => {
    if (!document || !resumeText.trim()) {
      setReviewError("Resume text cannot be empty.");
      return;
    }
    setConfirming(true);
    setReviewError(null);
    try {
      const response = await axios.put(`${API_BASE}/resume_documents/${document.id}`, { raw_text: resumeText });
      setResumeText(response.data.raw_text);
      setStep("preferences");
    } catch (requestError) {
      setReviewError(requestError.response?.data?.detail || "Could not save your resume text. Try again.");
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDocument(null);
    setResumeText("");
    setError(null);
    setReviewError(null);
    setStep("upload");
  };

  if (step === "preferences" && document) {
    return <JobPreferencesForm
      documentId={document.id}
      apiBase={API_BASE}
      onBack={() => setStep("upload")}
      onViewRecommendations={() => setStep("results")}
    />;
  }

  if (step === "results" && document) {
    return <RecommendationResults
      documentId={document.id}
      apiBase={API_BASE}
      onBack={() => setStep("preferences")}
      onStartOver={reset}
    />;
  }

  return (
    <div className="resume-page resume-upload-page advisor-page">
      <div className="resume-upload-container">
        <header className="advisor-page-header">
          <h1>Job recommendations from your resume</h1>
          <p>Upload a PDF, review the extracted text, then set the roles and conditions that matter to you.</p>
        </header>
        <AdvisorWorkflow currentStep="upload" />
        <div className="resume-upload-review-grid">
          <section className="resume-card upload-panel" aria-labelledby="resume-upload-heading">
          <div className="page-header resume-page-header">
            <span>Step 1 of 3</span>
            <h2 id="resume-upload-heading">Upload your resume</h2>
            <p>PDF only. We will extract the text for you to review before matching.</p>
          </div>
          <div className="upload-section">
            <label htmlFor="file-input" className="upload-box upload-label">
              <div className="upload-icon" aria-hidden="true">PDF</div>
              <p>Drop your resume here or click to browse</p>
              <span className="upload-hint">PDF, up to 10 MB</span>
            </label>
            <input
              id="file-input"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const selected = event.target.files[0];
                if (selected?.type === "application/pdf" || selected?.name?.toLowerCase().endsWith(".pdf")) {
                  setFile(selected);
                  setDocument(null);
                  setResumeText("");
                  setError(null);
                  setReviewError(null);
                } else {
                  setFile(null);
                  setError("Please select a PDF file.");
                }
              }}
              style={{ display: "none" }}
            />
            {file && <p className="selected-file">Selected: {file.name}</p>}
            {error && <p className="error-message">{error}</p>}
            <button type="button" onClick={uploadResume} disabled={!file || loading} className="upload-button">
              {loading ? "Extracting resume text…" : "Upload and review text"}
            </button>
          </div>
          </section>
          <section className="resume-card resume-text-review" aria-labelledby="resume-text-heading">
            <div className="page-header resume-page-header">
              <span>Confirm your content</span>
              <h2 id="resume-text-heading">Review extracted text</h2>
              <p>{document ? "Correct anything that did not transfer cleanly before continuing." : "Your extracted resume text will appear here after upload."}</p>
            </div>
            <textarea
              className="resume-text-area"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              aria-label="Extracted resume text"
              placeholder="Upload a PDF to review its extracted text."
              disabled={!document}
            />
            {reviewError && <p className="error-message">{reviewError}</p>}
            <div className="resume-text-actions">
              <span className="resume-confirmation-note">{document ? "Confirm the content when it looks right." : "Waiting for a resume upload."}</span>
              <button type="button" className="upload-button" onClick={confirmResumeText} disabled={!document || confirming || !resumeText.trim()}>
                {confirming ? "Saving text" : "Confirm and continue"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ResumeTextReview({ document, resumeText, setResumeText, apiBase, onContinue, onStartOver }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveText = async () => {
    if (!resumeText.trim()) {
      setError("Resume text cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put(`${apiBase}/resume_documents/${document.id}`, { raw_text: resumeText });
      setResumeText(response.data.raw_text);
      onContinue();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not save your resume text. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="resume-page resume-upload-page advisor-page">
      <div className="resume-upload-container">
        <header className="advisor-page-header">
          <h1>Review your resume text</h1>
          <p>We extracted the text from <strong>{document.filename}</strong>. Correct anything that did not transfer cleanly.</p>
        </header>
        <AdvisorWorkflow currentStep="upload" />
        <section className="resume-card resume-text-review" aria-labelledby="resume-text-heading">
          <div className="page-header resume-page-header">
            <span>Step 1 of 3</span>
            <h2 id="resume-text-heading">Extracted resume text</h2>
            <p>Your saved text—not a generated summary—will be used for matching.</p>
          </div>
          <textarea
            className="resume-text-area"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            aria-label="Extracted resume text"
          />
          {error && <p className="error-message">{error}</p>}
          <div className="resume-text-actions">
            <button type="button" className="text-button" onClick={onStartOver}>Upload a different PDF</button>
            <button type="button" className="upload-button" onClick={saveText} disabled={saving || !resumeText.trim()}>
              {saving ? "Saving text…" : "Save text and continue"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function JobPreferencesForm({ documentId, apiBase, onBack, onViewRecommendations }) {
  const [form, setForm] = useState(EMPTY_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.put(`${apiBase}/resume_documents/${documentId}/preferences`, {
        target_job_titles: splitPreferenceList(form.target_job_titles),
        preferred_locations: splitPreferenceList(form.preferred_locations),
        prioritized_skills: splitPreferenceList(form.prioritized_skills),
        remote_preference: form.remote_preference,
        work_authorization: form.work_authorization,
        minimum_salary: form.minimum_salary === "" ? null : Number(form.minimum_salary),
        salary_type: form.salary_type,
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not save your preferences. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="resume-page resume-upload-page advisor-page">
      <div className="resume-upload-container">
        <header className="advisor-page-header">
          <h1>Set your job preferences</h1>
          <p>Your resume text is saved. These preferences determine which jobs are eligible for recommendations.</p>
        </header>
        <AdvisorWorkflow currentStep="preferences" />
        <form className="resume-card preferences-form" onSubmit={savePreferences}>
          <div className="page-header resume-page-header">
            <span>Step 2 of 3</span>
            <h2>What should we look for?</h2>
            <p>Leave a field blank, or choose “No preference,” when it should not limit your search.</p>
          </div>
          <div className="preferences-grid">
            <label className="preferences-field preferences-field-wide">
              <span>Target job titles</span>
              <input name="target_job_titles" value={form.target_job_titles} onChange={updateField} placeholder="e.g. Data analyst, BI analyst — leave blank if none" />
              <small>Separate multiple titles with commas.</small>
            </label>
            <label className="preferences-field preferences-field-wide">
              <span>Preferred locations</span>
              <input name="preferred_locations" value={form.preferred_locations} onChange={updateField} placeholder="e.g. Toronto, Vancouver — leave blank if none" />
              <small>Separate multiple locations with commas.</small>
            </label>
            <label className="preferences-field preferences-field-wide">
              <span>Skills to prioritize</span>
              <input name="prioritized_skills" value={form.prioritized_skills} onChange={updateField} placeholder="e.g. Python, SQL, AWS — leave blank if none" />
              <small>Separate multiple skills with commas; they break otherwise equal matches.</small>
            </label>
            <SelectField label="Work arrangement" name="remote_preference" value={form.remote_preference} onChange={updateField} options={[["no_preference", "No preference"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on_site", "On-site"]]} />
            <SelectField label="Work authorization" name="work_authorization" value={form.work_authorization} onChange={updateField} options={[["no_preference", "No preference"], ["authorized", "Authorized to work"], ["requires_sponsorship", "Require sponsorship"]]} />
            <label className="preferences-field">
              <span>Minimum acceptable salary (USD)</span>
              <div className="salary-preference-inputs">
                <input name="minimum_salary" type="number" min="0" step="1000" value={form.minimum_salary} onChange={updateField} placeholder="e.g. 80000 — leave blank if none" />
                <select name="salary_type" value={form.salary_type} onChange={updateField} aria-label="Salary period">
                  <option value="yearly">per year</option>
                  <option value="hourly">per hour</option>
                  <option value="no_preference">period unknown</option>
                </select>
              </div>
            </label>
          </div>
          {error && <p className="error-message">{error}</p>}
          {saved && <p className="save-confirmation" role="status">Preferences saved. Recommendations will be enabled in the next step.</p>}
          <div className="resume-text-actions">
            <button type="button" className="text-button" onClick={onBack}>Back to resume text</button>
            <div className="preference-actions">
              {saved && <button type="button" className="text-button" onClick={onViewRecommendations}>View recommendations</button>}
              <button type="submit" className="upload-button" disabled={saving}>{saving ? "Saving preferences…" : "Save preferences"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecommendationResults({ documentId, apiBase, onBack, onStartOver }) {
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    axios.post(`${apiBase}/resume_documents/${documentId}/recommendations`)
      .then((response) => {
        if (!isCurrent) return;
        setData(response.data);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setError(requestError.response?.data?.detail || "Could not load recommendations. Try again.");
        setStatus("error");
      });
    return () => { isCurrent = false; };
  }, [apiBase, documentId, retryCount]);

  if (status === "loading") {
    return <RecommendationShell onBack={onBack} onStartOver={onStartOver}>
      <section className="resume-card recommendation-state"><span className="recommendation-spinner" aria-hidden="true" /><h2>Scoring your best active matches</h2><p>We are comparing the strongest catalog candidates against your saved resume and preferences.</p></section>
    </RecommendationShell>;
  }
  if (status === "error") {
    return <RecommendationShell onBack={onBack} onStartOver={onStartOver}>
      <section className="resume-card recommendation-state"><h2>Recommendations are unavailable</h2><p className="error-message">{error}</p><button type="button" className="upload-button" onClick={() => { setStatus("loading"); setRetryCount((count) => count + 1); }}>Try again</button></section>
    </RecommendationShell>;
  }

  const recommendations = data?.recommendations || [];
  if (!recommendations.length) {
    return <RecommendationShell onBack={onBack} onStartOver={onStartOver}>
      <section className="resume-card recommendation-state"><h2>No active matches yet</h2><p>There are no active catalog jobs that meet your saved requirements. Try broadening your preferences or check back after the next scrape.</p></section>
    </RecommendationShell>;
  }

  return <RecommendationShell onBack={onBack} onStartOver={onStartOver}>
    <section className="recommendation-heading">
      <span>Step 3 of 3</span>
      <h1>Your best job matches</h1>
      <p>Ranked by Jev fit score, then confidence, from {data.candidate_count} eligible active jobs.</p>
    </section>
    {data.batch_errors?.length > 0 && <p className="recommendation-warning">Some jobs could not be scored, so this list may be incomplete. Please try again later.</p>}
    <div className="recommendation-grid">
      {recommendations.map((job, index) => <RecommendationCard key={job.job_id} job={job} index={index} onSelect={() => setSelectedJob(job)} />)}
    </div>
    {selectedJob && <RecommendationDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
  </RecommendationShell>;
}

function RecommendationShell({ children, onBack, onStartOver }) {
  return <div className="resume-page resume-upload-page advisor-page"><div className="resume-upload-container"><header className="advisor-page-header"><h1>Job recommendations</h1><p>Active roles matched to your resume and saved preferences.</p></header><AdvisorWorkflow currentStep="results" />{children}<div className="recommendation-footer"><button type="button" className="text-button" onClick={onBack}>Edit preferences</button><button type="button" className="text-button" onClick={onStartOver}>Use a different resume</button></div></div></div>;
}

const formatJevFit = (score) => `${((Number(score) / 4) * 10).toFixed(1)}/10`;
const formatJevConfidence = (confidence) => typeof confidence === "number" ? `${(confidence * 10).toFixed(1)}/10 confidence` : "Confidence unavailable";

function RecommendationCard({ job, index, onSelect }) {
  const confidence = formatJevConfidence(job.confidence);
  return <article className="recommendation-card">
    <div className="recommendation-card-topline"><span>Match {String(index + 1).padStart(2, "0")}</span><strong>{formatJevFit(job.fit_score)} fit</strong></div>
    <h2>{job.title}</h2>
    <p className="recommendation-company">{job.company || "Company not listed"}</p>
    <dl className="recommendation-meta">
      <div><dt>Location</dt><dd>{job.location || "Not listed"}</dd></div>
      <div><dt>Salary</dt><dd>{formatSalary(job)}</dd></div>
    </dl>
    <div className="recommendation-card-footer"><span className={job.match_label === "possible match" ? "possible-match" : "confirmed-match"}>{job.match_label}</span><span>{confidence}</span></div>
    <button type="button" className="job-details-link recommendation-details-button" onClick={onSelect}>View details</button>
  </article>;
}

function formatSalary(job) {
  if (job.salary_min == null && job.salary_max == null) return "Not listed";
  const amount = (value) => `$${Math.round(Number(value)).toLocaleString()}`;
  const range = job.salary_min != null && job.salary_max != null ? `${amount(job.salary_min)}–${amount(job.salary_max)}` : amount(job.salary_min ?? job.salary_max);
  return `${range} USD${job.salary_type ? ` / ${job.salary_type}` : ""}`;
}

function RecommendationDetailsModal({ job, onClose }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  const details = job.description || "A detailed description was not provided for this posting.";
  const isLongDescription = details.length > 700;
  const displayedDetails = showFullDescription || !isLongDescription
    ? details
    : `${details.slice(0, 700).trim()}...`;
  return createPortal(
    <div className="posting-details-backdrop" onMouseDown={onClose} role="presentation">
      <section className="posting-details-modal" role="dialog" aria-modal="true" aria-labelledby="recommendation-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="posting-details-close" onClick={onClose} aria-label="Close job details">×</button>
        <div className="posting-details-content">
          <span className="posting-details-eyebrow">Job details · {job.match_label}</span>
          <h2 id="recommendation-details-title">{job.title}</h2>
          <p className="posting-details-company">{job.company || "Company not listed"}</p>
          <div className="posting-details-meta">
            <div><span>Location</span><strong>{job.location || "Not listed"}</strong></div>
            <div><span>Salary</span><strong>{formatSalary(job)}</strong></div>
            <div><span>Jev fit</span><strong>{formatJevFit(job.fit_score)} · {formatJevConfidence(job.confidence)}</strong></div>
          </div>
          <div className="posting-details-description">
            <h3>About this role</h3>
            <p>{displayedDetails}</p>
            {isLongDescription && <button type="button" className="posting-description-toggle" onClick={() => setShowFullDescription((visible) => !visible)}>{showFullDescription ? "View fewer details ↑" : "View more details ↓"}</button>}
          </div>
          {job.posting_url ? <a className="posting-details-link" href={job.posting_url} target="_blank" rel="noreferrer">View job posting <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></a> : <span className="posting-details-link posting-details-link-disabled">Job link not available</span>}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="preferences-field">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {options.map(([optionValue, optionLabel]) => <option value={optionValue} key={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}
