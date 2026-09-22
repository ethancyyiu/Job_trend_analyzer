import { useState } from "react";
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

function splitPreferenceList(value) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

export function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [step, setStep] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      setStep("review");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDocument(null);
    setResumeText("");
    setError(null);
    setStep("upload");
  };

  if (step === "review" && document) {
    return <ResumeTextReview
      document={document}
      resumeText={resumeText}
      setResumeText={setResumeText}
      apiBase={API_BASE}
      onContinue={() => setStep("preferences")}
      onStartOver={reset}
    />;
  }

  if (step === "preferences" && document) {
    return <JobPreferencesForm
      documentId={document.id}
      apiBase={API_BASE}
      onBack={() => setStep("review")}
    />;
  }

  return (
    <div className="resume-page resume-upload-page advisor-page">
      <div className="resume-upload-container">
        <header className="advisor-page-header">
          <h1>Job recommendations from your resume</h1>
          <p>Upload a PDF, review the extracted text, then set the roles and conditions that matter to you.</p>
        </header>
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
                  setError(null);
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
      </div>
    </div>
  );
}

function ResumeTextReview({ document, resumeText, setResumeText, apiBase, onContinue, onStartOver }) {
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

function JobPreferencesForm({ documentId, apiBase, onBack }) {
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
        <form className="resume-card preferences-form" onSubmit={savePreferences}>
          <div className="page-header resume-page-header">
            <span>Step 2 of 3</span>
            <h2>What should we look for?</h2>
            <p>Leave a field open if it should not limit your search.</p>
          </div>
          <div className="preferences-grid">
            <label className="preferences-field preferences-field-wide">
              <span>Target job titles</span>
              <input name="target_job_titles" value={form.target_job_titles} onChange={updateField} placeholder="e.g. Data analyst, Business intelligence analyst" />
              <small>Separate multiple titles with commas.</small>
            </label>
            <label className="preferences-field preferences-field-wide">
              <span>Preferred locations</span>
              <input name="preferred_locations" value={form.preferred_locations} onChange={updateField} placeholder="e.g. Toronto, Ontario, Canada" />
              <small>Separate multiple locations with commas.</small>
            </label>
            <label className="preferences-field preferences-field-wide">
              <span>Skills to prioritize</span>
              <input name="prioritized_skills" value={form.prioritized_skills} onChange={updateField} placeholder="e.g. Python, SQL, AWS" />
              <small>Optional. Separate multiple skills with commas; they break otherwise equal matches.</small>
            </label>
            <SelectField label="Work arrangement" name="remote_preference" value={form.remote_preference} onChange={updateField} options={[["no_preference", "No preference"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on_site", "On-site"]]} />
            <SelectField label="Work authorization" name="work_authorization" value={form.work_authorization} onChange={updateField} options={[["no_preference", "No preference"], ["authorized", "Authorized to work"], ["requires_sponsorship", "Require sponsorship"]]} />
            <label className="preferences-field">
              <span>Minimum acceptable salary</span>
              <div className="salary-preference-inputs">
                <input name="minimum_salary" type="number" min="0" step="1000" value={form.minimum_salary} onChange={updateField} placeholder="e.g. 80000" />
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
            <button type="submit" className="upload-button" disabled={saving}>{saving ? "Saving preferences…" : "Save preferences"}</button>
          </div>
        </form>
      </div>
    </div>
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
