"""Deterministic candidate-job filtering and retrieval for recommendations."""

from __future__ import annotations

from collections import Counter
import re

from pydantic import BaseModel, Field

from analysis.skill_extractor import extract_skills
from api.db import query
from api.job_catalog import JobRecord, ensure_job_catalog_schema
from api.resume import JobPreferences


DEFAULT_CANDIDATE_LIMIT = 60
MAX_JOBS_PER_COMPANY = 2

# Keys and values are punctuation-insensitive. These cover the common source
# variations seen in resumes and postings without using embeddings or an LLM.
SKILL_ALIASES = {
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "amazonwebservices": "aws",
    "amazonaws": "aws",
    "aws": "aws",
    "node": "nodejs",
    "nodejs": "nodejs",
    "reactjs": "react",
    "powerbi": "powerbi",
    "scikitlearn": "scikitlearn",
    "cicd": "cicd",
    "restfulapi": "restapi",
    "restapi": "restapi",
}
_ALIAS_PHRASES = {
    "postgres": "postgresql",
    "amazon web services": "aws",
    "amazon aws": "aws",
    "node.js": "nodejs",
    "react.js": "react",
    "power bi": "powerbi",
    "scikit-learn": "scikitlearn",
    "ci/cd": "cicd",
    "rest api": "restapi",
}


class RetrievalBreakdown(BaseModel):
    required_skill_overlap: float = Field(ge=0, le=1)
    title_role_similarity: float = Field(ge=0, le=1)
    seniority_experience_fit: float = Field(ge=0, le=1)
    location_remote_fit: float = Field(ge=0, le=1)
    salary_fit: float = Field(ge=0, le=1)


class CandidateJob(BaseModel):
    job: JobRecord
    retrieval_score: float = Field(ge=0, le=100)
    breakdown: RetrievalBreakdown
    priority_skill_matches: int = Field(ge=0)


def _normalized_phrase(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").casefold())


def normalize_skill(value: str) -> str:
    normalized = _normalized_phrase(value)
    return SKILL_ALIASES.get(normalized, normalized)


def normalized_skills(values: list[str] | tuple[str, ...] | None, source_text: str = "") -> set[str]:
    """Normalize skill labels and recognize a small set of practical aliases."""
    result = {normalize_skill(value) for value in (values or []) if value and normalize_skill(value)}
    source = source_text.casefold()
    for phrase, canonical in _ALIAS_PHRASES.items():
        if phrase in source:
            result.add(canonical)
    return result


def skills_from_text(text: str) -> set[str]:
    return normalized_skills(extract_skills(text), text)


def derive_remote_policy(description: str | None, location: str | None) -> str | None:
    text = f"{location or ''}\n{description or ''}".casefold()
    if re.search(r"\bhybrid\b", text):
        return "hybrid"
    if re.search(r"\b(?:on[ -]?site|in[ -]?office|not remote)\b", text):
        return "on_site"
    if re.search(r"\bremote\b", text):
        return "remote"
    return None


def derive_work_authorization(description: str | None) -> str | None:
    text = (description or "").casefold()
    if re.search(r"\b(?:no|without)\s+(?:visa\s+)?sponsorship\b|\bdoes not sponsor\b", text):
        return "no_sponsorship"
    if re.search(r"\b(?:visa\s+)?sponsorship\s+(?:is\s+)?available\b|\bwill sponsor\b", text):
        return "sponsorship_available"
    return None


def load_active_job_catalog() -> list[JobRecord]:
    """Load lightweight active-job records for deterministic retrieval."""
    ensure_job_catalog_schema()
    rows = query("""
        SELECT id, title, company, job_category, location, salary_type,
               salary_min, salary_max, requirements, nice_to_haves,
               date_posted, posting_url, skills
        FROM postings
        WHERE date_posted >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date_posted DESC, id DESC
    """)
    jobs: list[JobRecord] = []
    for row in rows:
        jobs.append(JobRecord(
            id=row[0], title=row[1], company=row[2], job_category=row[3], location=row[4],
            salary_type=row[5], salary_min=float(row[6]) if row[6] is not None else None,
            salary_max=float(row[7]) if row[7] is not None else None,
            requirements=row[8] or [], nice_to_haves=row[9] or [], date_posted=row[10],
            posting_url=row[11], skills=row[12] or [],
        ))
    return jobs


def hydrate_candidate_jobs(candidates: list[CandidateJob]) -> list[CandidateJob]:
    """Fetch verbose fields only for the small set that Jev will score."""
    if not candidates:
        return []
    candidate_ids = [candidate.job.id for candidate in candidates]
    rows = query("""
        SELECT id, responsibilities, description
        FROM postings
        WHERE id = ANY(%s)
        """, (candidate_ids,))
    details_by_id = {
        row[0]: {"responsibilities": row[1], "description": row[2]}
        for row in rows
    }
    return [
        candidate.model_copy(update={
            "job": candidate.job.model_copy(update=details_by_id.get(candidate.job.id, {})),
        })
        for candidate in candidates
    ]


def _title_similarity(target_titles: list[str], job: JobRecord) -> float:
    if not target_titles:
        return 0.5
    job_tokens = set(re.findall(r"[a-z0-9]+", job.title.casefold()))
    best = 0.0
    for target in target_titles:
        target_normalized = _normalized_phrase(target)
        job_normalized = _normalized_phrase(job.title)
        if target_normalized and (target_normalized in job_normalized or job_normalized in target_normalized):
            best = max(best, 1.0)
            continue
        target_tokens = set(re.findall(r"[a-z0-9]+", target.casefold()))
        if target_tokens and job_tokens:
            best = max(best, len(target_tokens & job_tokens) / len(target_tokens | job_tokens))
    return best


def _seniority_level(text: str) -> int | None:
    source = (text or "").casefold()
    years = [int(value) for value in re.findall(r"\b(\d{1,2})\+?\s+years?\b", source)]
    if years:
        maximum = max(years)
        if maximum >= 8:
            return 3
        if maximum >= 4:
            return 2
        if maximum >= 1:
            return 1
        return 0
    if re.search(r"\b(?:principal|staff|lead)\b", source):
        return 3
    if re.search(r"\b(?:senior|sr\.?|manager)\b", source):
        return 2
    if re.search(r"\b(?:junior|entry[ -]?level|intern|co-op)\b", source):
        return 0
    if re.search(r"\b(?:mid[ -]?level|intermediate)\b", source):
        return 1
    return None


def _seniority_fit(resume_text: str, job: JobRecord) -> float:
    candidate_level = _seniority_level(resume_text)
    job_level = _seniority_level(" ".join(filter(None, [job.title, " ".join(job.requirements), job.description])))
    if candidate_level is None or job_level is None:
        return 0.5
    if candidate_level >= job_level:
        return 1.0
    return 0.45 if job_level - candidate_level == 1 else 0.05


def _location_matches(preferred_locations: list[str], location: str | None) -> bool | None:
    if not preferred_locations:
        return True
    if not location:
        return None
    job_location = _normalized_phrase(location)
    for preferred in preferred_locations:
        normalized = _normalized_phrase(preferred)
        if len(normalized) >= 3 and (normalized in job_location or job_location in normalized):
            return True
    return False


def _clearly_fails_preferences(job: JobRecord, preferences: JobPreferences) -> bool:
    remote_policy = job.remote_policy or derive_remote_policy(job.description, job.location)
    work_authorization = job.work_authorization or derive_work_authorization(job.description)
    remote_preference = preferences.remote_preference
    if remote_preference != "no_preference" and remote_policy is not None and remote_policy != remote_preference:
        return True

    location_match = _location_matches(preferences.preferred_locations, job.location)
    if location_match is False and not (remote_policy == "remote" and remote_preference == "remote"):
        return True

    if preferences.work_authorization == "requires_sponsorship" and work_authorization == "no_sponsorship":
        return True

    if preferences.minimum_salary is not None and job.salary_max is not None:
        comparable_salary = preferences.salary_type == "no_preference" or job.salary_type == preferences.salary_type
        if comparable_salary and job.salary_max < preferences.minimum_salary:
            return True
    return False


def _location_remote_fit(job: JobRecord, preferences: JobPreferences) -> float:
    remote_policy = job.remote_policy or derive_remote_policy(job.description, job.location)
    if preferences.remote_preference == "no_preference":
        remote_score = 1.0
    elif remote_policy is None:
        remote_score = 0.5
    else:
        remote_score = 1.0 if remote_policy == preferences.remote_preference else 0.0

    location_match = _location_matches(preferences.preferred_locations, job.location)
    if location_match is True or (remote_policy == "remote" and preferences.remote_preference == "remote"):
        location_score = 1.0
    elif location_match is None:
        location_score = 0.4
    else:
        location_score = 0.0
    return (remote_score + location_score) / 2


def _salary_fit(job: JobRecord, preferences: JobPreferences) -> float:
    if preferences.minimum_salary is None:
        return 0.5
    if job.salary_max is None:
        return 0.0
    if preferences.salary_type != "no_preference" and job.salary_type != preferences.salary_type:
        return 0.1
    if job.salary_min is not None and job.salary_min >= preferences.minimum_salary:
        return 1.0
    return 0.7


def _required_skills(job: JobRecord) -> set[str]:
    explicit_requirements = skills_from_text("\n".join(job.requirements))
    return explicit_requirements or normalized_skills(job.skills, job.description or "")


def score_candidate_job(
    resume_text: str,
    preferences: JobPreferences,
    job: JobRecord,
    candidate_skills: set[str] | None = None,
    priority_skills: set[str] | None = None,
) -> CandidateJob:
    candidate_skills = candidate_skills if candidate_skills is not None else skills_from_text(resume_text)
    required_skills = _required_skills(job)
    overlap = len(candidate_skills & required_skills) / len(required_skills) if required_skills else 0.0
    job_skills = (
        required_skills
        | normalized_skills(job.skills, job.description or "")
        | normalized_skills(job.nice_to_haves, job.description or "")
    )
    priority_skills = priority_skills if priority_skills is not None else normalized_skills(preferences.prioritized_skills)
    priority_matches = len(priority_skills & job_skills)
    breakdown = RetrievalBreakdown(
        required_skill_overlap=overlap,
        title_role_similarity=_title_similarity(preferences.target_job_titles, job),
        seniority_experience_fit=_seniority_fit(resume_text, job),
        location_remote_fit=_location_remote_fit(job, preferences),
        salary_fit=_salary_fit(job, preferences),
    )
    score = 100 * (
        0.35 * breakdown.required_skill_overlap
        + 0.25 * breakdown.title_role_similarity
        + 0.15 * breakdown.seniority_experience_fit
        + 0.15 * breakdown.location_remote_fit
        + 0.10 * breakdown.salary_fit
    )
    return CandidateJob(
        job=job,
        retrieval_score=round(score, 4),
        breakdown=breakdown,
        priority_skill_matches=priority_matches,
    )


def retrieve_candidate_jobs(
    resume_text: str,
    preferences: JobPreferences,
    jobs: list[JobRecord],
    limit: int = DEFAULT_CANDIDATE_LIMIT,
) -> list[CandidateJob]:
    """Return the deterministic 40–80-job Jev candidate pool (60 by default)."""
    if not 40 <= limit <= 80:
        raise ValueError("Candidate retrieval limit must be between 40 and 80.")

    candidate_skills = skills_from_text(resume_text)
    priority_skills = normalized_skills(preferences.prioritized_skills)

    ranked = [
        score_candidate_job(resume_text, preferences, job, candidate_skills, priority_skills)
        for job in jobs
        if job.is_active and not _clearly_fails_preferences(job, preferences)
    ]
    ranked.sort(key=lambda item: (-item.retrieval_score, -item.priority_skill_matches, item.job.id))

    selected: list[CandidateJob] = []
    overflow: list[CandidateJob] = []
    company_counts: Counter[str] = Counter()
    for candidate in ranked:
        company_key = _normalized_phrase(candidate.job.company or "unknown")
        if company_counts[company_key] < MAX_JOBS_PER_COMPANY:
            selected.append(candidate)
            company_counts[company_key] += 1
        else:
            overflow.append(candidate)
        if len(selected) == limit:
            return selected

    # If the catalog is concentrated in only a few companies, retain enough
    # candidates for Jev instead of returning an artificially tiny pool.
    for candidate in overflow:
        if len(selected) == limit:
            break
        selected.append(candidate)
    selected.sort(key=lambda item: (-item.retrieval_score, -item.priority_skill_matches, item.job.id))
    return selected
